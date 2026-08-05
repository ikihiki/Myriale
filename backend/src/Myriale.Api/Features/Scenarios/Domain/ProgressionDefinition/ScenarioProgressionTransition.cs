using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Scenarios.Domain;

public sealed class ScenarioProgressionTransition
{
    [Key, MaxLength(80)]
    public ScenarioProgressionTransitionId Id { get; set; }

    [Required]
    public ScenarioDefinitionVersionId DefinitionVersionId { get; set; } = new(string.Empty);

    [Required, MaxLength(80)]
    public ScenarioProgressionNodeId SourceNodeId { get; set; } = new(string.Empty);

    [Required, MaxLength(80)]
    public string SignalCode { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string TriggerDescription { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public ScenarioProgressionNodeId TargetNodeId { get; set; } = new(string.Empty);

    [MaxLength(160)]
    public ModulePackageModuleId? ModuleId { get; set; }

    [MaxLength(80)]
    public string? ModuleVersion { get; set; }

    [MaxLength(64)]
    public string? ModuleDigest { get; set; }

    public string? ModuleConfigurationJson { get; set; }
    public string? ModuleContextJson { get; set; }
    public int ModuleRandomValueCount { get; set; }

    public ScenarioDefinitionVersion DefinitionVersion { get; set; } = null!;
    public ScenarioProgressionNode SourceNode { get; set; } = null!;
    public ScenarioProgressionNode TargetNode { get; set; } = null!;
}
