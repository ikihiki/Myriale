using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record SessionExecutionContext(string ExecutionId, string LeaseToken, long Revision, string AttemptId, int AttemptNumber);
public sealed record SessionExecutionHandlerResult(bool Succeeded, bool Retryable = false, string? ErrorCode = null, string? UserMessage = null, string? TerminalStatus = null);

public interface ISessionExecutionHandler
{
    string Kind { get; }
    Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken);
}

public sealed class SessionExecutionWorker(IServiceScopeFactory scopeFactory, ILogger<SessionExecutionWorker> logger) : BackgroundService
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan IdleDelay = TimeSpan.FromMilliseconds(250);
    private readonly string workerId = $"worker-{Environment.MachineName}-{Guid.NewGuid():N}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var claimed = await ClaimAsync(stoppingToken);
                if (claimed is null) { await Task.Delay(IdleDelay, stoppingToken); continue; }
                await RunAsync(claimed.Value, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception exception)
            {
                logger.LogError(exception, "Session execution worker loop failed.");
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }
    }

    private async Task<(string ExecutionId, string LeaseToken, long Revision, string AttemptId, int AttemptNumber)?> ClaimAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTimeOffset.UtcNow;
        // SQLite cannot translate DateTimeOffset ordering/comparison. Keep the bounded status
        // predicate in SQL and evaluate due/expired timestamps in memory; PostgreSQL remains indexed.
        var candidates = await db.SessionExecutions
            .Where(execution => execution.DismissedAt == null
                && (execution.Status == SessionExecutionStatuses.Queued
                    || execution.Status == SessionExecutionStatuses.RetryWait
                    || execution.Status == SessionExecutionStatuses.Running))
            .OrderByDescending(execution => execution.Priority)
            .Take(32)
            .ToListAsync(cancellationToken);
        var candidate = candidates
            .Where(execution => execution.Status == SessionExecutionStatuses.Queued
                || execution.Status == SessionExecutionStatuses.RetryWait && execution.NextAttemptAt <= now
                || execution.Status == SessionExecutionStatuses.Running && execution.LeaseExpiresAt <= now)
            .OrderByDescending(execution => execution.Priority)
            .ThenBy(execution => execution.QueuedAt)
            .FirstOrDefault();
        if (candidate is null) return null;
        if (candidate.Status == SessionExecutionStatuses.Running) SessionExecutionTelemetry.LeaseExpired.Add(1, SessionExecutionTelemetry.Tags(candidate.Kind, candidate.Status));
        if (candidate.Status == SessionExecutionStatuses.RetryWait) SessionExecutionStateMachine.Transition(candidate, SessionExecutionStatuses.Queued);
        var token = $"LET-{Guid.NewGuid():N}".ToUpperInvariant();
        SessionExecutionStateMachine.Transition(candidate, SessionExecutionStatuses.Running);
        candidate.LeaseOwner = workerId;
        candidate.LeaseToken = token;
        candidate.LeaseExpiresAt = now.Add(LeaseDuration);
        candidate.StartedAt ??= now;
        candidate.AttemptCount++;
        candidate.NextAttemptAt = null;
        candidate.ErrorCode = null;
        candidate.UserErrorMessage = null;
        var attempt = new SessionExecutionAttempt
        {
            Id = $"ATT-{Guid.NewGuid():N}".ToUpperInvariant(), ExecutionId = candidate.Id, AttemptNumber = candidate.AttemptCount,
            Status = "running", WorkerId = workerId, StartedAt = now,
        };
        db.SessionExecutionAttempts.Add(attempt);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return null; }
        SessionExecutionTelemetry.Started.Add(1, SessionExecutionTelemetry.Tags(candidate.Kind, candidate.Status));
        SessionExecutionTelemetry.QueueDuration.Record((now - candidate.QueuedAt).TotalSeconds, SessionExecutionTelemetry.Tags(candidate.Kind, candidate.Status));
        return (candidate.Id, token, candidate.Revision, attempt.Id, attempt.AttemptNumber);
    }

    private async Task RunAsync((string ExecutionId, string LeaseToken, long Revision, string AttemptId, int AttemptNumber) claim, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var execution = await db.SessionExecutions.AsNoTracking().SingleAsync(item => item.Id == claim.ExecutionId, cancellationToken);
        using var activity = StartActivity(execution, claim.AttemptNumber);
        using var logScope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["SessionId"] = execution.SessionId, ["ExecutionId"] = execution.Id, ["AttemptId"] = claim.AttemptId,
            ["TraceId"] = activity?.TraceId.ToString(), ["SpanId"] = activity?.SpanId.ToString(),
        });
        var handler = scope.ServiceProvider.GetServices<ISessionExecutionHandler>().SingleOrDefault(item => item.Kind == execution.Kind);
        SessionExecutionHandlerResult result;
        if (handler is null)
            result = new(false, false, "handler_not_configured", "この生成処理はまだ構成されていません。");
        else
        {
            try { result = await handler.ExecuteAsync(new(claim.ExecutionId, claim.LeaseToken, claim.Revision, claim.AttemptId, claim.AttemptNumber), cancellationToken); }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { return; }
            catch (Exception exception)
            {
                activity?.SetStatus(ActivityStatusCode.Error, exception.GetType().Name);
                logger.LogWarning(exception, "Session execution handler failed. Kind={Kind}", execution.Kind);
                result = new(false, true, "execution_failed", "生成処理に失敗しました。入力内容は保存されています。");
            }
        }
        await FinishAsync(claim, result, activity, cancellationToken);
    }

    private async Task FinishAsync((string ExecutionId, string LeaseToken, long Revision, string AttemptId, int AttemptNumber) claim, SessionExecutionHandlerResult result, Activity? activity, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var execution = await db.SessionExecutions.Include(item => item.Attempts).SingleOrDefaultAsync(item => item.Id == claim.ExecutionId, cancellationToken);
        if (execution is null || execution.LeaseToken != claim.LeaseToken || execution.Status is not (SessionExecutionStatuses.Running or SessionExecutionStatuses.CancelRequested)) return;
        var attempt = execution.Attempts.Single(item => item.Id == claim.AttemptId);
        var now = DateTimeOffset.UtcNow;
        attempt.CompletedAt = now;
        attempt.TraceId = activity?.TraceId.ToString();
        attempt.SpanId = activity?.SpanId.ToString();
        attempt.CorrelationId = Activity.Current?.TraceId.ToString();
        attempt.ErrorCode = result.ErrorCode;
        attempt.Retryable = result.Retryable;
        execution.LeaseOwner = null; execution.LeaseToken = null; execution.LeaseExpiresAt = null;
        if (execution.Status == SessionExecutionStatuses.CancelRequested)
        {
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Cancelled);
            attempt.Status = "cancelled"; execution.CompletedAt = now;
            SessionExecutionTelemetry.Cancelled.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        }
        else if (result.TerminalStatus == SessionExecutionStatuses.Superseded)
        {
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Superseded);
            attempt.Status = "superseded"; execution.CompletedAt = now; execution.IsRetryable = false; execution.ErrorCode = result.ErrorCode; execution.UserErrorMessage = result.UserMessage;
            SessionExecutionTelemetry.Superseded.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        }
        else if (result.Succeeded)
        {
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Succeeded);
            attempt.Status = "succeeded"; execution.CompletedAt = now; execution.IsRetryable = false;
            SessionExecutionTelemetry.Completed.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        }
        else if (result.Retryable && execution.AttemptCount < execution.MaxAttempts)
        {
            var delay = TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, execution.AttemptCount)) + Random.Shared.NextDouble());
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.RetryWait);
            attempt.Status = "failed"; execution.NextAttemptAt = now.Add(delay); execution.ErrorCode = result.ErrorCode; execution.UserErrorMessage = result.UserMessage;
            SessionExecutionTelemetry.Retried.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, errorCode: result.ErrorCode));
            SessionExecutionTelemetry.RetryDelay.Record(delay.TotalSeconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        }
        else
        {
            SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Failed);
            attempt.Status = "failed"; execution.CompletedAt = now; execution.IsRetryable = result.Retryable; execution.ErrorCode = result.ErrorCode; execution.UserErrorMessage = result.UserMessage;
            SessionExecutionTelemetry.Failed.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, errorCode: result.ErrorCode));
        }
        await db.SaveChangesAsync(cancellationToken);
        SessionExecutionTelemetry.AttemptDuration.Record((now - attempt.StartedAt).TotalSeconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
        if (execution.StartedAt is not null && SessionExecutionStatuses.IsTerminal(execution.Status))
            SessionExecutionTelemetry.Duration.Record((now - execution.StartedAt.Value).TotalSeconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
    }

    private static Activity? StartActivity(SessionExecution execution, int attemptNumber)
    {
        ActivityContext parent = default;
        if (!string.IsNullOrWhiteSpace(execution.TraceParent)) ActivityContext.TryParse(execution.TraceParent, null, out parent);
        var activity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.execution.run", ActivityKind.Internal, parent);
        activity?.SetTag("myriale.execution.kind", execution.Kind);
        activity?.SetTag("myriale.execution.attempt_number", attemptNumber);
        activity?.SetTag("myriale.execution.id", execution.Id);
        activity?.SetTag("myriale.session.id", execution.SessionId);
        return activity;
    }
}
