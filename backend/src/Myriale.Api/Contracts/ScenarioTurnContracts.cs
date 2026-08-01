using System.Text.Json;

using Myriale.Api.Services;

namespace Myriale.Api.Contracts;

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

public sealed record RulePublicLocation(string Id, string Code, string Name, string Description);
public sealed record RulePublicObject(string Id, string Code, string Name, string LocationId, bool IsGlobal, long Revision, JsonElement State);
public sealed record RulePublicAction(string ObjectId, string ActionId, string Code, string Label, string Description, JsonElement ArgumentSchema, bool Enabled);
public sealed record RuleActionSnapshot(string SchemaVersion, string SnapshotId, RulePublicLocation CurrentLocation, IReadOnlyList<RulePublicObject> Objects, IReadOnlyList<RulePublicAction> Actions);
public sealed record ModelActionDecisionLocation(string Code, string Name, string Description);
public sealed record ModelActionDecisionVisibleObject(string Code, string Name, string Scope, JsonElement PublicState);
public sealed record ModelActionDecisionScene(ModelActionDecisionLocation CurrentLocation, IReadOnlyList<ModelActionDecisionVisibleObject> VisibleObjects);
public sealed record ModelActionDecisionCandidate(string SelectionCode, string ActionCode, string Label, string Description, JsonElement ArgumentSchema);
public sealed record ModelObjectActions(string ObjectCode, string ObjectName, IReadOnlyList<ModelActionDecisionCandidate> Actions);
public sealed record ModelActionDecisionRequest(string SchemaVersion, string PlayerInput, ModelActionDecisionScene Scene, IReadOnlyList<ModelObjectActions> ObjectActions, IReadOnlyList<ModelActionDecisionCandidate> SystemActions);
public sealed record ModelActionDecisionResult(string SchemaVersion, string SelectionCode, JsonElement Arguments);
public sealed record ModelActionDecisionPromptAudit(string PromptVersion, string SystemPrompt, ModelActionDecisionRequest ModelRequest, string ResponseSchemaVersion);

public sealed record RuleActionDecisionRequest(string SchemaVersion, string PlayerInput, RuleActionSnapshot Snapshot);
public sealed record RuleActionDecisionResult(string SchemaVersion, string ObjectId, string ActionId, JsonElement Arguments);
public sealed record RuleAppliedEffect(string Type, string? TargetId, string? Path, JsonElement? Value);
public sealed record RulePostState(string SchemaVersion, RulePublicLocation CurrentLocation, IReadOnlyList<RulePublicObject> Objects, IReadOnlyDictionary<string, bool> SessionFlags, long SessionStateRevision);
public sealed record PostStateNarrativeRequest(string SchemaVersion, NarrativeScenarioInput Scenario, string PlayerInput, RulePublicObject SelectedObject, RulePublicAction SelectedAction, RulePostState PostState, IReadOnlyList<string> Facts, IReadOnlyList<JsonElement> Events, IReadOnlyList<string> NarrativeHints, IReadOnlyList<string> ForbiddenNarrativeFacts);
public sealed record PostStateNarrativeResult(string SchemaVersion, string Heading, string Body);

public sealed record SessionObjectStateResponse(string ObjectId, string Code, string Name, string LocationId, bool IsGlobal, long Revision, JsonElement State);
public sealed record SessionRuleActionStepResponse(
    string Id,
    string ExecutionId,
    string Stage,
    string SchemaVersion,
    RuleActionSnapshot? ActionSnapshot,
    RuleActionDecisionResult? Decision,
    RulePostState? PostState,
    ScenarioExtensionResult? Extension,
    DateTimeOffset? AppliedAt,
    DateTimeOffset? NarrativePublishedAt);

public sealed record SessionScenarioTurnSelectedActionResponse(
    string ObjectId,
    string ActionId,
    string? ObjectCode,
    string? ObjectLabel,
    string? ActionCode,
    string? ActionLabel,
    JsonElement? Arguments);

public sealed record SessionScenarioTurnPostStateResponse(
    long Revision,
    RulePublicLocation CurrentLocation,
    IReadOnlyList<RulePublicObject> Objects,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> Hints,
    IReadOnlyList<RuleAppliedEffect> AppliedEffects);

public sealed record SessionScenarioTurnProjectionResponse(
    string SchemaVersion,
    string Stage,
    RulePublicLocation? CurrentLocation,
    IReadOnlyList<RulePublicObject> Objects,
    IReadOnlyList<RulePublicAction> AvailableActions,
    SessionScenarioTurnSelectedActionResponse? SelectedAction,
    SessionScenarioTurnPostStateResponse? PostState);
