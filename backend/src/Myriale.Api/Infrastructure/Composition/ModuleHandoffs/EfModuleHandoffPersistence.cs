using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ModuleHandoffs.Application;
using Myriale.Api.Features.ModuleHandoffs.Application.Services;
using Myriale.Api.Features.ProgressionRuntime.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Infrastructure.Hosting;
using Myriale.ModuleSdk;

namespace Myriale.Api.Infrastructure.Composition.ModuleHandoffs;

public sealed class EfModuleHandoffEnqueuePersistence(ApplicationDbContext db, TimeProvider timeProvider) : IModuleHandoffEnqueuePersistence
{
    public async Task<ModuleHandoffEnqueueOutcome> EnqueueAsync(
        ModuleHandoffEnqueueRequest request,
        AiProviderProfileId narrativeAiProfileId,
        CancellationToken cancellationToken)
    {
        var source = await db.SessionTurns.Include(turn => turn.Session)
            .SingleOrDefaultAsync(turn => turn.Id == request.SessionTurnId, cancellationToken)
            ?? throw new ModuleHandoffValidationException("module_execution_missing", "Module Turnを確認できませんでした。");
        var linkedExecutionId = await db.ModuleExecutions.AsNoTracking()
            .Where(execution => execution.SessionTurnId == source.Id)
            .Select(execution => (ModuleExecutionId?)execution.Id)
            .SingleOrDefaultAsync(cancellationToken);
        if (source.Kind != SessionTurnKind.Module || linkedExecutionId != request.ExecutionId
            || source.SessionId != source.Session.Id)
            throw new ModuleHandoffValidationException("module_execution_missing", "Module実行とSession Turnの因果関係を確認できませんでした。");
        if (source.Session.HeadTurnId != source.Id)
            throw new ModuleHandoffValidationException("session_advanced", "Sessionが先へ進んだためhandoffを開始できません。");

        var idempotencyKey = $"module-handoff:{request.ExecutionId}";
        if (db.SessionExecutions.Local.Any(item => item.SessionId == source.SessionId && item.IdempotencyKey == idempotencyKey)
            || await db.SessionExecutions.AnyAsync(item => item.SessionId == source.SessionId && item.IdempotencyKey == idempotencyKey, cancellationToken))
            return ModuleHandoffEnqueueOutcome.Existing;

        var now = timeProvider.GetUtcNow();
        db.SessionExecutions.Add(new SessionExecution
        {
            Id = new SessionExecutionId($"EXE-{Guid.NewGuid():N}".ToUpperInvariant()),
            SessionId = source.SessionId,
            Kind = SessionExecutionKind.ModuleHandoff,
            TriggerType = SessionExecutionTriggerType.ModuleOutcome,
            TriggerId = new SessionExecutionTriggerId(source.Id.AsPrimitive()),
            Status = SessionExecutionStatus.Queued,
            Revision = 0,
            IdempotencyKey = idempotencyKey,
            PayloadHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.ExecutionId.AsPrimitive()))).ToLowerInvariant(),
            NarrativeAiProfileId = narrativeAiProfileId,
            AcceptedHeadTurnId = source.Id,
            AcceptedSessionRevision = source.Session.Revision,
            CreatedAt = now,
            QueuedAt = now,
        });
        return ModuleHandoffEnqueueOutcome.Enqueued;
    }
}

public sealed class EfModuleHandoffSourceSnapshotQuery(ApplicationDbContext db) : IModuleHandoffSourceSnapshotQuery
{
    public async Task<ModuleHandoffSourceSnapshot?> LoadAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.AsNoTracking().SingleOrDefaultAsync(item => item.Id == context.ExecutionId
            && item.Status == SessionExecutionStatus.Running && item.LeaseToken == context.LeaseToken
            && item.Revision == context.Revision, cancellationToken);
        if (execution is null) return null;

