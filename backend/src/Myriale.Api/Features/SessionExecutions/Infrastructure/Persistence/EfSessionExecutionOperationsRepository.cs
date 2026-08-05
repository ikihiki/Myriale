using System.Data.Common;
using System.Data;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionExecutions.Application;
using Myriale.Api.Infrastructure.Persistence;


namespace Myriale.Api.Features.SessionExecutions.Infrastructure;

public sealed class EfSessionExecutionOperationsRepository(
    ApplicationDbContext db,
    TimeProvider timeProvider,
    ISessionExecutionRetryPolicy retryPolicy) : ISessionExecutionOperationsRepository
{
    private const int MaximumBatchSize = 32;

    public async Task<SessionExecutionClaimBatchResult> ClaimBatchAsync(
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
        try
        {
            var candidates = await LoadCandidatesAsync(now, maxBatchSize, cancellationToken);
            var claims = new List<SessionExecutionClaim>(candidates.Count);
            foreach (var execution in candidates)
            {
                if (execution.Status == SessionExecutionStatus.Running)
                {
                    SessionExecutionTelemetry.LeaseExpired.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
                    var expiredAttempts = await db.SessionExecutionAttempts
                        .Where(attempt => attempt.ExecutionId == execution.Id && attempt.Status == SessionExecutionAttemptStatus.Running)
                        .ToListAsync(cancellationToken);
                    foreach (var expiredAttempt in expiredAttempts) expiredAttempt.Expire(now);
                }

                var token = $"LET-{Guid.NewGuid():N}".ToUpperInvariant();
                execution.TransitionTo(SessionExecutionStatus.Running);
                execution.LeaseOwner = workerId;
                execution.LeaseToken = token;
                execution.LeaseExpiresAt = now.Add(leaseDuration);
                execution.StartedAt ??= now;
                execution.AttemptCount++;
                execution.NextAttemptAt = null;
                execution.ErrorCode = null;
                execution.UserErrorMessage = null;
                var attempt = SessionExecutionAttempt.Start(
                    $"ATT-{Guid.NewGuid():N}".ToUpperInvariant(),
                    execution.Id,
                    execution.AttemptCount,
                    workerId,
                    now);
                db.SessionExecutionAttempts.Add(attempt);
                claims.Add(new SessionExecutionClaim(execution.Id, token, execution.Revision, attempt.Id, attempt.AttemptNumber));
            }

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            foreach (var execution in candidates)
            {
                SessionExecutionTelemetry.Started.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
                SessionExecutionTelemetry.QueueDuration.Record((now - execution.QueuedAt).TotalSeconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
            }
            return SessionExecutionClaimBatchResult.Success(claims);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict, []);
        }
        catch (DbException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict, []);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict, []);
        }
    }

    public async Task<SessionExecutionClaimContextResult> LoadClaimContextAsync(
        SessionExecutionClaim claim,
        CancellationToken cancellationToken)
    {
        try
        {
            var row = await db.SessionExecutions.AsNoTracking()
                .Where(execution => execution.Id == claim.ExecutionId)
                .Select(execution => new
                {
                    execution.SessionId,
                    execution.Kind,
                    execution.TraceParent,
                    execution.Status,
                    execution.LeaseToken,
                    execution.Revision,
                })
                .SingleOrDefaultAsync(cancellationToken);
            if (row is null || row.Status != SessionExecutionStatus.Running || row.LeaseToken != claim.LeaseToken)
                return new(SessionExecutionOperationOutcome.StaleClaim, null);
            if (row.Revision != claim.Revision)
                return new(SessionExecutionOperationOutcome.RevisionConflict, null);
            return new(SessionExecutionOperationOutcome.Success, new(claim, row.SessionId, row.Kind, row.TraceParent));
        }
        catch (DbException)
        {
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict, null);
        }
    }

    public async Task<SessionExecutionOperationOutcome> HeartbeatAsync(
        SessionExecutionClaim claim,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken)
    {
        if (leaseDuration <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(leaseDuration));
        try
        {
            var expiresAt = timeProvider.GetUtcNow().Add(leaseDuration);
            var updated = await db.SessionExecutions
                .Where(execution => execution.Id == claim.ExecutionId
                    && execution.Status == SessionExecutionStatus.Running
                    && execution.LeaseToken == claim.LeaseToken
                    && execution.Revision == claim.Revision)
                .ExecuteUpdateAsync(setters => setters.SetProperty(execution => execution.LeaseExpiresAt, expiresAt), cancellationToken);
            if (updated == 1) return SessionExecutionOperationOutcome.Success;
            return await ClassifyFenceAsync(claim, allowCancellationRevision: false, cancellationToken);
        }
        catch (DbException)
        {
            return SessionExecutionOperationOutcome.TransientDatabaseConflict;
        }
        catch (DbUpdateException)
        {
            return SessionExecutionOperationOutcome.TransientDatabaseConflict;
        }
    }

    public async Task<SessionExecutionFinalizeResult> FinalizeAsync(
        SessionExecutionFinalizeRequest request,
        CancellationToken cancellationToken)
    {
        var claim = request.Claim;
        SessionExecution? execution;
        try
        {
            execution = await db.SessionExecutions.Include(item => item.Attempts)
                .SingleOrDefaultAsync(item => item.Id == claim.ExecutionId, cancellationToken);
        }
        catch (DbException)
        {
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict);
        }
        if (execution is null || execution.LeaseToken != claim.LeaseToken)
            return new(SessionExecutionOperationOutcome.StaleClaim);

        var validRevision = execution.Status == SessionExecutionStatus.Running && execution.Revision == claim.Revision
            || execution.Status == SessionExecutionStatus.CancelRequested && execution.Revision == claim.Revision + 1;
        if (!validRevision)
        {
            return execution.Status is SessionExecutionStatus.Running or SessionExecutionStatus.CancelRequested
                ? new(SessionExecutionOperationOutcome.RevisionConflict)
                : new(SessionExecutionOperationOutcome.StaleClaim);
        }

        var attempt = execution.Attempts.SingleOrDefault(item => item.Id == claim.AttemptId);
        if (attempt is null || attempt.Status != SessionExecutionAttemptStatus.Running)
            return new(SessionExecutionOperationOutcome.StaleClaim);

        var now = timeProvider.GetUtcNow();
        attempt.RecordTrace(request.CorrelationId, request.TraceId, request.SpanId);
        execution.ClearLease();
        TimeSpan? retryDelay = null;
        if (execution.Status == SessionExecutionStatus.CancelRequested)
        {
            execution.TransitionTo(SessionExecutionStatus.Cancelled);
            attempt.Cancel(now, request.Decision.ErrorCode, request.Decision.ErrorCategory);
            execution.CompletedAt = now;
        }
        else if (request.Decision.TerminalStatus == SessionExecutionStatus.Superseded)
        {
            execution.TransitionTo(SessionExecutionStatus.Superseded);
            attempt.Supersede(now, request.Decision.ErrorCode, request.Decision.ErrorCategory);
            execution.CompletedAt = now;
            execution.IsRetryable = false;
            execution.ErrorCode = request.Decision.ErrorCode;
            execution.UserErrorMessage = request.Decision.UserMessage;
        }
        else if (request.Decision.Succeeded)
        {
            execution.TransitionTo(SessionExecutionStatus.Succeeded);
            attempt.Succeed(now);
            execution.CompletedAt = now;
            execution.IsRetryable = false;
        }
        else if (request.Decision.Retryable && execution.AttemptCount < execution.MaxAttempts)
        {
            retryDelay = retryPolicy.GetDelay(execution.AttemptCount);
            execution.TransitionTo(SessionExecutionStatus.RetryWait);
            attempt.Fail(now, request.Decision.ErrorCode, request.Decision.ErrorCategory, true);
            execution.NextAttemptAt = now.Add(retryDelay.Value);
            execution.ErrorCode = request.Decision.ErrorCode;
            execution.UserErrorMessage = request.Decision.UserMessage;
        }
        else
        {
            execution.TransitionTo(SessionExecutionStatus.Failed);
            attempt.Fail(now, request.Decision.ErrorCode, request.Decision.ErrorCategory, request.Decision.Retryable);
            execution.CompletedAt = now;
            execution.IsRetryable = request.Decision.Retryable;
            execution.ErrorCode = request.Decision.ErrorCode;
            execution.UserErrorMessage = request.Decision.UserMessage;
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new(SessionExecutionOperationOutcome.RevisionConflict);
        }
        catch (DbException)
        {
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict);
        }
        catch (DbUpdateException)
        {
            return new(SessionExecutionOperationOutcome.TransientDatabaseConflict);
        }

        return new(
            SessionExecutionOperationOutcome.Success,
            execution.Kind,
            execution.Status,
            attempt.StartedAt,
            execution.StartedAt,
            now,
            retryDelay,
            request.Decision.ErrorCode);
    }

    public async Task<IReadOnlyList<SessionExecutionOperationsMetric>> ReadMetricsAsync(
        DateTimeOffset now,
        DateTimeOffset stuckBefore,
        CancellationToken cancellationToken)
    {
        if (db.Database.IsSqlite())
            return await ReadSqliteMetricsAsync(now, stuckBefore, cancellationToken);

        return await db.SessionExecutions.AsNoTracking()
            .Where(execution => execution.Status == SessionExecutionStatus.Queued
                || execution.Status == SessionExecutionStatus.Running
                || execution.Status == SessionExecutionStatus.RetryWait
                || execution.Status == SessionExecutionStatus.CancelRequested)
            .GroupBy(execution => execution.Kind)
            .Select(group => new SessionExecutionOperationsMetric(
                group.Key,
                group.LongCount(execution => execution.Status == SessionExecutionStatus.Queued),
                group.LongCount(execution => execution.Status == SessionExecutionStatus.Running || execution.Status == SessionExecutionStatus.CancelRequested),
                group.LongCount(execution => execution.Status == SessionExecutionStatus.RetryWait),
                group.Where(execution => execution.Status == SessionExecutionStatus.Queued)
                    .Select(execution => (DateTimeOffset?)execution.QueuedAt)
                    .Min(),
                group.LongCount(execution => (execution.Status == SessionExecutionStatus.Running || execution.Status == SessionExecutionStatus.CancelRequested)
                    && ((execution.LeaseExpiresAt != null && execution.LeaseExpiresAt < now)
                        || (execution.StartedAt != null && execution.StartedAt < stuckBefore)))))
            .ToListAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<SessionExecutionOperationsMetric>> ReadSqliteMetricsAsync(
        DateTimeOffset now,
        DateTimeOffset stuckBefore,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose) await connection.OpenAsync(cancellationToken);
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT "Kind",
                       SUM(CASE WHEN "Status" = 'queued' THEN 1 ELSE 0 END),
                       SUM(CASE WHEN "Status" IN ('running', 'cancel-requested') THEN 1 ELSE 0 END),
                       SUM(CASE WHEN "Status" = 'retry-wait' THEN 1 ELSE 0 END),
                       MIN(CASE WHEN "Status" = 'queued' THEN "QueuedAt" END),
                       SUM(CASE WHEN "Status" IN ('running', 'cancel-requested')
                            AND (("LeaseExpiresAt" IS NOT NULL AND "LeaseExpiresAt" < @now)
                              OR ("StartedAt" IS NOT NULL AND "StartedAt" < @stuckBefore))
                           THEN 1 ELSE 0 END)
                FROM "SessionExecutions"
                WHERE "Status" IN ('queued', 'running', 'retry-wait', 'cancel-requested')
                GROUP BY "Kind"
                """;
            var nowParameter = command.CreateParameter();
            nowParameter.ParameterName = "@now";
            nowParameter.Value = now;
            command.Parameters.Add(nowParameter);
            var stuckParameter = command.CreateParameter();
            stuckParameter.ParameterName = "@stuckBefore";
            stuckParameter.Value = stuckBefore;
            command.Parameters.Add(stuckParameter);

            var results = new List<SessionExecutionOperationsMetric>();
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(new(
                    SessionExecutionStorageValues.Kind(reader.GetString(0)),
                    reader.GetInt64(1),
                    reader.GetInt64(2),
                    reader.GetInt64(3),
                    reader.IsDBNull(4) ? null : reader.GetFieldValue<DateTimeOffset>(4),
                    reader.GetInt64(5)));
            }
            return results;
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    private async Task<SessionExecutionOperationOutcome> ClassifyFenceAsync(
        SessionExecutionClaim claim,
        bool allowCancellationRevision,
        CancellationToken cancellationToken)
    {
        var row = await db.SessionExecutions.AsNoTracking()
            .Where(execution => execution.Id == claim.ExecutionId)
            .Select(execution => new { execution.Status, execution.LeaseToken, execution.Revision })
            .SingleOrDefaultAsync(cancellationToken);
        if (row is null || row.LeaseToken != claim.LeaseToken) return SessionExecutionOperationOutcome.StaleClaim;
        if (row.Revision != claim.Revision && !(allowCancellationRevision && row.Revision == claim.Revision + 1))
            return SessionExecutionOperationOutcome.RevisionConflict;
        return SessionExecutionOperationOutcome.StaleClaim;
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
                    "Status" = {{SessionExecutionStatus.Queued}}
                    OR ("Status" = {{SessionExecutionStatus.RetryWait}} AND "NextAttemptAt" <= {{now}})
                    OR ("Status" = {{SessionExecutionStatus.Running}} AND "LeaseExpiresAt" <= {{now}})
                  )
                ORDER BY "Priority" DESC, "QueuedAt", "Id"
                LIMIT {{maxBatchSize}}
                FOR UPDATE SKIP LOCKED
                """).ToListAsync(cancellationToken);
        }

        var scanSize = Math.Min(MaximumBatchSize * 4, Math.Max(maxBatchSize * 4, 32));
        var candidates = await db.SessionExecutions
            .Where(execution => execution.DismissedAt == null
                && (execution.Status == SessionExecutionStatus.Queued
                    || execution.Status == SessionExecutionStatus.RetryWait
                    || execution.Status == SessionExecutionStatus.Running))
            .OrderByDescending(execution => execution.Priority)
            .Take(scanSize)
            .ToListAsync(cancellationToken);
        return candidates
            .Where(execution => execution.Status == SessionExecutionStatus.Queued
                || execution.Status == SessionExecutionStatus.RetryWait && execution.NextAttemptAt <= now
                || execution.Status == SessionExecutionStatus.Running && execution.LeaseExpiresAt <= now)
            .OrderByDescending(execution => execution.Priority)
            .ThenBy(execution => execution.QueuedAt)
            .ThenBy(execution => execution.Id, StringComparer.Ordinal)
            .Take(maxBatchSize)
            .ToList();
    }
}
