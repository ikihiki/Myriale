using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionState
{
    [Key, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    public long Revision { get; set; }

    [Required]
    public string FlagsJson { get; set; } = "{}";

    public DateTimeOffset UpdatedAt { get; set; }

    public Session Session { get; set; } = null!;
}
