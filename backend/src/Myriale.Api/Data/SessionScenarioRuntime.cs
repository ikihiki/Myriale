using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public enum ScenarioTurnStage
{
    Snapshot,
    Decision,
    Resolution,
    Extension,
    EffectCommit,
    NarrativePublish,
    Completed,
    Failed,
}

public static class ScenarioTurnStageValues
{
    public static string ToWireValue(this ScenarioTurnStage value) => value switch
    {
        ScenarioTurnStage.Snapshot => "snapshot",
        ScenarioTurnStage.Decision => "decision",
        ScenarioTurnStage.Resolution => "resolution",
        ScenarioTurnStage.Extension => "extension",
        ScenarioTurnStage.EffectCommit => "effect-commit",
        ScenarioTurnStage.NarrativePublish => "narrative-publish",
        ScenarioTurnStage.Completed => "completed",
        ScenarioTurnStage.Failed => "failed",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static ScenarioTurnStage Parse(string value) => value switch
    {
        "snapshot" => ScenarioTurnStage.Snapshot,
        "decision" => ScenarioTurnStage.Decision,
        "resolution" => ScenarioTurnStage.Resolution,
        "extension" => ScenarioTurnStage.Extension,
        "effect-commit" => ScenarioTurnStage.EffectCommit,
        "narrative-publish" => ScenarioTurnStage.NarrativePublish,
        "completed" => ScenarioTurnStage.Completed,
        "failed" => ScenarioTurnStage.Failed,
        _ => throw new InvalidOperationException($"Unknown scenario turn stage '{value}'."),
    };
}

public sealed class SessionObjectState
{
    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [Required] public string ScenarioObjectId { get; internal set; } = string.Empty;
    [Required] public string LocationId { get; internal set; } = string.Empty;
    [Required] public string StateJson { get; internal set; } = "{}";
    public long Revision { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;
    public ScenarioObject ScenarioObject { get; internal set; } = null!;
    public ScenarioLocation Location { get; internal set; } = null!;

    public static SessionObjectState Create(
        string id, string sessionId, string scenarioObjectId, string locationId,
        string stateJson, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(sessionId)
            || string.IsNullOrWhiteSpace(scenarioObjectId) || string.IsNullOrWhiteSpace(locationId))
            throw new ArgumentException("Object state identity, session, object, and location are required.");
        _ = System.Text.Json.JsonDocument.Parse(stateJson);
        return new SessionObjectState
        {
            Id = id,
            SessionId = sessionId,
            ScenarioObjectId = scenarioObjectId,
            LocationId = locationId,
            StateJson = stateJson,
            Revision = 0,
            UpdatedAt = now,
        };
    }

