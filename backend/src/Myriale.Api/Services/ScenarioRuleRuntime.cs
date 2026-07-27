using System.Text.Json;
using System.Text.Json.Nodes;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record ScenarioRuleWorld(Session Session, ScenarioDefinitionVersion Definition, IReadOnlyList<SessionObjectState> States);
public sealed record ScenarioRuleResolution(ResolvedScenarioRule? Rule, IReadOnlyList<RuleAppliedEffect> Effects, IReadOnlyList<string> Facts, IReadOnlyList<JsonElement> Events, IReadOnlyList<string> Hints, IReadOnlyList<string> ForbiddenFacts);

public sealed class ScenarioRuleEvaluator
{
    public bool Evaluate(string json, JsonObject objectState, IReadOnlyDictionary<string, bool> flags, JsonElement arguments)
    {
        try
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            return TryEvaluate(document.RootElement, objectState, flags, arguments, out var result) && result;
        }
        catch (JsonException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (OverflowException)
        {
            return false;
        }
    }

    private bool TryEvaluate(
        JsonElement condition,
        JsonObject state,
        IReadOnlyDictionary<string, bool> flags,
        JsonElement arguments,
        out bool result)
    {
        result = false;
        if (condition.ValueKind != JsonValueKind.Object) return false;
        var properties = condition.EnumerateObject().ToList();
        if (properties.Count == 0)
        {
            result = true;
            return true;
        }

        var logical = properties.Where(property => property.Name is "and" or "or" or "not").ToList();
        if (logical.Count > 0)
        {
            if (logical.Count != 1 || properties.Count != 1) return false;
            var property = logical[0];
            if (property.Name == "not")
            {
                if (!TryEvaluate(property.Value, state, flags, arguments, out var child)) return false;
                result = !child;
                return true;
            }
            if (property.Value.ValueKind != JsonValueKind.Array) return false;

            result = property.Name == "and";
            foreach (var item in property.Value.EnumerateArray())
            {
                if (!TryEvaluate(item, state, flags, arguments, out var child)) return false;
                result = property.Name == "and" ? result && child : result || child;
            }
            return true;
        }

        if (properties.Any(property => property.Name is not ("op" or "path" or "value"))) return false;
        if (!condition.TryGetProperty("op", out var opElement) || opElement.ValueKind != JsonValueKind.String) return false;
        if (!condition.TryGetProperty("path", out var pathElement) || pathElement.ValueKind != JsonValueKind.String) return false;
        var op = opElement.GetString();
        var path = pathElement.GetString();
        if (string.IsNullOrWhiteSpace(op) || string.IsNullOrWhiteSpace(path) || !IsConditionPathSyntaxValid(path)) return false;
        if (!TryResolve(path, state, flags, arguments, out var actual))
        {
            // A syntactically valid exists check over a missing path is false; every other operation also fails closed.
            return op == "exists" && properties.Count == 2;
        }

        if (op == "exists")
        {
            if (properties.Count != 2) return false;
            result = true;
            return true;
        }
        if (!condition.TryGetProperty("value", out var value) || properties.Count != 3) return false;
        var expected = JsonNode.Parse(value.GetRawText());
        switch (op)
        {
            case "eq": result = JsonNode.DeepEquals(actual, expected); return true;
            case "ne": result = !JsonNode.DeepEquals(actual, expected); return true;
            case "lt": return CompareNumbers(actual, expected, (left, right) => left < right, out result);
            case "lte": return CompareNumbers(actual, expected, (left, right) => left <= right, out result);
            case "gt": return CompareNumbers(actual, expected, (left, right) => left > right, out result);
            case "gte": return CompareNumbers(actual, expected, (left, right) => left >= right, out result);
            case "in":
                if (expected is not JsonArray array) return false;
                result = array.Any(item => JsonNode.DeepEquals(item, actual));
                return true;
            default:
                return false;
        }
    }

