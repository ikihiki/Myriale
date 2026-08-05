using System.Collections.ObjectModel;
using System.Text.Json;
using System.Text.Json.Nodes;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.ScenarioTurns.Infrastructure;

public sealed record ScenarioRuleLocationSnapshot(string Id, string Code, string Name, string Description);
public sealed record ScenarioRuleObjectSnapshot(
    string Id,
    string Code,
    string Name,
    string ProfileMarkdown,
    bool IsGlobal,
    string LocationId,
    long Revision,
    JsonElement State,
    IReadOnlySet<string> PublicFields,
    IReadOnlyList<ResolvedScenarioAction> Actions,
    IReadOnlyList<ResolvedScenarioRule> Rules);
public sealed record ScenarioRuleNarrativeSnapshot(
    string Title,
    string Summary,
    string Genre,
    string Tone,
    string Lore,
    string AiFreedom,
    string SelectedHero,
    string Opening,
    IReadOnlyList<NarrativeEntityInput> Entities);
public sealed record ScenarioRuleWorldSnapshot(
    string SessionId,
    string OwnerId,
    string ScenarioDefinitionVersionId,
    string CurrentLocationId,
    long SessionRevision,
    SessionStatus SessionStatus,
    long SessionStateRevision,
    IReadOnlyDictionary<string, bool> SessionFlags,
    IReadOnlyList<ScenarioRuleLocationSnapshot> Locations,
    IReadOnlyList<ScenarioRuleObjectSnapshot> Objects,
    ScenarioRuleNarrativeSnapshot Narrative);

public sealed class ScenarioRuleWorldSnapshotFactory(ScenarioRuleConfigurationResolver resolver)
{
    public ScenarioRuleWorldSnapshot Create(Session session, ScenarioDefinitionVersion definition, IReadOnlyList<SessionObjectState> states)
    {
        var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(session.State.FlagsJson) ?? [];
        var byState = states.ToDictionary(state => state.ScenarioObjectId, StringComparer.Ordinal);
        var objects = definition.Objects.OrderBy(item => item.Code, StringComparer.Ordinal).Select(item =>
        {
            var state = byState[item.Id];
            var configuration = resolver.Resolve(definition, item);
            if (configuration.Conflicts.Count > 0) throw new ScenarioTurnValidationException("invalid_rule_configuration");
            return new ScenarioRuleObjectSnapshot(
                item.Id, item.Code, item.Name, item.ProfileMarkdown, item.IsGlobal,
                state.LocationId, state.Revision, Parse(state.StateJson),
                new HashSet<string>(configuration.PublicFields, StringComparer.Ordinal),
                configuration.Actions.ToArray(), configuration.Rules.ToArray());
        }).ToArray();
        var locations = definition.Locations.OrderBy(item => item.Code, StringComparer.Ordinal)
            .Select(item => new ScenarioRuleLocationSnapshot(item.Id, item.Code, item.Name, item.Description)).ToArray();
        var narrative = new ScenarioRuleNarrativeSnapshot(
            definition.ScenarioTitle.Value, definition.ScenarioSummary, definition.ScenarioGenre,
            definition.ScenarioTone, definition.ScenarioLore, definition.ScenarioAiFreedom,
            session.SelectedHero, definition.ScenarioOpening,
            definition.Objects.OrderBy(item => item.Code, StringComparer.Ordinal)
                .Select(item => new NarrativeEntityInput(item.Code, item.Name, item.ProfileMarkdown)).ToArray());
        return new ScenarioRuleWorldSnapshot(
            session.Id, session.OwnerId,
            session.ScenarioDefinitionVersionId ?? throw new ScenarioTurnValidationException("scenario_definition_not_pinned"),
            session.CurrentLocationId ?? throw new ScenarioTurnValidationException("scenario_location_not_pinned"),
            session.Revision, session.Status, session.State.Revision,
            new ReadOnlyDictionary<string, bool>(new Dictionary<string, bool>(flags, StringComparer.Ordinal)),
            locations, objects, narrative);
    }

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
}

public sealed record ScenarioSessionPatch(long ExpectedRevision, string CurrentLocationId, bool Complete);
public sealed record ScenarioSessionStatePatch(long ExpectedRevision, IReadOnlyDictionary<string, bool> Flags);
public sealed record ScenarioObjectPatch(string ObjectId, long ExpectedRevision, string LocationId, JsonElement State);
public sealed record ScenarioPlacementChange(string TargetId, string LocationId, bool IsSession);
public sealed record ScenarioEffectPlan(
    ScenarioSessionPatch Session,
    ScenarioSessionStatePatch? SessionState,
    IReadOnlyList<ScenarioObjectPatch> Objects,
    IReadOnlyList<ScenarioPlacementChange> Placements,
    IReadOnlyList<RuleAppliedEffect> AppliedEffects,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts,
    bool CompletionIntent,
    ScenarioExtensionRequest? ExtensionRequest);
