using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

using Myriale.Api.Domain.Scenarios;

namespace Myriale.Api.Services;

public sealed record ResolvedScenarioAction(
    string Id, string Code, string Label, string Description, string ArgumentSchemaJson,
    string AvailabilityConditionJson, string Visibility, string ExecutionMode,
    int SourceRank, string SourceCode, string ObjectTypeId)
{
    public ConditionExpression AvailabilityCondition => ConditionExpression.FromJson(AvailabilityConditionJson);
}

public sealed record ResolvedScenarioRule(
    string Id, string RuleCode, string ActionCode, string ConditionJson, int Priority, int SourceRank, string SourceCode,
    string? AuthoringNote, string EffectsJson, string? ModuleId, string? ModuleVersion, string? ModuleDigest, string? ModuleConfigurationJson)
{
    public ConditionExpression Condition => ConditionExpression.FromJson(ConditionJson);
    public EffectSet Effects => EffectSet.FromJson(EffectsJson);
}

public sealed record ResolvedRuleConfiguration(
    IReadOnlyList<ScenarioObjectType> Mixins, JsonObject StateSchema, JsonObject DefaultState,
    IReadOnlySet<string> PublicFields, IReadOnlyList<ResolvedScenarioAction> Actions,
    IReadOnlyList<ResolvedScenarioRule> Rules, IReadOnlyList<string> Conflicts);

