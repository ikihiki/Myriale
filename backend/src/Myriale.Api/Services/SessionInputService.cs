using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class SessionInputService(ApplicationDbContext db, IOptions<AiProviderOptions> aiOptions)
{
    public async Task<SessionInputAcceptanceResult> AcceptAsync(string ownerId, string sessionId, CreateSessionInputRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RequestId) || request.RequestId.Length > 120)
            return SessionInputAcceptanceResult.Error(400, "invalid_request_id", "RequestIdを指定してください。");
        var text = request.Text?.Trim() ?? string.Empty;
        if (text.Length is 0 or > 4000) return SessionInputAcceptanceResult.Error(400, "invalid_input", "入力は1文字以上4000文字以内で指定してください。");
        var interactionType = request.InteractionType?.Trim() ?? string.Empty;
        if (!NarrativeInteractionTypes.Allowed.Contains(interactionType))
            return SessionInputAcceptanceResult.Error(400, "invalid_interaction_type", "InteractionTypeが不正です。");
        if (request.RequestedOutputs is { Count: > 0 } && request.RequestedOutputs.Any(output => output != SessionExecutionKinds.ScenarioTurn))
            return SessionInputAcceptanceResult.Error(400, "unsupported_output", "現在リクエストできる生成結果はscenario-turnだけです。");

        var payloadHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{interactionType}\n{text}"))).ToLowerInvariant();

        // Resolve the owner boundary before looking up an idempotent replay. Otherwise a caller
        // who knows another Session ID and RequestId can distinguish or retrieve that owner's work.
        var session = await db.Sessions.SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);
        if (session is null) return SessionInputAcceptanceResult.Error(404, "session_not_found", "Sessionが見つかりません。");

        var replayInput = await db.SessionPlayerInputs.AsNoTracking().SingleOrDefaultAsync(input => input.SessionId == sessionId && input.RequestId == request.RequestId, cancellationToken);
        if (replayInput is not null)
        {
            if (replayInput.PayloadHash != payloadHash) return SessionInputAcceptanceResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
            var replayExecution = await db.SessionExecutions.AsNoTracking().SingleAsync(execution => execution.SessionId == sessionId && execution.IdempotencyKey == request.RequestId, cancellationToken);
            return SessionInputAcceptanceResult.Success(replayInput, replayExecution, replay: true);
        }

        if (session.HeadTurnId is not null)
        {
            var headModule = await db.SessionTurns.AsNoTracking()
                .Where(turn => turn.Id == session.HeadTurnId && turn.Kind == "module")
                .Select(turn => new
                {
                    ExecutionStatus = turn.ModuleExecution == null ? null : turn.ModuleExecution.Status,
                    HasNarrativeHandoff = turn.NarrativeTurn != null,
                })
                .SingleOrDefaultAsync(cancellationToken);
            if (headModule is { HasNarrativeHandoff: false })
            {
                var code = headModule.ExecutionStatus == Myriale.ModuleSdk.ModuleExecutionStatuses.Completed
                    ? "module_handoff_pending"
                    : "forced_mode_active";
                var message = code == "module_handoff_pending"
                    ? "確定したモジュール結果をNarrativeへ引き渡しています。"
                    : "プログラムによる進行中は自由入力できません。";
                return SessionInputAcceptanceResult.Error(409, code, message);
            }
        }

        if (session.Status != "active") return SessionInputAcceptanceResult.Error(409, "session_not_active", "Sessionは入力を受け付けていません。");
        var cutoff = DateTimeOffset.UtcNow.AddMinutes(-1);
        var recentInputCount = db.Database.IsNpgsql()
            ? await db.SessionPlayerInputs.CountAsync(input => input.SessionId == sessionId && input.CreatedAt >= cutoff, cancellationToken)
            : (await db.SessionPlayerInputs.AsNoTracking()
                .Where(input => input.SessionId == sessionId)
                .Select(input => input.CreatedAt)
                .ToListAsync(cancellationToken))
                .Count(createdAt => createdAt >= cutoff);
        if (recentInputCount >= aiOptions.Value.SessionRequestsPerMinute)
            return SessionInputAcceptanceResult.Error(429, "session_rate_limited", "SessionのAI入力上限に達しました。しばらく待って再試行してください。");

        const string executionKind = SessionExecutionKinds.ScenarioTurn;
        var now = DateTimeOffset.UtcNow;
        var input = new SessionPlayerInput
        {
            Id = $"INP-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = sessionId,
            RequestId = request.RequestId,
            Text = text,
            InteractionType = interactionType,
            PayloadHash = payloadHash,
            AcceptedAfterTurnId = session.HeadTurnId,
            AcceptedSessionRevision = session.Revision,
            CreatedBy = ownerId,
            SupersedesInputId = request.SupersedesInputId,
            CreatedAt = now,
        };
        var execution = new SessionExecution
        {
            Id = $"EXE-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = sessionId,
            Kind = executionKind,
            TriggerType = "player-input",
            Stage = ScenarioTurnStages.LoadingWorld,
            SchemaVersion = 1,
            TriggerId = input.Id,
            Status = SessionExecutionStatuses.Queued,
            Revision = 0,
            IdempotencyKey = request.RequestId,
            PayloadHash = payloadHash,
            AcceptedHeadTurnId = session.HeadTurnId,
            AcceptedSessionRevision = session.Revision,
            MaxAttempts = Math.Max(1, aiOptions.Value.MaxAttempts),
            CreatedAt = now,
            QueuedAt = now,
            TraceParent = Activity.Current?.Id,
        };
        session.Revision++;
        session.UpdatedAt = now;
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        db.SessionPlayerInputs.Add(input);
        db.SessionExecutions.Add(execution);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            var winner = await db.SessionPlayerInputs.AsNoTracking().SingleOrDefaultAsync(item => item.SessionId == sessionId && item.RequestId == request.RequestId, cancellationToken);
            if (winner is null) throw;
            if (winner.PayloadHash != payloadHash) return SessionInputAcceptanceResult.Error(409, "idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
            var winnerExecution = await db.SessionExecutions.AsNoTracking().SingleAsync(item => item.SessionId == sessionId && item.IdempotencyKey == request.RequestId, cancellationToken);
            return SessionInputAcceptanceResult.Success(winner, winnerExecution, replay: true);
        }
        SessionExecutionTelemetry.Enqueued.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        return SessionInputAcceptanceResult.Success(input, execution, replay: false);
    }
}

public sealed record SessionInputAcceptanceResult(SessionPlayerInput? Input, SessionExecution? Execution, int StatusCode, string? Code, string? Message, bool Replay)
{
    public static SessionInputAcceptanceResult Success(SessionPlayerInput input, SessionExecution execution, bool replay) => new(input, execution, 202, null, null, replay);
    public static SessionInputAcceptanceResult Error(int status, string code, string message) => new(null, null, status, code, message, false);
}
