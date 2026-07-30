using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public static class SessionAiInteractionStages
{
    public const string ActionDecision = "action-decision";
    public const string Narrative = "narrative";
}

public static class SessionAiInteractionStatuses
{
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
    public const string ValidationFailed = "validation-failed";
}

public sealed class SessionAiInteraction
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string ExecutionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string AttemptId { get; set; } = string.Empty;
    public int Sequence { get; set; }
    [Required, MaxLength(32)] public string Stage { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string AiProfileId { get; set; } = string.Empty;
    [MaxLength(80)] public string? Provider { get; set; }
    [MaxLength(160)] public string? Model { get; set; }
    [MaxLength(160)] public string? ProviderRequestId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
    public long? LatencyMilliseconds { get; set; }
    public int? InputTokens { get; set; }
    public int? OutputTokens { get; set; }
    [MaxLength(80)] public string? FinishReason { get; set; }
    [Required, MaxLength(32)] public string Status { get; set; } = SessionAiInteractionStatuses.Succeeded;
    [MaxLength(80)] public string? ErrorCode { get; set; }
    [MaxLength(500)] public string? ErrorMessage { get; set; }
    public string? SentPrompt { get; set; }
    public string? ReceivedResult { get; set; }
    public string? ValidationResult { get; set; }

    public Session Session { get; set; } = null!;
    public SessionExecution Execution { get; set; } = null!;
    public SessionExecutionAttempt Attempt { get; set; } = null!;
}
