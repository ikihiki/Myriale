using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.SessionArtifacts;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Application.ScenarioTurns;

public sealed record ScenarioExecutionCheckpoint(
    string ExecutionId,
    string SessionId,
    string PlayerInputId,
    string PlayerInput,
    string? AcceptedHeadTurnId,
    long AcceptedSessionRevision,
    string ActionAiProfileId,
    string NarrativeAiProfileId);

public interface IScenarioExecutionFence
{
    Task<ScenarioExecutionCheckpoint?> CheckAsync(SessionExecutionContext context, ScenarioTurnStage stage, CancellationToken cancellationToken);
}

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
        return await (
            from item in db.SessionExecutions.AsNoTracking()
            join input in db.SessionPlayerInputs.AsNoTracking() on item.TriggerId equals input.Id
            where item.Id == context.ExecutionId
            select new ScenarioExecutionCheckpoint(
                item.Id, item.SessionId, item.TriggerId, input.Text,
                item.AcceptedHeadTurnId, item.AcceptedSessionRevision,
                item.ActionDecisionAiProfileId!, item.NarrativeAiProfileId!))
            .SingleAsync(cancellationToken);
    }
}

public interface IScenarioWorldSnapshotQuery
{
    Task<ScenarioRuleWorldSnapshot> LoadAsync(string sessionId, CancellationToken cancellationToken);
}

public sealed class EfScenarioWorldSnapshotQuery(ApplicationDbContext db, ScenarioRuleWorldSnapshotFactory factory) : IScenarioWorldSnapshotQuery
{
    public async Task<ScenarioRuleWorldSnapshot> LoadAsync(string sessionId, CancellationToken cancellationToken)
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

public sealed record ScenarioActionStepSnapshot(
    string Id,
    string SessionId,
    string ExecutionId,
    string PlayerInputId,
    ScenarioTurnStage Stage,
    long PreSessionRevision,
    long? PostSessionRevision,
    string ObjectRevisionsJson,
    string ActionSnapshotJson,
    string? DecisionJson,
    string? SelectedRuleId,
    string? ResolutionPlanJson,
    string? AppliedEffectsJson,
    string? PublicPostStateJson,
    string? FactsJson,
    string? EventsJson,
    string? NarrativeHintsJson,
    string? ForbiddenNarrativeFactsJson,
    string? ExtensionReceiptJson,
    DateTimeOffset? AppliedAt,
    DateTimeOffset? NarrativePublishedAt);

public enum ScenarioCheckpointWriteOutcome { Written, Existing, LeaseLost, Conflict }

public interface IScenarioActionSnapshotRepository
{
    Task<ScenarioActionStepSnapshot?> FindAsync(string executionId, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> CreateAsync(SessionExecutionContext context, ScenarioExecutionCheckpoint execution, ScenarioRuleWorldSnapshot world, RuleActionSnapshot snapshot, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> RecordDecisionAsync(SessionExecutionContext context, RuleActionDecisionResult decision, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> RecordResolutionAsync(SessionExecutionContext context, ScenarioRuleResolution resolution, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> RecordExtensionAsync(SessionExecutionContext context, ScenarioExtensionResult result, DateTimeOffset now, CancellationToken cancellationToken);
}

public sealed class EfScenarioActionSnapshotRepository(ApplicationDbContext db) : IScenarioActionSnapshotRepository
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public Task<ScenarioActionStepSnapshot?> FindAsync(string executionId, CancellationToken cancellationToken) =>
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
        if (!string.Equals(fenced.AcceptedHeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal)
            || world.SessionRevision != fenced.AcceptedSessionRevision + 1)
            return ScenarioCheckpointWriteOutcome.Conflict;
        var step = SessionRuleActionStep.CreateSnapshot(
            $"RST-{Guid.NewGuid():N}".ToUpperInvariant(), execution.SessionId, execution.ExecutionId,
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

public interface IScenarioAiInteractionRecorder
{
    Task<RuleActionDecisionResult?> FindRecordedDecisionAsync(string executionId, CancellationToken cancellationToken);
    Task RecordSuccessAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        string stage, string profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        string canonicalResultJson, CancellationToken cancellationToken);
    Task RecordValidationFailureAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        string stage, string profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        ScenarioTurnValidationException exception, CancellationToken cancellationToken);
    Task TryRecordProviderFailureAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        string stage, string profileId, DateTimeOffset startedAt, AiProviderException exception, CancellationToken cancellationToken);
}

public sealed class EfScenarioAiInteractionRecorder(ApplicationDbContext db, ILogger<EfScenarioAiInteractionRecorder> logger)
    : IScenarioAiInteractionRecorder
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<RuleActionDecisionResult?> FindRecordedDecisionAsync(string executionId, CancellationToken cancellationToken)
    {
        var recorded = await db.SessionAiInteractions.AsNoTracking()
            .Where(item => item.ExecutionId == executionId && item.Stage == SessionAiInteractionStages.ActionDecision
                && item.Status == SessionAiInteractionStatuses.Succeeded)
            .Select(item => new { item.CompletedAt, item.ValidationResult })
            .ToListAsync(cancellationToken);
        var json = recorded.OrderBy(item => item.CompletedAt).Select(item => item.ValidationResult).FirstOrDefault();
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<RuleActionDecisionResult>(json, Json); }
        catch (JsonException) { return null; }
    }

