using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Services;

public sealed class SessionNarrativeHandoffService(
    ApplicationDbContext db,
    INarrativeGenerator generator,
    ILogger<SessionNarrativeHandoffService> logger)
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();

    public async Task PrepareAsync(
        ModuleExecution execution,
        ModuleExecutionRequest completionRequest,
        ModuleOutcome? outcome,
        CancellationToken cancellationToken)
    {
        if (execution.SessionTurnId is null || outcome is null) return;
        if (await db.SessionNarrativeHandoffs.AnyAsync(
                handoff => handoff.SourceModuleTurnId == execution.SessionTurnId,
                cancellationToken))
            return;

        var source = await db.SessionTurns
            .Include(turn => turn.Session).ThenInclude(session => session.State)
            .SingleAsync(turn => turn.Id == execution.SessionTurnId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        db.SessionNarrativeHandoffs.Add(new SessionNarrativeHandoff
        {
            SourceModuleTurnId = source.Id,
            ExecutionId = execution.Id,
            SessionId = source.SessionId,
            SourceSessionRevision = source.Session.State.Revision,
            Status = "pending",
            IsRetryable = true,
            AttemptCount = 0,
            CreatedAt = now,
            UpdatedAt = now,
        });
    }

    public async Task EnsureAsync(string ownerId, string executionId, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var now = DateTimeOffset.UtcNow;
        var leaseId = $"NHL-{Guid.NewGuid():N}".ToUpperInvariant();
        var leaseExpiresAt = now.Add(LeaseDuration);
        var claim = await db.SessionNarrativeHandoffs
            .SingleOrDefaultAsync(handoff => handoff.ExecutionId == executionId, cancellationToken);
        if (claim is null
            || claim.Status == "completed"
            || !claim.IsRetryable
            || claim.LeaseExpiresAt is not null && claim.LeaseExpiresAt > now)
            return;
        claim.Status = "pending";
        claim.AttemptCount++;
        claim.Revision++;
        claim.LeaseId = leaseId;
        claim.LeaseExpiresAt = leaseExpiresAt;
        claim.LastErrorCode = null;
        claim.LastErrorMessage = null;
        claim.UpdatedAt = now;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return;
        }

        db.ChangeTracker.Clear();
        var handoff = await LoadClaimAsync(ownerId, executionId, leaseId, cancellationToken);
        if (handoff?.SourceModuleTurn.ModuleExecution is null) return;

        NarrativeHandoffRequest request;
        try
        {
            request = BuildRequest(handoff);
        }
        catch (NarrativeHandoffValidationException exception)
        {
            await MarkFailedAsync(executionId, leaseId, exception.Code, exception.Message, retryable: false, cancellationToken);
            return;
        }

        string body;
        AiGenerationMetadata generationMetadata;
        try
        {
            var generation = await generator.GenerateAsync(request, cancellationToken);
            body = generation.Value;
            generationMetadata = generation.Metadata;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return;
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            var providerError = exception as AiProviderException;
            var code = providerError?.Code ?? (exception is OperationCanceledException ? AiProviderErrorCodes.Timeout : AiProviderErrorCodes.SchemaFailure);
            var retryable = providerError?.Retryable ?? true;
            logger.LogWarning(
                exception,
                "Automatic narrative generation failed. ExecutionId={ExecutionId} LeaseId={LeaseId} ErrorCode={ErrorCode} ErrorMessage={ErrorMessage} Retryable={Retryable} ExceptionType={ExceptionType} InnerExceptionType={InnerExceptionType}",
                executionId,
                leaseId,
                code,
                exception.Message,
                retryable,
                exception.GetType().Name,
                exception.InnerException?.GetType().Name);
            await MarkFailedAsync(
                executionId,
                leaseId,
                code,
                "Narrativeの生成に失敗しました。",
                retryable,
                CancellationToken.None);
            return;
        }

        db.ChangeTracker.Clear();
        handoff = await LoadClaimAsync(ownerId, executionId, leaseId, cancellationToken);
        if (handoff is null) return;
        var source = handoff.SourceModuleTurn;
        if (source.NarrativeTurn is not null)
        {
            await NormalizeCompletedAsync(executionId, cancellationToken);
            return;
        }
        if (source.Session.HeadTurnId != source.Id
            || source.Session.State.Revision != handoff.SourceSessionRevision)
        {
            await MarkFailedAsync(
                executionId,
                leaseId,
                "session_advanced",
                "Narrative生成中にSessionが進行しました。",
                retryable: false,
                cancellationToken);
            return;
        }

        var completedAt = DateTimeOffset.UtcNow;
        source.Session.UpdatedAt = completedAt;
        source.Session.Revision++;
        handoff.Status = "completed";
        handoff.IsRetryable = false;
        handoff.LeaseId = null;
        handoff.LeaseExpiresAt = null;
        handoff.LastErrorCode = null;
        handoff.LastErrorMessage = null;
        handoff.UpdatedAt = completedAt;
        handoff.CompletedAt = completedAt;
        var narrativeTurn = new SessionTurn
        {
            Id = NewTurnId(),
            SessionId = source.SessionId,
            PreviousTurnId = source.Id,
            Position = source.Position + 1,
            Kind = "narrative",
            DialogueSchemaVersion = NarrativeDialogueSchema.Version,
            DialogueTurnType = "module-handoff",
            Heading = "確定した結果を受ける",
            NarrativeBody = body,
            AiProvider = generationMetadata.Provider,
            AiModel = generationMetadata.Model,
            AiResponseId = generationMetadata.ResponseId,
            AiInputTokens = generationMetadata.InputTokens,
            AiOutputTokens = generationMetadata.OutputTokens,
            AiLatencyMilliseconds = generationMetadata.LatencyMilliseconds,
            AiAttemptCount = generationMetadata.AttemptCount,
            AiFinishReason = generationMetadata.FinishReason,
            SourceModuleTurnId = source.Id,
            SourceSessionRevision = handoff.SourceSessionRevision,
            CreatedAt = completedAt,
        };
        source.Session.HeadTurnId = narrativeTurn.Id;
        source.Session.HeadTurn = narrativeTurn;
        db.SessionTurns.Add(narrativeTurn);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            if (await db.SessionTurns.AsNoTracking().AnyAsync(turn => turn.SourceModuleTurnId == source.Id, cancellationToken))
                await NormalizeCompletedAsync(executionId, cancellationToken);
            else
                await MarkFailedAsync(
                    executionId,
                    leaseId,
                    "session_advanced",
                    "Narrative生成中にSessionが進行しました。",
                    retryable: false,
                    cancellationToken);
        }
    }

    private async Task<SessionNarrativeHandoff?> LoadClaimAsync(
        string ownerId,
        string executionId,
        string leaseId,
        CancellationToken cancellationToken) =>
        await db.SessionNarrativeHandoffs
            .Include(handoff => handoff.SourceModuleTurn)
                .ThenInclude(turn => turn.Session).ThenInclude(session => session.Scenario)
            .Include(handoff => handoff.SourceModuleTurn)
                .ThenInclude(turn => turn.Session).ThenInclude(session => session.HeadTurn)
            .Include(handoff => handoff.SourceModuleTurn)
                .ThenInclude(turn => turn.Session).ThenInclude(session => session.State)
            .Include(handoff => handoff.SourceModuleTurn)
                .ThenInclude(turn => turn.ModuleExecution).ThenInclude(execution => execution!.OutcomeApplication)
            .Include(handoff => handoff.SourceModuleTurn).ThenInclude(turn => turn.NarrativeTurn)
            .SingleOrDefaultAsync(handoff => handoff.ExecutionId == executionId
                && handoff.LeaseId == leaseId
                && handoff.SourceModuleTurn.Session.OwnerId == ownerId,
                cancellationToken);

    private NarrativeHandoffRequest BuildRequest(SessionNarrativeHandoff handoff)
    {
        var source = handoff.SourceModuleTurn;
        var execution = source.ModuleExecution!;
        if (execution.Status != ModuleExecutionStatuses.Completed || execution.OutcomeJson is null)
            throw new NarrativeHandoffValidationException("module_turn_not_completed", "Module Turnが完了していません。");
        if (source.Session.HeadTurnId != source.Id
            || source.Session.State.Revision != handoff.SourceSessionRevision)
            throw new NarrativeHandoffValidationException("session_advanced", "Module Turnの後にSessionが進行しています。");

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
                || application.AppliedSessionRevision != handoff.SourceSessionRevision)
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
            new NarrativeSessionStateInput(handoff.SourceSessionRevision, flags));
    }

    private Task<int> MarkFailedAsync(
        string executionId,
        string leaseId,
        string code,
        string message,
        bool retryable,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        return db.SessionNarrativeHandoffs
            .Where(handoff => handoff.ExecutionId == executionId && handoff.LeaseId == leaseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(handoff => handoff.Status, "failed")
                .SetProperty(handoff => handoff.IsRetryable, retryable)
                .SetProperty(handoff => handoff.LeaseId, (string?)null)
                .SetProperty(handoff => handoff.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(handoff => handoff.LastErrorCode, code)
                .SetProperty(handoff => handoff.LastErrorMessage, message)
                .SetProperty(handoff => handoff.UpdatedAt, now),
                cancellationToken);
    }

    private Task<int> NormalizeCompletedAsync(string executionId, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        return db.SessionNarrativeHandoffs
            .Where(handoff => handoff.ExecutionId == executionId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(handoff => handoff.Status, "completed")
                .SetProperty(handoff => handoff.IsRetryable, false)
                .SetProperty(handoff => handoff.LeaseId, (string?)null)
                .SetProperty(handoff => handoff.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(handoff => handoff.LastErrorCode, (string?)null)
                .SetProperty(handoff => handoff.LastErrorMessage, (string?)null)
                .SetProperty(handoff => handoff.UpdatedAt, now)
                .SetProperty(handoff => handoff.CompletedAt, handoff => handoff.CompletedAt ?? now),
                cancellationToken);
    }

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static string NewTurnId() => $"TRN-{Guid.NewGuid():N}".ToUpperInvariant();
}

public sealed class NarrativeHandoffValidationException(string code, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string Code { get; } = code;
}
