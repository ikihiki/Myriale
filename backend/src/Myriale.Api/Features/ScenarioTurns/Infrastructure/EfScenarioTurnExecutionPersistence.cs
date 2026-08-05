using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ScenarioTurns.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.ScenarioTurns.Infrastructure;

public sealed class EfScenarioExecutionFence(ApplicationDbContext db) : IScenarioExecutionFence
{
    public async Task<ScenarioExecutionCheckpoint?> CheckAsync(SessionExecutionContext context, ScenarioTurnStage stage, CancellationToken cancellationToken)
    {
        var updated = await db.SessionExecutions
            .Where(item => item.Id == context.ExecutionId
                && item.Status == SessionExecutionStatus.Running
                && item.LeaseToken == context.LeaseToken
                && item.Revision == context.Revision)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.Stage, stage.ToWireValue()), cancellationToken);
        if (updated != 1) return null;
        var item = await db.SessionExecutions.AsNoTracking()
            .SingleAsync(candidate => candidate.Id == context.ExecutionId, cancellationToken);
        var inputId = new SessionPlayerInputId(item.TriggerId.AsPrimitive());
        var input = await db.SessionPlayerInputs.AsNoTracking()
            .SingleAsync(candidate => candidate.Id == inputId, cancellationToken);
        return new ScenarioExecutionCheckpoint(
            item.Id, item.SessionId, input.Id, input.Text,
            item.AcceptedHeadTurnId, item.AcceptedSessionRevision,
            item.ActionDecisionAiProfileId!.Value, item.NarrativeAiProfileId!.Value);
    }
}

public sealed class EfScenarioWorldSnapshotQuery(ApplicationDbContext db, ScenarioRuleWorldSnapshotFactory factory) : IScenarioWorldSnapshotQuery
{
    public async Task<ScenarioRuleWorldSnapshot> LoadAsync(SessionId sessionId, CancellationToken cancellationToken)
    {
        var session = await db.Sessions.AsNoTracking().Include(item => item.State)
            .SingleAsync(item => item.Id == sessionId, cancellationToken);
        var definition = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Include(item => item.Locations)
            .Include(item => item.ObjectTypes).ThenInclude(item => item.Actions)
            .Include(item => item.Objects)
            .SingleAsync(item => item.Id == session.ScenarioDefinitionVersionId && item.Status == DefinitionStatus.Published, cancellationToken);
        var states = await db.SessionObjectStates.AsNoTracking()
            .Where(item => item.SessionId == sessionId).ToListAsync(cancellationToken);
        return factory.Create(session, definition, states);
    }
}