public sealed record ScenarioRuleResolution(ResolvedScenarioRule? Rule, ScenarioEffectPlan Plan);

public sealed class ScenarioRuleEvaluator
{
    public bool Evaluate(ConditionExpression condition, JsonObject objectState, IReadOnlyDictionary<string, bool> flags, JsonElement arguments)
    {
        try { return TryEvaluate(condition, objectState, flags, arguments, out var result) && result; }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException or FormatException or OverflowException)
        {
            return false;
        }
    }

    private bool TryEvaluate(ConditionExpression condition, JsonObject state, IReadOnlyDictionary<string, bool> flags, JsonElement arguments, out bool result)
    {
        result = false;
        switch (condition)
        {
            case AlwaysCondition: result = true; return true;
            case AllCondition all:
                result = true;
                foreach (var child in all.Conditions)
                {
                    if (!TryEvaluate(child, state, flags, arguments, out var childResult)) return false;
                    result &= childResult;
                }
                return true;
            case AnyCondition any:
                foreach (var child in any.Conditions)
                {
                    if (!TryEvaluate(child, state, flags, arguments, out var childResult)) return false;
                    result |= childResult;
                }
                return true;
            case NotCondition not:
                if (!TryEvaluate(not.Condition, state, flags, arguments, out var nested)) return false;
                result = !nested; return true;
            case PredicateCondition predicate: return TryEvaluatePredicate(predicate, state, flags, arguments, out result);
            default: return false;
        }
    }

    private static bool TryEvaluatePredicate(PredicateCondition condition, JsonObject state, IReadOnlyDictionary<string, bool> flags, JsonElement arguments, out bool result)
    {
        result = false;
        if (string.IsNullOrWhiteSpace(condition.Path) || !IsConditionPathSyntaxValid(condition.Path)) return false;
        if (!TryResolve(condition.Path, state, flags, arguments, out var actual)) return false;
        if (condition.Operator == "exists") { result = true; return true; }
        if (condition.Expected is not { } value) return false;
        var expected = JsonNode.Parse(value.GetRawText());
        switch (condition.Operator)
        {
            case "eq": result = JsonNode.DeepEquals(actual, expected); return true;
            case "ne": result = !JsonNode.DeepEquals(actual, expected); return true;
            case "lt": return CompareNumbers(actual, expected, (left, right) => left < right, out result);
            case "lte": return CompareNumbers(actual, expected, (left, right) => left <= right, out result);
            case "gt": return CompareNumbers(actual, expected, (left, right) => left > right, out result);
            case "gte": return CompareNumbers(actual, expected, (left, right) => left >= right, out result);
            case "in":
                if (expected is not JsonArray array) return false;
                result = array.Any(item => JsonNode.DeepEquals(item, actual)); return true;
            default: return false;
        }
    }

    private static bool IsConditionPathSyntaxValid(string path)
    {
        if (path.StartsWith("session.flags.", StringComparison.Ordinal))
        {
            var flag = path["session.flags.".Length..];
            return !string.IsNullOrWhiteSpace(flag) && !flag.Contains('.');
        }
        var remainder = path.StartsWith("state.", StringComparison.Ordinal) ? path["state.".Length..]
            : path.StartsWith("arguments.", StringComparison.Ordinal) ? path["arguments.".Length..] : string.Empty;
        return remainder.Length > 0 && !remainder.Split('.', StringSplitOptions.None).Any(string.IsNullOrWhiteSpace);
    }

    private static bool CompareNumbers(JsonNode? actual, JsonNode? expected, Func<decimal, decimal, bool> compare, out bool result)
    {
        result = false;
        if (!TryNumber(actual, out var left) || !TryNumber(expected, out var right)) return false;
        result = compare(left, right); return true;
    }

    private static bool TryResolve(string path, JsonObject state, IReadOnlyDictionary<string, bool> flags, JsonElement arguments, out JsonNode? value)
    {
        value = null;
        JsonNode? root;
        string remainder;
        if (path.StartsWith("state.", StringComparison.Ordinal)) { root = state; remainder = path["state.".Length..]; }
        else if (path.StartsWith("arguments.", StringComparison.Ordinal))
        {
            if (arguments.ValueKind != JsonValueKind.Object) return false;
            root = JsonNode.Parse(arguments.GetRawText()); remainder = path["arguments.".Length..];
        }
        else if (path.StartsWith("session.flags.", StringComparison.Ordinal))
        {
            var flag = path["session.flags.".Length..];
            if (string.IsNullOrWhiteSpace(flag) || flag.Contains('.') || !flags.TryGetValue(flag, out var enabled)) return false;
            value = JsonValue.Create(enabled); return true;
        }
        else return false;
        foreach (var segment in remainder.Split('.', StringSplitOptions.None))
            if (string.IsNullOrWhiteSpace(segment) || root is not JsonObject current || !current.TryGetPropertyValue(segment, out root)) return false;
        value = root; return true;
    }

    private static bool TryNumber(JsonNode? node, out decimal number)
    {
        number = default;
        return node is JsonValue value && value.TryGetValue(out number);
    }
}

