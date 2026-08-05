using Myriale.Api.Architecture;

using System.Text.Json;


namespace Myriale.Api.Features.ScenarioTurns.Contracts;

[CrossSliceContract]
public static class ScenarioTurnSchemas
{
    public const int Execution = 1;
    public const string ActionSnapshot = "rule-action-snapshot.v1";
    public const string ActionDecision = "rule-action-decision.v1";
    public const string ModelActionDecisionRequest = "model-action-decision-request.v3";
    public const string ModelActionDecisionResult = "model-action-decision-result.v3";
    public const string ModelActionDecisionPrompt = "model-action-decision-prompt.v3";
    public const string ActionStep = "rule-action-step.v1";
    public const string PostStateNarrative = "post-state-narrative.v1";
    public const string NarrativeContext = "post-state-context.v1";
    public const string NarrativePrompt = "post-state-prompt.v1";
}

[CrossSliceContract]
public sealed record RulePublicLocation(ScenarioLocationId Id, string Code, string Name, string Description);
[CrossSliceContract]
public sealed record RulePublicObject(ScenarioObjectId Id, string Code, string Name, ScenarioLocationId LocationId, bool IsGlobal, long Revision, JsonElement State);
[CrossSliceContract]
public sealed record RulePublicAction(ScenarioObjectId ObjectId, ScenarioObjectTypeActionId ActionId, string Code, string Label, string Description, JsonElement ArgumentSchema, bool Enabled);
[CrossSliceContract]
public sealed record RuleActionSnapshot(string SchemaVersion, string SnapshotId, RulePublicLocation CurrentLocation, IReadOnlyList<RulePublicObject> Objects, IReadOnlyList<RulePublicAction> Actions);
[CrossSliceContract]
public sealed record ModelActionDecisionLocation(string Code, string Name, string Description);
[CrossSliceContract]
public sealed record ModelActionDecisionVisibleObject(string Code, string Name, string Scope, JsonElement PublicState);
[CrossSliceContract]
public sealed record ModelActionDecisionScene(ModelActionDecisionLocation CurrentLocation, IReadOnlyList<ModelActionDecisionVisibleObject> VisibleObjects);
[CrossSliceContract]
public sealed record ModelActionDecisionCandidate(string SelectionCode, string ActionCode, string Label, string Description, JsonElement ArgumentSchema);
[CrossSliceContract]
public sealed record ModelObjectActions(string ObjectCode, string ObjectName, IReadOnlyList<ModelActionDecisionCandidate> Actions);
[CrossSliceContract]
public sealed record ModelActionDecisionRequest(string SchemaVersion, string PlayerInput, ModelActionDecisionScene Scene, IReadOnlyList<ModelObjectActions> ObjectActions, IReadOnlyList<ModelActionDecisionCandidate> SystemActions);
[CrossSliceContract]
public sealed record ModelActionDecisionResult(string SchemaVersion, string SelectionCode, JsonElement Arguments);
[CrossSliceContract]
public sealed record ModelActionDecisionPromptAudit(string PromptVersion, string SystemPrompt, ModelActionDecisionRequest ModelRequest, string ResponseSchemaVersion);

[CrossSliceContract]
public sealed record RuleActionDecisionRequest(string SchemaVersion, string PlayerInput, RuleActionSnapshot Snapshot);
[CrossSliceContract]
public sealed record RuleActionDecisionResult(string SchemaVersion, ScenarioObjectId ObjectId, ScenarioObjectTypeActionId ActionId, JsonElement Arguments);
[CrossSliceContract]
public sealed record RuleAppliedEffect(string Type, string? TargetId, string? Path, JsonElement? Value);
[CrossSliceContract]
public sealed record RulePostState(string SchemaVersion, RulePublicLocation CurrentLocation, IReadOnlyList<RulePublicObject> Objects, IReadOnlyDictionary<string, bool> SessionFlags, long SessionStateRevision);
[CrossSliceContract]
public sealed record PostStateNarrativeRequest(string SchemaVersion, NarrativeScenarioInput Scenario, string PlayerInput, RulePublicObject SelectedObject, RulePublicAction SelectedAction, RulePostState PostState, IReadOnlyList<string> Facts, IReadOnlyList<JsonElement> Events, IReadOnlyList<string> NarrativeHints, IReadOnlyList<string> ForbiddenNarrativeFacts);
[CrossSliceContract]
public sealed record PostStateNarrativeResult(string SchemaVersion, string Heading, string Body);

[CrossSliceContract]
public sealed record SessionObjectStateResponse(ScenarioObjectId ObjectId, string Code, string Name, ScenarioLocationId LocationId, bool IsGlobal, long Revision, JsonElement State);
[CrossSliceContract]
public sealed record ScenarioExtensionResult(
    SessionExecutionId ExecutionId,
    string Status,
    long Revision,
    IReadOnlyList<Myriale.ModuleSdk.ModuleAvailableAction> AvailableActions,
    IReadOnlyList<RuleAppliedEffect> Effects,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts,
    JsonElement PublicState);

[CrossSliceContract]
public sealed record SessionRuleActionStepResponse(
    SessionRuleActionStepId Id,
    SessionExecutionId ExecutionId,
    string Stage,
    string SchemaVersion,
    RuleActionSnapshot? ActionSnapshot,
    RuleActionDecisionResult? Decision,
    RulePostState? PostState,
    ScenarioExtensionResult? Extension,
    DateTimeOffset? AppliedAt,
    DateTimeOffset? NarrativePublishedAt);

[CrossSliceContract]
public sealed record SessionScenarioTurnSelectedActionResponse(
    ScenarioObjectId ObjectId,
    ScenarioObjectTypeActionId ActionId,
    string? ObjectCode,
    string? ObjectLabel,
    string? ActionCode,
    string? ActionLabel,
    JsonElement? Arguments);

[CrossSliceContract]
public sealed record SessionScenarioTurnPostStateResponse(
    long Revision,
    RulePublicLocation CurrentLocation,
    IReadOnlyList<RulePublicObject> Objects,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> Hints,
    IReadOnlyList<RuleAppliedEffect> AppliedEffects);

[CrossSliceContract]
public sealed record SessionScenarioTurnProjectionResponse(
    string SchemaVersion,
    string Stage,
    RulePublicLocation? CurrentLocation,
    IReadOnlyList<RulePublicObject> Objects,
    IReadOnlyList<RulePublicAction> AvailableActions,
    SessionScenarioTurnSelectedActionResponse? SelectedAction,
    SessionScenarioTurnPostStateResponse? PostState);
