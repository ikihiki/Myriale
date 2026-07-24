using System.Text.Json;
using System.Text.Json.Nodes;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record ScenarioRuleWorld(Session Session, ScenarioDefinitionVersion Definition, IReadOnlyList<SessionObjectState> States);
public sealed record ScenarioRuleResolution(ScenarioObjectActionRule? Rule, IReadOnlyList<RuleAppliedEffect> Effects, IReadOnlyList<string> Facts, IReadOnlyList<JsonElement> Events, IReadOnlyList<string> Hints, IReadOnlyList<string> ForbiddenFacts);

public sealed class ScenarioRuleEvaluator
{
    public bool Evaluate(string json, JsonObject objectState, IReadOnlyDictionary<string, bool> flags, JsonElement arguments)
    {
        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
        return Evaluate(document.RootElement, objectState, flags, arguments);
    }

    private bool Evaluate(JsonElement condition, JsonObject state, IReadOnlyDictionary<string, bool> flags, JsonElement arguments)
    {
        if (condition.ValueKind != JsonValueKind.Object || !condition.EnumerateObject().Any()) return true;
        if (condition.TryGetProperty("and", out var and)) return and.EnumerateArray().All(item => Evaluate(item, state, flags, arguments));
        if (condition.TryGetProperty("or", out var or)) return or.EnumerateArray().Any(item => Evaluate(item, state, flags, arguments));
        if (condition.TryGetProperty("not", out var not)) return !Evaluate(not, state, flags, arguments);
        var op = condition.TryGetProperty("op", out var opElement) ? opElement.GetString() : null;
        if (string.IsNullOrWhiteSpace(op)) return true;
        var path = condition.TryGetProperty("path", out var pathElement) ? pathElement.GetString() ?? string.Empty : string.Empty;
        var actual = Resolve(path, state, flags, arguments);
        if (op == "exists") return actual is not null;
        var expected = condition.TryGetProperty("value", out var value) ? JsonNode.Parse(value.GetRawText()) : null;
        return op switch
        {
            "eq" => JsonNode.DeepEquals(actual, expected),
            "ne" => !JsonNode.DeepEquals(actual, expected),
            "lt" => Number(actual) < Number(expected),
            "lte" => Number(actual) <= Number(expected),
            "gt" => Number(actual) > Number(expected),
            "gte" => Number(actual) >= Number(expected),
            "in" => expected is JsonArray array && array.Any(item => JsonNode.DeepEquals(item, actual)),
            _ => false,
        };
    }

    private static JsonNode? Resolve(string path, JsonObject state, IReadOnlyDictionary<string, bool> flags, JsonElement arguments)
    {
        JsonNode? root;
        string remainder;
        if (path == "state" || path.StartsWith("state.", StringComparison.Ordinal)) { root = state; remainder = path.Length == 5 ? "" : path[6..]; }
        else if (path == "arguments" || path.StartsWith("arguments.", StringComparison.Ordinal)) { root = JsonNode.Parse(arguments.GetRawText()); remainder = path.Length == 9 ? "" : path[10..]; }
        else if (path.StartsWith("session.flags.", StringComparison.Ordinal)) return JsonValue.Create(flags.GetValueOrDefault(path[14..]));
        else return null;
        foreach (var segment in remainder.Split('.', StringSplitOptions.RemoveEmptyEntries)) root = root?[segment];
        return root;
    }

    private static decimal Number(JsonNode? node) => node is JsonValue value && value.TryGetValue<decimal>(out var number) ? number : decimal.MinValue;
}

public sealed class ScenarioPublicProjector
{
    public JsonElement Project(ScenarioObjectType type, string stateJson)
    {
        var state = JsonNode.Parse(stateJson) as JsonObject ?? [];
        using var projectionDocument = JsonDocument.Parse(type.PublicProjectionJson);
        var result = new JsonObject();
        if (projectionDocument.RootElement.TryGetProperty("include", out var include) && include.ValueKind == JsonValueKind.Array)
            foreach (var item in include.EnumerateArray())
                if (item.GetString() is { } name && state[name] is { } value) result[name] = value.DeepClone();
        return JsonSerializer.SerializeToElement(result);
    }
}

