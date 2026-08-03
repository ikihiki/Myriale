using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ScenarioDefinitionVersion
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string ScenarioId { get; set; } = string.Empty;
    public Scenario Scenario { get; set; } = null!;
    public int Version { get; set; }
    [MaxLength(20)] public DefinitionStatus Status { get; set; } = DefinitionStatus.Draft;
    public int SchemaVersion { get; set; } = 2;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    [Required, MaxLength(80)] public string StartLocationCode { get; set; } = string.Empty;
    public ScenarioTitle ScenarioTitle { get; set; } = new("Untitled");
    [MaxLength(2000)] public string ScenarioSummary { get; set; } = string.Empty;
    [MaxLength(80)] public string ScenarioGenre { get; set; } = string.Empty;
    [MaxLength(120)] public string ScenarioTone { get; set; } = string.Empty;
    public string ScenarioLore { get; set; } = string.Empty;
    [MaxLength(120)] public string ScenarioAiFreedom { get; set; } = string.Empty;
    [MaxLength(20)] public HeroMode ScenarioHeroMode { get; set; } = HeroMode.Free;
    public bool ScenarioHeroFreeGenerationAllowed { get; set; }
    public string ScenarioHero { get; set; } = string.Empty;
    public string ScenarioOpening { get; set; } = string.Empty;
    [MaxLength(240)] public IllustrationPrompt ScenarioIllustrationStyle { get; set; } = new("");
    [MaxLength(240)] public IllustrationPrompt ScenarioIllustrationMood { get; set; } = new("");
    public IllustrationPrompt ScenarioIllustrationNegative { get; set; } = new("");
    public string ScenarioSampleScene { get; set; } = string.Empty;
    public ICollection<ScenarioProgressionNode> ProgressionNodes { get; set; } = [];
    public ICollection<ScenarioProgressionTransition> ProgressionTransitions { get; set; } = [];
    public ICollection<ScenarioLocation> Locations { get; set; } = [];
    public ICollection<ScenarioObjectType> ObjectTypes { get; set; } = [];
    public ICollection<ScenarioObject> Objects { get; set; } = [];

    public void EnsureDraft()
    {
        if (Status != DefinitionStatus.Draft) throw new InvalidOperationException("Published scenario definitions are immutable.");
    }

    public void SnapshotScenario(Scenario scenario)
    {
        EnsureDraft();
        ScenarioTitle = scenario.Title; ScenarioSummary = scenario.Summary; ScenarioGenre = scenario.Genre; ScenarioTone = scenario.Tone;
        ScenarioLore = scenario.Lore; ScenarioAiFreedom = scenario.AiFreedom; ScenarioHeroMode = scenario.HeroMode;
        ScenarioHeroFreeGenerationAllowed = scenario.HeroFreeGenerationAllowed; ScenarioHero = scenario.Hero; ScenarioOpening = scenario.Opening;
        ScenarioIllustrationStyle = scenario.IllustrationStyle; ScenarioIllustrationMood = scenario.IllustrationMood;
        ScenarioIllustrationNegative = scenario.IllustrationNegative; ScenarioSampleScene = scenario.SampleScene;
    }

    public void Publish(DateTimeOffset now)
    {
        EnsureDraft(); Status = DefinitionStatus.Published; PublishedAt = UpdatedAt = now;
    }
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
    public string GenericActionRulesJson { get; set; } = "[]";
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
    [MaxLength(20)] public ActionVisibility Visibility { get; set; } = ActionVisibility.AiChoice;
    [MaxLength(20)] public ActionExecutionMode ExecutionMode { get; set; } = ActionExecutionMode.Rule;
}

public sealed class ScenarioObject
{
    [Key] public string Id { get; set; } = string.Empty;
    [Required] public string DefinitionVersionId { get; set; } = string.Empty;
    public ScenarioDefinitionVersion DefinitionVersion { get; set; } = null!;
    [MaxLength(80)] public string Code { get; set; } = string.Empty;
    [MaxLength(160)] public string Name { get; set; } = string.Empty;
    public string ProfileMarkdown { get; set; } = string.Empty;
    [Required] public string LocationId { get; set; } = string.Empty;
    public ScenarioLocation Location { get; set; } = null!;
    public string InitialStateOverrideJson { get; set; } = "{}";
    public string MixinTypeCodesJson { get; set; } = string.Empty;
    public string LocalStateSchemaJson { get; set; } = "{}";
    public string LocalDefaultStateJson { get; set; } = "{}";
    public string LocalPublicProjectionJson { get; set; } = "{}";
    public string LocalActionsJson { get; set; } = "[]";
    public string ActionRuleMutationsJson { get; set; } = "[]";
    public bool IsGlobal { get; set; }
}
