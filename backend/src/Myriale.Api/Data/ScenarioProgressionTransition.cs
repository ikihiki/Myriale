using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ScenarioProgressionTransition
{
    [Key, MaxLength(80)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string SourceNodeId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string SignalCode { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string TriggerDescription { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string TargetNodeId { get; set; } = string.Empty;

    [MaxLength(160)]
    public string? ModuleId { get; set; }

    [MaxLength(80)]
    public string? ModuleVersion { get; set; }

    [MaxLength(64)]
    public string? ModuleDigest { get; set; }

    public string? ModuleConfigurationJson { get; set; }
    public string? ModuleContextJson { get; set; }
    public int ModuleRandomValueCount { get; set; }

    public ScenarioProgressionNode SourceNode { get; set; } = null!;
    public ScenarioProgressionNode TargetNode { get; set; } = null!;
}