public sealed class ScenarioActionEnumerator(ScenarioRuleEvaluator evaluator, ScenarioPublicProjector projector)
{
    public RuleActionSnapshot Enumerate(ScenarioRuleWorld world, string snapshotId)
    {
        var location = world.Definition.Locations.Single(item => item.Id == world.Session.CurrentLocationId);
        var definitionObjects = world.Definition.Objects.ToDictionary(item => item.Id);
        var visibleStates = world.States.Where(state =>
        {
            var item = definitionObjects[state.ScenarioObjectId];
            return item.IsGlobal || state.LocationId == world.Session.CurrentLocationId;
        }).ToList();
        var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(world.Session.State.FlagsJson) ?? [];
        var objects = visibleStates.Select(state =>
        {
            var item = definitionObjects[state.ScenarioObjectId];
            return new RulePublicObject(item.Id, item.Code, item.Name, state.LocationId, item.IsGlobal, state.Revision, projector.Project(item.ObjectType, state.StateJson));
        }).ToList();
        var actions = new List<RulePublicAction>();
        foreach (var state in visibleStates)
        {
            var item = definitionObjects[state.ScenarioObjectId];
            var stateObject = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
            foreach (var action in item.ObjectType.Actions.Where(action => action.Visibility == "ai-choice"))
            {
                using var emptyArguments = JsonDocument.Parse("{}");
                var enabled = evaluator.Evaluate(action.AvailabilityConditionJson, stateObject, flags, emptyArguments.RootElement)
                    && item.ActionRules.Any(rule => rule.ObjectTypeActionId == action.Id && evaluator.Evaluate(rule.ConditionJson, stateObject, flags, emptyArguments.RootElement));
                actions.Add(new(item.Id, action.Id, action.Code, action.Label, action.Description, Parse(action.ArgumentSchemaJson), enabled));
            }
        }
        actions.Add(new("system", "clarify", "clarify", "状況を確認する", "状態を変更せず現在の状況を説明する。", Parse("{\"type\":\"object\",\"additionalProperties\":false}"), true));
        actions.Add(new("system", "no-op", "no-op", "様子を見る", "状態を変更せず物語を続ける。", Parse("{\"type\":\"object\",\"additionalProperties\":false}"), true));
        return new(ScenarioTurnSchemas.ActionSnapshot, snapshotId,
            new(location.Id, location.Code, location.Name, location.Description), objects, actions);
    }

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
}

public sealed class ScenarioEffectApplier(ScenarioRuleEvaluator evaluator, ScenarioPublicProjector projector)
{
    public ScenarioRuleResolution ResolveAndApply(ScenarioRuleWorld world, RuleActionDecisionResult decision)
    {
        if (decision.ObjectId == "system") return new(null, [], [], [], [], []);
        var state = world.States.Single(item => item.ScenarioObjectId == decision.ObjectId);
        var item = world.Definition.Objects.Single(objectItem => objectItem.Id == decision.ObjectId);
        var action = item.ObjectType.Actions.Single(typeAction => typeAction.Id == decision.ActionId);
        var stateObject = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
        var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(world.Session.State.FlagsJson) ?? [];
        var matches = item.ActionRules.Where(rule => rule.ObjectTypeActionId == action.Id && evaluator.Evaluate(rule.ConditionJson, stateObject, flags, decision.Arguments))
            .OrderByDescending(rule => rule.Priority).ToList();
        if (matches.Count == 0) throw new ScenarioTurnValidationException("action_no_longer_available");
        if (matches.Count > 1 && matches[0].Priority == matches[1].Priority) throw new ScenarioTurnValidationException("ambiguous_action_rule");
        var rule = matches[0];
        using var effectsDocument = JsonDocument.Parse(rule.EffectsJson);
        var effects = effectsDocument.RootElement.EnumerateArray().Select(effect => effect.Clone()).ToList();
        ValidateEffects(world, item, effects);
        var applied = new List<RuleAppliedEffect>(); var facts = new List<string>(); var events = new List<JsonElement>(); var hints = new List<string>(); var forbidden = new List<string>();
        foreach (var effect in effects)
        {
            var type = effect.GetProperty("type").GetString()!;
            var targetId = effect.TryGetProperty("objectId", out var target) ? target.GetString() : item.Id;
            var path = effect.TryGetProperty("path", out var pathElement) ? pathElement.GetString() : null;
            JsonElement? value = effect.TryGetProperty("value", out var valueElement) ? valueElement.Clone() : null;
            switch (type)
            {
                case "set-state": SetState(world, targetId!, path!, value!.Value); break;
                case "increment-state": IncrementState(world, targetId!, path!, value!.Value); break;
                case "append-set": AppendSet(world, targetId!, path!, value!.Value, false); break;
                case "remove-set": AppendSet(world, targetId!, path!, value!.Value, true); break;
                case "move-object":
                    var moved = world.States.Single(s => s.ScenarioObjectId == targetId);
                    var locationValue = effect.GetProperty("locationId").GetString()!;
                    moved.LocationId = world.Definition.Locations.Single(location => location.Id == locationValue || location.Code == locationValue).Id;
                    moved.Revision++; moved.UpdatedAt = DateTimeOffset.UtcNow;
                    break;
                case "set-session-flag": flags[effect.GetProperty("flag").GetString()!] = effect.GetProperty("value").GetBoolean(); break;
                case "emit-fact": facts.Add(effect.GetProperty("text").GetString()!); break;
                case "emit-event": events.Add(effect.Clone()); break;
                case "add-narrative-hint": hints.Add(effect.GetProperty("text").GetString()!); break;
                case "forbid-narrative-fact": forbidden.Add(effect.GetProperty("text").GetString()!); break;
                case "complete-session": world.Session.Status = "completed"; break;
            }
            applied.Add(new(type, targetId, path, value));
        }
        world.Session.State.FlagsJson = JsonSerializer.Serialize(flags); world.Session.State.Revision++; world.Session.State.UpdatedAt = DateTimeOffset.UtcNow;
        return new(rule, applied, facts, events, hints, forbidden);
    }