        var triggerTurnId = new SessionTurnId(execution.TriggerId.AsPrimitive());
        var source = await db.SessionTurns.AsNoTracking()
            .Include(turn => turn.Session).ThenInclude(session => session.State)
            .SingleOrDefaultAsync(turn => turn.Id == triggerTurnId, cancellationToken);
        var moduleExecution = source is null ? null : await db.ModuleExecutions.AsNoTracking()
            .Include(module => module.OutcomeApplication)
            .SingleOrDefaultAsync(module => module.SessionTurnId == source.Id, cancellationToken);
        SessionTurnId? existing = source is null ? null : await db.SessionTurns.AsNoTracking()
            .Where(turn => turn.SourceModuleTurnId == source.Id).Select(turn => turn.Id)
            .SingleOrDefaultAsync(cancellationToken);
        var definitionId = source?.Session.ScenarioDefinitionVersionId;
        var entities = definitionId is null ? [] : await db.ScenarioObjects.AsNoTracking()
            .Where(item => item.DefinitionVersionId == definitionId).OrderBy(item => item.Code)
            .Select(item => new NarrativeEntityInput(item.Code, item.Name, item.ProfileMarkdown)).ToListAsync(cancellationToken);
        var definition = definitionId is null ? null : await db.ScenarioDefinitionVersions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == definitionId, cancellationToken);
        return new(
            execution.Id, execution.SessionId, source?.Session.OwnerId ?? default, execution.TriggerType,
            execution.TriggerId, execution.IdempotencyKey, execution.AcceptedHeadTurnId, execution.AcceptedSessionRevision,
            execution.NarrativeAiProfileId ?? default, source?.Id, source?.SessionId, source?.Kind, moduleExecution?.Id,
            moduleExecution?.Status, moduleExecution?.OutcomeJson, moduleExecution?.ViewStateJson,
            moduleExecution?.OutcomeApplication?.SessionId, moduleExecution?.OutcomeApplication?.AppliedSessionRevision,
            source?.Session.HeadTurnId, source?.Session.Revision ?? 0, source?.Session.State.Revision ?? 0,
            source?.Session.State.FlagsJson ?? "{}", definitionId,
            definition?.ScenarioTitle.Value ?? string.Empty, definition?.ScenarioSummary ?? string.Empty,
            definition?.ScenarioGenre ?? string.Empty, definition?.ScenarioTone ?? string.Empty,
            definition?.ScenarioLore ?? string.Empty, definition?.ScenarioAiFreedom ?? string.Empty,
            source?.Session.SelectedHero ?? string.Empty, definition?.ScenarioOpening ?? string.Empty,
            entities, existing);
    }
}

