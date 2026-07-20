using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionPlayerInputWork
{
    [Key, MaxLength(40)]
    public string PlayerInputId { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Status { get; set; } = "pending";

    public long Revision { get; set; }
    public int AttemptCount { get; set; }

    [MaxLength(40)]
    public string? LeaseId { get; set; }

    public DateTimeOffset? LeaseExpiresAt { get; set; }
    public bool IsRetryable { get; set; } = true;
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public SessionPlayerInput PlayerInput { get; set; } = null!;
}