public sealed class ScenarioRuleConfigurationResolver
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public IReadOnlyList<string> MixinCodes(ScenarioObject item) => Deserialize<List<string>>(item.MixinTypeCodesJson) ?? [];

    public ResolvedRuleConfiguration Resolve(ScenarioDefinitionVersion definition, ScenarioObject item)
    {
        var conflicts = new List<string>();
        var byCode = definition.ObjectTypes.ToDictionary(type => type.Code, StringComparer.Ordinal);
        var codes = MixinCodes(item);
        var mixins = new List<ScenarioObjectType>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var code in codes)
        {
            if (!seen.Add(code)) { conflicts.Add($"duplicate mixin '{code}'"); continue; }
            if (!byCode.TryGetValue(code, out var type)) { conflicts.Add($"missing mixin '{code}'"); continue; }
            mixins.Add(type);
        }

        var schema = new JsonObject { ["type"] = "object", ["additionalProperties"] = false, ["properties"] = new JsonObject(), ["required"] = new JsonArray() };
        var properties = (JsonObject)schema["properties"]!;
        var required = (JsonArray)schema["required"]!;
        var defaults = new JsonObject();
        var visibility = new Dictionary<string, bool>(StringComparer.Ordinal);
        var actions = new Dictionary<string, ResolvedScenarioAction>(StringComparer.Ordinal);
        var candidates = new Dictionary<(string TypeCode, string RuleCode), ResolvedScenarioRule>();

        for (var rank = 0; rank < mixins.Count; rank++)
        {
            var type = mixins[rank];
            MergeState(type.StateSchemaJson, type.DefaultStateJson, type.PublicProjectionJson, type.Code, properties, required, defaults, visibility, conflicts);
            foreach (var action in type.Actions)
            {
                var resolved = new ResolvedScenarioAction(action.Id, action.Code, action.Label, action.Description, action.ArgumentSchemaJson,
                    action.AvailabilityConditionJson, action.Visibility.ToWireValue(), action.ExecutionMode.ToWireValue(), rank, type.Code, type.Id);
                if (actions.TryGetValue(action.Code, out var existing) && !SameContract(existing, resolved))
                    conflicts.Add($"action '{action.Code}' differs between '{existing.SourceCode}' and '{type.Code}'");
                else actions[action.Code] = resolved;
            }
            foreach (var rule in Deserialize<List<ScenarioActionRule>>(type.GenericActionRulesJson) ?? [])
            {
                var key = (type.Code, rule.Code);
                if (!candidates.TryAdd(key, FromGeneric(rule, rank, type.Code))) conflicts.Add($"duplicate rule target '{type.Code}/{rule.Code}'");
            }
        }

        var localRank = mixins.Count;
        MergeState(item.LocalStateSchemaJson, item.LocalDefaultStateJson, item.LocalPublicProjectionJson, "object", properties, required, defaults, visibility, conflicts);
        foreach (var action in Deserialize<List<ScenarioObjectTypeActionInput>>(item.LocalActionsJson) ?? [])
        {
            var resolved = new ResolvedScenarioAction(OpaqueId(item.Id, action.Code), action.Code, action.Label, action.Description ?? string.Empty,
                Raw(action.ArgumentSchema, "{}"), Raw(action.AvailabilityCondition), action.Visibility, action.ExecutionMode,
                localRank, "object", item.Id);
            if (actions.TryGetValue(action.Code, out var existing) && !SameContract(existing, resolved))
                conflicts.Add($"action '{action.Code}' differs between '{existing.SourceCode}' and object");
            else actions[action.Code] = resolved;
        }

        var mutations = Deserialize<List<ScenarioObjectRuleMutationInput>>(item.ActionRuleMutationsJson) ?? [];
        var mutatedTargets = new HashSet<(string TypeCode, string RuleCode)>();
        foreach (var mutation in mutations.Where(rule => rule.Operation != ScenarioRuleMutationOperation.Add))
        {
            var key = (mutation.TargetTypeCode ?? string.Empty, mutation.TargetRuleCode ?? string.Empty);
            if (!mutatedTargets.Add(key)) { conflicts.Add($"conflicting mutation chain for '{key.Item1}/{key.Item2}'"); continue; }
            if (!candidates.TryGetValue(key, out var generic)) { conflicts.Add($"missing rule target '{key.Item1}/{key.Item2}'"); continue; }
            switch (mutation.Operation)
            {
                case ScenarioRuleMutationOperation.Delete: candidates.Remove(key); break;
                case ScenarioRuleMutationOperation.Override: candidates[key] = FromReplacement(mutation, generic, item.Id); break;
                case ScenarioRuleMutationOperation.Adjust: candidates[key] = FromAdjustment(mutation, generic); break;
                default: conflicts.Add($"invalid rule mutation operation '{mutation.Operation}'"); break;
            }
        }

        var rules = candidates.Values.ToList();
        foreach (var addition in mutations.Where(rule => rule.Operation == ScenarioRuleMutationOperation.Add))
            rules.Add(FromAddition(addition, localRank, item.Id));

        return new(mixins, schema, defaults, visibility.Where(pair => pair.Value).Select(pair => pair.Key).ToHashSet(StringComparer.Ordinal),
            actions.Values.OrderBy(action => action.Code).ToList(), rules, conflicts);
    }

    public JsonObject InitialState(ScenarioDefinitionVersion definition, ScenarioObject item)
    {
        var resolved = Resolve(definition, item);
        var state = (JsonObject)resolved.DefaultState.DeepClone();
        foreach (var pair in ParseObject(item.InitialStateOverrideJson)) state[pair.Key] = pair.Value?.DeepClone();
        return state;
    }

    private static ResolvedScenarioRule FromGeneric(ScenarioActionRule rule, int rank, string typeCode) =>
        new(OpaqueId(typeCode, rule.Code), rule.Code, rule.ActionCode, Raw(rule.Condition), rule.Priority, rank, typeCode,
            rule.AuthoringNote, Raw(rule.Effects), rule.ModuleBinding?.ModuleId, rule.ModuleBinding?.Version, rule.ModuleBinding?.Digest,
            rule.ModuleBinding is null ? null : Raw(rule.ModuleBinding.Configuration, "{}"));

    private static ResolvedScenarioRule FromReplacement(ScenarioObjectRuleMutationInput mutation, ResolvedScenarioRule generic, string objectId) =>
        new(OpaqueId(objectId, $"override:{generic.SourceCode}:{generic.RuleCode}"), generic.RuleCode, mutation.ActionCode!, Raw(mutation.Condition!),
            mutation.Priority!.Value, generic.SourceRank, "object", mutation.AuthoringNote, Raw(mutation.Effects!), mutation.ModuleBinding?.ModuleId,
            mutation.ModuleBinding?.Version, mutation.ModuleBinding?.Digest, mutation.ModuleBinding is null ? null : Raw(mutation.ModuleBinding.Configuration, "{}"));

    private static ResolvedScenarioRule FromAdjustment(ScenarioObjectRuleMutationInput mutation, ResolvedScenarioRule generic) => generic with
    {
        ConditionJson = mutation.ConditionSpecified && mutation.Condition is { } condition ? Raw(condition) : generic.ConditionJson,
        Priority = mutation.PrioritySpecified && mutation.Priority is { } priority ? priority : generic.Priority,
        AuthoringNote = mutation.AuthoringNoteSpecified ? mutation.AuthoringNote : generic.AuthoringNote,
        EffectsJson = mutation.EffectsSpecified && mutation.Effects is { } effects ? Raw(effects) : generic.EffectsJson,
        ModuleId = mutation.ModuleBindingSpecified ? mutation.ModuleBinding?.ModuleId : generic.ModuleId,
        ModuleVersion = mutation.ModuleBindingSpecified ? mutation.ModuleBinding?.Version : generic.ModuleVersion,
        ModuleDigest = mutation.ModuleBindingSpecified ? mutation.ModuleBinding?.Digest : generic.ModuleDigest,
        ModuleConfigurationJson = mutation.ModuleBindingSpecified
            ? mutation.ModuleBinding is null ? null : Raw(mutation.ModuleBinding.Configuration, "{}")
            : generic.ModuleConfigurationJson,
    };

    private static ResolvedScenarioRule FromAddition(ScenarioObjectRuleMutationInput mutation, int rank, string objectId) =>
        new(OpaqueId(objectId, $"add:{mutation.Code}"), mutation.Code!, mutation.ActionCode!, Raw(mutation.Condition!), mutation.Priority!.Value,
            rank, "object", mutation.AuthoringNote, Raw(mutation.Effects!), mutation.ModuleBinding?.ModuleId, mutation.ModuleBinding?.Version,
            mutation.ModuleBinding?.Digest, mutation.ModuleBinding is null ? null : Raw(mutation.ModuleBinding.Configuration, "{}"));

    private static void MergeState(string schemaJson, string defaultsJson, string projectionJson, string source,
        JsonObject properties, JsonArray required, JsonObject defaults, IDictionary<string, bool> visibility, ICollection<string> conflicts)
    {
        var schema = ParseObject(schemaJson);
        var incoming = schema["properties"] as JsonObject;
        if (incoming is not null)
            foreach (var pair in incoming)
            {
                if (properties.TryGetPropertyValue(pair.Key, out var existing) && !JsonNode.DeepEquals(existing, pair.Value))
                    conflicts.Add($"state '{pair.Key}' differs at '{source}'");
                else if (existing is null) { properties[pair.Key] = pair.Value?.DeepClone(); required.Add(pair.Key); }
            }
        foreach (var pair in ParseObject(defaultsJson)) defaults[pair.Key] = pair.Value?.DeepClone();
        var projection = ParseObject(projectionJson);
        if (projection["include"] is JsonArray include)
        {
            var included = include.Select(node => node?.GetValue<string>()).OfType<string>().ToHashSet(StringComparer.Ordinal);
            foreach (var name in incoming?.Select(pair => pair.Key) ?? []) visibility[name] = included.Contains(name);
        }
        if (projection["exclude"] is JsonArray exclude)
            foreach (var name in exclude.Select(node => node?.GetValue<string>()).OfType<string>()) visibility[name] = false;
    }

    private static bool SameContract(ResolvedScenarioAction left, ResolvedScenarioAction right) =>
        left.Code == right.Code && left.Label == right.Label && left.Description == right.Description
        && JsonEqual(left.ArgumentSchemaJson, right.ArgumentSchemaJson) && JsonEqual(left.AvailabilityConditionJson, right.AvailabilityConditionJson)
        && left.Visibility == right.Visibility && left.ExecutionMode == right.ExecutionMode;

    private static bool JsonEqual(string left, string right) => JsonNode.DeepEquals(JsonNode.Parse(left), JsonNode.Parse(right));
    private static string OpaqueId(string scope, string code) => "RA-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{scope}\n{code}")))[..24];
    private static T? Deserialize<T>(string json) => string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json, Json);
    private static JsonObject ParseObject(string json) => JsonNode.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json) as JsonObject ?? [];
    private static string Raw(ConditionExpression condition) => JsonSerializer.Serialize(condition, Json);
    private static string Raw(EffectSet effects) => JsonSerializer.Serialize(effects, Json);
    private static string Raw(JsonElement element, string fallback) => element.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? fallback : element.GetRawText();
}