public sealed class EfScenarioActionSnapshotRepository(ApplicationDbContext db) : IScenarioActionSnapshotRepository
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public Task<ScenarioActionStepSnapshot?> FindAsync(SessionExecutionId executionId, CancellationToken cancellationToken) =>
        db.SessionRuleActionSteps.AsNoTracking().Where(item => item.ExecutionId == executionId)
            .Select(item => Map(item)).SingleOrDefaultAsync(cancellationToken);

    public async Task<ScenarioCheckpointWriteOutcome> CreateAsync(
        SessionExecutionContext context, ScenarioExecutionCheckpoint execution, ScenarioRuleWorldSnapshot world,
        RuleActionSnapshot snapshot, DateTimeOffset now, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var fenced = await LoadFencedExecutionAsync(context, cancellationToken);
        if (fenced is null) return ScenarioCheckpointWriteOutcome.LeaseLost;
        if (await db.SessionRuleActionSteps.AnyAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken))
            return ScenarioCheckpointWriteOutcome.Existing;
        if (fenced.AcceptedHeadTurnId != execution.AcceptedHeadTurnId
            || world.SessionRevision != fenced.AcceptedSessionRevision + 1)
            return ScenarioCheckpointWriteOutcome.Conflict;
        var step = SessionRuleActionStep.CreateSnapshot(
            new SessionRuleActionStepId($"RST-{Guid.NewGuid():N}".ToUpperInvariant()), execution.SessionId, execution.ExecutionId,
            execution.PlayerInputId, world.ScenarioDefinitionVersionId, world.SessionRevision,
            JsonSerializer.Serialize(world.Objects.ToDictionary(item => item.Id, item => item.Revision), Json),
            JsonSerializer.Serialize(snapshot, Json), now);
        db.SessionRuleActionSteps.Add(step);
        fenced.Stage = ScenarioTurnStage.Decision.ToWireValue();
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return ScenarioCheckpointWriteOutcome.Written;
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            return await db.SessionRuleActionSteps.AnyAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken)
                ? ScenarioCheckpointWriteOutcome.Existing : ScenarioCheckpointWriteOutcome.Conflict;
        }
    }

    public async Task<ScenarioCheckpointWriteOutcome> RecordDecisionAsync(
        SessionExecutionContext context, RuleActionDecisionResult decision, DateTimeOffset now, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var execution = await LoadFencedExecutionAsync(context, cancellationToken);
        if (execution is null) return ScenarioCheckpointWriteOutcome.LeaseLost;
        var step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken);
        if (!step.RecordDecision(JsonSerializer.Serialize(decision, Json), now)) return ScenarioCheckpointWriteOutcome.Existing;
        execution.Stage = step.Stage.ToWireValue();
        return await SaveAsync(cancellationToken);
    }

    public async Task<ScenarioCheckpointWriteOutcome> RecordResolutionAsync(
        SessionExecutionContext context, ScenarioRuleResolution resolution, DateTimeOffset now, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var execution = await LoadFencedExecutionAsync(context, cancellationToken);
        if (execution is null) return ScenarioCheckpointWriteOutcome.LeaseLost;
        var step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken);
        if (!step.RecordResolution(resolution.Rule?.Id, JsonSerializer.Serialize(resolution.Plan, Json), resolution.Plan.ExtensionRequest is not null, now))
            return ScenarioCheckpointWriteOutcome.Existing;
        execution.Stage = step.Stage.ToWireValue();
        return await SaveAsync(cancellationToken);
    }

    public async Task<ScenarioCheckpointWriteOutcome> RecordExtensionAsync(
        SessionExecutionContext context, ScenarioExtensionResult result, DateTimeOffset now, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var execution = await LoadFencedExecutionAsync(context, cancellationToken);
        if (execution is null) return ScenarioCheckpointWriteOutcome.LeaseLost;
        var step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken);
        if (!step.CompleteExtension(JsonSerializer.Serialize(result, Json), now)) return ScenarioCheckpointWriteOutcome.Existing;
        execution.Stage = step.Stage.ToWireValue();
        return await SaveAsync(cancellationToken);
    }

    private Task<SessionExecution?> LoadFencedExecutionAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == context.ExecutionId
            && item.Status == SessionExecutionStatus.Running
            && item.LeaseToken == context.LeaseToken
            && item.Revision == context.Revision, cancellationToken);

    private async Task<ScenarioCheckpointWriteOutcome> SaveAsync(CancellationToken cancellationToken)
    {
        try { await db.SaveChangesAsync(cancellationToken); return ScenarioCheckpointWriteOutcome.Written; }
        catch (DbUpdateConcurrencyException) { db.ChangeTracker.Clear(); return ScenarioCheckpointWriteOutcome.LeaseLost; }
    }

    private static ScenarioActionStepSnapshot Map(SessionRuleActionStep item) => new(
        item.Id, item.SessionId, item.ExecutionId, item.PlayerInputId, item.Stage,
        item.PreSessionRevision, item.PostSessionRevision, item.ObjectRevisionsJson,
        item.ActionSnapshotJson, item.DecisionJson, item.SelectedRuleId, item.ResolutionPlanJson,
        item.AppliedEffectsJson, item.PublicPostStateJson, item.FactsJson, item.EventsJson,
        item.NarrativeHintsJson, item.ForbiddenNarrativeFactsJson, item.ExtensionReceiptJson,
        item.AppliedAt, item.NarrativePublishedAt);
}

