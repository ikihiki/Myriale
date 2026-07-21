using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record SessionExecutionClaim(
    string ExecutionId,
    string LeaseToken,
    long Revision,
    string AttemptId,
    int AttemptNumber);

public interface ISessionExecutionQueue
{
    Task<IReadOnlyList<SessionExecutionClaim>> ClaimAsync(
        string workerId,
        int maxBatchSize,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken);

    Task<bool> HeartbeatAsync(
        SessionExecutionClaim claim,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken);
}

public sealed class SessionExecutionQueue(ApplicationDbContext db, TimeProvider timeProvider) : ISessionExecutionQueue
{
    private const int MaximumBatchSize = 32;

    public async Task<IReadOnlyList<SessionExecutionClaim>> ClaimAsync(
        string workerId,
        int maxBatchSize,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(workerId)) throw new ArgumentException("Worker ID is required.", nameof(workerId));
        if (maxBatchSize <= 0 || maxBatchSize > MaximumBatchSize)
            throw new ArgumentOutOfRangeException(nameof(maxBatchSize), $"Batch size must be between 1 and {MaximumBatchSize}.");
        if (leaseDuration <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(leaseDuration));

        var now = timeProvider.GetUtcNow();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var candidates = await LoadCandidatesAsync(now, maxBatchSize, cancellationToken);
        if (candidates.Count == 0)
        {
            await transaction.CommitAsync(cancellationToken);
            return [];
        }

        var claims = new List<SessionExecutionClaim>(candidates.Count);
        foreach (var execution in candidates)
        {
            if (execution.Status == SessionExecutionStatuses.Running)
            {
                SessionExecutionTelemetry.LeaseExpired.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
                var expiredAttempts = await db.SessionExecutionAttempts
                    .Where(attempt => attempt.ExecutionId == execution.Id && attempt.Status == "running")
                    .ToListAsync(cancellationToken);
                foreach (var expiredAttempt in expiredAttempts)
                {
                    expiredAttempt.Status = "expired";
                    expiredAttempt.CompletedAt = now;
                    expiredAttempt.ErrorCode = "lease_expired";
                    expiredAttempt.Retryable = true;
                }
            }
            var token = $"LET-{Guid.NewGuid():N}".ToUpperInvariant();
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Running);
            execution.LeaseOwner = workerId;
            execution.LeaseToken = token;
            execution.LeaseExpiresAt = now.Add(leaseDuration);
            execution.StartedAt ??= now;
            execution.AttemptCount++;
            execution.NextAttemptAt = null;
            execution.ErrorCode = null;
            execution.UserErrorMessage = null;
            var attempt = new SessionExecutionAttempt
            {
                Id = $"ATT-{Guid.NewGuid():N}".ToUpperInvariant(),
                ExecutionId = execution.Id,
                AttemptNumber = execution.AttemptCount,
                Status = "running",
                WorkerId = workerId,
                StartedAt = now,
            };
            db.SessionExecutionAttempts.Add(attempt);
            claims.Add(new SessionExecutionClaim(execution.Id, token, execution.Revision, attempt.Id, attempt.AttemptNumber));
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return [];
        }

        foreach (var execution in candidates)
        {
            SessionExecutionTelemetry.Started.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
            SessionExecutionTelemetry.QueueDuration.Record((now - execution.QueuedAt).TotalSeconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        }
        return claims;
    }

    public async Task<bool> HeartbeatAsync(
        SessionExecutionClaim claim,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken)
    {
        if (leaseDuration <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(leaseDuration));
        var expiresAt = timeProvider.GetUtcNow().Add(leaseDuration);
        var updated = await db.SessionExecutions
            .Where(execution => execution.Id == claim.ExecutionId
                && execution.Status == SessionExecutionStatuses.Running
                && execution.LeaseToken == claim.LeaseToken
                && execution.Revision == claim.Revision)
            .ExecuteUpdateAsync(setters => setters.SetProperty(execution => execution.LeaseExpiresAt, expiresAt), cancellationToken);
        return updated == 1;
    }

    private async Task<List<SessionExecution>> LoadCandidatesAsync(
        DateTimeOffset now,
        int maxBatchSize,
        CancellationToken cancellationToken)
    {
        if (db.Database.IsNpgsql())
        {
            return await db.SessionExecutions.FromSqlInterpolated($$"""
                SELECT *
                FROM "SessionExecutions"
                WHERE "DismissedAt" IS NULL
                  AND (
                    "Status" = {{SessionExecutionStatuses.Queued}}
                    OR ("Status" = {{SessionExecutionStatuses.RetryWait}} AND "NextAttemptAt" <= {{now}})
                    OR ("Status" = {{SessionExecutionStatuses.Running}} AND "LeaseExpiresAt" <= {{now}})
                  )
                ORDER BY "Priority" DESC, "QueuedAt", "Id"
                LIMIT {{maxBatchSize}}
                FOR UPDATE SKIP LOCKED
                """).ToListAsync(cancellationToken);
        }

        // SQLite is used by fast tests and cannot compare/order DateTimeOffset server-side.
        // Keep the scan bounded while preserving the same eligibility and ordering semantics.
        var scanSize = Math.Min(MaximumBatchSize * 4, Math.Max(maxBatchSize * 4, 32));
        var candidates = await db.SessionExecutions
            .Where(execution => execution.DismissedAt == null
                && (execution.Status == SessionExecutionStatuses.Queued
                    || execution.Status == SessionExecutionStatuses.RetryWait
                    || execution.Status == SessionExecutionStatuses.Running))
            .OrderByDescending(execution => execution.Priority)
            .Take(scanSize)
            .ToListAsync(cancellationToken);
        return candidates
            .Where(execution => execution.Status == SessionExecutionStatuses.Queued
                || execution.Status == SessionExecutionStatuses.RetryWait && execution.NextAttemptAt <= now
                || execution.Status == SessionExecutionStatuses.Running && execution.LeaseExpiresAt <= now)
            .OrderByDescending(execution => execution.Priority)
            .ThenBy(execution => execution.QueuedAt)
            .ThenBy(execution => execution.Id, StringComparer.Ordinal)
            .Take(maxBatchSize)
            .ToList();
    }
}
