using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Execution;

public sealed class ModuleHandoffPreparer(ApplicationDbContext db)
{
    public async Task PrepareAsync(
        ModuleExecution execution,
        ModuleOutcome? outcome,
        CancellationToken cancellationToken)
    {
        if (execution.SessionTurnId is null || outcome is null) return;
        var source = await db.SessionTurns
            .Include(turn => turn.Session)
            .SingleAsync(turn => turn.Id == execution.SessionTurnId, cancellationToken);
        var idempotencyKey = $"module-handoff:{execution.Id}";
        if (db.SessionExecutions.Local.Any(item => item.SessionId == source.SessionId && item.IdempotencyKey == idempotencyKey)
            || await db.SessionExecutions.AnyAsync(item => item.SessionId == source.SessionId && item.IdempotencyKey == idempotencyKey, cancellationToken))
            return;
        var now = DateTimeOffset.UtcNow;
        db.SessionExecutions.Add(new SessionExecution
        {
            Id = $"EXE-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = source.SessionId,
            Kind = SessionExecutionKinds.ModuleHandoff,
            TriggerType = SessionExecutionTriggerType.ModuleOutcome,
            TriggerId = source.Id,
            Status = SessionExecutionStatuses.Queued,
            Revision = 0,
            IdempotencyKey = idempotencyKey,
            PayloadHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(execution.Id))).ToLowerInvariant(),
            AcceptedHeadTurnId = source.Id,
            AcceptedSessionRevision = source.Session.Revision,
            CreatedAt = now,
            QueuedAt = now,
        });
    }

}
