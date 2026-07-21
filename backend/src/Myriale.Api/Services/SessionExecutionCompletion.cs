using Myriale.Api.Data;

namespace Myriale.Api.Services;

internal static class SessionExecutionCompletion
{
    public static void MarkPublished(
        SessionExecution execution,
        SessionExecutionAttempt attempt,
        DateTimeOffset completedAt)
    {
        SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Succeeded);
        execution.CompletedAt = completedAt;
        execution.IsRetryable = false;
        execution.NextAttemptAt = null;
        execution.ErrorCode = null;
        execution.UserErrorMessage = null;
        execution.LeaseOwner = null;
        execution.LeaseToken = null;
        execution.LeaseExpiresAt = null;

        attempt.Status = "succeeded";
        attempt.CompletedAt = completedAt;
        attempt.ErrorCode = null;
        attempt.Retryable = false;
    }
}
