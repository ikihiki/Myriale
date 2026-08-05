using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.ProgressionRuntime.Domain;

public sealed class SessionProgressionModuleSnapshot
{
    [Key, MaxLength(40)]
    public SessionProgressionModuleSnapshotId Id { get; set; }

    [Required, MaxLength(40)]
    public SessionId SessionId { get; set; }

    [Required, MaxLength(80)]
    public ScenarioProgressionTransitionId TransitionId { get; set; }

    [Required, MaxLength(160)]
    public ModulePackageModuleId ModuleId { get; set; }

    [Required, MaxLength(80)]
    public ModulePackageVersion ModuleVersion { get; set; }

    [Required, MaxLength(64)]
    public ModulePackageDigest ModuleDigest { get; set; }

    public string ConfigurationJson { get; set; } = "{}";
    public string ContextJson { get; set; } = "{}";
    public int RandomValueCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

}
