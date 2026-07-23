using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record SessionExecutionContext(string ExecutionId, string LeaseToken, long Revision, string AttemptId, int AttemptNumber);
public sealed record SessionExecutionHandlerResult(bool Succeeded, bool Retryable = false, string? ErrorCode = null, string? UserMessage = null, string? TerminalStatus = null, string? ErrorCategory = null);

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
                    // FinishAsync distinguishes a user cancellation from a lost/reclaimed lease.
                    result = new(false, false, "execution_cancelled", "生成処理はキャンセルされました。");
                }
                catch (Exception exception)
                {
                    activity?.SetStatus(ActivityStatusCode.Error, exception.GetType().Name);
                    logger.LogWarning(exception, "Session execution handler failed. Kind={Kind}", execution.Kind);
                    result = new(false, true, "execution_failed", "生成処理に失敗しました。入力内容は保存されています。", ErrorCategory: "internal");
                }
            }
        }
        finally
        {
            executionCancellation.Cancel();
            try { await heartbeat; }
            catch (OperationCanceledException) { }
        }
        var finalizer = scope.ServiceProvider.GetRequiredService<SessionExecutionFinalizer>();
        await finalizer.FinishAsync(claim, result, activity, stoppingToken);
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
