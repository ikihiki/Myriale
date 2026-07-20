using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class SessionNarrativeTurnService(
    ApplicationDbContext db,
    INarrativeGenerator generator,
    SessionScenarioProgressionService progression,
    ILogger<SessionNarrativeTurnService> logger)
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan GenerationTimeout = TimeSpan.FromSeconds(30);

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

        var recentTurns = await db.SessionTurns.AsNoTracking()
            .Include(turn => turn.PlayerInput)
            .Where(turn => turn.SessionId == sessionId && turn.Kind == "narrative")
            .OrderByDescending(turn => turn.Position)
            .Take(8)
            .OrderBy(turn => turn.Position)
            .Select(turn => new NarrativeDialogueTurnInput(turn.PlayerInput == null ? null : turn.PlayerInput.Text, turn.NarrativeBody))
            .ToListAsync(cancellationToken);
        var scenario = claimed.Session.Scenario;
        IReadOnlyList<NarrativeAllowedSignal> providerAllowedSignals;
        NarrativeDialogueResult generated;
        try
        {
            providerAllowedSignals = interactionType == NarrativeInteractionTypes.Clarification
                ? []
                : await LoadAllowedSignalsAsync(claimed.Session.Progress, cancellationToken);
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(GenerationTimeout);
            generated = await generator.GenerateDialogueAsync(
                new NarrativeDialogueRequest(
                    NarrativeDialogueSchema.Version,
                    new NarrativeScenarioInput(scenario.Title, scenario.Summary, scenario.Genre, scenario.Tone, scenario.Lore, scenario.AiFreedom, scenario.Hero, scenario.Opening),
                    recentTurns,
                    interactionType,
                    inputText,
                    new NarrativeSessionStateInput(
                        claimed.Session.State.Revision,
                        JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(claimed.Session.State.FlagsJson) ?? new Dictionary<string, bool>()),
                    providerAllowedSignals,
                    claimed.Session.InterpretationEnabled),
                timeout.Token);
            ValidateGeneratedResult(generated, interactionType, claimed.Session.InterpretationEnabled);
            ValidateSignals(generated.Signals, providerAllowedSignals);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await ReleaseClaimAsync(pendingInput.Id, leaseId);
            throw;
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or HttpRequestException or JsonException or OperationCanceledException)
        {
            logger.LogWarning(exception, "Dialogue narrative generation failed for {SessionId}", sessionId);
            await MarkFailedAsync(pendingInput.Id, leaseId, "narrative_generation_failed", "Narrativeの生成に失敗しました。", retryable: true, CancellationToken.None);
            return SessionNarrativeTurnResult.Error(503, "narrative_generation_failed", "Narrativeの生成に失敗しました。");
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
            DialogueTurnType = generated.TurnType,
            Heading = generated.Heading,
            NarrativeBody = generated.Body,
            Interpretation = claimedSession.InterpretationEnabled ? generated.Interpretation : null,
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

    private async Task<SessionNarrativeTurnResult> CompleteAsync(string ownerId, SessionTurn turn, CancellationToken cancellationToken)
    {
        await progression.EnsureNarrativeTurnAsync(ownerId, turn.Id, cancellationToken);
        return SessionNarrativeTurnResult.Success(turn);
    }

    private static bool SameTurn(string? left, string? right) => string.Equals(left, right, StringComparison.Ordinal);

    private async Task<IReadOnlyList<NarrativeAllowedSignal>> LoadAllowedSignalsAsync(
        SessionProgressState? progress,
        CancellationToken cancellationToken)
    {
        if (progress is null) return [];
        var allowedCodes = JsonSerializer.Deserialize<IReadOnlyList<string>>(progress.CurrentNode.AllowedNarrativeSignalsJson) ?? [];
        var seen = new HashSet<string>(StringComparer.Ordinal);
        if (allowedCodes.Any(code => string.IsNullOrWhiteSpace(code)
                || code.Length > 80
                || code.Any(character => !(char.IsLower(character) || char.IsDigit(character) || character == '-'))
                || !seen.Add(code)))
            throw new NarrativeGenerationException("Scenario progression contains an invalid narrative signal allowlist.");
        if (allowedCodes.Count == 0) return [];

        var transitions = await db.ScenarioProgressionTransitions.AsNoTracking()
            .Where(transition => transition.SourceNodeId == progress.CurrentNodeId
                && allowedCodes.Contains(transition.SignalCode))
            .ToDictionaryAsync(transition => transition.SignalCode, StringComparer.Ordinal, cancellationToken);
        if (transitions.Count != allowedCodes.Count)
            throw new NarrativeGenerationException("Scenario progression signal is missing a transition definition.");

        return allowedCodes.Select(code =>
        {
            var transition = transitions[code];
            if (string.IsNullOrWhiteSpace(transition.TriggerDescription) || transition.TriggerDescription.Length > 1000)
                throw new NarrativeGenerationException("Scenario progression signal is missing a valid trigger description.");
            return new NarrativeAllowedSignal(code, transition.TriggerDescription.Trim());
        }).ToArray();
    }

    private static void ValidateGeneratedResult(
        NarrativeDialogueResult result,
        string interactionType,
        bool interpretationRequired)
    {
        var turnTypeMatchesInteraction = interactionType switch
        {
            NarrativeInteractionTypes.Clarification => result.TurnType == "clarification",
            NarrativeInteractionTypes.Dialogue => result.TurnType is "action-result" or "npc-reply",
            _ => false,
        };
        if (!string.Equals(result.SchemaVersion, NarrativeDialogueSchema.Version, StringComparison.Ordinal)
            || !NarrativeDialogueSchema.TurnTypes.Contains(result.TurnType)
            || !turnTypeMatchesInteraction
            || string.IsNullOrWhiteSpace(result.Heading)
            || result.Heading.Length > 120
            || string.IsNullOrWhiteSpace(result.Body)
            || result.Body.Length > 20_000
            || result.Signals is null
            || (result.TurnType == "clarification" && result.Signals.Count > 0)
            || (interpretationRequired && string.IsNullOrWhiteSpace(result.Interpretation))
            || result.Interpretation?.Length > 500)
            throw new NarrativeGenerationException("Narrative provider returned an invalid dialogue result.");
    }

    private static void ValidateSignals(
        IReadOnlyList<NarrativeProgressionSignal> signals,
        IReadOnlyList<NarrativeAllowedSignal> allowedSignals)
    {
        if (signals.Count > 1) throw new NarrativeGenerationException("Narrative provider returned too many progression signals.");
        var allowedCodes = allowedSignals.Select(signal => signal.Code).ToHashSet(StringComparer.Ordinal);
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var signal in signals)
        {
            if (string.IsNullOrWhiteSpace(signal.Code)
                || signal.Code.Length > 80
                || string.IsNullOrWhiteSpace(signal.Evidence)
                || signal.Evidence.Length > 500
                || signal.Code.Any(character => !(char.IsLower(character) || char.IsDigit(character) || character == '-'))
                || !seen.Add(signal.Code)
                || !allowedCodes.Contains(signal.Code))
                throw new NarrativeGenerationException("Narrative provider returned an invalid progression signal.");
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

public sealed record SessionNarrativeTurnResult(int StatusCode, SessionTurn? Turn, string? Code, string? Message)
{
    public static SessionNarrativeTurnResult Success(SessionTurn turn) => new(200, turn, null, null);
    public static SessionNarrativeTurnResult Error(int statusCode, string code, string message) => new(statusCode, null, code, message);
}
