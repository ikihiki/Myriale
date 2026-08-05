using System.ComponentModel.DataAnnotations;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.Scenarios.Domain;

public sealed class ScenarioDefinitionVersion : IHasDomainEvents
{
    private readonly List<IDomainEvent> _domainEvents = [];
    internal ScenarioDefinitionVersion() { }

    [Key] public string Id { get; internal set; } = string.Empty;
    [Required] public string ScenarioId { get; internal set; } = string.Empty;
    public Scenario Scenario { get; internal set; } = null!;
    public int Version { get; internal set; }
    [MaxLength(20)] public DefinitionStatus Status { get; internal set; } = DefinitionStatus.Draft;
    public int SchemaVersion { get; internal set; } = 2;
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public DateTimeOffset? PublishedAt { get; internal set; }
    public int Revision { get; internal set; }
    [Required, MaxLength(80)] public string StartLocationCode { get; internal set; } = string.Empty;
    public ScenarioTitle ScenarioTitle { get; internal set; } = new("Untitled");
    [MaxLength(2000)] public string ScenarioSummary { get; internal set; } = string.Empty;
    [MaxLength(80)] public string ScenarioGenre { get; internal set; } = string.Empty;
    [MaxLength(120)] public string ScenarioTone { get; internal set; } = string.Empty;
    public string ScenarioLore { get; internal set; } = string.Empty;
    [MaxLength(120)] public string ScenarioAiFreedom { get; internal set; } = string.Empty;
    [MaxLength(20)] public HeroMode ScenarioHeroMode { get; internal set; } = HeroMode.Free;
    public bool ScenarioHeroFreeGenerationAllowed { get; internal set; }
    public string ScenarioHero { get; internal set; } = string.Empty;
    public string ScenarioOpening { get; internal set; } = string.Empty;
    [MaxLength(240)] public IllustrationPrompt ScenarioIllustrationStyle { get; internal set; } = new("");
    [MaxLength(240)] public IllustrationPrompt ScenarioIllustrationMood { get; internal set; } = new("");
    public IllustrationPrompt ScenarioIllustrationNegative { get; internal set; } = new("");
    public string ScenarioSampleScene { get; internal set; } = string.Empty;
    public ICollection<ScenarioProgressionNode> ProgressionNodes { get; set; } = [];
    public ICollection<ScenarioProgressionTransition> ProgressionTransitions { get; set; } = [];
    public ICollection<ScenarioLocation> Locations { get; set; } = [];
    public ICollection<ScenarioObjectType> ObjectTypes { get; set; } = [];
    public ICollection<ScenarioObject> Objects { get; set; } = [];

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents;

    public static ScenarioDefinitionVersion CreateDraft(string id, string scenarioId, int version, DateTimeOffset now) => new()
    {
        Id = id,
        ScenarioId = scenarioId,
        Version = version,
        Status = DefinitionStatus.Draft,
        SchemaVersion = 2,
        CreatedAt = now,
        UpdatedAt = now,
    };

    public void ReplaceAuthoringHeader(int schemaVersion, string startLocationCode, DateTimeOffset now)
    {
        EnsureDraft();
        SchemaVersion = schemaVersion;
        StartLocationCode = startLocationCode;
        UpdatedAt = now;
        Revision++;
    }

    public IReadOnlyList<IDomainEvent> DequeueDomainEvents()
    {
        var events = _domainEvents.ToArray();
        _domainEvents.Clear();
        return events;
    }

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
        EnsureDraft();
        Status = DefinitionStatus.Published;
        PublishedAt = UpdatedAt = now;
        Revision++;
        _domainEvents.Add(new ScenarioDefinitionPublished(ScenarioId, Id, Version, now));
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
