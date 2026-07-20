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

        var session = await db.Sessions
            .Include(item => item.Scenario)
            .Include(item => item.State)
            .Include(item => item.HeadTurn)
            .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);
        if (session is null) return SessionNarrativeTurnResult.Error(404, "session_not_found", "Sessionが見つかりません。");
        if (!string.Equals(session.Status, "active", StringComparison.OrdinalIgnoreCase))
            return SessionNarrativeTurnResult.Error(409, "session_not_active", "Sessionは入力を受け付けていません。");

        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(inputText))).ToLowerInvariant();
        var input = await db.SessionPlayerInputs
            .Include(item => item.NarrativeTurn)
            .Include(item => item.Work)
            .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
        if (input is not null)
        {
            if (!string.Equals(input.PayloadHash, hash, StringComparison.Ordinal))
                return SessionNarrativeTurnResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
            if (input.NarrativeTurn is not null)
                return await CompleteAsync(ownerId, input.NarrativeTurn, cancellationToken);
            if (!input.Work.IsRetryable)
                return SessionNarrativeTurnResult.Error(409, input.Work.ErrorCode ?? "narrative_not_retryable", input.Work.ErrorMessage ?? "Narrative生成を再試行できません。");
        }
        else
        {
            var now = DateTimeOffset.UtcNow;
            input = new SessionPlayerInput
            {
                Id = $"INP-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = sessionId,
                RequestId = request.RequestId,
                Text = inputText,
                PayloadHash = hash,
                AcceptedAfterTurnId = session.HeadTurnId,
                CreatedAt = now,
                Work = new SessionPlayerInputWork
                {
                    Status = "pending",
                    Revision = 0,
                    AttemptCount = 0,
                    IsRetryable = true,
                    UpdatedAt = now,
                },
            };
            session.Revision++;
            db.SessionPlayerInputs.Add(input);
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
                var winner = await db.SessionPlayerInputs
                    .Include(item => item.NarrativeTurn)
                    .Include(item => item.Work)
                    .SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
                if (winner is null) throw;
                if (!string.Equals(winner.PayloadHash, hash, StringComparison.Ordinal))
                    return SessionNarrativeTurnResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
                if (winner.NarrativeTurn is not null) return await CompleteAsync(ownerId, winner.NarrativeTurn, cancellationToken);
                input = winner;
            }
        }

        db.ChangeTracker.Clear();
        var currentHeadId = await db.Sessions.AsNoTracking()
            .Where(item => item.Id == sessionId && item.OwnerId == ownerId)
            .Select(item => item.HeadTurnId)
            .SingleAsync(cancellationToken);
        if (!SameTurn(currentHeadId, input.AcceptedAfterTurnId))
        {
            await MarkFailedAsync(input.Id, null, "session_advanced", "Player Input受付後にSessionが進行しました。", retryable: false, cancellationToken);
            return SessionNarrativeTurnResult.Error(409, "session_advanced", "Player Input受付後にSessionが進行しました。");
        }

        var work = await db.SessionPlayerInputWorks.SingleAsync(item => item.PlayerInputId == input.Id, cancellationToken);
        var leaseId = $"NIL-{Guid.NewGuid():N}".ToUpperInvariant();
        var nowClaimed = DateTimeOffset.UtcNow;
        if (work.LeaseExpiresAt is not null && work.LeaseExpiresAt > nowClaimed)
            return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        work.Status = "pending";
        work.Revision++;
        work.AttemptCount++;
        work.LeaseId = leaseId;
        work.LeaseExpiresAt = nowClaimed.Add(LeaseDuration);
        work.ErrorCode = null;
        work.ErrorMessage = null;
        work.UpdatedAt = nowClaimed;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        }

        db.ChangeTracker.Clear();
        var claimed = await LoadClaimAsync(ownerId, input.Id, leaseId, cancellationToken);
        if (claimed is null) return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        if (!SameTurn(claimed.PlayerInput.Session.HeadTurnId, claimed.PlayerInput.AcceptedAfterTurnId))
        {
            await MarkFailedAsync(input.Id, leaseId, "session_advanced", "Narrative生成前にSessionが進行しました。", retryable: false, cancellationToken);
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
        var scenario = claimed.PlayerInput.Session.Scenario;
        var allowedSignals = claimed.PlayerInput.Session.Progress is null
            ? []
            : JsonSerializer.Deserialize<IReadOnlyList<string>>(claimed.PlayerInput.Session.Progress.CurrentNode.AllowedNarrativeSignalsJson) ?? [];
        NarrativeDialogueResult generated;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(GenerationTimeout);
            generated = await generator.GenerateDialogueAsync(
                new NarrativeDialogueRequest(
                    new NarrativeScenarioInput(scenario.Title, scenario.Summary, scenario.Genre, scenario.Tone, scenario.Lore, scenario.AiFreedom, scenario.Hero, scenario.Opening),
                    recentTurns,
                    inputText,
                    new NarrativeSessionStateInput(
                        claimed.PlayerInput.Session.State.Revision,
                        JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(claimed.PlayerInput.Session.State.FlagsJson) ?? new Dictionary<string, bool>()),
                    allowedSignals),
                timeout.Token);
            ValidateSignals(generated.Signals, allowedSignals);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await ReleaseClaimAsync(input.Id, leaseId);
            throw;
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or HttpRequestException or JsonException or OperationCanceledException)
        {
            logger.LogWarning(exception, "Dialogue narrative generation failed for {SessionId}", sessionId);
            await MarkFailedAsync(input.Id, leaseId, "narrative_generation_failed", "Narrativeの生成に失敗しました。", retryable: true, CancellationToken.None);
            return SessionNarrativeTurnResult.Error(503, "narrative_generation_failed", "Narrativeの生成に失敗しました。");
        }

        db.ChangeTracker.Clear();
        claimed = await LoadClaimAsync(ownerId, input.Id, leaseId, cancellationToken);
        if (claimed is null) return SessionNarrativeTurnResult.Error(409, "request_in_progress", "同じ入力のNarrative生成が進行中です。");
        if (claimed.PlayerInput.NarrativeTurn is not null)
            return await CompleteAsync(ownerId, claimed.PlayerInput.NarrativeTurn, cancellationToken);
        var claimedSession = claimed.PlayerInput.Session;
        if (!SameTurn(claimedSession.HeadTurnId, claimed.PlayerInput.AcceptedAfterTurnId))
        {
            await MarkFailedAsync(input.Id, leaseId, "session_advanced", "Narrative生成中にSessionが進行しました。", retryable: false, cancellationToken);
            return SessionNarrativeTurnResult.Error(409, "session_advanced", "Narrative生成中にSessionが進行しました。");
        }

        var completedAt = DateTimeOffset.UtcNow;
        var turn = new SessionTurn
        {
            Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = sessionId,
            PreviousTurnId = claimed.PlayerInput.AcceptedAfterTurnId,
            Position = (claimedSession.HeadTurn?.Position ?? 0) + 1,
            Kind = "narrative",
            NarrativeBody = generated.Body,
            PlayerInputId = claimed.PlayerInput.Id,
            SourceSessionRevision = claimedSession.State.Revision,
            CreatedAt = completedAt,
        };
        claimedSession.HeadTurnId = turn.Id;
        claimedSession.HeadTurn = turn;
        claimedSession.Revision++;
        claimedSession.UpdatedAt = completedAt;
        claimed.Status = "completed";
        claimed.IsRetryable = false;
        claimed.LeaseId = null;
        claimed.LeaseExpiresAt = null;
        claimed.ErrorCode = null;
        claimed.ErrorMessage = null;
        claimed.UpdatedAt = completedAt;
        foreach (var generatedSignal in generated.Signals)
        {
            var signal = new SessionNarrativeSignal
            {
                Id = $"NSG-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = sessionId,
                NarrativeTurnId = turn.Id,
                Code = generatedSignal.Code,
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
                .SingleAsync(item => item.Id == input.Id, cancellationToken);
            if (existing.NarrativeTurn is null)
            {
                await MarkFailedAsync(input.Id, null, "session_advanced", "Narrative生成中にSessionが進行しました。", retryable: false, cancellationToken);
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

    private static void ValidateSignals(IReadOnlyList<NarrativeProgressionSignal> signals, IReadOnlyList<string> allowedSignals)
    {
        if (signals.Count > 1) throw new NarrativeGenerationException("Narrative provider returned too many progression signals.");
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var signal in signals)
        {
            if (string.IsNullOrWhiteSpace(signal.Code)
                || signal.Code.Length > 80
                || signal.Code.Any(character => !(char.IsLower(character) || char.IsDigit(character) || character == '-'))
                || !seen.Add(signal.Code)
                || !allowedSignals.Contains(signal.Code, StringComparer.Ordinal))
                throw new NarrativeGenerationException("Narrative provider returned an invalid progression signal.");
        }
    }

    private Task<SessionPlayerInputWork?> LoadClaimAsync(string ownerId, string inputId, string leaseId, CancellationToken cancellationToken) =>
        db.SessionPlayerInputWorks
            .Include(work => work.PlayerInput).ThenInclude(input => input.NarrativeTurn)
            .Include(work => work.PlayerInput).ThenInclude(input => input.Session).ThenInclude(session => session.State)
            .Include(work => work.PlayerInput).ThenInclude(input => input.Session).ThenInclude(session => session.Scenario)
            .Include(work => work.PlayerInput).ThenInclude(input => input.Session).ThenInclude(session => session.HeadTurn)
            .Include(work => work.PlayerInput).ThenInclude(input => input.Session).ThenInclude(session => session.Progress).ThenInclude(progress => progress!.CurrentNode)
            .SingleOrDefaultAsync(work => work.PlayerInputId == inputId && work.LeaseId == leaseId && work.PlayerInput.Session.OwnerId == ownerId, cancellationToken);

    private Task<int> MarkFailedAsync(string inputId, string? leaseId, string code, string message, bool retryable, CancellationToken cancellationToken) =>
        db.SessionPlayerInputWorks
            .Where(work => work.PlayerInputId == inputId && (leaseId == null || work.LeaseId == leaseId))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(work => work.Status, "failed")
                .SetProperty(work => work.IsRetryable, retryable)
                .SetProperty(work => work.LeaseId, (string?)null)
                .SetProperty(work => work.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(work => work.ErrorCode, code)
                .SetProperty(work => work.ErrorMessage, message)
                .SetProperty(work => work.UpdatedAt, DateTimeOffset.UtcNow), cancellationToken);

    private Task<int> ReleaseClaimAsync(string inputId, string leaseId) =>
        db.SessionPlayerInputWorks
            .Where(work => work.PlayerInputId == inputId && work.LeaseId == leaseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(work => work.Status, "pending")
                .SetProperty(work => work.LeaseId, (string?)null)
                .SetProperty(work => work.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(work => work.UpdatedAt, DateTimeOffset.UtcNow), CancellationToken.None);
}

public sealed record SessionNarrativeTurnResult(int StatusCode, SessionTurn? Turn, string? Code, string? Message)
{
    public static SessionNarrativeTurnResult Success(SessionTurn turn) => new(200, turn, null, null);
    public static SessionNarrativeTurnResult Error(int statusCode, string code, string message) => new(statusCode, null, code, message);
}
