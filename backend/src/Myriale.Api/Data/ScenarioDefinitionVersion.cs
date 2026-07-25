using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ScenarioDefinitionVersion
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string ScenarioId { get; set; } = string.Empty;
    public Scenario Scenario { get; set; } = null!;
    public int Version { get; set; }
    [MaxLength(20)] public string Status { get; set; } = "draft";
    public int SchemaVersion { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public ICollection<ScenarioLocation> Locations { get; set; } = [];
    public ICollection<ScenarioObjectType> ObjectTypes { get; set; } = [];
    public ICollection<ScenarioObject> Objects { get; set; } = [];
}

public sealed class ScenarioLocation
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string DefinitionVersionId { get; set; } = string.Empty;
    public ScenarioDefinitionVersion DefinitionVersion { get; set; } = null!;
    [MaxLength(80)] public string Code { get; set; } = string.Empty;
    [MaxLength(160)] public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AuthoringDataJson { get; set; } = "{}";
}

public sealed class ScenarioObjectType
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string DefinitionVersionId { get; set; } = string.Empty;
    public ScenarioDefinitionVersion DefinitionVersion { get; set; } = null!;
    [MaxLength(80)] public string Code { get; set; } = string.Empty;
    [MaxLength(160)] public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SchemaVersion { get; set; } = 1;
    public string StateSchemaJson { get; set; } = "{}";
    public string DefaultStateJson { get; set; } = "{}";
    public string PublicProjectionJson { get; set; } = "{}";
    public ICollection<ScenarioObjectTypeAction> Actions { get; set; } = [];
}

public sealed class ScenarioObjectTypeAction
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string ObjectTypeId { get; set; } = string.Empty;
    public ScenarioObjectType ObjectType { get; set; } = null!;
    [MaxLength(80)] public string Code { get; set; } = string.Empty;
    [MaxLength(160)] public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ArgumentSchemaJson { get; set; } = "{}";
    public string AvailabilityConditionJson { get; set; } = "{}";
    [MaxLength(20)] public string Visibility { get; set; } = "ai-choice";
    [MaxLength(20)] public string ExecutionMode { get; set; } = "rule";
}

public sealed class ScenarioObject
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string DefinitionVersionId { get; set; } = string.Empty;
    public ScenarioDefinitionVersion DefinitionVersion { get; set; } = null!;
    [MaxLength(80)] public string Code { get; set; } = string.Empty;
    [MaxLength(160)] public string Name { get; set; } = string.Empty;
    [Required] public string ObjectTypeId { get; set; } = string.Empty;
    public ScenarioObjectType ObjectType { get; set; } = null!;
    [Required] public string LocationId { get; set; } = string.Empty;
    public ScenarioLocation Location { get; set; } = null!;
    public string InitialStateOverrideJson { get; set; } = "{}";
    public bool IsGlobal { get; set; }
    public ICollection<ScenarioObjectActionRule> ActionRules { get; set; } = [];
}

public sealed class ScenarioObjectActionRule
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string ObjectId { get; set; } = string.Empty;
    public ScenarioObject Object { get; set; } = null!;
    [Required] public string ObjectTypeActionId { get; set; } = string.Empty;
    public ScenarioObjectTypeAction ObjectTypeAction { get; set; } = null!;
    public string ConditionJson { get; set; } = "{}";
    public int Priority { get; set; }
    public string AuthoringNote { get; set; } = string.Empty;
    public string EffectsJson { get; set; } = "[]";
    [MaxLength(160)] public string? ModuleId { get; set; }
    [MaxLength(40)] public string? ModuleVersion { get; set; }
    [MaxLength(128)] public string? ModuleDigest { get; set; }
    public string? ModuleConfigurationJson { get; set; }
}
