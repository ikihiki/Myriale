using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Services;

public sealed class ModuleHandoffExecutionHandler(
    ApplicationDbContext db,
    INarrativeGenerator generator,
    IHostEnvironment environment,
    ILogger<ModuleHandoffExecutionHandler> logger) : ISessionExecutionHandler
{
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();

    public string Kind => SessionExecutionKinds.ModuleHandoff;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext workerContext, CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == workerContext.ExecutionId, cancellationToken);
        if (execution is null
            || execution.Status != SessionExecutionStatuses.Running
            || execution.LeaseToken != workerContext.LeaseToken
            || execution.Revision != workerContext.Revision)
            return LeaseLost();
        if (execution.TriggerType != "module-outcome")
            return new(false, false, "invalid_trigger", "Module handoffの起点を確認できませんでした。");

        var source = await LoadSourceAsync(execution.TriggerId, cancellationToken);
        var causalError = ValidateCausality(execution, source);
        if (causalError is not null) return causalError;

        NarrativeHandoffRequest request;
        try
        {
            request = BuildRequest(source!);
        }
        catch (NarrativeHandoffValidationException exception)
        {
            return new(false, false, exception.Code, exception.Message,
                exception.Code == "session_advanced" ? SessionExecutionStatuses.Superseded : null);
        }

        NarrativeGeneration<string> generation;
        using var providerActivity = SessionExecutionTelemetry.ActivitySource.StartActivity("ai.provider.request", ActivityKind.Client);
        try
        {
            generation = await generator.GenerateAsync(request, cancellationToken);
            if (string.IsNullOrWhiteSpace(generation.Value) || generation.Value.Length > 20_000)
                throw new NarrativeGenerationException("Narrative provider returned an invalid body.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            var providerError = exception as AiProviderException;
            var code = providerError?.Code ?? (exception is OperationCanceledException ? AiProviderErrorCodes.Timeout : AiProviderErrorCodes.SchemaFailure);
            var retryable = providerError?.Retryable ?? exception is HttpRequestException or OperationCanceledException;
            providerActivity?.SetStatus(ActivityStatusCode.Error, code);
            await RecordFailureDiagnosticsAsync(workerContext.AttemptId, exception, code, retryable, cancellationToken);
            logger.LogWarning(exception, "Module handoff execution failed. ExecutionId={ExecutionId} ErrorCode={ErrorCode} Retryable={Retryable}", execution.Id, code, retryable);
            return new(false, retryable, code, "Narrativeを生成できませんでした。Moduleの結果は保存されています。");
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
            return LeaseLost();
        }
        await db.Entry(current).Reference(item => item.Session).Query()
            .Include(session => session.HeadTurn)
            .Include(session => session.State)
            .LoadAsync(cancellationToken);
        source = await LoadSourceAsync(current.TriggerId, cancellationToken);
        causalError = ValidateCausality(current, source);
        if (causalError is not null)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            return causalError;
        }

        var alreadyPublished = await db.SessionTurns.AsNoTracking()
            .SingleOrDefaultAsync(turn => turn.SourceModuleTurnId == source!.Id, cancellationToken);
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == workerContext.AttemptId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        if (alreadyPublished is not null)
        {
            SessionExecutionCompletion.MarkPublished(current, attempt, now);
            await db.SaveChangesAsync(cancellationToken);
            await publishTransaction.CommitAsync(cancellationToken);
            return new(true);
        }

        var sourceStateRevision = ResolveSourceStateRevision(source!);
        var artifact = new SessionArtifact
        {
            Id = $"ART-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = current.SessionId,
            ExecutionId = current.Id,
            AttemptId = workerContext.AttemptId,
            Kind = "narrative-text",
            Status = "committed",
            ContentType = "application/json",
            ContentJson = JsonSerializer.Serialize(new NarrativeHandoffResponse(generation.Value)),
            MetadataJson = JsonSerializer.Serialize(new { generation.Metadata.Provider, generation.Metadata.Model, generation.Metadata.ResponseId }),
            Checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(generation.Value))).ToLowerInvariant(),
            CreatedAt = now,
            ValidatedAt = now,
            CommittedAt = now,
        };
        var turn = new SessionTurn
        {
            Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = current.SessionId,
            PreviousTurnId = source!.Id,
            Position = source.Position + 1,
            Kind = "narrative",
            DialogueSchemaVersion = NarrativeDialogueSchema.Version,
            DialogueTurnType = "module-handoff",
            Heading = "確定した結果を受ける",
            NarrativeBody = generation.Value,
            AiProvider = generation.Metadata.Provider,
            AiModel = generation.Metadata.Model,
            AiResponseId = generation.Metadata.ResponseId,
            AiInputTokens = generation.Metadata.InputTokens,
            AiOutputTokens = generation.Metadata.OutputTokens,
            AiLatencyMilliseconds = generation.Metadata.LatencyMilliseconds,
            AiAttemptCount = generation.Metadata.AttemptCount,
            AiFinishReason = generation.Metadata.FinishReason,
            SourceModuleTurnId = source.Id,
            SourceSessionRevision = sourceStateRevision,
            CreatedAt = now,
        };
        current.Session.HeadTurnId = turn.Id;
        current.Session.HeadTurn = turn;
        current.Session.Revision++;
        current.Session.UpdatedAt = now;
        db.SessionArtifacts.Add(artifact);
        db.SessionTurns.Add(turn);
        attempt.Provider = generation.Metadata.Provider;
        attempt.Model = generation.Metadata.Model;
        attempt.ProviderRequestId = generation.Metadata.ResponseId;
        attempt.LatencyMilliseconds = generation.Metadata.LatencyMilliseconds;
        attempt.InputTokens = generation.Metadata.InputTokens;
        attempt.OutputTokens = generation.Metadata.OutputTokens;
        attempt.FinishReason = generation.Metadata.FinishReason;
        SessionExecutionCompletion.MarkPublished(current, attempt, now);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await publishTransaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            if (await db.SessionTurns.AsNoTracking().AnyAsync(item => item.SourceModuleTurnId == source.Id, cancellationToken))
                return await CompleteExistingPublicationAsync(workerContext, cancellationToken);
            return Superseded();
        }

        SessionExecutionTelemetry.ArtifactCommitted.Add(1, SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        SessionExecutionTelemetry.TurnPublished.Add(1, SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        SessionExecutionTelemetry.ArtifactSize.Record(Encoding.UTF8.GetByteCount(generation.Value), SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        return new(true);
    }

    private async Task<SessionExecutionHandlerResult> CompleteExistingPublicationAsync(
        SessionExecutionContext workerContext,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await LoadFencedForPublishAsync(workerContext, cancellationToken);
        if (execution is null)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return LeaseLost();
        }

        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == workerContext.AttemptId, cancellationToken);
        SessionExecutionCompletion.MarkPublished(execution, attempt, DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
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

    private Task<SessionTurn?> LoadSourceAsync(string sourceTurnId, CancellationToken cancellationToken) =>
        db.SessionTurns
            .Include(turn => turn.Session).ThenInclude(session => session.Scenario)
            .Include(turn => turn.Session).ThenInclude(session => session.HeadTurn)
            .Include(turn => turn.Session).ThenInclude(session => session.State)
            .Include(turn => turn.ModuleExecution).ThenInclude(moduleExecution => moduleExecution!.OutcomeApplication)
            .SingleOrDefaultAsync(turn => turn.Id == sourceTurnId, cancellationToken);

    private static SessionExecutionHandlerResult? ValidateCausality(SessionExecution execution, SessionTurn? source)
    {
        if (source?.ModuleExecution is null
            || source.SessionId != execution.SessionId
            || execution.AcceptedHeadTurnId != source.Id
            || execution.IdempotencyKey != $"module-handoff:{source.ModuleExecution.Id}")
            return new(false, false, "module_execution_missing", "Module実行を確認できませんでした。");
        if (source.Session.HeadTurnId != source.Id || source.Session.Revision != execution.AcceptedSessionRevision)
            return Superseded();
        return null;
    }

    private NarrativeHandoffRequest BuildRequest(SessionTurn source)
    {
        var execution = source.ModuleExecution!;
        if (execution.Status != ModuleExecutionStatuses.Completed || execution.OutcomeJson is null)
            throw new NarrativeHandoffValidationException("module_turn_not_completed", "Module Turnが完了していません。");

        ModuleOutcome outcome;
        JsonElement viewState;
        IReadOnlyDictionary<string, bool> flags;
        try
        {
            outcome = JsonSerializer.Deserialize<ModuleOutcome>(execution.OutcomeJson, _json)
                ?? throw new JsonException("Outcome is empty.");
            viewState = Parse(execution.ViewStateJson);
            flags = JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(source.Session.State.FlagsJson, _json)
                ?? new Dictionary<string, bool>();
        }
        catch (JsonException exception)
        {
            throw new NarrativeHandoffValidationException("narrative_source_invalid", "Narrative生成元の公開データを読み込めません。", exception);
        }

        if (outcome.Effects.Count > 0)
        {
            var application = execution.OutcomeApplication;
            if (application is null
                || application.SessionId != source.SessionId
                || application.AppliedSessionRevision != source.Session.State.Revision)
                throw new NarrativeHandoffValidationException("effects_not_applied", "Outcome Effectの適用が完了していません。");
        }

        return new NarrativeHandoffRequest(
            new NarrativeScenarioInput(
                source.Session.Scenario.Title,
                source.Session.Scenario.Summary,
                source.Session.Scenario.Genre,
                source.Session.Scenario.Tone,
                source.Session.Scenario.Lore,
                source.Session.Scenario.AiFreedom,
                source.Session.Scenario.Hero,
                source.Session.Scenario.Opening),
            new NarrativeOutcomeInput(
                outcome.Category,
                outcome.Code,
                outcome.Title,
                outcome.Summary,
                outcome.PublicFacts,
                outcome.EmittedEvents,
                outcome.NarrativeHints,
                outcome.ForbiddenNarrativeFacts),
            viewState,
            new NarrativeSessionStateInput(ResolveSourceStateRevision(source), flags));
    }

    private static long ResolveSourceStateRevision(SessionTurn source) =>
        source.ModuleExecution!.OutcomeApplication?.AppliedSessionRevision ?? source.Session.State.Revision;

    private async Task RecordFailureDiagnosticsAsync(string attemptId, Exception exception, string code, bool retryable, CancellationToken cancellationToken)
    {
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == attemptId, cancellationToken);
        attempt.ErrorCode = code;
        attempt.ErrorCategory = exception.GetType().Name;
        attempt.Retryable = retryable;
        if (environment.IsDevelopment())
        {
            attempt.ExceptionChain = string.Join(" -> ", Enumerate(exception).Select(item => item.GetType().Name));
            attempt.RedactedResponseExcerpt = DevelopmentErrorDetails.From(environment, exception) is { } details
                ? NarrativeExecutionHandler.Redact(details)
                : null;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static IEnumerable<Exception> Enumerate(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException!) yield return current;
    }

    private static SessionExecutionHandlerResult LeaseLost() =>
        new(false, false, "lease_lost", "生成処理の所有権が失われました。");

    private static SessionExecutionHandlerResult Superseded() =>
        new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}

public sealed class NarrativeHandoffValidationException(string code, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string Code { get; } = code;
}
