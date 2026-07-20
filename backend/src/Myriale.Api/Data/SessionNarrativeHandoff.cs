using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionNarrativeHandoff
{
    [Key, MaxLength(40)]
    public string SourceModuleTurnId { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string ExecutionId { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    public long SourceSessionRevision { get; set; }

    [Required, MaxLength(32)]
    public string Status { get; set; } = "pending";

    public int Revision { get; set; }
    public bool IsRetryable { get; set; } = true;
    public int AttemptCount { get; set; }

    [MaxLength(40)]
    public string? LeaseId { get; set; }

    public DateTimeOffset? LeaseExpiresAt { get; set; }

    [MaxLength(80)]
    public string? LastErrorCode { get; set; }

    [MaxLength(500)]
    public string? LastErrorMessage { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public SessionTurn SourceModuleTurn { get; set; } = null!;
}
