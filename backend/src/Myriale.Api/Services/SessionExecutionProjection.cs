using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public static class SessionExecutionProjection
{
    public static SessionExecutionResponse ToResponse(SessionExecution execution, bool includeDevelopmentDiagnostics)
    {
        var capabilities = new SessionExecutionCapabilities(
            execution.Status is SessionExecutionStatuses.Failed or SessionExecutionStatuses.Cancelled,
            execution.Status is SessionExecutionStatuses.Queued or SessionExecutionStatuses.Running or SessionExecutionStatuses.RetryWait or SessionExecutionStatuses.CancelRequested,
            SessionExecutionStatuses.IsTerminal(execution.Status));
        SessionExecutionDiagnosticsResponse? diagnostics = null;
        if (includeDevelopmentDiagnostics)
        {
            diagnostics = new SessionExecutionDiagnosticsResponse(
                execution.SessionId, execution.TriggerType, execution.TriggerId, execution.Revision, execution.LeaseOwner,
                execution.LeaseToken is { Length: >= 8 } token ? $"…{token[^8..]}" : null, execution.LeaseExpiresAt,
                execution.Attempts.OrderBy(item => item.AttemptNumber).Select(item => new SessionExecutionAttemptDiagnosticsResponse(
                    item.Id, item.AttemptNumber, item.Status, item.WorkerId, item.Provider, item.Model, item.ProviderRequestId,
                    item.StartedAt, item.CompletedAt, item.LatencyMilliseconds, item.InputTokens, item.OutputTokens, item.FinishReason,
                    item.ErrorCode, item.ErrorCategory, item.Retryable, item.CorrelationId, item.TraceId, item.SpanId,
                    item.ExceptionChain, item.RedactedResponseExcerpt, item.SentPrompt, item.ReceivedResult, item.ValidationResult,
                    item.PromptVersion, item.ContextHash, item.ContextSizeBytes)).ToList());
        }
        return new SessionExecutionResponse(
            execution.Id, execution.SessionId, execution.Kind, execution.TriggerType, execution.TriggerId, execution.Status,
            execution.Revision, execution.IsRetryable, execution.AttemptCount, execution.MaxAttempts, execution.NextAttemptAt,
            execution.ErrorCode, execution.UserErrorMessage, execution.CreatedAt, execution.StartedAt, execution.CompletedAt,
            execution.CancelRequestedAt, execution.DismissedAt, capabilities, diagnostics);
    }

    public static SessionPlayerInputResponse ToResponse(SessionPlayerInput input) => new(
        input.Id, input.RequestId, input.Text, input.InteractionType, input.AcceptedAfterTurnId,
        input.AcceptedSessionRevision, input.SupersedesInputId, input.CreatedAt);
}
