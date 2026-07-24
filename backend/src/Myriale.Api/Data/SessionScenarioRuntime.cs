using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public static class ScenarioTurnStages
{
    public const string LoadingWorld = "loading-world";
    public const string EnumeratingActions = "enumerating-actions";
    public const string SelectingAction = "selecting-action";
    public const string ApplyingRules = "applying-rules";
    public const string RunningExtension = "running-extension";
    public const string GeneratingNarrative = "generating-narrative";
    public const string Completed = "completed";
    public const string Failed = "failed";
}

public sealed class SessionObjectState
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required] public string ScenarioObjectId { get; set; } = string.Empty;
    [Required] public string LocationId { get; set; } = string.Empty;
    [Required] public string StateJson { get; set; } = "{}";
    public long Revision { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Session Session { get; set; } = null!;
    public ScenarioObject ScenarioObject { get; set; } = null!;
    public ScenarioLocation Location { get; set; } = null!;
}

public sealed class SessionRuleActionStep
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string ExecutionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string PlayerInputId { get; set; } = string.Empty;
    [Required] public string ScenarioDefinitionVersionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string Stage { get; set; } = ScenarioTurnStages.LoadingWorld;
    public int SchemaVersion { get; set; } = 1;
    public long PreSessionRevision { get; set; }
    public long? PostSessionRevision { get; set; }
    [Required] public string ObjectRevisionsJson { get; set; } = "{}";
    [Required] public string ActionSnapshotJson { get; set; } = "{}";
    public string? DecisionJson { get; set; }
    public string? SelectedRuleId { get; set; }
    public string? AppliedEffectsJson { get; set; }
    public string? PublicPostStateJson { get; set; }
    public string? FactsJson { get; set; }
    public string? EventsJson { get; set; }
    public string? NarrativeHintsJson { get; set; }
    public string? ForbiddenNarrativeFactsJson { get; set; }
    public string? ExtensionReceiptJson { get; set; }
    public DateTimeOffset? EnumeratedAt { get; set; }
    public DateTimeOffset? SelectedAt { get; set; }
    public DateTimeOffset? AppliedAt { get; set; }
    public DateTimeOffset? NarrativePublishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Session Session { get; set; } = null!;
    public SessionExecution Execution { get; set; } = null!;
    public SessionPlayerInput PlayerInput { get; set; } = null!;
}