    public Task RecordSuccessAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        string stage, string profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        string canonicalResultJson, CancellationToken cancellationToken) =>
        PersistAsync(execution, context, sequence, stage, profileId, startedAt, generation,
            SessionAiInteractionStatuses.Succeeded, null, null, canonicalResultJson, cancellationToken);

    public Task RecordValidationFailureAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        string stage, string profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        ScenarioTurnValidationException exception, CancellationToken cancellationToken) =>
        PersistAsync(execution, context, sequence, stage, profileId, startedAt, generation,
            SessionAiInteractionStatuses.ValidationFailed, exception.Code, exception.Message,
            JsonSerializer.Serialize(new { status = "invalid", code = exception.Code }, Json), cancellationToken);

    public async Task TryRecordProviderFailureAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        string stage, string profileId, DateTimeOffset startedAt, AiProviderException exception, CancellationToken cancellationToken)
    {
        try
        {
            var interaction = await FindOrCreateAsync(execution, context, sequence, stage, profileId, startedAt, cancellationToken);
            var completed = DateTimeOffset.UtcNow;
            interaction.CompletedAt = completed;
            interaction.LatencyMilliseconds = Math.Max(0, (long)(completed - startedAt).TotalMilliseconds);
            interaction.Status = SessionAiInteractionStatuses.Failed;
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
        string stage, string profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        string status, string? errorCode, string? errorMessage, string validationResult, CancellationToken cancellationToken)
    {
        var interaction = await FindOrCreateAsync(execution, context, sequence, stage, profileId, startedAt, cancellationToken);
        interaction.Provider = generation.Metadata.Provider;
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
        int sequence, string stage, string profileId, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        var interaction = await db.SessionAiInteractions.SingleOrDefaultAsync(
            item => item.AttemptId == context.AttemptId && item.Stage == stage, cancellationToken);
        if (interaction is not null) return interaction;
        interaction = new SessionAiInteraction
        {
            Id = $"AII-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = execution.SessionId,
            ExecutionId = execution.ExecutionId, AttemptId = context.AttemptId, Sequence = sequence,
            Stage = stage, AiProfileId = profileId, StartedAt = startedAt,
        };
        db.SessionAiInteractions.Add(interaction);
        return interaction;
    }
}

public interface IScenarioAiDecisionService
{
    Task<RuleActionDecisionResult> DecideAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        RuleActionSnapshot snapshot, CancellationToken cancellationToken);
}

