using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Scenarios.Domain;

public sealed class ScenarioProgressionNode
{
    [Key, MaxLength(80)]
    public ScenarioProgressionNodeId Id { get; set; }

    [Required]
    public ScenarioDefinitionVersionId DefinitionVersionId { get; set; } = new(string.Empty);

    [Required, MaxLength(80)]
    public string Code { get; set; } = string.Empty;

    public bool IsInitial { get; set; }
    public string AllowedNarrativeSignalsJson { get; set; } = "[]";

    public ScenarioDefinitionVersion DefinitionVersion { get; set; } = null!;
}
