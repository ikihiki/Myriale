using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Infrastructure.Composition.ScenarioTurns;

public enum ScenarioTurnStage
{
    Snapshot,
    Decision,
    Resolution,
    StateTransition,
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
        ScenarioTurnStage.StateTransition => "state-transition",
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
        "state-transition" => ScenarioTurnStage.StateTransition,
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
    [Key, MaxLength(40)] public SessionObjectStateId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    [Required] public ScenarioObjectId ScenarioObjectId { get; internal set; }
    [Required] public ScenarioLocationId LocationId { get; internal set; }
    [Required] public string StateJson { get; internal set; } = "{}";
    public long Revision { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public static SessionObjectState Create(
        SessionObjectStateId id, SessionId sessionId, ScenarioObjectId scenarioObjectId, ScenarioLocationId locationId,
        string stateJson, DateTimeOffset now)
    {
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

    public void Apply(string stateJson, ScenarioLocationId locationId, long expectedRevision, DateTimeOffset now)
    {
        if (Revision != expectedRevision)
            throw new ScenarioRuntimeRevisionConflictException(ScenarioObjectId.AsPrimitive(), expectedRevision, Revision);
        _ = System.Text.Json.JsonDocument.Parse(stateJson);
        StateJson = stateJson;
        LocationId = locationId;
        Revision++;
        UpdatedAt = now;
    }
}

public sealed class SessionRuleActionStep
{
    [Key, MaxLength(40)] public SessionRuleActionStepId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    [Required, MaxLength(40)] public SessionExecutionId ExecutionId { get; internal set; }
    [Required, MaxLength(40)] public SessionPlayerInputId PlayerInputId { get; internal set; }
    [Required] public ScenarioDefinitionVersionId ScenarioDefinitionVersionId { get; internal set; }
    [Required, MaxLength(40)] public ScenarioTurnStage Stage { get; internal set; } = ScenarioTurnStage.Snapshot;
    public int SchemaVersion { get; internal set; } = 1;
    public long PreSessionRevision { get; internal set; }
    public long? PostSessionRevision { get; internal set; }
    [Required] public string ObjectRevisionsJson { get; internal set; } = "{}";
    [Required] public string ActionSnapshotJson { get; internal set; } = "{}";
    public string? DecisionJson { get; internal set; }
    public string? SelectedRuleId { get; internal set; }
    public string? ResolutionPlanJson { get; internal set; }
    public string? EntityStateTransitionJson { get; internal set; }
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
    public static SessionRuleActionStep CreateSnapshot(
        SessionRuleActionStepId id, SessionId sessionId, SessionExecutionId executionId, SessionPlayerInputId playerInputId,
        ScenarioDefinitionVersionId definitionVersionId, long preSessionRevision, string objectRevisionsJson,
        string actionSnapshotJson, DateTimeOffset now, DateTimeOffset? startedAt = null)
    {
        if (string.IsNullOrWhiteSpace(objectRevisionsJson) || string.IsNullOrWhiteSpace(actionSnapshotJson))
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
        Stage = ScenarioTurnStage.StateTransition;
        UpdatedAt = now;
        return true;
    }

    public bool RecordStateTransition(string transitionJson, string resolutionPlanJson, bool requiresExtension, DateTimeOffset now)
    {
        if (EntityStateTransitionJson is not null) return false;
        EnsureStage(ScenarioTurnStage.StateTransition);
        EntityStateTransitionJson = Required(transitionJson, nameof(transitionJson));
        ResolutionPlanJson = Required(resolutionPlanJson, nameof(resolutionPlanJson));
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
            throw new ScenarioRuntimeRevisionConflictException(SessionId.AsPrimitive(), expectedPreSessionRevision, PreSessionRevision);
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
