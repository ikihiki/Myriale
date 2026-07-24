using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public static class SessionExecutionKinds
{
    public const string ScenarioTurn = "scenario-turn";
    public const string Narrative = "narrative";
    public const string ModuleHandoff = "module-handoff";
    public const string NoteProposal = "note-proposal";
    public const string Image = "image";
}

public static class SessionExecutionStatuses
{
    public const string Queued = "queued";
    public const string Running = "running";
    public const string RetryWait = "retry-wait";
    public const string CancelRequested = "cancel-requested";
    public const string Succeeded = "succeeded";
    public const string Failed = "failed";
    public const string Cancelled = "cancelled";
    public const string Superseded = "superseded";

    public static bool IsActive(string status) => status is Queued or Running or RetryWait or CancelRequested;
    public static bool IsTerminal(string status) => status is Succeeded or Failed or Cancelled or Superseded;
}

public sealed class SessionExecution
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Kind { get; set; } = SessionExecutionKinds.Narrative;
    [Required, MaxLength(32)] public string TriggerType { get; set; } = "player-input";
    [Required, MaxLength(40)] public string TriggerId { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Status { get; set; } = SessionExecutionStatuses.Queued;
    [MaxLength(40)] public string? Stage { get; set; }
    public int SchemaVersion { get; set; } = 1;
    public long Revision { get; set; }
    [Required, MaxLength(160)] public string IdempotencyKey { get; set; } = string.Empty;
    [Required, MaxLength(64)] public string PayloadHash { get; set; } = string.Empty;
    [MaxLength(40)] public string? AcceptedHeadTurnId { get; set; }
    public long AcceptedSessionRevision { get; set; }
    [Required, MaxLength(32)] public string PublishPolicy { get; set; } = "required";
    public int Priority { get; set; }
    public bool IsRetryable { get; set; } = true;
    public int AttemptCount { get; set; }
    public int MaxAttempts { get; set; } = 3;
    public DateTimeOffset? NextAttemptAt { get; set; }
    [MaxLength(120)] public string? LeaseOwner { get; set; }
    [MaxLength(80)] public string? LeaseToken { get; set; }
    public DateTimeOffset? LeaseExpiresAt { get; set; }
    [MaxLength(80)] public string? ErrorCode { get; set; }
    [MaxLength(500)] public string? UserErrorMessage { get; set; }
    [MaxLength(512)] public string? TraceParent { get; set; }
    [MaxLength(40)] public string? SupersededByExecutionId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset QueuedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? CancelRequestedAt { get; set; }
    public DateTimeOffset? DismissedAt { get; set; }

    public Session Session { get; set; } = null!;
    public ICollection<SessionExecutionAttempt> Attempts { get; set; } = [];
    public ICollection<SessionArtifact> Artifacts { get; set; } = [];
}