    public void Apply(string stateJson, string locationId, long expectedRevision, DateTimeOffset now)
    {
        if (Revision != expectedRevision)
            throw new ScenarioRuntimeRevisionConflictException(ScenarioObjectId, expectedRevision, Revision);
        if (string.IsNullOrWhiteSpace(locationId)) throw new ArgumentException("Location is required.", nameof(locationId));
        _ = System.Text.Json.JsonDocument.Parse(stateJson);
        StateJson = stateJson;
        LocationId = locationId;
        Revision++;
        UpdatedAt = now;
    }
}

public sealed class SessionRuleActionStep
{
    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string ExecutionId { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string PlayerInputId { get; internal set; } = string.Empty;
    [Required] public string ScenarioDefinitionVersionId { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public ScenarioTurnStage Stage { get; internal set; } = ScenarioTurnStage.Snapshot;
    public int SchemaVersion { get; internal set; } = 1;
    public long PreSessionRevision { get; internal set; }
    public long? PostSessionRevision { get; internal set; }
    [Required] public string ObjectRevisionsJson { get; internal set; } = "{}";
    [Required] public string ActionSnapshotJson { get; internal set; } = "{}";
    public string? DecisionJson { get; internal set; }
    public string? SelectedRuleId { get; internal set; }
    public string? ResolutionPlanJson { get; internal set; }
    public string? AppliedEffectsJson { get; internal set; }
    public string? PublicPostStateJson { get; internal set; }
    public string? FactsJson { get; internal set; }
    public string? EventsJson { get; internal set; }
    public string? NarrativeHintsJson { get; internal set; }
    public string? ForbiddenNarrativeFactsJson { get; internal set; }
    public string? ExtensionReceiptJson { get; internal set; }
    public DateTimeOffset? EnumeratedAt { get; internal set; }
    public DateTimeOffset? SelectedAt { get; internal set; }
    public DateTimeOffset? ResolvedAt { get; internal set; }
    public DateTimeOffset? ExtensionCompletedAt { get; internal set; }
    public DateTimeOffset? AppliedAt { get; internal set; }
    public DateTimeOffset? NarrativePublishedAt { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;
    public SessionExecution Execution { get; internal set; } = null!;
    public SessionPlayerInput PlayerInput { get; internal set; } = null!;

    public static SessionRuleActionStep CreateSnapshot(
        string id, string sessionId, string executionId, string playerInputId,
        string definitionVersionId, long preSessionRevision, string objectRevisionsJson,
        string actionSnapshotJson, DateTimeOffset now, DateTimeOffset? startedAt = null)
    {
        if (new[] { id, sessionId, executionId, playerInputId, definitionVersionId, objectRevisionsJson, actionSnapshotJson }
            .Any(string.IsNullOrWhiteSpace))
            throw new ArgumentException("Scenario action snapshot fields are required.");
        return new SessionRuleActionStep
        {
            Id = id,
            SessionId = sessionId,
            ExecutionId = executionId,
            PlayerInputId = playerInputId,
            ScenarioDefinitionVersionId = definitionVersionId,
            Stage = ScenarioTurnStage.Decision,
            PreSessionRevision = preSessionRevision,
            ObjectRevisionsJson = objectRevisionsJson,
            ActionSnapshotJson = actionSnapshotJson,
            EnumeratedAt = now,
            CreatedAt = startedAt ?? now,
            UpdatedAt = now,
        };
    }

    public bool RecordDecision(string decisionJson, DateTimeOffset now)
    {
        if (DecisionJson is not null) return false;
        EnsureStage(ScenarioTurnStage.Decision);
        DecisionJson = Required(decisionJson, nameof(decisionJson));
        SelectedAt = now;
        Stage = ScenarioTurnStage.Resolution;
        UpdatedAt = now;
        return true;
    }

    public bool RecordResolution(string? selectedRuleId, string resolutionPlanJson, bool requiresExtension, DateTimeOffset now)
    {
        if (ResolutionPlanJson is not null) return false;
        EnsureStage(ScenarioTurnStage.Resolution);
        SelectedRuleId = selectedRuleId;
        ResolutionPlanJson = Required(resolutionPlanJson, nameof(resolutionPlanJson));
        ResolvedAt = now;
        Stage = requiresExtension ? ScenarioTurnStage.Extension : ScenarioTurnStage.EffectCommit;
        UpdatedAt = now;
        return true;
    }

    public bool CompleteExtension(string receiptJson, DateTimeOffset now)
    {
        if (ExtensionReceiptJson is not null) return false;
        EnsureStage(ScenarioTurnStage.Extension);
        ExtensionReceiptJson = Required(receiptJson, nameof(receiptJson));
        ExtensionCompletedAt = now;
        Stage = ScenarioTurnStage.EffectCommit;
        UpdatedAt = now;
        return true;
    }

    public bool CommitEffects(
        long expectedPreSessionRevision, long postSessionRevision, string appliedEffectsJson,
        string publicPostStateJson, string factsJson, string eventsJson,
        string narrativeHintsJson, string forbiddenNarrativeFactsJson, DateTimeOffset now)
    {
        if (AppliedAt is not null) return false;
        EnsureStage(ScenarioTurnStage.EffectCommit);
        if (PreSessionRevision != expectedPreSessionRevision)
            throw new ScenarioRuntimeRevisionConflictException(SessionId, expectedPreSessionRevision, PreSessionRevision);
        if (postSessionRevision <= expectedPreSessionRevision)
            throw new ArgumentOutOfRangeException(nameof(postSessionRevision));
        PostSessionRevision = postSessionRevision;
        AppliedEffectsJson = Required(appliedEffectsJson, nameof(appliedEffectsJson));
        PublicPostStateJson = Required(publicPostStateJson, nameof(publicPostStateJson));
        FactsJson = Required(factsJson, nameof(factsJson));
        EventsJson = Required(eventsJson, nameof(eventsJson));
        NarrativeHintsJson = Required(narrativeHintsJson, nameof(narrativeHintsJson));
        ForbiddenNarrativeFactsJson = Required(forbiddenNarrativeFactsJson, nameof(forbiddenNarrativeFactsJson));
        AppliedAt = now;
        Stage = ScenarioTurnStage.NarrativePublish;
        UpdatedAt = now;
        return true;
    }

    public bool PublishNarrative(DateTimeOffset now)
    {
        if (NarrativePublishedAt is not null) return false;
        EnsureStage(ScenarioTurnStage.NarrativePublish);
        if (AppliedAt is null || PostSessionRevision is null)
            throw new InvalidOperationException("Effects must be committed before narrative publication.");
        NarrativePublishedAt = now;
        Stage = ScenarioTurnStage.Completed;
        UpdatedAt = now;
        return true;
    }

    private void EnsureStage(ScenarioTurnStage expected)
    {
        if (Stage != expected) throw new InvalidOperationException($"Invalid scenario turn transition: {Stage} -> {expected}.");
    }

    private static string Required(string value, string name) =>
        !string.IsNullOrWhiteSpace(value) ? value : throw new ArgumentException("Value is required.", name);
}

public sealed class ScenarioRuntimeRevisionConflictException(string targetId, long expected, long actual)
    : Exception($"Scenario runtime revision conflict for '{targetId}'. Expected {expected}, actual {actual}.")
{
    public string TargetId { get; } = targetId;
    public long ExpectedRevision { get; } = expected;
    public long ActualRevision { get; } = actual;
}