public sealed class ScenarioAiDecisionService(
    ScenarioActionDecisionModelMapper mapper,
    IScenarioTurnAi ai,
    IScenarioAiInteractionRecorder recorder) : IScenarioAiDecisionService
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<RuleActionDecisionResult> DecideAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        RuleActionSnapshot snapshot, CancellationToken cancellationToken)
    {
        var recorded = await recorder.FindRecordedDecisionAsync(execution.ExecutionId, cancellationToken);
        if (recorded is not null) return Validate(snapshot, recorded);
        var request = mapper.CreateRequest(execution.PlayerInput, snapshot);
        var startedAt = DateTimeOffset.UtcNow;
        NarrativeGeneration<ModelActionDecisionResult> generated;
        try { generated = await ai.DecideActionForProfileAsync(execution.ActionAiProfileId, request, cancellationToken); }
        catch (AiProviderException exception) when (exception.SentPrompt is not null || exception.ReceivedResult is not null)
        {
            await recorder.TryRecordProviderFailureAsync(execution, context, 1, SessionAiInteractionStages.ActionDecision,
                execution.ActionAiProfileId, startedAt, exception, cancellationToken);
            throw;
        }
        RuleActionDecisionResult decision;
        try { decision = Validate(snapshot, mapper.MapResult(snapshot, generated.Value)); }
        catch (ScenarioTurnValidationException exception)
        {
            await recorder.RecordValidationFailureAsync(execution, context, 1, SessionAiInteractionStages.ActionDecision,
                execution.ActionAiProfileId, startedAt, generated, exception, cancellationToken);
            throw;
        }
        await recorder.RecordSuccessAsync(execution, context, 1, SessionAiInteractionStages.ActionDecision,
            execution.ActionAiProfileId, startedAt, generated, JsonSerializer.Serialize(decision, Json), cancellationToken);
        return decision;
    }

    public static RuleActionDecisionResult Validate(RuleActionSnapshot snapshot, RuleActionDecisionResult decision)
    {
        if (decision.SchemaVersion != ScenarioTurnSchemas.ActionDecision || decision.Arguments.ValueKind != JsonValueKind.Object)
            throw new ScenarioTurnValidationException("invalid_action_decision");
        var action = snapshot.Actions.SingleOrDefault(item => item.ObjectId == decision.ObjectId && item.ActionId == decision.ActionId)
            ?? throw new ScenarioTurnValidationException("unknown_action");
        if (!action.Enabled) throw new ScenarioTurnValidationException("disabled_action");
        ScenarioActionArgumentValidator.Validate(action.ArgumentSchema, decision.Arguments);
        return decision;
    }
}

public interface IScenarioTurnArtifactWriter
{
    void AddRuleStep(string sessionId, string executionId, string attemptId, SessionRuleActionStep step, DateTimeOffset now);
    void AddNarrative(string sessionId, string executionId, string attemptId, PostStateNarrativeResult narrative, DateTimeOffset now);
}

public sealed class ScenarioTurnArtifactWriter(ISessionArtifactWriter writer) : IScenarioTurnArtifactWriter
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;
    public void AddRuleStep(string sessionId, string executionId, string attemptId, SessionRuleActionStep step, DateTimeOffset now) =>
        writer.Add(SessionArtifact.CreateCommittedJson(
            $"ART-{Guid.NewGuid():N}".ToUpperInvariant(), sessionId, executionId, attemptId,
            new RuleActionStepArtifactPayload(step.ActionSnapshotJson, step.DecisionJson, step.SelectedRuleId,
                step.AppliedEffectsJson, step.PublicPostStateJson), null, now, Json));
    public void AddNarrative(string sessionId, string executionId, string attemptId, PostStateNarrativeResult narrative, DateTimeOffset now) =>
        writer.Add(SessionArtifact.CreateCommittedJson(
            $"ART-{Guid.NewGuid():N}".ToUpperInvariant(), sessionId, executionId, attemptId,
            new PostStateNarrativeArtifactPayload(narrative.SchemaVersion, narrative.Heading, narrative.Body), null, now, Json));
}

public sealed record ScenarioEffectCommitResult(ScenarioCheckpointWriteOutcome Outcome);

