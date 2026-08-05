using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.SessionExecutions.Domain;

public enum SessionAiInteractionStage
{
    ActionDecision,
    Narrative,
    ModuleHandoff,
}

public enum SessionAiInteractionStatus
{
    Succeeded,
    Failed,
    ValidationFailed,
}

public static class SessionAiInteractionValues
{
    public static string ToWireValue(this SessionAiInteractionStage value) => value switch
    {
        SessionAiInteractionStage.ActionDecision => "action-decision",
        SessionAiInteractionStage.Narrative => "narrative",
        SessionAiInteractionStage.ModuleHandoff => "module-handoff",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWireValue(this SessionAiInteractionStatus value) => value switch
    {
        SessionAiInteractionStatus.Succeeded => "succeeded",
        SessionAiInteractionStatus.Failed => "failed",
        SessionAiInteractionStatus.ValidationFailed => "validation-failed",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static SessionAiInteractionStage ParseStage(string value) => value switch
    {
        "action-decision" => SessionAiInteractionStage.ActionDecision,
        "narrative" => SessionAiInteractionStage.Narrative,
        "module-handoff" => SessionAiInteractionStage.ModuleHandoff,
        _ => throw new InvalidOperationException($"Unknown AI interaction stage '{value}'."),
    };

    public static SessionAiInteractionStatus ParseStatus(string value) => value switch
    {
        "succeeded" => SessionAiInteractionStatus.Succeeded,
        "failed" => SessionAiInteractionStatus.Failed,
        "validation-failed" => SessionAiInteractionStatus.ValidationFailed,
        _ => throw new InvalidOperationException($"Unknown AI interaction status '{value}'."),
    };
}

public sealed class SessionAiInteraction
{
    [Key, MaxLength(40)] public SessionAiInteractionId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    [Required, MaxLength(40)] public SessionExecutionId ExecutionId { get; internal set; }
    [Required, MaxLength(40)] public SessionExecutionAttemptId AttemptId { get; internal set; }
    public int Sequence { get; internal set; }
    [Required, MaxLength(32)] public SessionAiInteractionStage Stage { get; internal set; }
    [Required, MaxLength(80)] public AiProviderProfileId AiProfileId { get; internal set; }
    [MaxLength(80)] public string? Provider { get; internal set; }
    [MaxLength(160)] public string? Model { get; internal set; }
    [MaxLength(160)] public string? ProviderRequestId { get; internal set; }
    public DateTimeOffset StartedAt { get; internal set; }
    public DateTimeOffset CompletedAt { get; internal set; }
    public long? LatencyMilliseconds { get; internal set; }
    public int? InputTokens { get; internal set; }
    public int? OutputTokens { get; internal set; }
    [MaxLength(80)] public string? FinishReason { get; internal set; }
    [Required, MaxLength(32)] public SessionAiInteractionStatus Status { get; internal set; } = SessionAiInteractionStatus.Succeeded;
    [MaxLength(80)] public string? ErrorCode { get; internal set; }
    [MaxLength(500)] public string? ErrorMessage { get; internal set; }
    public string? SentPrompt { get; internal set; }
    public string? ReceivedResult { get; internal set; }
    public string? ValidationResult { get; internal set; }

    public Session Session { get; internal set; } = null!;
    public SessionExecution Execution { get; internal set; } = null!;
    public SessionExecutionAttempt Attempt { get; internal set; } = null!;
}