public sealed class ScenarioPublicProjector
{
    public JsonElement Project(ScenarioRuleObjectSnapshot item, JsonElement state)
    {
        if (state.ValueKind != JsonValueKind.Object) throw new ScenarioTurnValidationException("invalid_object_state");
        var result = new JsonObject();
        foreach (var name in item.PublicFields)
            if (state.TryGetProperty(name, out var value)) result[name] = JsonNode.Parse(value.GetRawText());
        return JsonSerializer.SerializeToElement(result);
    }
}

public sealed class ScenarioActionEnumerator(ScenarioRuleEvaluator evaluator, ScenarioPublicProjector projector)
{
    public RuleActionSnapshot Enumerate(ScenarioRuleWorldSnapshot world, string snapshotId)
    {
        var location = world.Locations.Single(item => item.Id == world.CurrentLocationId);
        var visible = world.Objects.Where(item => item.IsGlobal || item.LocationId == world.CurrentLocationId).ToArray();
        var objects = visible.Select(item => new RulePublicObject(
            item.Id, item.Code, item.Name, item.LocationId, item.IsGlobal, item.Revision, projector.Project(item, item.State))).ToArray();
        var actions = new List<RulePublicAction>();
        using var emptyArguments = JsonDocument.Parse("{}");
        foreach (var item in visible)
        {
            var state = JsonNode.Parse(item.State.GetRawText()) as JsonObject ?? [];
            foreach (var action in item.Actions.Where(action => action.Visibility == ActionVisibility.AiChoice))
            {
                var enabled = evaluator.Evaluate(action.AvailabilityCondition, state, world.SessionFlags, emptyArguments.RootElement)
                    && item.Rules.Any(rule => rule.ActionCode == action.Code && evaluator.Evaluate(rule.Condition, state, world.SessionFlags, emptyArguments.RootElement));
                actions.Add(new(item.Id, action.Id, action.Code, action.Label, action.Description, action.ArgumentSchema.Clone(), enabled));
            }
        }
        actions.Add(new("system", "clarify", "clarify", "状況を確認する", "状態を変更せず現在の状況を説明する。", Parse("{\"type\":\"object\",\"additionalProperties\":false}"), true));
        actions.Add(new("system", "no-op", "no-op", "様子を見る", "状態を変更せず物語を続ける。", Parse("{\"type\":\"object\",\"additionalProperties\":false}"), true));
        return new(ScenarioTurnSchemas.ActionSnapshot, snapshotId,
            new(location.Id, location.Code, location.Name, location.Description), objects, actions);
    }

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
}

public interface IScenarioRuleResolutionService
{
    ScenarioRuleResolution Resolve(ScenarioRuleWorldSnapshot world, RuleActionDecisionResult decision, string invocationId);
    RulePostState ProjectPostState(ScenarioRuleWorldSnapshot world, ScenarioEffectPlan plan);
}

