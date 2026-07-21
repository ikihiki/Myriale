using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class ModuleHandoffExecutionHandler(ApplicationDbContext db, SessionNarrativeHandoffService handoffs) : ISessionExecutionHandler
{
    public string Kind => SessionExecutionKinds.ModuleHandoff;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.AsNoTracking().SingleAsync(item => item.Id == context.ExecutionId, cancellationToken);
        var source = await db.SessionTurns.AsNoTracking().Include(item => item.Session).Include(item => item.ModuleExecution)
            .SingleAsync(item => item.Id == execution.TriggerId, cancellationToken);
        if (source.Session.HeadTurnId != source.Id)
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);
        if (source.ModuleExecution is null) return new(false, false, "module_execution_missing", "Module実行を確認できませんでした。");
        await handoffs.EnsureAsync(source.Session.OwnerId, source.ModuleExecution.Id, cancellationToken);
        db.ChangeTracker.Clear();
        var handoff = await db.SessionNarrativeHandoffs.AsNoTracking().SingleAsync(item => item.ExecutionId == source.ModuleExecution.Id, cancellationToken);
        if (handoff.Status == "completed") return new(true);
        if (handoff.LastErrorCode == "session_advanced") return new(false, false, handoff.LastErrorCode, handoff.LastErrorMessage, SessionExecutionStatuses.Superseded);
        return new(false, handoff.IsRetryable, handoff.LastErrorCode ?? "module_handoff_failed", handoff.LastErrorMessage ?? "Narrativeを生成できませんでした。");
    }
}
