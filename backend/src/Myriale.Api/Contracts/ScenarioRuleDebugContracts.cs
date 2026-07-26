using System.Text.Json;

namespace Myriale.Api.Contracts;

public sealed record ScenarioRuleDebugObjectStateInput(
    string ObjectCode,
    string LocationCode,
    JsonElement State);

public sealed record ScenarioRuleDebugRequest(
    string Trigger,
    string CurrentLocationCode,
    IReadOnlyDictionary<string, bool> Flags,
    IReadOnlyList<ScenarioRuleDebugObjectStateInput> Objects,
    string? ObjectCode,
    string? ActionCode,
    JsonElement Arguments,
    string? PlayerInput);

public sealed record ScenarioRuleDebugResponse(
    RuleActionSnapshot Snapshot,
    RuleActionDecisionResult? Decision,
    string? SelectedRuleCode,
    IReadOnlyList<RuleAppliedEffect> AppliedEffects,
    RulePostState? PostState,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> Hints,
    IReadOnlyList<string> ForbiddenFacts);
