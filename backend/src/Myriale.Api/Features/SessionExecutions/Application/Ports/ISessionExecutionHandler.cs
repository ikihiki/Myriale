using Myriale.Api.Architecture;

namespace Myriale.Api.Features.SessionExecutions.Application.Ports;

[CrossSliceContract]
public sealed record SessionExecutionContext(SessionExecutionId ExecutionId, string LeaseToken, long Revision, SessionExecutionAttemptId AttemptId, int AttemptNumber);

[CrossSliceContract]
public sealed record SessionExecutionHandlerResult(bool Succeeded, bool Retryable = false, string? ErrorCode = null, string? UserMessage = null, string? TerminalStatus = null, string? ErrorCategory = null);

[CrossSliceContract]
public interface ISessionExecutionHandler
{
    string Kind { get; }
    Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken);
}