public sealed class ScenarioRuleResolutionService(ScenarioRuleEvaluator evaluator, ScenarioPublicProjector projector, ScenarioRuleJsonCodec codec)
    : IScenarioRuleResolutionService
{
    public ScenarioRuleResolution Resolve(ScenarioRuleWorldSnapshot world, RuleActionDecisionResult decision, string invocationId)
    {
        if (decision.ObjectId == "system") return new(null, EmptyPlan(world));
        var source = world.Objects.SingleOrDefault(item => item.Id == decision.ObjectId)
            ?? throw new ScenarioTurnValidationException("invalid_effect_object");
        var action = source.Actions.SingleOrDefault(item => item.Id == decision.ActionId)
            ?? throw new ScenarioTurnValidationException("unknown_action");
        var sourceState = JsonNode.Parse(source.State.GetRawText()) as JsonObject ?? [];
        var matches = source.Rules.Where(rule => rule.ActionCode == action.Code
                && evaluator.Evaluate(rule.Condition, sourceState, world.SessionFlags, decision.Arguments))
            .OrderByDescending(rule => rule.Priority).ThenByDescending(rule => rule.SourceRank).ToArray();
        if (matches.Length == 0) throw new ScenarioTurnValidationException("action_no_longer_available");
        if (matches.Length > 1 && matches[0].Priority == matches[1].Priority && matches[0].SourceRank == matches[1].SourceRank)
            throw new ScenarioTurnValidationException("ambiguous_action_rule");
        var rule = matches[0];
        var mutableStates = world.Objects.ToDictionary(
            item => item.Id,
            item => new MutableObject(item, JsonNode.Parse(item.State.GetRawText()) as JsonObject ?? []),
            StringComparer.Ordinal);
        var flags = new Dictionary<string, bool>(world.SessionFlags, StringComparer.Ordinal);
        var flagsChanged = false;
        var currentLocationId = world.CurrentLocationId;
        var complete = false;
        var applied = new List<RuleAppliedEffect>();
        var placements = new List<ScenarioPlacementChange>();
        var facts = new List<string>();
        var events = new List<JsonElement>();
        var hints = new List<string>();
        var forbidden = new List<string>();

        foreach (var effect in rule.Effects.Effects)
        {
            string? targetId = source.Id;
            string? path = null;
            JsonElement? value = null;
            switch (effect)
            {
                case StateEffect stateEffect:
                    targetId = ResolveObject(world, source, stateEffect.ObjectCode, stateEffect.ObjectId).Id;
                    var statePath = ValidateStatePath(stateEffect.Path);
                    value = stateEffect.Value ?? throw new ScenarioTurnValidationException("invalid_effect_value");
                    ApplyState(mutableStates[targetId], stateEffect.Type, statePath, value.Value);
                    path = stateEffect.Path;
                    break;
                case MoveObjectEffect moveObject:
                    targetId = ResolveObject(world, source, moveObject.ObjectCode, moveObject.ObjectId).Id;
                    var destination = ResolveLocation(world, moveObject.LocationCode, moveObject.LocationId);
                    mutableStates[targetId].LocationId = destination.Id;
                    mutableStates[targetId].Changed = true;
                    path = "locationId"; value = JsonSerializer.SerializeToElement(destination.Code);
                    placements.Add(new(targetId, destination.Id, false));
                    break;
                case MoveSessionEffect moveSession:
                    var sessionDestination = ResolveLocation(world, moveSession.LocationCode, moveSession.LocationId);
                    currentLocationId = sessionDestination.Id; targetId = world.SessionId;
                    path = "currentLocationId"; value = JsonSerializer.SerializeToElement(sessionDestination.Code);
                    placements.Add(new(world.SessionId, sessionDestination.Id, true));
                    break;
                case SetSessionFlagEffect flag:
                    if (string.IsNullOrWhiteSpace(flag.Flag)) throw new ScenarioTurnValidationException("invalid_effect_flag");
                    if (flag.Value is null) throw new ScenarioTurnValidationException("invalid_effect_value");
                    flags[flag.Flag] = flag.Value.Value; flagsChanged = true; targetId = world.SessionId;
                    path = $"flags.{flag.Flag}"; value = JsonSerializer.SerializeToElement(flag.Value.Value);
                    break;
                case TextEffect text when text.Type == "emit-fact": facts.Add(RequiredText(text.Text)); targetId = null; break;
                case TextEffect text when text.Type == "add-narrative-hint": hints.Add(RequiredText(text.Text)); targetId = null; break;
                case TextEffect text when text.Type == "forbid-narrative-fact": forbidden.Add(RequiredText(text.Text)); targetId = null; break;
                case EmitEventEffect emitted:
                    if (string.IsNullOrWhiteSpace(emitted.Event)) throw new ScenarioTurnValidationException("invalid_effect_event");
                    if (emitted.LocationCode is not null || emitted.LocationId is not null)
                        _ = ResolveLocation(world, emitted.LocationCode, emitted.LocationId);
                    events.Add(codec.ToElement(new EffectSet([emitted]))[0].Clone()); targetId = null; break;
                case CompleteSessionEffect:
                    complete = true; targetId = world.SessionId; path = "status"; value = JsonSerializer.SerializeToElement("completed"); break;
                default: throw new ScenarioTurnValidationException("invalid_effect_variant");
            }
            applied.Add(new(effect.Type, targetId, path, value?.Clone()));
        }

        var objectPatches = mutableStates.Values.Where(item => item.Changed).Select(item => new ScenarioObjectPatch(
            item.Source.Id, item.Source.Revision, item.LocationId, JsonSerializer.SerializeToElement(item.State))).ToArray();
        var extension = rule.ModuleId is null ? null : BuildExtension(world, source, action, rule, decision, invocationId);
        var plan = new ScenarioEffectPlan(
            new(world.SessionRevision, currentLocationId, complete),
            flagsChanged ? new(world.SessionStateRevision, new ReadOnlyDictionary<string, bool>(flags)) : null,
            objectPatches, placements, applied, facts, events, hints, forbidden, complete, extension);
        ValidatePlan(world, plan);
        return new(rule, plan);
    }

    public RulePostState ProjectPostState(ScenarioRuleWorldSnapshot world, ScenarioEffectPlan plan)
    {
        var patches = plan.Objects.ToDictionary(item => item.ObjectId, StringComparer.Ordinal);
        var location = world.Locations.Single(item => item.Id == plan.Session.CurrentLocationId);
        var objects = world.Objects.Select(item =>
        {
            var state = patches.TryGetValue(item.Id, out var patch) ? patch.State : item.State;
            var locationId = patches.TryGetValue(item.Id, out patch) ? patch.LocationId : item.LocationId;
            var revision = patches.ContainsKey(item.Id) ? item.Revision + 1 : item.Revision;
            return new { Item = item, State = state, LocationId = locationId, Revision = revision };
        }).Where(item => item.Item.IsGlobal || item.LocationId == location.Id)
          .Select(item => new RulePublicObject(item.Item.Id, item.Item.Code, item.Item.Name, item.LocationId,
              item.Item.IsGlobal, item.Revision, projector.Project(item.Item, item.State))).ToArray();
        return new(ScenarioTurnSchemas.PostStateNarrative,
            new(location.Id, location.Code, location.Name, location.Description), objects,
            plan.SessionState?.Flags ?? world.SessionFlags,
            plan.SessionState is null ? world.SessionStateRevision : world.SessionStateRevision + 1);
    }

    private static ScenarioEffectPlan EmptyPlan(ScenarioRuleWorldSnapshot world) => new(
        new(world.SessionRevision, world.CurrentLocationId, false), null, [], [], [], [], [], [], [], false, null);

    private static ScenarioExtensionRequest BuildExtension(
        ScenarioRuleWorldSnapshot world, ScenarioRuleObjectSnapshot source, ResolvedScenarioAction action,
        ResolvedScenarioRule rule, RuleActionDecisionResult decision, string invocationId)
    {
        if (string.IsNullOrWhiteSpace(rule.ModuleVersion) || string.IsNullOrWhiteSpace(rule.ModuleDigest) || rule.ModuleConfiguration is null)
            throw new ScenarioTurnValidationException("invalid_extension_binding");
        return new ScenarioExtensionRequest(
            invocationId, world.OwnerId, world.SessionId, source.Id, action.ObjectTypeId, action.Id, rule.Id,
            rule.ModuleId!, rule.ModuleVersion, rule.ModuleDigest, rule.ModuleConfiguration.Value.Clone(),
            decision.Arguments.Clone(), source.State.Clone());
    }

    private static void ValidatePlan(ScenarioRuleWorldSnapshot world, ScenarioEffectPlan plan)
    {
        if (plan.Session.ExpectedRevision != world.SessionRevision || world.Locations.All(item => item.Id != plan.Session.CurrentLocationId))
            throw new ScenarioTurnValidationException("invalid_session_patch");
        if (plan.SessionState is { } state && state.ExpectedRevision != world.SessionStateRevision)
            throw new ScenarioTurnValidationException("invalid_session_state_patch");
        var duplicates = plan.Objects.GroupBy(item => item.ObjectId, StringComparer.Ordinal).FirstOrDefault(group => group.Count() > 1);
        if (duplicates is not null) throw new ScenarioTurnValidationException("duplicate_object_patch");
        foreach (var patch in plan.Objects)
        {
            var source = world.Objects.SingleOrDefault(item => item.Id == patch.ObjectId)
                ?? throw new ScenarioTurnValidationException("invalid_effect_object");
            if (source.Revision != patch.ExpectedRevision) throw new ScenarioTurnValidationException("stale_object_revision");
            if (world.Locations.All(item => item.Id != patch.LocationId) || patch.State.ValueKind != JsonValueKind.Object)
                throw new ScenarioTurnValidationException("invalid_object_patch");
        }
    }

    private static ScenarioRuleObjectSnapshot ResolveObject(ScenarioRuleWorldSnapshot world, ScenarioRuleObjectSnapshot source, string? code, string? id)
    {
        var reference = code ?? id;
        if (string.IsNullOrWhiteSpace(reference)) return source;
        return world.Objects.SingleOrDefault(item => item.Code == reference || item.Id == reference)
            ?? throw new ScenarioTurnValidationException("invalid_effect_object");
    }

    private static ScenarioRuleLocationSnapshot ResolveLocation(ScenarioRuleWorldSnapshot world, string? code, string? id)
    {
        var reference = code ?? id;
        return world.Locations.SingleOrDefault(item => item.Code == reference || item.Id == reference)
            ?? throw new ScenarioTurnValidationException("invalid_move_target");
    }

    private static string ValidateStatePath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) || !path.StartsWith("state.", StringComparison.Ordinal))
            throw new ScenarioTurnValidationException("invalid_effect_path");
        var remainder = path["state.".Length..];
        if (remainder.Length == 0 || remainder.Split('.', StringSplitOptions.None).Any(string.IsNullOrWhiteSpace))
            throw new ScenarioTurnValidationException("invalid_effect_path");
        return remainder;
    }

    private static void ApplyState(MutableObject target, string type, string path, JsonElement value)
    {
        var segments = path.Split('.');
        JsonObject parent = target.State;
        for (var index = 0; index < segments.Length - 1; index++)
        {
            if (parent[segments[index]] is not JsonObject nested) throw new ScenarioTurnValidationException("invalid_effect_path");
            parent = nested;
        }
        var key = segments[^1];
        if (!parent.TryGetPropertyValue(key, out var current) || current is null)
            throw new ScenarioTurnValidationException("invalid_effect_path");
        var next = JsonNode.Parse(value.GetRawText());
        switch (type)
        {
            case "set-state":
                if (!Compatible(current, next)) throw new ScenarioTurnValidationException("invalid_effect_value");
                parent[key] = next; break;
            case "increment-state":
                if (!TryDecimal(current, out var existing) || value.ValueKind != JsonValueKind.Number || !value.TryGetDecimal(out var increment))
                    throw new ScenarioTurnValidationException("invalid_effect_value");
                parent[key] = existing + increment; break;
            case "append-set":
            case "remove-set":
                if (current is not JsonArray array || next is null) throw new ScenarioTurnValidationException("invalid_effect_value");
                var match = array.FirstOrDefault(item => JsonNode.DeepEquals(item, next));
                if (type == "remove-set") { if (match is not null) array.Remove(match); }
                else if (match is null) array.Add(next);
                break;
            default: throw new ScenarioTurnValidationException("invalid_effect_variant");
        }
        target.Changed = true;
    }

    private static bool Compatible(JsonNode current, JsonNode? next)
    {
        if (next is null) return false;
        if (current is JsonObject) return next is JsonObject;
        if (current is JsonArray) return next is JsonArray;
        if (current is not JsonValue currentValue || next is not JsonValue nextValue) return false;
        if (TryDecimal(currentValue, out _) && TryDecimal(nextValue, out _)) return true;
        if (currentValue.TryGetValue<bool>(out _) && nextValue.TryGetValue<bool>(out _)) return true;
        if (currentValue.TryGetValue<string>(out _) && nextValue.TryGetValue<string>(out _)) return true;
        return false;
    }

    private static bool TryDecimal(JsonNode node, out decimal value)
    {
        value = default;
        return node is JsonValue jsonValue && jsonValue.TryGetValue(out value);
    }

    private static string RequiredText(string? text) =>
        !string.IsNullOrWhiteSpace(text) ? text : throw new ScenarioTurnValidationException("invalid_effect_text");

    private sealed class MutableObject(ScenarioRuleObjectSnapshot source, JsonObject state)
    {
        public ScenarioRuleObjectSnapshot Source { get; } = source;
        public JsonObject State { get; } = state;
        public string LocationId { get; set; } = source.LocationId;
        public bool Changed { get; set; }
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