public sealed class EfModuleHandoffAiInteractionRecorder(
    ApplicationDbContext db,
    IHostEnvironment environment,
    ILogger<EfModuleHandoffAiInteractionRecorder> logger) : IModuleHandoffAiInteractionRecorder
{
    public Task RecordSuccessAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context, DateTimeOffset startedAt,
        NarrativeGeneration<string> generation, CancellationToken cancellationToken) =>
        PersistAsync(source, context, startedAt, generation.Metadata, generation.SentPrompt, generation.ReceivedResult,
            SessionAiInteractionStatus.Succeeded, null, null, false, cancellationToken);

    public async Task TryRecordFailureAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context, DateTimeOffset startedAt,
        Exception exception, string code, bool retryable, CancellationToken cancellationToken)
    {
        try
        {
            await PersistAsync(source, context, startedAt, null,
                (exception as AiProviderException)?.SentPrompt, (exception as AiProviderException)?.ReceivedResult,
                SessionAiInteractionStatus.Failed, code, exception.Message, retryable, cancellationToken);
            if (environment.IsDevelopment())
            {
                var attempt = await db.SessionExecutionAttempts.SingleOrDefaultAsync(item => item.Id == context.AttemptId, cancellationToken);
                if (attempt is not null)
                {
                    attempt.RecordFailureDiagnostics(
                        string.Join(" -> ", Enumerate(exception).Select(item => item.GetType().Name)),
                        DevelopmentErrorDetails.From(environment, exception) is { } details
                            ? SessionExecutionDiagnostics.Redact(details) : null);
                    await db.SaveChangesAsync(cancellationToken);
                }
            }
        }
        catch (Exception persistenceException)
        {
            db.ChangeTracker.Clear();
            logger.LogWarning(persistenceException, "Failed to persist Module handoff AI interaction. ExecutionId={ExecutionId}", source.ExecutionId);
        }
    }

    private async Task PersistAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context, DateTimeOffset startedAt,
        AiGenerationMetadata? metadata, string? sentPrompt, string? receivedResult, SessionAiInteractionStatus status,
        string? errorCode, string? errorMessage, bool retryable, CancellationToken cancellationToken)
    {
        var interaction = await db.SessionAiInteractions.SingleOrDefaultAsync(
            item => item.AttemptId == context.AttemptId && item.Stage == SessionAiInteractionStage.ModuleHandoff, cancellationToken);
        if (interaction is null)
        {
            interaction = new SessionAiInteraction
            {
                Id = new SessionAiInteractionId($"AII-{Guid.NewGuid():N}".ToUpperInvariant()), SessionId = source.SessionId,
                ExecutionId = source.ExecutionId, AttemptId = context.AttemptId, Sequence = 1,
                Stage = SessionAiInteractionStage.ModuleHandoff, AiProfileId = source.NarrativeAiProfileId, StartedAt = startedAt,
            };
            db.SessionAiInteractions.Add(interaction);
        }
        interaction.CompletedAt = DateTimeOffset.UtcNow;
        interaction.Provider = metadata?.Provider.AsPrimitive();
        interaction.Model = metadata?.Model;
        interaction.ProviderRequestId = metadata?.ResponseId;
        interaction.LatencyMilliseconds = metadata?.LatencyMilliseconds ?? Math.Max(0, (long)(interaction.CompletedAt - startedAt).TotalMilliseconds);
        interaction.InputTokens = metadata?.InputTokens;
        interaction.OutputTokens = metadata?.OutputTokens;
        interaction.FinishReason = metadata?.FinishReason;
        interaction.Status = status;
        interaction.ErrorCode = errorCode;
        interaction.ErrorMessage = errorMessage;
        interaction.SentPrompt = sentPrompt;
        interaction.ReceivedResult = receivedResult;
        interaction.ValidationResult = JsonSerializer.Serialize(new { status = status == SessionAiInteractionStatus.Succeeded ? "valid" : "not-validated" });
        var attempt = await db.SessionExecutionAttempts.SingleOrDefaultAsync(item => item.Id == context.AttemptId, cancellationToken);
        if (attempt is not null)
        {
            attempt.RecordProviderDiagnostics(
                metadata?.Provider.AsPrimitive(),
                metadata?.Model,
                metadata?.ResponseId,
                metadata?.LatencyMilliseconds,
                metadata?.InputTokens,
                metadata?.OutputTokens,
                metadata?.FinishReason,
                errorCode,
                errorCode is null ? null : "ai-provider",
                retryable);
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static IEnumerable<Exception> Enumerate(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException!) yield return current;
    }
}

