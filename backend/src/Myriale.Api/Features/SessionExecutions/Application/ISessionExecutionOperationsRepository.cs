
namespace Myriale.Api.Features.SessionExecutions.Application;

public enum SessionExecutionOperationOutcome
{
    Success,
    StaleClaim,
    RevisionConflict,
    TransientDatabaseConflict,
}

public sealed record SessionExecutionClaim(
    SessionExecutionId ExecutionId,
    string LeaseToken,
    long Revision,
    SessionExecutionAttemptId AttemptId,
    int AttemptNumber);

public sealed record SessionExecutionClaimContext(
    SessionExecutionClaim Claim,
    SessionId SessionId,
    SessionExecutionKind Kind,
    string? TraceParent);

public sealed record SessionExecutionClaimBatchResult(
    SessionExecutionOperationOutcome Outcome,
    IReadOnlyList<SessionExecutionClaim> Claims)
{
    public static SessionExecutionClaimBatchResult Success(IReadOnlyList<SessionExecutionClaim> claims) =>
        new(SessionExecutionOperationOutcome.Success, claims);
}

public sealed record SessionExecutionClaimContextResult(
    SessionExecutionOperationOutcome Outcome,
    SessionExecutionClaimContext? Context);

public sealed record SessionExecutionFinalizeDecision(
    bool Succeeded,
    bool Retryable = false,
    string? ErrorCode = null,
    string? UserMessage = null,
    SessionExecutionStatus? TerminalStatus = null,
    string? ErrorCategory = null);

public sealed record SessionExecutionFinalizeRequest(
    SessionExecutionClaim Claim,
    SessionExecutionFinalizeDecision Decision,
    string? CorrelationId,
    string? TraceId,
    string? SpanId);

public sealed record SessionExecutionFinalizeResult(
    SessionExecutionOperationOutcome Outcome,
    SessionExecutionKind? Kind = null,
    SessionExecutionStatus? Status = null,
    DateTimeOffset? AttemptStartedAt = null,
    DateTimeOffset? ExecutionStartedAt = null,
    DateTimeOffset? CompletedAt = null,
    TimeSpan? RetryDelay = null,
    string? ErrorCode = null);

public sealed record SessionExecutionOperationsMetric(
    SessionExecutionKind Kind,
    long QueueDepth,
    long Running,
    long RetryWait,
    DateTimeOffset? OldestQueuedAt,
    long Stuck);

public interface ISessionExecutionOperationsRepository
{
    Task<SessionExecutionClaimBatchResult> ClaimBatchAsync(
        string workerId,
        int maxBatchSize,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken);

    Task<SessionExecutionClaimContextResult> LoadClaimContextAsync(
        SessionExecutionClaim claim,
        CancellationToken cancellationToken);

    Task<SessionExecutionOperationOutcome> HeartbeatAsync(
        SessionExecutionClaim claim,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken);

    Task<SessionExecutionFinalizeResult> FinalizeAsync(
        SessionExecutionFinalizeRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<SessionExecutionOperationsMetric>> ReadMetricsAsync(
        DateTimeOffset now,
        DateTimeOffset stuckBefore,
        CancellationToken cancellationToken);
}

public interface ISessionExecutionRetryPolicy
{
    TimeSpan GetDelay(int attemptNumber);
}

public interface ISessionExecutionJitter
{
    double NextUnit();
}

public sealed class SessionExecutionRetryPolicy(ISessionExecutionJitter jitter) : ISessionExecutionRetryPolicy
{
    public TimeSpan GetDelay(int attemptNumber)
    {
        if (attemptNumber <= 0) throw new ArgumentOutOfRangeException(nameof(attemptNumber));
        return TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, attemptNumber)) + jitter.NextUnit());
    }
}

public sealed class RandomSessionExecutionJitter : ISessionExecutionJitter
{
    public double NextUnit() => Random.Shared.NextDouble();
}