public sealed class EfScenarioAiInteractionRecorder(ApplicationDbContext db, ILogger<EfScenarioAiInteractionRecorder> logger)
    : IScenarioAiInteractionRecorder
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<RuleActionDecisionResult?> FindRecordedDecisionAsync(SessionExecutionId executionId, CancellationToken cancellationToken)
    {
        var recorded = await db.SessionAiInteractions.AsNoTracking()
            .Where(item => item.ExecutionId == executionId && item.Stage == SessionAiInteractionStage.ActionDecision
                && item.Status == SessionAiInteractionStatus.Succeeded)
            .Select(item => new { item.CompletedAt, item.ValidationResult })
            .ToListAsync(cancellationToken);
        var json = recorded.OrderBy(item => item.CompletedAt).Select(item => item.ValidationResult).FirstOrDefault();
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<RuleActionDecisionResult>(json, Json); }
        catch (JsonException) { return null; }
    }

    public Task RecordSuccessAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        string canonicalResultJson, CancellationToken cancellationToken) =>
        PersistAsync(execution, context, sequence, stage, profileId, startedAt, generation,
            SessionAiInteractionStatus.Succeeded, null, null, canonicalResultJson, cancellationToken);

    public Task RecordValidationFailureAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        ScenarioTurnValidationException exception, CancellationToken cancellationToken) =>
        PersistAsync(execution, context, sequence, stage, profileId, startedAt, generation,
            SessionAiInteractionStatus.ValidationFailed, exception.Code, exception.Message,
            JsonSerializer.Serialize(new { status = "invalid", code = exception.Code }, Json), cancellationToken);

    public async Task TryRecordProviderFailureAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, AiProviderException exception, CancellationToken cancellationToken)
    {
        try
        {
            var interaction = await FindOrCreateAsync(execution, context, sequence, stage, profileId, startedAt, cancellationToken);
            var completed = DateTimeOffset.UtcNow;
            interaction.CompletedAt = completed;
            interaction.LatencyMilliseconds = Math.Max(0, (long)(completed - startedAt).TotalMilliseconds);
            interaction.Status = SessionAiInteractionStatus.Failed;
            interaction.ErrorCode = exception.Code;
            interaction.ErrorMessage = exception.Message;
            interaction.SentPrompt = exception.SentPrompt;
            interaction.ReceivedResult = exception.ReceivedResult;
            interaction.ValidationResult = JsonSerializer.Serialize(new { status = "not-validated" }, Json);
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception persistenceException)
        {
            db.ChangeTracker.Clear();
            logger.LogWarning(persistenceException, "Failed to persist scenario AI interaction failure. ExecutionId={ExecutionId} Stage={Stage}", execution.ExecutionId, stage);
        }
    }

    private async Task PersistAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        SessionAiInteractionStatus status, string? errorCode, string? errorMessage, string validationResult, CancellationToken cancellationToken)
    {
        var interaction = await FindOrCreateAsync(execution, context, sequence, stage, profileId, startedAt, cancellationToken);
        interaction.Provider = generation.Metadata.Provider.AsPrimitive();
        interaction.Model = generation.Metadata.Model;
        interaction.ProviderRequestId = generation.Metadata.ResponseId;
        interaction.CompletedAt = DateTimeOffset.UtcNow;
        interaction.LatencyMilliseconds = generation.Metadata.LatencyMilliseconds;
        interaction.InputTokens = generation.Metadata.InputTokens;
        interaction.OutputTokens = generation.Metadata.OutputTokens;
        interaction.FinishReason = generation.Metadata.FinishReason;
        interaction.Status = status;
        interaction.ErrorCode = errorCode;
        interaction.ErrorMessage = errorMessage;
        interaction.SentPrompt = generation.SentPrompt;
        interaction.ReceivedResult = generation.ReceivedResult;
        interaction.ValidationResult = validationResult;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<SessionAiInteraction> FindOrCreateAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        int sequence, SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        var interaction = await db.SessionAiInteractions.SingleOrDefaultAsync(
            item => item.AttemptId == context.AttemptId && item.Stage == stage, cancellationToken);
        if (interaction is not null) return interaction;
        interaction = new SessionAiInteraction
        {
            Id = new SessionAiInteractionId($"AII-{Guid.NewGuid():N}".ToUpperInvariant()), SessionId = execution.SessionId,
            ExecutionId = execution.ExecutionId, AttemptId = context.AttemptId, Sequence = sequence,
            Stage = stage, AiProfileId = profileId, StartedAt = startedAt,
        };
        db.SessionAiInteractions.Add(interaction);
        return interaction;
    }
}