public interface IScenarioEffectCommitUnitOfWork
{
    Task<ScenarioEffectCommitResult> CommitAsync(SessionExecutionContext context, ScenarioRuleWorldSnapshot world, CancellationToken cancellationToken);
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
        if (session.Revision != plan.Session.ExpectedRevision || !string.Equals(session.HeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal))
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

public interface IScenarioNarrativeGenerationService
{
    Task<NarrativeGeneration<PostStateNarrativeResult>> GenerateAsync(
        ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        ScenarioActionStepSnapshot step, CancellationToken cancellationToken);
}

public sealed class ScenarioNarrativeGenerationService(
    IScenarioTurnAi ai,
    IScenarioAiInteractionRecorder recorder,
    IScenarioWorldSnapshotQuery worldQuery) : IScenarioNarrativeGenerationService
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GenerateAsync(
        ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        ScenarioActionStepSnapshot step, CancellationToken cancellationToken)
    {
        var snapshot = JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)!;
        var decision = JsonSerializer.Deserialize<RuleActionDecisionResult>(step.DecisionJson!, Json)!;
        var postState = JsonSerializer.Deserialize<RulePostState>(step.PublicPostStateJson!, Json)!;
        var action = snapshot.Actions.Single(item => item.ObjectId == decision.ObjectId && item.ActionId == decision.ActionId);
        var selectedObject = decision.ObjectId == "system"
            ? new RulePublicObject("system", "system", "システム", postState.CurrentLocation.Id, true, 0, Parse("{}"))
            : snapshot.Objects.Single(item => item.Id == decision.ObjectId);
        var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
        var request = new PostStateNarrativeRequest(
            ScenarioTurnSchemas.PostStateNarrative,
            new NarrativeScenarioInput(world.Narrative.Title, world.Narrative.Summary, world.Narrative.Genre,
                world.Narrative.Tone, world.Narrative.Lore, world.Narrative.AiFreedom,
                world.Narrative.SelectedHero, world.Narrative.Entities, world.Narrative.Opening),
            execution.PlayerInput, selectedObject, action, postState,
            DeserializeList<string>(step.FactsJson), DeserializeList<JsonElement>(step.EventsJson),
            DeserializeList<string>(step.NarrativeHintsJson), DeserializeList<string>(step.ForbiddenNarrativeFactsJson));
        var startedAt = DateTimeOffset.UtcNow;
        NarrativeGeneration<PostStateNarrativeResult> generated;
        try { generated = await ai.GeneratePostStateNarrativeForProfileAsync(execution.NarrativeAiProfileId, request, cancellationToken); }
        catch (AiProviderException exception) when (exception.SentPrompt is not null || exception.ReceivedResult is not null)
        {
            await recorder.TryRecordProviderFailureAsync(execution, context, 2, SessionAiInteractionStages.Narrative,
                execution.NarrativeAiProfileId, startedAt, exception, cancellationToken);
            throw;
        }
        try { Validate(generated.Value, request.ForbiddenNarrativeFacts); }
        catch (ScenarioTurnValidationException exception)
        {
            await recorder.RecordValidationFailureAsync(execution, context, 2, SessionAiInteractionStages.Narrative,
                execution.NarrativeAiProfileId, startedAt, generated, exception, cancellationToken);
            throw;
        }
        await recorder.RecordSuccessAsync(execution, context, 2, SessionAiInteractionStages.Narrative,
            execution.NarrativeAiProfileId, startedAt, generated,
            JsonSerializer.Serialize(new { status = "valid" }, Json), cancellationToken);
        return generated;
    }

    private static void Validate(PostStateNarrativeResult result, IReadOnlyList<string> forbidden)
    {
        if (result.SchemaVersion != ScenarioTurnSchemas.PostStateNarrative || string.IsNullOrWhiteSpace(result.Heading)
            || result.Heading.Length > 120 || string.IsNullOrWhiteSpace(result.Body) || result.Body.Length > 20_000)
            throw new ScenarioTurnValidationException("invalid_post_state_narrative");
        if (forbidden.Any(item => !string.IsNullOrWhiteSpace(item) && result.Body.Contains(item, StringComparison.OrdinalIgnoreCase)))
            throw new ScenarioTurnValidationException("forbidden_narrative_fact");
    }

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
    private static IReadOnlyList<T> DeserializeList<T>(string? json) => string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<List<T>>(json, Json) ?? [];
}

public interface IScenarioSessionTurnAppender
{
    SessionTurn Append(Session session, SessionPlayerInput input, SessionRuleActionStep step,
        NarrativeGeneration<PostStateNarrativeResult> narrative, DateTimeOffset now);
}