public sealed class EfModuleHandoffPublishUnitOfWork(
    ApplicationDbContext db,
    IModuleHandoffSessionTurnAppender appender,
    IModuleHandoffArtifactWriter artifactWriter,
    EnsureProgressionSignalCommand progressionSignals,
    TimeProvider timeProvider) : IModuleHandoffPublishUnitOfWork
{
    private static readonly JsonSerializerOptions Json = ModuleJsonSerializerOptions.Create();

    public async Task<ModuleHandoffPublishResult> PublishAsync(SessionExecutionContext context,
        ModuleHandoffGenerationResult narrative, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await LoadFencedAsync(context, cancellationToken);
        if (execution is null) return new(ModuleHandoffPublishOutcome.LeaseLost);
        var triggerTurnId = new SessionTurnId(execution.TriggerId.AsPrimitive());
        var source = await db.SessionTurns
            .Include(turn => turn.Session).ThenInclude(session => session.HeadTurn)
            .Include(turn => turn.Session).ThenInclude(session => session.State)
            .SingleOrDefaultAsync(turn => turn.Id == triggerTurnId, cancellationToken);
        var moduleExecution = await db.ModuleExecutions
            .Include(module => module.OutcomeApplication)
            .SingleOrDefaultAsync(module => module.SessionTurnId == triggerTurnId, cancellationToken);
        if (source is null || moduleExecution is null || source.Kind != SessionTurnKind.Module || source.SessionId != execution.SessionId
            || execution.TriggerType != SessionExecutionTriggerType.ModuleOutcome || execution.AcceptedHeadTurnId != source.Id
            || execution.IdempotencyKey != $"module-handoff:{moduleExecution.Id}")
            return new(ModuleHandoffPublishOutcome.Conflict);
        var existing = await db.SessionTurns.AsNoTracking().SingleOrDefaultAsync(turn => turn.SourceModuleTurnId == source.Id, cancellationToken);
        if (existing is not null) return new(ModuleHandoffPublishOutcome.Existing, source.Session.OwnerId, existing.Id);
        if (source.Session.HeadTurnId != source.Id || source.Session.Revision != execution.AcceptedSessionRevision)
            return new(ModuleHandoffPublishOutcome.SessionAdvanced);
        if (moduleExecution.Status != ModuleExecutionStatus.Completed || moduleExecution.OutcomeJson is null)
            return new(ModuleHandoffPublishOutcome.Conflict);
        var outcome = JsonSerializer.Deserialize<ModuleOutcome>(moduleExecution.OutcomeJson, Json);
        if (outcome is null || ModuleHandoffNarrativeRequestBuilder.HasEffects(moduleExecution.OutcomeJson) && (moduleExecution.OutcomeApplication is null
            || moduleExecution.OutcomeApplication.SessionId != source.SessionId
            || moduleExecution.OutcomeApplication.AppliedSessionRevision != source.Session.State.Revision))
            return new(ModuleHandoffPublishOutcome.Conflict);

        var now = timeProvider.GetUtcNow();
        var sourceRevision = moduleExecution.OutcomeApplication?.AppliedSessionRevision ?? source.Session.State.Revision;
        var turn = appender.Append(source.Session, source.Id, sourceRevision, narrative.Generation, now);
        artifactWriter.Add(execution.SessionId, execution.Id, context.AttemptId, narrative.Generation, now);
        await progressionSignals.PrepareAsync(source.Session, turn, outcome.Code, now, cancellationToken);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            SessionExecutionTelemetry.ArtifactCommitted.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
            SessionExecutionTelemetry.TurnPublished.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
            SessionExecutionTelemetry.ArtifactSize.Record(Encoding.UTF8.GetByteCount(narrative.Generation.Value), SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
            return new(ModuleHandoffPublishOutcome.Published, source.Session.OwnerId, turn.Id);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return new(ModuleHandoffPublishOutcome.Conflict);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            var winner = await db.SessionTurns.AsNoTracking().SingleOrDefaultAsync(turn => turn.SourceModuleTurnId == source.Id, cancellationToken);
            return winner is null ? new(ModuleHandoffPublishOutcome.Conflict)
                : new(ModuleHandoffPublishOutcome.Existing, source.Session.OwnerId, winner.Id);
        }
    }

    private Task<SessionExecution?> LoadFencedAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        if (db.Database.IsNpgsql())
            return db.SessionExecutions.FromSqlInterpolated($$"""
                SELECT * FROM "SessionExecutions"
                WHERE "Id" = {{context.ExecutionId}} AND "Status" = {{SessionExecutionStatus.Running}}
                  AND "LeaseToken" = {{context.LeaseToken}} AND "Revision" = {{context.Revision}}
                FOR UPDATE
                """).SingleOrDefaultAsync(cancellationToken);
        return db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == context.ExecutionId
            && item.Status == SessionExecutionStatus.Running && item.LeaseToken == context.LeaseToken
            && item.Revision == context.Revision, cancellationToken);
    }
}
