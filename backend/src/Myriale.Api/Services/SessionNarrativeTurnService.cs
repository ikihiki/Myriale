using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class SessionNarrativeTurnService(
    ApplicationDbContext db,
    INarrativeContextBuilder contextBuilder,
    INarrativePromptBuilder promptBuilder,
    INarrativeGenerator generator,
    SessionScenarioProgressionService progression,
    IOptions<AiProviderOptions> aiOptions,
    IHostEnvironment environment,
    ILogger<SessionNarrativeTurnService> logger)
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);

    public Task<SessionNarrativeTurnResult> CreateAsync(
        string ownerId,
        string sessionId,
        CreateNarrativeTurnRequest request,
        CancellationToken cancellationToken) =>
        CreateCoreAsync(ownerId, sessionId, request, cancellationToken, 0);

    private async Task<SessionNarrativeTurnResult> CreateCoreAsync(
        string ownerId,
        string sessionId,
        CreateNarrativeTurnRequest request,
        CancellationToken cancellationToken,
        int acceptanceRetryCount)
    {
        if (string.IsNullOrWhiteSpace(request.RequestId) || request.RequestId.Length > 120)
            return SessionNarrativeTurnResult.Error(400, "invalid_request_id", "RequestIdを指定してください。");
        var inputText = request.Input?.Trim() ?? string.Empty;
        if (inputText.Length is 0 or > 4000)
            return SessionNarrativeTurnResult.Error(400, "invalid_input", "入力は1文字以上4000文字以内で指定してください。");
        var interactionType = request.InteractionType?.Trim() ?? string.Empty;
        if (!NarrativeInteractionTypes.Allowed.Contains(interactionType))
            return SessionNarrativeTurnResult.Error(400, "invalid_interaction_type", "InteractionTypeが不正です。");

        var session = await db.Sessions
            .Include(item => item.Scenario)
            .Include(item => item.State)
            .Include(item => item.HeadTurn)
            .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);
        if (session is null) return SessionNarrativeTurnResult.Error(404, "session_not_found", "Sessionが見つかりません。");
        if (!string.Equals(session.Status, "active", StringComparison.OrdinalIgnoreCase))
            return SessionNarrativeTurnResult.Error(409, "session_not_active", "Sessionは入力を受け付けていません。");

        var hashPayload = $"{interactionType}\n{inputText}";
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hashPayload))).ToLowerInvariant();
        var completedInput = await db.SessionPlayerInputs
            .Include(item => item.NarrativeTurn)
            .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
        if (completedInput is not null)
        {
            if (!string.Equals(completedInput.PayloadHash, hash, StringComparison.Ordinal))
                return SessionNarrativeTurnResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
            if (completedInput.NarrativeTurn is null)
                return SessionNarrativeTurnResult.Error(409, "narrative_incomplete", "完了済みPlayer InputにNarrative Turnがありません。");
            return await CompleteAsync(ownerId, completedInput.NarrativeTurn, cancellationToken);
        }

        var pendingInput = await db.SessionPendingPlayerInputs
            .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
        if (pendingInput is not null)
        {
            if (!string.Equals(pendingInput.PayloadHash, hash, StringComparison.Ordinal))
                return SessionNarrativeTurnResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
            if (!pendingInput.IsRetryable)
                return SessionNarrativeTurnResult.Error(409, pendingInput.ErrorCode ?? "narrative_not_retryable", pendingInput.ErrorMessage ?? "Narrative生成を再試行できません。");
        }
        else
        {
            var quotaError = await CheckQuotaAsync(ownerId, sessionId, cancellationToken);
            if (quotaError is not null) return quotaError;

            var now = DateTimeOffset.UtcNow;
            pendingInput = new SessionPendingPlayerInput
            {
                Id = $"INP-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = sessionId,
                RequestId = request.RequestId,
                Text = inputText,
                InteractionType = interactionType,
                PayloadHash = hash,
                AcceptedAfterTurnId = session.HeadTurnId,
                Status = "pending",
                Revision = 0,
                AttemptCount = 0,
                IsRetryable = true,
                CreatedAt = now,
                UpdatedAt = now,
            };
            session.Revision++;
            db.SessionPendingPlayerInputs.Add(pendingInput);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException) when (acceptanceRetryCount < 5)
            {
                db.ChangeTracker.Clear();
                return await CreateCoreAsync(ownerId, sessionId, request, cancellationToken, acceptanceRetryCount + 1);
            }
            catch (DbUpdateException)
            {
                db.ChangeTracker.Clear();
                completedInput = await db.SessionPlayerInputs.AsNoTracking()
                    .Include(item => item.NarrativeTurn)
                    .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
                if (completedInput is not null)
                {
                    if (!string.Equals(completedInput.PayloadHash, hash, StringComparison.Ordinal))
                        return SessionNarrativeTurnResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
                    if (completedInput.NarrativeTurn is null) throw;
                    return await CompleteAsync(ownerId, completedInput.NarrativeTurn, cancellationToken);
                }
                pendingInput = await db.SessionPendingPlayerInputs
                    .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
                if (pendingInput is null) throw;
                if (!string.Equals(pendingInput.PayloadHash, hash, StringComparison.Ordinal))
                    return SessionNarrativeTurnResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
            }
        }

        db.ChangeTracker.Clear();
        var currentHeadId = await db.Sessions.AsNoTracking()
            .Where(item => item.Id == sessionId && item.OwnerId == ownerId)
            .Select(item => item.HeadTurnId)
            .SingleAsync(cancellationToken);
        if (!SameTurn(currentHeadId, pendingInput.AcceptedAfterTurnId))
        {
            await MarkFailedAsync(pendingInput.Id, null, "session_advanced", "Player Input受付後にSessionが進行しました。", retryable: false, cancellationToken);
            return SessionNarrativeTurnResult.Error(409, "session_advanced", "Player Input受付後にSessionが進行しました。");
        }

        pendingInput = await db.SessionPendingPlayerInputs.SingleAsync(item => item.Id == pendingInput.Id, cancellationToken);
        var leaseId = $"NIL-{Guid.NewGuid():N}".ToUpperInvariant();
        var nowClaimed = DateTimeOffset.UtcNow;
        if (pendingInput.LeaseExpiresAt is not null && pendingInput.LeaseExpiresAt > nowClaimed)
            return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        pendingInput.Status = "pending";
        pendingInput.Revision++;
        pendingInput.AttemptCount++;
        pendingInput.LeaseId = leaseId;
        pendingInput.LeaseExpiresAt = nowClaimed.Add(LeaseDuration);
        pendingInput.ErrorCode = null;
        pendingInput.ErrorMessage = null;
        pendingInput.UpdatedAt = nowClaimed;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        }

        db.ChangeTracker.Clear();
        var claimed = await LoadClaimAsync(ownerId, pendingInput.Id, leaseId, cancellationToken);
        if (claimed is null) return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        if (!SameTurn(claimed.Session.HeadTurnId, claimed.AcceptedAfterTurnId))
        {
            await MarkFailedAsync(pendingInput.Id, leaseId, "session_advanced", "Narrative生成前にSessionが進行しました。", retryable: false, cancellationToken);
            return SessionNarrativeTurnResult.Error(409, "session_advanced", "Narrative生成前にSessionが進行しました。");
        }

        NarrativeDialogueContext context;
        IReadOnlyList<NarrativeAllowedSignal> providerAllowedSignals;
        NarrativePromptInstructions prompt;
        NarrativeDialogueResult generated;
        AiGenerationMetadata generationMetadata;
        try
        {
            context = await contextBuilder.BuildDialogueAsync(ownerId, sessionId, interactionType, cancellationToken);
            prompt = promptBuilder.Build(context, interactionType);
            providerAllowedSignals = context.AllowedSignals;
            var generation = await generator.GenerateDialogueAsync(
                new NarrativeDialogueRequest(
                    NarrativeDialogueSchema.Version,
                    context.SchemaVersion,
                    context.Diagnostics,
                    context.Scenario,
                    context.RecentTurns,
                    context.Memory,
                    context.PriorModuleOutcomes,
                    interactionType,
                    prompt,
                    inputText,
                    context.SessionState,
                    context.CurrentProgressionNode,
                    context.AllowedSignals,
                    claimed.Session.InterpretationEnabled),
                cancellationToken);
            generated = generation.Value;
            generationMetadata = generation.Metadata;
            ValidateGeneratedResult(generated, generationMetadata, interactionType, claimed.Session.InterpretationEnabled);
            ValidateSignals(generated.Signals, generationMetadata, providerAllowedSignals);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await ReleaseClaimAsync(pendingInput.Id, leaseId);
            throw;
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            var providerError = exception as AiProviderException;
            var code = providerError?.Code ?? (exception is OperationCanceledException ? AiProviderErrorCodes.Timeout : AiProviderErrorCodes.SchemaFailure);
            var retryable = providerError?.Retryable ?? true;
            logger.LogWarning(
                exception,
                "Dialogue narrative generation failed. SessionId={SessionId} PendingInputId={PendingInputId} LeaseId={LeaseId} ErrorCode={ErrorCode} ErrorMessage={ErrorMessage} Retryable={Retryable} ExceptionType={ExceptionType} InnerExceptionType={InnerExceptionType}",
                sessionId,
                pendingInput.Id,
                leaseId,
                code,
                exception.Message,
                retryable,
                exception.GetType().Name,
                exception.InnerException?.GetType().Name);
            const string message = "Narrativeの生成に失敗しました。";
            var details = DevelopmentErrorDetails.From(environment, exception);
            await MarkFailedAsync(pendingInput.Id, leaseId, code, details is null ? message : $"{message} {details}", retryable, CancellationToken.None);
            return SessionNarrativeTurnResult.Error(code == AiProviderErrorCodes.RateLimited ? 429 : 503, code, message, details);
        }

        db.ChangeTracker.Clear();
        claimed = await LoadClaimAsync(ownerId, pendingInput.Id, leaseId, cancellationToken);
        if (claimed is null)
        {
            var concurrentlyCompleted = await db.SessionPlayerInputs.AsNoTracking()
                .Include(item => item.NarrativeTurn)
                .SingleOrDefaultAsync(item => item.Id == pendingInput.Id, cancellationToken);
            return concurrentlyCompleted?.NarrativeTurn is not null
                ? await CompleteAsync(ownerId, concurrentlyCompleted.NarrativeTurn, cancellationToken)
                : SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        }
        var claimedSession = claimed.Session;
        if (!SameTurn(claimedSession.HeadTurnId, claimed.AcceptedAfterTurnId))
        {
            await MarkFailedAsync(pendingInput.Id, leaseId, "session_advanced", "Narrative生成中にSessionが進行しました。", retryable: false, cancellationToken);
            return SessionNarrativeTurnResult.Error(409, "session_advanced", "Narrative生成中にSessionが進行しました。");
        }

        var completedAt = DateTimeOffset.UtcNow;
        var finalizedInput = new SessionPlayerInput
        {
            Id = claimed.Id,
            SessionId = claimed.SessionId,
            RequestId = claimed.RequestId,
            Text = claimed.Text,
            InteractionType = claimed.InteractionType,
            PayloadHash = claimed.PayloadHash,
            AcceptedAfterTurnId = claimed.AcceptedAfterTurnId,
            CreatedAt = claimed.CreatedAt,
        };
        var turn = new SessionTurn
        {
            Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = sessionId,
            PreviousTurnId = claimed.AcceptedAfterTurnId,
            Position = (claimedSession.HeadTurn?.Position ?? 0) + 1,
            Kind = "narrative",
            DialogueSchemaVersion = generated.SchemaVersion,
            ContextSchemaVersion = context.Diagnostics.SchemaVersion,
            ContextComponentIdsJson = JsonSerializer.Serialize(context.Diagnostics.ComponentIds),
            ContextSizeBytes = context.Diagnostics.SizeBytes,
            ContextHash = context.Diagnostics.Hash,
            PromptVersion = prompt.Version,
            DialogueTurnType = generated.TurnType,
            Heading = generated.Heading,
            NarrativeBody = generated.Body,
            Interpretation = claimedSession.InterpretationEnabled ? generated.Interpretation : null,
            AiProvider = generationMetadata.Provider,
            AiModel = generationMetadata.Model,
            AiResponseId = generationMetadata.ResponseId,
            AiInputTokens = generationMetadata.InputTokens,
            AiOutputTokens = generationMetadata.OutputTokens,
            AiLatencyMilliseconds = generationMetadata.LatencyMilliseconds,
            AiAttemptCount = generationMetadata.AttemptCount,
            AiFinishReason = generationMetadata.FinishReason,
            PlayerInputId = finalizedInput.Id,
            PlayerInput = finalizedInput,
            SourceSessionRevision = claimedSession.State.Revision,
            CreatedAt = completedAt,
        };
        claimedSession.HeadTurnId = turn.Id;
        claimedSession.HeadTurn = turn;
        claimedSession.Revision++;
        claimedSession.UpdatedAt = completedAt;
        db.SessionPlayerInputs.Add(finalizedInput);
        db.SessionPendingPlayerInputs.Remove(claimed);
        foreach (var generatedSignal in generated.Signals)
        {
            var signal = new SessionNarrativeSignal
            {
                Id = $"NSG-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = sessionId,
                NarrativeTurnId = turn.Id,
                Code = generatedSignal.Code,
                Evidence = generatedSignal.Evidence.Trim(),
                CreatedAt = completedAt,
            };
            db.SessionNarrativeSignals.Add(signal);
            if (claimedSession.Progress is null) continue;
            var transition = await db.ScenarioProgressionTransitions.AsNoTracking()
                .SingleOrDefaultAsync(item => item.SourceNodeId == claimedSession.Progress.CurrentNodeId
                    && item.SignalCode == generatedSignal.Code, cancellationToken);
            if (transition is null) continue;
            var snapshot = await db.SessionProgressionModuleSnapshots.AsNoTracking()
                .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.TransitionId == transition.Id, cancellationToken);
            db.SessionProgressionTransitionReceipts.Add(new SessionProgressionTransitionReceipt
            {
                Id = $"PTR-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = sessionId,
                SourceSignalId = signal.Id,
                TransitionId = transition.Id,
                FromNodeId = transition.SourceNodeId,
                ToNodeId = transition.TargetNodeId,
                Status = snapshot is null ? "waiting-configuration" : "pending",
                ModuleId = snapshot?.ModuleId,
                ModuleVersion = snapshot?.ModuleVersion,
                ModuleDigest = snapshot?.ModuleDigest,
                ModuleConfigurationJson = snapshot?.ConfigurationJson,
                ModuleContextJson = snapshot?.ContextJson,
                ModuleRandomValueCount = snapshot?.RandomValueCount ?? 0,
                Revision = 0,
                AttemptCount = 0,
                IsRetryable = snapshot is not null,
                CreatedAt = completedAt,
                UpdatedAt = completedAt,
            });
            claimedSession.Progress.CurrentNodeId = transition.TargetNodeId;
            claimedSession.Progress.Revision++;
            claimedSession.Progress.UpdatedAt = completedAt;
        }
        db.SessionTurns.Add(turn);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return await CompleteAsync(ownerId, turn, cancellationToken);
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            var existing = await db.SessionPlayerInputs.AsNoTracking().Include(item => item.NarrativeTurn)
                .SingleAsync(item => item.Id == pendingInput.Id, cancellationToken);
            if (existing.NarrativeTurn is null)
            {
                await MarkFailedAsync(pendingInput.Id, null, "session_advanced", "Narrative生成中にSessionが進行しました。", retryable: false, cancellationToken);
                return SessionNarrativeTurnResult.Error(409, "session_advanced", "Narrative生成中にSessionが進行しました。");
            }
            return await CompleteAsync(ownerId, existing.NarrativeTurn, cancellationToken);
        }
    }

    private async Task<SessionNarrativeTurnResult?> CheckQuotaAsync(
        string ownerId,
        string sessionId,
        CancellationToken cancellationToken)
    {
        var options = aiOptions.Value;
        var cutoff = DateTimeOffset.UtcNow.AddMinutes(-1);
        var sessionCompletedAt = await db.SessionPlayerInputs.AsNoTracking()
            .Where(input => input.SessionId == sessionId)
            .Select(input => input.CreatedAt)
            .ToListAsync(cancellationToken);
        var sessionPendingAt = await db.SessionPendingPlayerInputs.AsNoTracking()
            .Where(input => input.SessionId == sessionId)
            .Select(input => input.CreatedAt)
            .ToListAsync(cancellationToken);
        var sessionRequests = sessionCompletedAt.Count(createdAt => createdAt >= cutoff)
            + sessionPendingAt.Count(createdAt => createdAt >= cutoff);
        if (sessionRequests >= options.SessionRequestsPerMinute)
            return SessionNarrativeTurnResult.Error(429, "session_rate_limited", "SessionのAI入力上限に達しました。しばらく待って再試行してください。");

        var userCompletedAt = await db.SessionPlayerInputs.AsNoTracking()
            .Where(input => input.Session.OwnerId == ownerId)
            .Select(input => input.CreatedAt)
            .ToListAsync(cancellationToken);
        var userPendingAt = await db.SessionPendingPlayerInputs.AsNoTracking()
            .Where(input => input.Session.OwnerId == ownerId)
            .Select(input => input.CreatedAt)
            .ToListAsync(cancellationToken);
        var userRequests = userCompletedAt.Count(createdAt => createdAt >= cutoff)
            + userPendingAt.Count(createdAt => createdAt >= cutoff);
        if (userRequests >= options.UserRequestsPerMinute)
            return SessionNarrativeTurnResult.Error(429, "user_rate_limited", "ユーザーのAI入力上限に達しました。しばらく待って再試行してください。");

        var tokenUsage = await db.SessionTurns.AsNoTracking()
            .Where(turn => turn.SessionId == sessionId)
            .Select(turn => new { turn.AiInputTokens, turn.AiOutputTokens })
            .ToListAsync(cancellationToken);
        var consumedTokens = tokenUsage.Sum(turn => (long)(turn.AiInputTokens ?? 0) + (turn.AiOutputTokens ?? 0));
        if (consumedTokens >= options.MaxTokensPerSession)
            return SessionNarrativeTurnResult.Error(429, "session_ai_budget_exceeded", "SessionのAI利用上限に達しました。");

        return null;
    }

    private async Task<SessionNarrativeTurnResult> CompleteAsync(string ownerId, SessionTurn turn, CancellationToken cancellationToken)
    {
        await progression.EnsureNarrativeTurnAsync(ownerId, turn.Id, cancellationToken);
        return SessionNarrativeTurnResult.Success(turn);
    }

    private static bool SameTurn(string? left, string? right) => string.Equals(left, right, StringComparison.Ordinal);

    private void ValidateGeneratedResult(
        NarrativeDialogueResult result,
        AiGenerationMetadata metadata,
        string interactionType,
        bool interpretationRequired)
    {
        var violations = new List<string>();
        if (!string.Equals(result.SchemaVersion, NarrativeDialogueSchema.Version, StringComparison.Ordinal))
            violations.Add($"schemaVersion expected={NarrativeDialogueSchema.Version} actual={result.SchemaVersion}");
        if (!NarrativeDialogueSchema.TurnTypes.Contains(result.TurnType))
            violations.Add($"turnType unsupported actual={result.TurnType}");
        var expectedTurnTypes = interactionType == NarrativeInteractionTypes.Clarification
            ? "clarification"
            : "action-result|npc-reply";
        var turnTypeMatchesInteraction = interactionType switch
        {
            NarrativeInteractionTypes.Clarification => result.TurnType == "clarification",
            NarrativeInteractionTypes.Dialogue => result.TurnType is "action-result" or "npc-reply",
            _ => false,
        };
        if (!turnTypeMatchesInteraction)
            violations.Add($"turnType mismatch interactionType={interactionType} expected={expectedTurnTypes} actual={result.TurnType}");
        if (string.IsNullOrWhiteSpace(result.Heading)) violations.Add("heading is empty");
        else if (result.Heading.Length > 120) violations.Add($"heading length={result.Heading.Length} max=120");
        if (string.IsNullOrWhiteSpace(result.Body)) violations.Add("body is empty");
        else if (result.Body.Length > 20_000) violations.Add($"body length={result.Body.Length} max=20000");
        if (result.Signals is null) violations.Add("signals is null");
        else if (result.TurnType == "clarification" && result.Signals.Count > 0)
            violations.Add($"clarification returned signals count={result.Signals.Count}");
        if (interpretationRequired && string.IsNullOrWhiteSpace(result.Interpretation))
            violations.Add("interpretation is required but empty");
        if (result.Interpretation?.Length > 500)
            violations.Add($"interpretation length={result.Interpretation.Length} max=500");

        if (violations.Count == 0) return;
        var reason = string.Join("; ", violations);
        logger.LogWarning(
            "AI Provider dialogue failed semantic validation. Provider={Provider} Model={Model} ResponseId={ResponseId} InteractionType={InteractionType} InterpretationRequired={InterpretationRequired} TurnType={TurnType} HeadingLength={HeadingLength} BodyLength={BodyLength} SignalCount={SignalCount} InterpretationLength={InterpretationLength} Violations={Violations}",
            metadata.Provider,
            metadata.Model,
            metadata.ResponseId,
            interactionType,
            interpretationRequired,
            result.TurnType,
            result.Heading?.Length ?? 0,
            result.Body?.Length ?? 0,
            result.Signals?.Count,
            result.Interpretation?.Length,
            reason);
        throw new NarrativeGenerationException($"Narrative provider returned an invalid dialogue result: {reason}");
    }

    private void ValidateSignals(
        IReadOnlyList<NarrativeProgressionSignal> signals,
        AiGenerationMetadata metadata,
        IReadOnlyList<NarrativeAllowedSignal> allowedSignals)
    {
        if (signals.Count > 1)
        {
            logger.LogWarning(
                "AI Provider returned too many progression signals. Provider={Provider} Model={Model} ResponseId={ResponseId} SignalCount={SignalCount} AllowedSignalCount={AllowedSignalCount}",
                metadata.Provider, metadata.Model, metadata.ResponseId, signals.Count, allowedSignals.Count);
            throw new NarrativeGenerationException($"Narrative provider returned too many progression signals: count={signals.Count}, max=1.");
        }
        var allowedCodes = allowedSignals.Select(signal => signal.Code).ToHashSet(StringComparer.Ordinal);
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var signal in signals)
        {
            var violations = new List<string>();
            if (string.IsNullOrWhiteSpace(signal.Code)) violations.Add("code is empty");
            else
            {
                if (signal.Code.Length > 80) violations.Add($"code length={signal.Code.Length} max=80");
                if (signal.Code.Any(character => !(char.IsLower(character) || char.IsDigit(character) || character == '-')))
                    violations.Add("code contains invalid characters");
                if (!seen.Add(signal.Code)) violations.Add($"code is duplicated code={signal.Code}");
                if (!allowedCodes.Contains(signal.Code)) violations.Add($"code is not allowed code={signal.Code}");
            }
            if (string.IsNullOrWhiteSpace(signal.Evidence)) violations.Add("evidence is empty");
            else if (signal.Evidence.Length > 500) violations.Add($"evidence length={signal.Evidence.Length} max=500");
            if (violations.Count == 0) continue;

            var reason = string.Join("; ", violations);
            logger.LogWarning(
                "AI Provider progression signal failed validation. Provider={Provider} Model={Model} ResponseId={ResponseId} SignalCode={SignalCode} EvidenceLength={EvidenceLength} AllowedCodes={AllowedCodes} Violations={Violations}",
                metadata.Provider,
                metadata.Model,
                metadata.ResponseId,
                signal.Code,
                signal.Evidence?.Length ?? 0,
                string.Join(',', allowedCodes),
                reason);
            throw new NarrativeGenerationException($"Narrative provider returned an invalid progression signal: {reason}");
        }
    }

    private Task<SessionPendingPlayerInput?> LoadClaimAsync(string ownerId, string inputId, string leaseId, CancellationToken cancellationToken) =>
        db.SessionPendingPlayerInputs
            .Include(input => input.Session).ThenInclude(session => session.State)
            .Include(input => input.Session).ThenInclude(session => session.Scenario)
            .Include(input => input.Session).ThenInclude(session => session.HeadTurn)
            .Include(input => input.Session).ThenInclude(session => session.Progress).ThenInclude(progress => progress!.CurrentNode)
            .SingleOrDefaultAsync(input => input.Id == inputId && input.LeaseId == leaseId && input.Session.OwnerId == ownerId, cancellationToken);

    private Task<int> MarkFailedAsync(string inputId, string? leaseId, string code, string message, bool retryable, CancellationToken cancellationToken) =>
        db.SessionPendingPlayerInputs
            .Where(input => input.Id == inputId && (leaseId == null || input.LeaseId == leaseId))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(input => input.Status, "failed")
                .SetProperty(input => input.IsRetryable, retryable)
                .SetProperty(input => input.LeaseId, (string?)null)
                .SetProperty(input => input.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(input => input.ErrorCode, code)
                .SetProperty(input => input.ErrorMessage, message)
                .SetProperty(input => input.UpdatedAt, DateTimeOffset.UtcNow), cancellationToken);

    private Task<int> ReleaseClaimAsync(string inputId, string leaseId) =>
        db.SessionPendingPlayerInputs
            .Where(input => input.Id == inputId && input.LeaseId == leaseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(input => input.Status, "pending")
                .SetProperty(input => input.LeaseId, (string?)null)
                .SetProperty(input => input.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(input => input.UpdatedAt, DateTimeOffset.UtcNow), CancellationToken.None);
}

public sealed record SessionNarrativeTurnResult(int StatusCode, SessionTurn? Turn, string? Code, string? Message, string? Details)
{
    public static SessionNarrativeTurnResult Success(SessionTurn turn) => new(200, turn, null, null, null);
    public static SessionNarrativeTurnResult Error(int statusCode, string code, string message, string? details = null) => new(statusCode, null, code, message, details);
}
