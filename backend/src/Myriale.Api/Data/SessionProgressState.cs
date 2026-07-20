using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionProgressState
{
    [Key, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string CurrentNodeId { get; set; } = string.Empty;

    public long Revision { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public ScenarioProgressionNode CurrentNode { get; set; } = null!;
}