    private static bool IsConditionPathSyntaxValid(string path)
    {
        if (path.StartsWith("session.flags.", StringComparison.Ordinal))
        {
            var flag = path["session.flags.".Length..];
            return !string.IsNullOrWhiteSpace(flag) && !flag.Contains('.');
        }

        var remainder = path.StartsWith("state.", StringComparison.Ordinal)
            ? path["state.".Length..]
            : path.StartsWith("arguments.", StringComparison.Ordinal)
                ? path["arguments.".Length..]
                : string.Empty;
        return remainder.Length > 0 && !remainder.Split('.', StringSplitOptions.None).Any(string.IsNullOrWhiteSpace);
    }

    private static bool CompareNumbers(JsonNode? actual, JsonNode? expected, Func<decimal, decimal, bool> compare, out bool result)
    {
        result = false;
        if (!TryNumber(actual, out var left) || !TryNumber(expected, out var right)) return false;
        result = compare(left, right);
        return true;
    }

    private static bool TryResolve(
        string path,
        JsonObject state,
        IReadOnlyDictionary<string, bool> flags,
        JsonElement arguments,
        out JsonNode? value)
    {
        value = null;
        JsonNode? root;
        string remainder;
        if (path.StartsWith("state.", StringComparison.Ordinal))
        {
            root = state;
            remainder = path["state.".Length..];
        }
        else if (path.StartsWith("arguments.", StringComparison.Ordinal))
        {
            if (arguments.ValueKind != JsonValueKind.Object) return false;
            root = JsonNode.Parse(arguments.GetRawText());
            remainder = path["arguments.".Length..];
        }
        else if (path.StartsWith("session.flags.", StringComparison.Ordinal))
        {
            var flag = path["session.flags.".Length..];
            if (string.IsNullOrWhiteSpace(flag) || flag.Contains('.') || !flags.TryGetValue(flag, out var enabled)) return false;
            value = JsonValue.Create(enabled);
            return true;
        }
        else return false;

        var segments = remainder.Split('.', StringSplitOptions.None);
        if (segments.Any(string.IsNullOrWhiteSpace)) return false;
        foreach (var segment in segments)
        {
            if (root is not JsonObject current || !current.TryGetPropertyValue(segment, out root)) return false;
        }
        value = root;
        return true;
    }

    private static bool TryNumber(JsonNode? node, out decimal number)
    {
        number = default;
        return node is JsonValue value && value.TryGetValue(out number);
    }
}

public sealed class ScenarioPublicProjector(ScenarioRuleConfigurationResolver resolver)
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

    public JsonElement Project(ScenarioDefinitionVersion definition, ScenarioObject item, string stateJson)
    {
        var state = JsonNode.Parse(stateJson) as JsonObject ?? [];
        var resolved = resolver.Resolve(definition, item);
        var result = new JsonObject();
        foreach (var name in resolved.PublicFields) if (state[name] is { } value) result[name] = value.DeepClone();
        return JsonSerializer.SerializeToElement(result);
    }
}

