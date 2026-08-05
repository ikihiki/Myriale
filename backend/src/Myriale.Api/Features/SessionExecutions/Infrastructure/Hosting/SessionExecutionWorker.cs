using System.Diagnostics;
using Myriale.Api.Features.SessionExecutions.Application;

namespace Myriale.Api.Features.SessionExecutions.Infrastructure;

public sealed class SessionExecutionWorkerSettings
{
    public int ClaimBatchSize { get; init; } = 8;
    public TimeSpan LeaseDuration { get; init; } = TimeSpan.FromMinutes(2);
    public TimeSpan HeartbeatInterval { get; init; } = TimeSpan.FromSeconds(30);
    public TimeSpan IdleDelay { get; init; } = TimeSpan.FromMilliseconds(250);
}

public sealed class SessionExecutionWorker(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    SessionExecutionWorkerSettings settings,
    ILogger<SessionExecutionWorker> logger) : BackgroundService
{
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
                    await Task.Delay(settings.IdleDelay, timeProvider, stoppingToken);
                    continue;
                }
                await Task.WhenAll(claims.Select(claim => RunClaimAsync(claim, stoppingToken)));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception exception)
            {
                logger.LogError(exception, "Session execution worker loop failed.");
                await Task.Delay(TimeSpan.FromSeconds(1), timeProvider, stoppingToken);
            }
        }
    }

    internal async Task RunClaimAsync(SessionExecutionClaim claim, CancellationToken stoppingToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var operations = scope.ServiceProvider.GetRequiredService<ISessionExecutionOperationsRepository>();
        var loaded = await operations.LoadClaimContextAsync(claim, stoppingToken);
        if (loaded.Outcome != SessionExecutionOperationOutcome.Success || loaded.Context is null) return;
        var context = loaded.Context;

        using var activity = StartActivity(context);
        using var logScope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["SessionId"] = context.SessionId,
            ["ExecutionId"] = claim.ExecutionId,
            ["AttemptId"] = claim.AttemptId,
            ["TraceId"] = activity?.TraceId.ToString(),
            ["SpanId"] = activity?.SpanId.ToString(),
        });
        using var executionCancellation = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        var heartbeat = HeartbeatAsync(claim, executionCancellation, stoppingToken);
        SessionExecutionHandlerResult result;
        try
        {
            var handler = scope.ServiceProvider.GetServices<ISessionExecutionHandler>().SingleOrDefault(item => item.Kind == context.Kind.ToString());
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
                    result = new(false, false, "execution_cancelled", "生成処理はキャンセルされました。", ErrorCategory: "cancellation");
                }
                catch (Exception exception)
                {
                    activity?.SetStatus(ActivityStatusCode.Error, exception.GetType().Name);
                    logger.LogWarning(exception, "Session execution handler failed. Kind={Kind}", context.Kind);
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

        var finalized = await operations.FinalizeAsync(new(
            claim,
            new(result.Succeeded, result.Retryable, result.ErrorCode, result.UserMessage,
                result.TerminalStatus is null ? null : Enum.Parse<SessionExecutionStatus>(result.TerminalStatus), result.ErrorCategory),
            Activity.Current?.TraceId.ToString(),
            activity?.TraceId.ToString(),
            activity?.SpanId.ToString()), stoppingToken);
        RecordFinalizationTelemetry(finalized);
    }

    private async Task<IReadOnlyList<SessionExecutionClaim>> ClaimAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var operations = scope.ServiceProvider.GetRequiredService<ISessionExecutionOperationsRepository>();
        var result = await operations.ClaimBatchAsync(workerId, settings.ClaimBatchSize, settings.LeaseDuration, cancellationToken);
        if (result.Outcome == SessionExecutionOperationOutcome.TransientDatabaseConflict)
            logger.LogDebug("Session execution claim encountered a transient database conflict.");
        return result.Claims;
    }

    private async Task HeartbeatAsync(
        SessionExecutionClaim claim,
        CancellationTokenSource executionCancellation,
        CancellationToken stoppingToken)
    {
        while (!executionCancellation.IsCancellationRequested)
        {
            await Task.Delay(settings.HeartbeatInterval, timeProvider, executionCancellation.Token);
            await using var scope = scopeFactory.CreateAsyncScope();
            var operations = scope.ServiceProvider.GetRequiredService<ISessionExecutionOperationsRepository>();
            var outcome = await operations.HeartbeatAsync(claim, settings.LeaseDuration, stoppingToken);
            if (outcome is SessionExecutionOperationOutcome.StaleClaim or SessionExecutionOperationOutcome.RevisionConflict)
            {
                executionCancellation.Cancel();
                return;
            }
        }
    }

    private static Activity? StartActivity(SessionExecutionClaimContext context)
    {
        ActivityContext parent = default;
        if (!string.IsNullOrWhiteSpace(context.TraceParent)) ActivityContext.TryParse(context.TraceParent, null, out parent);
        var activity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.execution.run", ActivityKind.Internal, parent);
        activity?.SetTag("myriale.execution.kind", context.Kind.ToContractValue());
        activity?.SetTag("myriale.execution.attempt_number", context.Claim.AttemptNumber);
        activity?.SetTag("myriale.execution.id", context.Claim.ExecutionId);
        activity?.SetTag("myriale.session.id", context.SessionId);
        return activity;
    }

    private static void RecordFinalizationTelemetry(SessionExecutionFinalizeResult result)
    {
        if (result.Outcome != SessionExecutionOperationOutcome.Success || result.Kind is null || result.Status is null || result.CompletedAt is null)
            return;
        var kind = result.Kind.Value;
        var status = result.Status.Value;
        var tags = SessionExecutionTelemetry.Tags(kind, status, errorCode: result.ErrorCode);
        if (status == SessionExecutionStatus.Succeeded) SessionExecutionTelemetry.Completed.Add(1, tags);
        else if (status == SessionExecutionStatus.Cancelled) SessionExecutionTelemetry.Cancelled.Add(1, tags);
        else if (status == SessionExecutionStatus.Superseded)
        {
            SessionExecutionTelemetry.Superseded.Add(1, tags);
            if (result.ErrorCode == "session_advanced") SessionExecutionTelemetry.RecordSessionAdvanced(kind, status);
        }
        else if (status == SessionExecutionStatus.RetryWait) SessionExecutionTelemetry.Retried.Add(1, tags);
        else if (status == SessionExecutionStatus.Failed) SessionExecutionTelemetry.Failed.Add(1, tags);
        if (result.RetryDelay is { } retryDelay) SessionExecutionTelemetry.RetryDelay.Record(retryDelay.TotalSeconds, tags);
        if (result.AttemptStartedAt is { } attemptStarted)
            SessionExecutionTelemetry.AttemptDuration.Record((result.CompletedAt.Value - attemptStarted).TotalSeconds, tags);
        if (result.ExecutionStartedAt is { } executionStarted && status.IsTerminal())
            SessionExecutionTelemetry.Duration.Record((result.CompletedAt.Value - executionStarted).TotalSeconds, tags);
    }
}