public sealed class EfScenarioEffectCommitUnitOfWork(
    ApplicationDbContext db,
    IScenarioRuleResolutionService resolver,
    IScenarioTurnArtifactWriter artifactWriter,
    TimeProvider timeProvider) : IScenarioEffectCommitUnitOfWork
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<ScenarioEffectCommitResult> CommitAsync(
        SessionExecutionContext context, ScenarioRuleWorldSnapshot world, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == context.ExecutionId
            && item.Status == SessionExecutionStatus.Running && item.LeaseToken == context.LeaseToken
            && item.Revision == context.Revision, cancellationToken);
        if (execution is null) return new(ScenarioCheckpointWriteOutcome.LeaseLost);
        var step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken);
        if (step.AppliedAt is not null) return new(ScenarioCheckpointWriteOutcome.Existing);
        if (step.Stage != ScenarioTurnStage.EffectCommit || string.IsNullOrWhiteSpace(step.ResolutionPlanJson))
            return new(ScenarioCheckpointWriteOutcome.Conflict);
        var plan = JsonSerializer.Deserialize<ScenarioEffectPlan>(step.ResolutionPlanJson, Json)
            ?? throw new ScenarioTurnValidationException("invalid_effect_plan");
        var session = await db.Sessions.Include(item => item.State).SingleAsync(item => item.Id == execution.SessionId, cancellationToken);
        if (session.Revision != plan.Session.ExpectedRevision || session.HeadTurnId != execution.AcceptedHeadTurnId)
            return new(ScenarioCheckpointWriteOutcome.Conflict);
        var states = await db.SessionObjectStates.Where(item => item.SessionId == execution.SessionId).ToListAsync(cancellationToken);
        foreach (var patch in plan.Objects)
        {
            var state = states.Single(item => item.ScenarioObjectId == patch.ObjectId);
            if (state.Revision != patch.ExpectedRevision) return new(ScenarioCheckpointWriteOutcome.Conflict);
        }
        var now = timeProvider.GetUtcNow();
        foreach (var patch in plan.Objects)
            states.Single(item => item.ScenarioObjectId == patch.ObjectId)
                .Apply(patch.State.GetRawText(), patch.LocationId, patch.ExpectedRevision, now);
        if (plan.SessionState is { } statePatch)
            session.State.ApplyFlags(statePatch.Flags, statePatch.ExpectedRevision, now);
        session.ApplyScenarioEffects(plan.Session.ExpectedRevision, plan.Session.CurrentLocationId, plan.CompletionIntent, now);
        var extension = string.IsNullOrWhiteSpace(step.ExtensionReceiptJson)
            ? null : JsonSerializer.Deserialize<ScenarioExtensionResult>(step.ExtensionReceiptJson, Json);
        var postState = resolver.ProjectPostState(world, plan);
        var effects = plan.AppliedEffects.Concat(extension?.Effects ?? []).ToArray();
        var facts = plan.Facts.Concat(extension?.Facts ?? []).ToArray();
        var events = plan.Events.Concat(extension?.Events ?? []).ToArray();
        var hints = plan.NarrativeHints.Concat(extension?.NarrativeHints ?? []).ToArray();
        var forbidden = plan.ForbiddenNarrativeFacts.Concat(extension?.ForbiddenNarrativeFacts ?? []).ToArray();
        step.CommitEffects(
            plan.Session.ExpectedRevision, session.Revision,
            JsonSerializer.Serialize(effects, Json), JsonSerializer.Serialize(postState, Json),
            JsonSerializer.Serialize(facts, Json), JsonSerializer.Serialize(events, Json),
            JsonSerializer.Serialize(hints, Json), JsonSerializer.Serialize(forbidden, Json), now);
        execution.Stage = step.Stage.ToWireValue();
        artifactWriter.AddRuleStep(execution.SessionId, execution.Id, context.AttemptId, step, now);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new(ScenarioCheckpointWriteOutcome.Written);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            return new(ScenarioCheckpointWriteOutcome.Conflict);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            if (await db.SessionRuleActionSteps.AsNoTracking().AnyAsync(
                    item => item.ExecutionId == context.ExecutionId && item.AppliedAt != null, cancellationToken))
                return new(ScenarioCheckpointWriteOutcome.Existing);
            throw;
        }
    }
}