public sealed class ScenarioActionEnumerator(ScenarioRuleEvaluator evaluator, ScenarioPublicProjector projector, ScenarioRuleConfigurationResolver resolver)
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
            return new RulePublicObject(item.Id, item.Code, item.Name, state.LocationId, item.IsGlobal, state.Revision, projector.Project(world.Definition, item, state.StateJson));
        }).ToList();
        var actions = new List<RulePublicAction>();
        foreach (var state in visibleStates)
        {
            var item = definitionObjects[state.ScenarioObjectId];
            var stateObject = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
            var configuration = resolver.Resolve(world.Definition, item);
            if (configuration.Conflicts.Count > 0) throw new ScenarioTurnValidationException("invalid_rule_configuration");
            foreach (var action in configuration.Actions.Where(action => action.Visibility == "ai-choice"))
            {
                using var emptyArguments = JsonDocument.Parse("{}");
                var enabled = evaluator.Evaluate(action.AvailabilityConditionJson, stateObject, flags, emptyArguments.RootElement)
                    && configuration.Rules.Any(rule => rule.ActionCode == action.Code && evaluator.Evaluate(rule.ConditionJson, stateObject, flags, emptyArguments.RootElement));
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

public sealed class ScenarioEffectApplier(ScenarioRuleEvaluator evaluator, ScenarioPublicProjector projector, ScenarioRuleConfigurationResolver resolver)
{
    public ScenarioRuleResolution ResolveAndApply(ScenarioRuleWorld world, RuleActionDecisionResult decision)
    {
        if (decision.ObjectId == "system") return new(null, [], [], [], [], []);
        var state = world.States.Single(item => item.ScenarioObjectId == decision.ObjectId);
        var item = world.Definition.Objects.Single(objectItem => objectItem.Id == decision.ObjectId);
        var configuration = resolver.Resolve(world.Definition, item);
        if (configuration.Conflicts.Count > 0) throw new ScenarioTurnValidationException("invalid_rule_configuration");
        var action = configuration.Actions.Single(typeAction => typeAction.Id == decision.ActionId);
        var stateObject = JsonNode.Parse(state.StateJson) as JsonObject ?? [];
        var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(world.Session.State.FlagsJson) ?? [];
        var matches = configuration.Rules.Where(rule => rule.ActionCode == action.Code && evaluator.Evaluate(rule.ConditionJson, stateObject, flags, decision.Arguments))
            .OrderByDescending(rule => rule.Priority).ThenByDescending(rule => rule.SourceRank).ToList();
        if (matches.Count == 0) throw new ScenarioTurnValidationException("action_no_longer_available");
        if (matches.Count > 1 && matches[0].Priority == matches[1].Priority && matches[0].SourceRank == matches[1].SourceRank) throw new ScenarioTurnValidationException("ambiguous_action_rule");
        var rule = matches[0];
        using var effectsDocument = JsonDocument.Parse(rule.EffectsJson);
        var effects = effectsDocument.RootElement.EnumerateArray().Select(effect => effect.Clone()).ToList();
        ValidateEffects(world, item, effects);
        var applied = new List<RuleAppliedEffect>(); var facts = new List<string>(); var events = new List<JsonElement>(); var hints = new List<string>(); var forbidden = new List<string>();
        foreach (var effect in effects)
        {
            var type = effect.GetProperty("type").GetString()!;
            var targetId = ResolveObjectId(world, item, effect);
            var path = effect.TryGetProperty("path", out var pathElement) ? pathElement.GetString() : null;
            JsonElement? value = effect.TryGetProperty("value", out var valueElement) ? valueElement.Clone() : null;
            switch (type)
            {
                case "set-state": SetState(world, targetId, path!, value!.Value); break;
                case "increment-state": IncrementState(world, targetId, path!, value!.Value); break;
                case "append-set": AppendSet(world, targetId, path!, value!.Value, false); break;
                case "remove-set": AppendSet(world, targetId, path!, value!.Value, true); break;
                case "move-object":
                    var moved = world.States.Single(s => s.ScenarioObjectId == targetId);
                    var destination = ResolveLocation(world, effect);
                    moved.LocationId = destination.Id;
                    moved.Revision++; moved.UpdatedAt = DateTimeOffset.UtcNow;
                    path = "locationId"; value = JsonSerializer.SerializeToElement(destination.Code);
                    break;
                case "move-session":
                    var sessionDestination = ResolveLocation(world, effect);
                    world.Session.CurrentLocationId = sessionDestination.Id;
                    targetId = sessionDestination.Id; path = "currentLocationId"; value = JsonSerializer.SerializeToElement(sessionDestination.Code);
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
        var allowedTypes = new HashSet<string>(StringComparer.Ordinal)
        {
            "set-state", "increment-state", "append-set", "remove-set", "move-object", "move-session",
            "set-session-flag", "emit-fact", "emit-event", "add-narrative-hint", "forbid-narrative-fact", "complete-session"
        };
        foreach (var effect in effects)
        {
            if (effect.ValueKind != JsonValueKind.Object || !effect.TryGetProperty("type", out var typeElement) || typeElement.ValueKind != JsonValueKind.String)
                throw new ScenarioTurnValidationException("invalid_effect_type");
            var type = typeElement.GetString() ?? string.Empty;
            if (!allowedTypes.Contains(type)) throw new ScenarioTurnValidationException("invalid_effect_type");
            if (type is "set-state" or "increment-state" or "append-set" or "remove-set")
            {
                if (!effect.TryGetProperty("path", out var pathElement) || pathElement.ValueKind != JsonValueKind.String || !(pathElement.GetString() ?? string.Empty).StartsWith("state.", StringComparison.Ordinal))
                    throw new ScenarioTurnValidationException("invalid_effect_path");
                if (!effect.TryGetProperty("value", out var stateValue)) throw new ScenarioTurnValidationException("invalid_effect_value");
                var targetId = ResolveObjectId(world, source, effect);
                var targetState = world.States.Single(item => item.ScenarioObjectId == targetId);
                using var targetStateDocument = JsonDocument.Parse(targetState.StateJson);
                var property = pathElement.GetString()!["state.".Length..].Split('.', 2)[0];
                if (!targetStateDocument.RootElement.TryGetProperty(property, out var currentValue)) throw new ScenarioTurnValidationException("invalid_effect_path");
                if (type == "set-state" && !CompatibleStateValue(currentValue, stateValue)) throw new ScenarioTurnValidationException("invalid_effect_value");
            }
            if (type is "move-object" or "move-session" || (type == "emit-event" && effect.TryGetProperty("locationCode", out _)))
                _ = ResolveLocation(world, effect);
            if (type == "move-object") _ = ResolveObjectId(world, source, effect);
            if (type == "set-session-flag")
            {
                if (!effect.TryGetProperty("flag", out var flag) || flag.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(flag.GetString())) throw new ScenarioTurnValidationException("invalid_effect_flag");
                if (!effect.TryGetProperty("value", out var flagValue) || flagValue.ValueKind is not (JsonValueKind.True or JsonValueKind.False)) throw new ScenarioTurnValidationException("invalid_effect_value");
            }
            if (type == "emit-event" && (!effect.TryGetProperty("event", out var eventName) || eventName.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(eventName.GetString())))
                throw new ScenarioTurnValidationException("invalid_effect_event");
            if (type is "emit-fact" or "add-narrative-hint" or "forbid-narrative-fact")
            {
                if (!effect.TryGetProperty("text", out var text) || text.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(text.GetString())) throw new ScenarioTurnValidationException("invalid_effect_text");
            }
        }
    }

    private static bool CompatibleStateValue(JsonElement current, JsonElement next) =>
        current.ValueKind == next.ValueKind
        || current.ValueKind is JsonValueKind.True or JsonValueKind.False && next.ValueKind is JsonValueKind.True or JsonValueKind.False
        || current.ValueKind == JsonValueKind.Number && next.ValueKind == JsonValueKind.Number;

    private static string ResolveObjectId(ScenarioRuleWorld world, ScenarioObject source, JsonElement effect)
    {
        var reference = effect.TryGetProperty("objectCode", out var objectCode) && objectCode.ValueKind == JsonValueKind.String
            ? objectCode.GetString()
            : effect.TryGetProperty("objectId", out var objectId) && objectId.ValueKind == JsonValueKind.String ? objectId.GetString() : null;
        if (string.IsNullOrWhiteSpace(reference)) return source.Id;
        var target = world.Definition.Objects.SingleOrDefault(item => item.Code == reference || item.Id == reference);
        if (target is null || !world.States.Any(state => state.ScenarioObjectId == target.Id)) throw new ScenarioTurnValidationException("invalid_effect_object");
        return target.Id;
    }

    private static ScenarioLocation ResolveLocation(ScenarioRuleWorld world, JsonElement effect)
    {
        var reference = effect.TryGetProperty("locationCode", out var locationCode) && locationCode.ValueKind == JsonValueKind.String
            ? locationCode.GetString()
            : effect.TryGetProperty("locationId", out var locationId) && locationId.ValueKind == JsonValueKind.String ? locationId.GetString() : null;
        return world.Definition.Locations.SingleOrDefault(location => location.Code == reference || location.Id == reference)
            ?? throw new ScenarioTurnValidationException("invalid_move_target");
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
            .Select(state => new RulePublicObject(state.ScenarioObjectId, state.ScenarioObject.Code, state.ScenarioObject.Name, state.LocationId, state.ScenarioObject.IsGlobal, state.Revision, projector.Project(world.Definition, state.ScenarioObject, state.StateJson))).ToList();
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