public sealed class ScenarioSessionTurnAppender : IScenarioSessionTurnAppender
{
    public SessionTurn Append(Session session, SessionPlayerInput input, SessionRuleActionStep step,
        NarrativeGeneration<PostStateNarrativeResult> narrative, DateTimeOffset now)
    {
        var id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant();
        var ai = new SessionTurnAiMetadata(narrative.Metadata.Provider, narrative.Metadata.Model, narrative.Metadata.ResponseId,
            narrative.Metadata.InputTokens, narrative.Metadata.OutputTokens, narrative.Metadata.LatencyMilliseconds,
            narrative.Metadata.AttemptCount, narrative.Metadata.FinishReason);
        return session.Status == SessionStatus.Completed
            ? session.AppendScenarioCompletionNarrative(id, input.Id, ScenarioTurnSchemas.PostStateNarrative,
                ScenarioTurnSchemas.NarrativeContext, ScenarioTurnSchemas.NarrativePrompt,
                narrative.Value.Heading, narrative.Value.Body, null, step.PostSessionRevision!.Value, ai, now)
            : session.AppendScenarioNarrative(id, input.Id, ScenarioTurnSchemas.PostStateNarrative,
                ScenarioTurnSchemas.NarrativeContext, ScenarioTurnSchemas.NarrativePrompt,
                narrative.Value.Heading, narrative.Value.Body, null, step.PostSessionRevision!.Value, ai, now);
    }
}

public enum ScenarioNarrativePublishOutcome { Published, Existing, LeaseLost, SessionAdvanced, Conflict }