public sealed class EfScenarioNarrativePublisher(
    ApplicationDbContext db,
    IScenarioSessionTurnAppender appender,
    IScenarioTurnArtifactWriter artifactWriter,
    TimeProvider timeProvider) : IScenarioNarrativePublisher
{
    public async Task<ScenarioNarrativePublishOutcome> PublishAsync(SessionExecutionContext context,
        NarrativeGeneration<PostStateNarrativeResult> narrative, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == context.ExecutionId
            && item.Status == SessionExecutionStatus.Running && item.LeaseToken == context.LeaseToken
            && item.Revision == context.Revision, cancellationToken);
        if (execution is null) return ScenarioNarrativePublishOutcome.LeaseLost;
        var step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == context.ExecutionId, cancellationToken);
        if (step.NarrativePublishedAt is not null) return ScenarioNarrativePublishOutcome.Existing;
        var input = await db.SessionPlayerInputs.SingleAsync(item => item.Id == step.PlayerInputId, cancellationToken);
        if (await db.SessionTurns.AnyAsync(item => item.PlayerInputId == input.Id, cancellationToken)) return ScenarioNarrativePublishOutcome.Existing;
        var session = await db.Sessions.Include(item => item.HeadTurn).SingleAsync(item => item.Id == execution.SessionId, cancellationToken);
        if (session.HeadTurnId != execution.AcceptedHeadTurnId)
            return ScenarioNarrativePublishOutcome.SessionAdvanced;
        var now = timeProvider.GetUtcNow();
        _ = appender.Append(session, input, step, narrative, now);
        step.PublishNarrative(now);
        execution.Stage = step.Stage.ToWireValue();
        artifactWriter.AddNarrative(execution.SessionId, execution.Id, context.AttemptId, narrative.Value, now);
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == context.AttemptId, cancellationToken);
        attempt.RecordProviderDiagnostics(
            narrative.Metadata.Provider.AsPrimitive(),
            narrative.Metadata.Model,
            narrative.Metadata.ResponseId,
            narrative.Metadata.LatencyMilliseconds,
            narrative.Metadata.InputTokens,
            narrative.Metadata.OutputTokens,
            narrative.Metadata.FinishReason);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return ScenarioNarrativePublishOutcome.Published;
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return ScenarioNarrativePublishOutcome.Conflict;
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            return await db.SessionTurns.AsNoTracking().AnyAsync(item => item.PlayerInputId == input.Id, cancellationToken)
                ? ScenarioNarrativePublishOutcome.Existing : ScenarioNarrativePublishOutcome.Conflict;
        }
    }
}
