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

public sealed class SessionExecutionWorker(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<SessionExecutionWorker> logger) : BackgroundService
{
    internal const int ClaimBatchSize = 8;
    internal static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);
    internal static readonly TimeSpan HeartbeatInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan IdleDelay = TimeSpan.FromMilliseconds(250);
    private readonly string workerId = $"worker-{Environment.MachineName}-{Guid.NewGuid():N}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var claims = await ClaimAsync(stoppingToken);
                if (claims.Count == 0)
                {
                    await Task.Delay(IdleDelay, timeProvider, stoppingToken);
                    continue;
                }
                await Task.WhenAll(claims.Select(claim => RunAsync(claim, stoppingToken)));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception exception)
            {
                logger.LogError(exception, "Session execution worker loop failed.");
                await Task.Delay(TimeSpan.FromSeconds(1), timeProvider, stoppingToken);
            }
        }
    }

    private async Task<IReadOnlyList<SessionExecutionClaim>> ClaimAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var queue = scope.ServiceProvider.GetRequiredService<ISessionExecutionQueue>();
        return await queue.ClaimAsync(workerId, ClaimBatchSize, LeaseDuration, cancellationToken);
    }

    private async Task RunAsync(SessionExecutionClaim claim, CancellationToken stoppingToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var execution = await db.SessionExecutions.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == claim.ExecutionId && item.LeaseToken == claim.LeaseToken && item.Revision == claim.Revision,
            stoppingToken);
        if (execution is null) return;

        using var activity = StartActivity(execution, claim.AttemptNumber);
        using var logScope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["SessionId"] = execution.SessionId,
            ["ExecutionId"] = execution.Id,
            ["AttemptId"] = claim.AttemptId,
            ["TraceId"] = activity?.TraceId.ToString(),
            ["SpanId"] = activity?.SpanId.ToString(),
        });
        using var executionCancellation = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        var heartbeat = HeartbeatAsync(claim, executionCancellation, stoppingToken);
        SessionExecutionHandlerResult result;
        try
        {
            var handler = scope.ServiceProvider.GetServices<ISessionExecutionHandler>().SingleOrDefault(item => item.Kind == execution.Kind);
            if (handler is null)
                result = new(false, false, "handler_not_configured", "この生成処理はまだ構成されていません。");
            else
            {
                try
                {
                    result = await handler.ExecuteAsync(
                        new(claim.ExecutionId, claim.LeaseToken, claim.Revision, claim.AttemptId, claim.AttemptNumber),
                        executionCancellation.Token);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
                catch (OperationCanceledException) when (executionCancellation.IsCancellationRequested)
                {
                    return; // A failed heartbeat means this worker no longer owns the lease.
                }
                catch (Exception exception)
                {
                    activity?.SetStatus(ActivityStatusCode.Error, exception.GetType().Name);
                    logger.LogWarning(exception, "Session execution handler failed. Kind={Kind}", execution.Kind);
                    result = new(false, true, "execution_failed", "生成処理に失敗しました。入力内容は保存されています。");
                }
            }
        }
        finally
        {
            executionCancellation.Cancel();
            try { await heartbeat; }
            catch (OperationCanceledException) { }
        }
        await FinishAsync(claim, result, activity, stoppingToken);
    }

    private async Task HeartbeatAsync(
        SessionExecutionClaim claim,
        CancellationTokenSource executionCancellation,
        CancellationToken stoppingToken)
    {
        while (!executionCancellation.IsCancellationRequested)
        {
            await Task.Delay(HeartbeatInterval, timeProvider, executionCancellation.Token);
            await using var scope = scopeFactory.CreateAsyncScope();
            var queue = scope.ServiceProvider.GetRequiredService<ISessionExecutionQueue>();
            if (!await queue.HeartbeatAsync(claim, LeaseDuration, stoppingToken))
            {
                executionCancellation.Cancel();
                return;
            }
        }
    }

    private async Task FinishAsync(
        SessionExecutionClaim claim,
        SessionExecutionHandlerResult result,
        Activity? activity,
        CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var execution = await db.SessionExecutions.Include(item => item.Attempts).SingleOrDefaultAsync(
            item => item.Id == claim.ExecutionId
                && item.LeaseToken == claim.LeaseToken
                && item.Revision == claim.Revision
                && (item.Status == SessionExecutionStatuses.Running || item.Status == SessionExecutionStatuses.CancelRequested),
            cancellationToken);
        if (execution is null) return;
        var attempt = execution.Attempts.SingleOrDefault(item => item.Id == claim.AttemptId);
        if (attempt is null) return;
        var now = timeProvider.GetUtcNow();
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
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return; }
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
