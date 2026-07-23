using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class SessionExecutionFinalizer(ApplicationDbContext db, TimeProvider timeProvider)
{
    public async Task FinishAsync(
        SessionExecutionClaim claim,
        SessionExecutionHandlerResult result,
        Activity? activity,
        CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.Include(item => item.Attempts).SingleOrDefaultAsync(
            item => item.Id == claim.ExecutionId
                && item.LeaseToken == claim.LeaseToken
                && (item.Status == SessionExecutionStatuses.Running && item.Revision == claim.Revision
                    || item.Status == SessionExecutionStatuses.CancelRequested && item.Revision == claim.Revision + 1),
            cancellationToken);
        if (execution is null) return;
        var attempt = execution.Attempts.SingleOrDefault(item => item.Id == claim.AttemptId);
        if (attempt is null) return;
        var now = timeProvider.GetUtcNow();
        attempt.CompletedAt = now;
        attempt.TraceId = activity?.TraceId.ToString();
        attempt.SpanId = activity?.SpanId.ToString();
        attempt.CorrelationId = Activity.Current?.TraceId.ToString();
        attempt.ErrorCategory = result.ErrorCategory;
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
            if (string.Equals(result.ErrorCode, "session_advanced", StringComparison.Ordinal))
                SessionExecutionTelemetry.RecordSessionAdvanced(execution.Kind, execution.Status);
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
}
