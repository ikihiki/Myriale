using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionProgressionModuleSnapshot
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string TransitionId { get; set; } = string.Empty;

    [Required, MaxLength(160)]
    public string ModuleId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string ModuleVersion { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string ModuleDigest { get; set; } = string.Empty;

    public string ConfigurationJson { get; set; } = "{}";
    public string ContextJson { get; set; } = "{}";
    public int RandomValueCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public ScenarioProgressionTransition Transition { get; set; } = null!;
}
