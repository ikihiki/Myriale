using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class NarrativeExecutionHandler(
    ApplicationDbContext db,
    INarrativeContextBuilder contextBuilder,
    INarrativePromptBuilder promptBuilder,
    INarrativeGenerator generator,
    SessionScenarioProgressionService progression,
    IHostEnvironment environment,
    ILogger<NarrativeExecutionHandler> logger) : ISessionExecutionHandler
{
    public string Kind => SessionExecutionKinds.Narrative;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext workerContext, CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == workerContext.ExecutionId
                && item.Status == SessionExecutionStatuses.Running
                && item.LeaseToken == workerContext.LeaseToken
                && item.Revision == workerContext.Revision,
            cancellationToken);
        if (execution is null)
            return new(false, false, "lease_lost", "生成処理の所有権が失われました。");
        var input = await db.SessionPlayerInputs.AsNoTracking().SingleAsync(item => item.Id == execution.TriggerId, cancellationToken);
        var session = await db.Sessions.AsNoTracking().Include(item => item.State).Include(item => item.HeadTurn)
            .SingleAsync(item => item.Id == execution.SessionId, cancellationToken);
        if (!string.Equals(session.HeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal))
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);

        NarrativeDialogueContext context;
        NarrativePromptInstructions prompt;
        NarrativeGeneration<NarrativeDialogueResult> generation;
        using var providerActivity = SessionExecutionTelemetry.ActivitySource.StartActivity("ai.provider.request", ActivityKind.Client);
        try
        {
            context = await contextBuilder.BuildDialogueAsync(session.OwnerId, session.Id, input.InteractionType, cancellationToken);
            prompt = promptBuilder.Build(context, input.InteractionType);
            generation = await generator.GenerateDialogueAsync(new NarrativeDialogueRequest(
                NarrativeDialogueSchema.Version, context.SchemaVersion, context.Diagnostics, context.Scenario, context.RecentTurns,
                context.Memory, context.PriorModuleOutcomes, input.InteractionType, prompt, input.Text, context.SessionState,
                context.CurrentProgressionNode, context.AllowedSignals, session.InterpretationEnabled), cancellationToken);
            if (string.IsNullOrWhiteSpace(generation.Value.Body) || generation.Value.Body.Length > 20_000)
                throw new NarrativeGenerationException("Narrative provider returned an invalid body.");
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            var providerError = exception as AiProviderException;
            var code = providerError?.Code ?? (exception is OperationCanceledException ? AiProviderErrorCodes.Timeout : AiProviderErrorCodes.SchemaFailure);
            var retryable = providerError?.Retryable ?? exception is HttpRequestException or OperationCanceledException;
            providerActivity?.SetStatus(ActivityStatusCode.Error, code);
            await RecordFailureDiagnosticsAsync(workerContext.AttemptId, exception, code, retryable, cancellationToken);
            logger.LogWarning(exception, "Narrative execution failed. ExecutionId={ExecutionId} ErrorCode={ErrorCode} Retryable={Retryable}", execution.Id, code, retryable);
            return new(false, retryable, code, "Narrativeを生成できませんでした。入力内容は保存されています。");
        }

        providerActivity?.SetTag("ai.provider.name", generation.Metadata.Provider);
        providerActivity?.SetTag("ai.model.name", generation.Metadata.Model);
        SessionExecutionTelemetry.ProviderDuration.Record(generation.Metadata.LatencyMilliseconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, generation.Metadata.Provider, generation.Metadata.Model));
        if (generation.Metadata.InputTokens is not null) SessionExecutionTelemetry.ProviderInputTokens.Record(generation.Metadata.InputTokens.Value, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, generation.Metadata.Provider, generation.Metadata.Model));
        if (generation.Metadata.OutputTokens is not null) SessionExecutionTelemetry.ProviderOutputTokens.Record(generation.Metadata.OutputTokens.Value, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, generation.Metadata.Provider, generation.Metadata.Model));

        db.ChangeTracker.Clear();
        await using var publishTransaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var current = await LoadFencedForPublishAsync(workerContext, cancellationToken);
        if (current is null)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            return new(false, false, "lease_lost", "生成処理の所有権が失われました。");
        }
        await db.Entry(current).Reference(item => item.Session).Query().Include(item => item.HeadTurn).LoadAsync(cancellationToken);
        if (!string.Equals(current.Session.HeadTurnId, current.AcceptedHeadTurnId, StringComparison.Ordinal))
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);
        }
        var alreadyPublished = await db.SessionTurns.AsNoTracking().SingleOrDefaultAsync(turn => turn.PlayerInputId == input.Id, cancellationToken);
        if (alreadyPublished is not null)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            return new(true);
        }

        var now = DateTimeOffset.UtcNow;
        var artifact = new SessionArtifact
        {
            Id = $"ART-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = current.SessionId,
            ExecutionId = current.Id,
            AttemptId = workerContext.AttemptId,
            Kind = "narrative-text",
            Status = "committed",
            ContentType = "application/json",
            ContentJson = JsonSerializer.Serialize(generation.Value),
            MetadataJson = JsonSerializer.Serialize(new { generation.Metadata.Provider, generation.Metadata.Model, generation.Metadata.ResponseId }),
            Checksum = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(generation.Value.Body))).ToLowerInvariant(),
            CreatedAt = now,
            ValidatedAt = now,
            CommittedAt = now,
        };
        var turn = new SessionTurn
        {
            Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = current.SessionId,
            PreviousTurnId = current.AcceptedHeadTurnId,
            Position = (current.Session.HeadTurn?.Position ?? 0) + 1,
            Kind = "narrative",
            DialogueSchemaVersion = generation.Value.SchemaVersion,
            ContextSchemaVersion = context.Diagnostics.SchemaVersion,
            ContextComponentIdsJson = JsonSerializer.Serialize(context.Diagnostics.ComponentIds),
            ContextSizeBytes = context.Diagnostics.SizeBytes,
            ContextHash = context.Diagnostics.Hash,
            PromptVersion = prompt.Version,
            DialogueTurnType = generation.Value.TurnType,
            Heading = generation.Value.Heading,
            NarrativeBody = generation.Value.Body,
            Interpretation = current.Session.InterpretationEnabled ? generation.Value.Interpretation : null,
            AiProvider = generation.Metadata.Provider,
            AiModel = generation.Metadata.Model,
            AiResponseId = generation.Metadata.ResponseId,
            AiInputTokens = generation.Metadata.InputTokens,
            AiOutputTokens = generation.Metadata.OutputTokens,
            AiLatencyMilliseconds = generation.Metadata.LatencyMilliseconds,
            AiAttemptCount = generation.Metadata.AttemptCount,
            AiFinishReason = generation.Metadata.FinishReason,
            PlayerInputId = input.Id,
            SourceSessionRevision = current.Session.State?.Revision ?? 0,
            CreatedAt = now,
        };
        current.Session.HeadTurnId = turn.Id;
        current.Session.HeadTurn = turn;
        current.Session.Revision++;
        current.Session.UpdatedAt = now;
        db.SessionArtifacts.Add(artifact);
        db.SessionTurns.Add(turn);
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == workerContext.AttemptId, cancellationToken);
        attempt.Provider = generation.Metadata.Provider; attempt.Model = generation.Metadata.Model; attempt.ProviderRequestId = generation.Metadata.ResponseId;
        attempt.LatencyMilliseconds = generation.Metadata.LatencyMilliseconds; attempt.InputTokens = generation.Metadata.InputTokens; attempt.OutputTokens = generation.Metadata.OutputTokens;
        attempt.FinishReason = generation.Metadata.FinishReason; attempt.PromptVersion = prompt.Version; attempt.ContextHash = context.Diagnostics.Hash; attempt.ContextSizeBytes = context.Diagnostics.SizeBytes;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await publishTransaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            if (await db.SessionTurns.AsNoTracking().AnyAsync(item => item.PlayerInputId == input.Id, cancellationToken)) return new(true);
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);
        }
        SessionExecutionTelemetry.ArtifactCommitted.Add(1, SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        SessionExecutionTelemetry.TurnPublished.Add(1, SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        SessionExecutionTelemetry.ArtifactSize.Record(System.Text.Encoding.UTF8.GetByteCount(generation.Value.Body), SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        await progression.EnsureNarrativeTurnAsync(session.OwnerId, turn.Id, cancellationToken);
        return new(true);
    }

    private Task<SessionExecution?> LoadFencedForPublishAsync(
        SessionExecutionContext workerContext,
        CancellationToken cancellationToken)
    {
        if (db.Database.IsNpgsql())
        {
            return db.SessionExecutions.FromSqlInterpolated($$"""
                SELECT *
                FROM "SessionExecutions"
                WHERE "Id" = {{workerContext.ExecutionId}}
                  AND "Status" = {{SessionExecutionStatuses.Running}}
                  AND "LeaseToken" = {{workerContext.LeaseToken}}
                  AND "Revision" = {{workerContext.Revision}}
                FOR UPDATE
                """).SingleOrDefaultAsync(cancellationToken);
        }

        return db.SessionExecutions.SingleOrDefaultAsync(
            item => item.Id == workerContext.ExecutionId
                && item.Status == SessionExecutionStatuses.Running
                && item.LeaseToken == workerContext.LeaseToken
                && item.Revision == workerContext.Revision,
            cancellationToken);
    }

    private async Task RecordFailureDiagnosticsAsync(string attemptId, Exception exception, string code, bool retryable, CancellationToken cancellationToken)
    {
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == attemptId, cancellationToken);
        attempt.ErrorCode = code;
        attempt.ErrorCategory = exception.GetType().Name;
        attempt.Retryable = retryable;
        if (environment.IsDevelopment())
        {
            attempt.ExceptionChain = string.Join(" -> ", Enumerate(exception).Select(item => item.GetType().Name));
            attempt.RedactedResponseExcerpt = DevelopmentErrorDetails.From(environment, exception) is { } details ? Redact(details) : null;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static IEnumerable<Exception> Enumerate(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException!) yield return current;
    }

    public static string Redact(string value)
    {
        var redacted = System.Text.RegularExpressions.Regex.Replace(value, "(?i)(authorization|api[-_ ]?key|cookie)\\s*[:=]\\s*[^,;\\s]+", "$1=[REDACTED]");
        return redacted.Length <= 1000 ? redacted : redacted[..1000];
    }
}
