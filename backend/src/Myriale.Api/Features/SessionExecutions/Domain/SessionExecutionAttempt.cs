using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public enum SessionExecutionAttemptStatus
{
    Running,
    Expired,
    Succeeded,
    Failed,
    Cancelled,
    Superseded,
}

public sealed class SessionExecutionAttempt
{
    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string ExecutionId { get; internal set; } = string.Empty;
    public int AttemptNumber { get; internal set; }
    [Required, MaxLength(32)] public SessionExecutionAttemptStatus Status { get; private set; } = SessionExecutionAttemptStatus.Running;
    [MaxLength(120)] public string? WorkerId { get; internal set; }
    [MaxLength(80)] public string? Provider { get; private set; }
    [MaxLength(160)] public string? Model { get; private set; }
    [MaxLength(160)] public string? ProviderRequestId { get; private set; }
    public DateTimeOffset StartedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public long? LatencyMilliseconds { get; private set; }
    public int? InputTokens { get; private set; }
    public int? OutputTokens { get; private set; }
    [MaxLength(80)] public string? FinishReason { get; private set; }
    [MaxLength(80)] public string? ErrorCode { get; private set; }
    [MaxLength(80)] public string? ErrorCategory { get; private set; }
    public bool Retryable { get; private set; }
    [MaxLength(120)] public string? CorrelationId { get; private set; }
    [MaxLength(64)] public string? TraceId { get; private set; }
    [MaxLength(32)] public string? SpanId { get; private set; }
    [MaxLength(300)] public string? ExceptionChain { get; private set; }
    [MaxLength(1000)] public string? RedactedResponseExcerpt { get; private set; }
    public string? SentPrompt { get; private set; }
    public string? ReceivedResult { get; private set; }
    public string? ValidationResult { get; private set; }
    [MaxLength(80)] public string? PromptVersion { get; private set; }
    [MaxLength(64)] public string? ContextHash { get; private set; }
    public int? ContextSizeBytes { get; private set; }

    public SessionExecution Execution { get; internal set; } = null!;
    public ICollection<SessionAiInteraction> AiInteractions { get; internal set; } = [];

    public static SessionExecutionAttempt Start(string id, string executionId, int attemptNumber, string workerId, DateTimeOffset startedAt)
    {
        if (string.IsNullOrWhiteSpace(id)) throw new ArgumentException("Attempt ID is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(executionId)) throw new ArgumentException("Execution ID is required.", nameof(executionId));
        if (attemptNumber <= 0) throw new ArgumentOutOfRangeException(nameof(attemptNumber));
        if (string.IsNullOrWhiteSpace(workerId)) throw new ArgumentException("Worker ID is required.", nameof(workerId));
        return new SessionExecutionAttempt
        {
            Id = id,
            ExecutionId = executionId,
            AttemptNumber = attemptNumber,
            WorkerId = workerId,
            StartedAt = startedAt,
        };
    }

    public void Expire(DateTimeOffset completedAt) => Complete(SessionExecutionAttemptStatus.Expired, completedAt, "lease_expired", "lease", true);
    public void Succeed(DateTimeOffset completedAt) => Complete(SessionExecutionAttemptStatus.Succeeded, completedAt, null, null, false);
    public void Fail(DateTimeOffset completedAt, string? errorCode, string? errorCategory, bool retryable) =>
        Complete(SessionExecutionAttemptStatus.Failed, completedAt, errorCode, errorCategory, retryable);
    public void Cancel(DateTimeOffset completedAt, string? errorCode, string? errorCategory) =>
        Complete(SessionExecutionAttemptStatus.Cancelled, completedAt, errorCode, errorCategory, false);
    public void Supersede(DateTimeOffset completedAt, string? errorCode, string? errorCategory) =>
        Complete(SessionExecutionAttemptStatus.Superseded, completedAt, errorCode, errorCategory, false);

    public void RecordProviderDiagnostics(
        string? provider,
        string? model,
        string? providerRequestId,
        long? latencyMilliseconds = null,
        int? inputTokens = null,
        int? outputTokens = null,
        string? finishReason = null,
        string? errorCode = null,
        string? errorCategory = null,
        bool retryable = false)
    {
        EnsureRunning();
        Provider = provider;
        Model = model;
        ProviderRequestId = providerRequestId;
        LatencyMilliseconds = latencyMilliseconds;
        InputTokens = inputTokens;
        OutputTokens = outputTokens;
        FinishReason = finishReason;
        ErrorCode = errorCode;
        ErrorCategory = errorCategory;
        Retryable = retryable;
    }

    public void RecordTrace(string? correlationId, string? traceId, string? spanId)
    {
        EnsureRunning();
        CorrelationId = correlationId;
        TraceId = traceId;
        SpanId = spanId;
    }

    public void RecordFailureDiagnostics(string? exceptionChain, string? redactedResponseExcerpt)
    {
        EnsureRunning();
        ExceptionChain = exceptionChain;
        RedactedResponseExcerpt = redactedResponseExcerpt;
    }

    public void RecordPayloadDiagnostics(
        string? sentPrompt,
        string? receivedResult,
        string? validationResult,
        string? promptVersion,
        string? contextHash,
        int? contextSizeBytes)
    {
        EnsureRunning();
        SentPrompt = sentPrompt;
        ReceivedResult = receivedResult;
        ValidationResult = validationResult;
        PromptVersion = promptVersion;
        ContextHash = contextHash;
        ContextSizeBytes = contextSizeBytes;
    }

    private void Complete(SessionExecutionAttemptStatus status, DateTimeOffset completedAt, string? errorCode, string? errorCategory, bool retryable)
    {
        EnsureRunning();
        if (completedAt < StartedAt) throw new ArgumentOutOfRangeException(nameof(completedAt));
        Status = status;
        CompletedAt = completedAt;
        ErrorCode = errorCode;
        ErrorCategory = errorCategory;
        Retryable = retryable;
    }

    private void EnsureRunning()
    {
        if (Status != SessionExecutionAttemptStatus.Running)
            throw new InvalidOperationException($"Attempt {Id} is already {Status}.");
    }
}
