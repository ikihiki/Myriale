using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionProgressionTransitionReceipt
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SourceSignalId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string TransitionId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string FromNodeId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string ToNodeId { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Status { get; set; } = "pending";

    [MaxLength(160)]
    public string? ModuleId { get; set; }

    [MaxLength(80)]
    public string? ModuleVersion { get; set; }

    [MaxLength(64)]
    public string? ModuleDigest { get; set; }

    public string? ModuleConfigurationJson { get; set; }
    public string? ModuleContextJson { get; set; }
    public int ModuleRandomValueCount { get; set; }

    [MaxLength(40)]
    public string? ModuleTurnId { get; set; }

    public long Revision { get; set; }
    public int AttemptCount { get; set; }

    [MaxLength(40)]
    public string? LeaseId { get; set; }

    public DateTimeOffset? LeaseExpiresAt { get; set; }
    public bool IsRetryable { get; set; } = true;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public Session Session { get; set; } = null!;
    public SessionNarrativeSignal SourceSignal { get; set; } = null!;
    public ScenarioProgressionTransition Transition { get; set; } = null!;
    public SessionTurn? ModuleTurn { get; set; }
}