public interface IScenarioNarrativePublisher
{
    Task<ScenarioNarrativePublishOutcome> PublishAsync(SessionExecutionContext context,
        NarrativeGeneration<PostStateNarrativeResult> narrative, CancellationToken cancellationToken);
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
        if (!string.Equals(session.HeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal))
            return ScenarioNarrativePublishOutcome.SessionAdvanced;
        var now = timeProvider.GetUtcNow();
        _ = appender.Append(session, input, step, narrative, now);
        step.PublishNarrative(now);
        execution.Stage = step.Stage.ToWireValue();
        artifactWriter.AddNarrative(execution.SessionId, execution.Id, context.AttemptId, narrative.Value, now);
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == context.AttemptId, cancellationToken);
        attempt.RecordProviderDiagnostics(
            narrative.Metadata.Provider,
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

public sealed class ScenarioTurnExecutionOrchestrator(
    IScenarioExecutionFence fence,
    IScenarioWorldSnapshotQuery worldQuery,
    ScenarioActionEnumerator enumerator,
    IScenarioActionSnapshotRepository steps,
    IScenarioAiDecisionService decisions,
    IScenarioRuleResolutionService resolutionService,
    IScenarioExtensionAdapter extensions,
    IScenarioEffectCommitUnitOfWork effectCommit,
    IScenarioNarrativeGenerationService narratives,
    IScenarioNarrativePublisher publisher,
    TimeProvider timeProvider,
    ILogger<ScenarioTurnExecutionOrchestrator> logger)
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        try
        {
            var execution = await fence.CheckAsync(context, ScenarioTurnStage.Snapshot, cancellationToken);
            if (execution is null) return LeaseLost();
            var step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            if (step is null)
            {
                var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
                if (world.SessionRevision != execution.AcceptedSessionRevision + 1)
                    return StaleSession();
                var snapshot = enumerator.Enumerate(world, $"RAS-{Guid.NewGuid():N}".ToUpperInvariant());
                var create = await steps.CreateAsync(context, execution, world, snapshot, timeProvider.GetUtcNow(), cancellationToken);
                if (create == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                if (create == ScenarioCheckpointWriteOutcome.Conflict) return StaleSession();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.DecisionJson is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.Decision, cancellationToken);
                if (execution is null) return LeaseLost();
                var snapshot = JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)
                    ?? throw new ScenarioTurnValidationException("invalid_action_snapshot");
                var decision = await decisions.DecideAsync(execution, context, snapshot, cancellationToken);
                var write = await steps.RecordDecisionAsync(context, decision, timeProvider.GetUtcNow(), cancellationToken);
                if (write == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.ResolutionPlanJson is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.Resolution, cancellationToken);
                if (execution is null) return LeaseLost();
                var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
                EnsureRevisions(step, world);
                var snapshot = enumerator.Enumerate(world,
                    JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)!.SnapshotId);
                var decision = JsonSerializer.Deserialize<RuleActionDecisionResult>(step.DecisionJson!, Json)!;
                ScenarioAiDecisionService.Validate(snapshot, decision);
                var resolution = resolutionService.Resolve(world, decision, step.Id);
                var write = await steps.RecordResolutionAsync(context, resolution, timeProvider.GetUtcNow(), cancellationToken);
                if (write == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.Stage == ScenarioTurnStage.Extension && step.ExtensionReceiptJson is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.Extension, cancellationToken);
                if (execution is null) return LeaseLost();
                var plan = JsonSerializer.Deserialize<ScenarioEffectPlan>(step.ResolutionPlanJson!, Json)
                    ?? throw new ScenarioTurnValidationException("invalid_effect_plan");
                var result = await extensions.ExecuteAsync(plan.ExtensionRequest
                    ?? throw new ScenarioTurnValidationException("extension_request_required"), cancellationToken);
                var write = await steps.RecordExtensionAsync(context, result, timeProvider.GetUtcNow(), cancellationToken);
                if (write == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.AppliedAt is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.EffectCommit, cancellationToken);
                if (execution is null) return LeaseLost();
                var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
                EnsureRevisions(step, world);
                var commit = await effectCommit.CommitAsync(context, world, cancellationToken);
                if (commit.Outcome == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                if (commit.Outcome == ScenarioCheckpointWriteOutcome.Conflict) return StaleObjects();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            execution = await fence.CheckAsync(context, ScenarioTurnStage.NarrativePublish, cancellationToken);
            if (execution is null) return LeaseLost();
            step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            if (step!.NarrativePublishedAt is not null) return new(true);
            var narrative = await narratives.GenerateAsync(execution, context, step, cancellationToken);
            if (await fence.CheckAsync(context, ScenarioTurnStage.NarrativePublish, cancellationToken) is null) return LeaseLost();
            var publish = await publisher.PublishAsync(context, narrative, cancellationToken);
            return publish switch
            {
                ScenarioNarrativePublishOutcome.Published or ScenarioNarrativePublishOutcome.Existing => new(true),
                ScenarioNarrativePublishOutcome.LeaseLost => LeaseLost(),
                ScenarioNarrativePublishOutcome.SessionAdvanced => new(false, false, "session_advanced", "Sessionが先へ進みました。", SessionExecutionStatus.Superseded),
                _ => new(false, true, "scenario_publish_conflict", "公開処理を再試行します。"),
            };
        }
        catch (ScenarioRuntimeRevisionConflictException)
        {
            return StaleObjects();
        }
        catch (ScenarioTurnValidationException exception) when (exception.Code == "stale_object_revision")
        {
            return StaleObjects();
        }
        catch (ScenarioTurnValidationException exception) when (exception.Code == "stale_session_revision")
        {
            return StaleSession();
        }
        catch (ScenarioTurnValidationException exception)
        {
            logger.LogWarning("Scenario turn validation failed. ExecutionId={ExecutionId} Code={Code}", context.ExecutionId, exception.Code);
            return new(false, false, exception.Code, "選択された行動を適用できませんでした。");
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            logger.LogWarning(exception, "Scenario turn AI stage failed. ExecutionId={ExecutionId}", context.ExecutionId);
            return new(false, true, "scenario_ai_failed", "AI処理を再試行します。");
        }
    }

    private static void EnsureRevisions(ScenarioActionStepSnapshot step, ScenarioRuleWorldSnapshot world)
    {
        if (world.SessionRevision != step.PreSessionRevision) throw new ScenarioTurnValidationException("stale_session_revision");
        var expected = JsonSerializer.Deserialize<Dictionary<string, long>>(step.ObjectRevisionsJson, Json) ?? [];
        if (world.Objects.Any(item => expected.GetValueOrDefault(item.Id, -1) != item.Revision))
            throw new ScenarioTurnValidationException("stale_object_revision");
    }

    private static SessionExecutionHandlerResult LeaseLost() => new(false, false, "lease_lost", "生成処理の所有権が失われました。");
    private static SessionExecutionHandlerResult StaleSession() => new(false, false, "stale_session_revision", "Sessionが更新されたため再入力してください。", SessionExecutionStatus.Superseded);
    private static SessionExecutionHandlerResult StaleObjects() => new(false, false, "stale_object_revision", "Object stateが更新されたため再入力してください。", SessionExecutionStatus.Superseded);
}

internal static class ScenarioJson
{
    internal static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };
}