    private static void ValidateEffects(ScenarioRuleWorld world, ScenarioObject source, IReadOnlyList<JsonElement> effects)
    {
        foreach (var effect in effects)
        {
            var type = effect.GetProperty("type").GetString();
            if (type is "set-state" or "increment-state" or "append-set" or "remove-set")
            {
                var path = effect.GetProperty("path").GetString() ?? "";
                if (!path.StartsWith("state.", StringComparison.Ordinal)) throw new ScenarioTurnValidationException("invalid_effect_path");
            }
            if (type == "move-object")
            {
                var locationId = effect.GetProperty("locationId").GetString();
                if (!world.Definition.Locations.Any(location => location.Id == locationId || location.Code == locationId)) throw new ScenarioTurnValidationException("invalid_move_target");
            }
        }
    }

    private static void SetState(ScenarioRuleWorld world, string objectId, string path, JsonElement value)
    {
        var state = world.States.Single(item => item.ScenarioObjectId == objectId); var root = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
        root[path[6..]] = JsonNode.Parse(value.GetRawText()); state.StateJson = root.ToJsonString(); state.Revision++; state.UpdatedAt = DateTimeOffset.UtcNow;
    }
    private static void IncrementState(ScenarioRuleWorld world, string objectId, string path, JsonElement value)
    {
        var state = world.States.Single(item => item.ScenarioObjectId == objectId); var root = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
        var key = path[6..]; var current = root[key]?.GetValue<decimal>() ?? 0; root[key] = current + value.GetDecimal(); state.StateJson = root.ToJsonString(); state.Revision++; state.UpdatedAt = DateTimeOffset.UtcNow;
    }
    private static void AppendSet(ScenarioRuleWorld world, string objectId, string path, JsonElement value, bool remove)
    {
        var state = world.States.Single(item => item.ScenarioObjectId == objectId); var root = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
        var key = path[6..]; var array = root[key] as JsonArray ?? []; var node = JsonNode.Parse(value.GetRawText());
        if (remove) { var match = array.FirstOrDefault(item => JsonNode.DeepEquals(item, node)); if (match is not null) array.Remove(match); }
        else if (!array.Any(item => JsonNode.DeepEquals(item, node))) array.Add(node);
        root[key] = array; state.StateJson = root.ToJsonString(); state.Revision++; state.UpdatedAt = DateTimeOffset.UtcNow;
    }

    public RulePostState ProjectPostState(ScenarioRuleWorld world)
    {
        var location = world.Definition.Locations.Single(item => item.Id == world.Session.CurrentLocationId);
        var objects = world.States.Where(state => state.LocationId == world.Session.CurrentLocationId || state.ScenarioObject.IsGlobal)
            .Select(state => new RulePublicObject(state.ScenarioObjectId, state.ScenarioObject.Code, state.ScenarioObject.Name, state.LocationId, state.ScenarioObject.IsGlobal, state.Revision, projector.Project(state.ScenarioObject.ObjectType, state.StateJson))).ToList();
        var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(world.Session.State.FlagsJson) ?? [];
        return new("rule-post-state.v1", new(location.Id, location.Code, location.Name, location.Description), objects, flags, world.Session.State.Revision);
    }
}

public sealed class ScenarioTurnValidationException(string code) : Exception(code) { public string Code { get; } = code; }

public sealed record ScenarioExtensionRequest(
    string InvocationId,
    string OwnerId,
    string SessionId,
    string ObjectId,
    string ObjectTypeId,
    string ActionId,
    string RuleId,
    string ModuleId,
    string Version,
    string Digest,
    JsonElement Configuration,
    JsonElement Arguments,
    JsonElement ObjectState);

public sealed record ScenarioExtensionResult(
    string ExecutionId,
    string Status,
    long Revision,
    IReadOnlyList<Myriale.ModuleSdk.ModuleAvailableAction> AvailableActions,
    IReadOnlyList<RuleAppliedEffect> Effects,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts,
    JsonElement PublicState);

public interface IScenarioExtensionAdapter { Task<ScenarioExtensionResult> ExecuteAsync(ScenarioExtensionRequest request, CancellationToken cancellationToken); }
