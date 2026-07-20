using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ScenarioProgressionNode
{
    [Key, MaxLength(80)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string ScenarioId { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string Code { get; set; } = string.Empty;

    public bool IsInitial { get; set; }
    public string AllowedNarrativeSignalsJson { get; set; } = "[]";

    public Scenario Scenario { get; set; } = null!;
}
