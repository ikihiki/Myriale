using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionExecutionAttempt
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string ExecutionId { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    [Required, MaxLength(32)] public string Status { get; set; } = "running";
    [MaxLength(120)] public string? WorkerId { get; set; }
    [MaxLength(80)] public string? Provider { get; set; }
    [MaxLength(160)] public string? Model { get; set; }
    [MaxLength(160)] public string? ProviderRequestId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public long? LatencyMilliseconds { get; set; }
    public int? InputTokens { get; set; }
    public int? OutputTokens { get; set; }
    [MaxLength(80)] public string? FinishReason { get; set; }
    [MaxLength(80)] public string? ErrorCode { get; set; }
    [MaxLength(80)] public string? ErrorCategory { get; set; }
    public bool Retryable { get; set; }
    [MaxLength(120)] public string? CorrelationId { get; set; }
    [MaxLength(64)] public string? TraceId { get; set; }
    [MaxLength(32)] public string? SpanId { get; set; }
    [MaxLength(300)] public string? ExceptionChain { get; set; }
    [MaxLength(1000)] public string? RedactedResponseExcerpt { get; set; }
    public string? SentPrompt { get; set; }
    public string? ReceivedResult { get; set; }
    public string? ValidationResult { get; set; }
    [MaxLength(80)] public string? PromptVersion { get; set; }
    [MaxLength(64)] public string? ContextHash { get; set; }
    public int? ContextSizeBytes { get; set; }

    public SessionExecution Execution { get; set; } = null!;
}
