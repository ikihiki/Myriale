using System.Text.Json;
using System.Text.Json.Nodes;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed record ResolvedProfileField(
    string Code,
    JsonObject Schema,
    bool Required,
    IReadOnlyList<string> Sources);

public sealed record ResolvedProfileConfiguration(
    IReadOnlyList<ScenarioObjectType> Mixins,
    IReadOnlyList<ResolvedProfileField> Fields,
    JsonObject Defaults,
    JsonObject EntityValues,
    JsonObject EffectiveValues,
    IReadOnlyDictionary<string, string> EffectiveValueSources,
    IReadOnlyList<string> Conflicts);

public sealed class ScenarioProfileConfigurationResolver
{
    private sealed class FieldState(JsonObject schema, bool required, string source)
    {
        public JsonObject Schema { get; set; } = schema;
        public bool Required { get; set; } = required;
        public List<string> Sources { get; } = [source];
    }

    public ResolvedProfileConfiguration Resolve(ScenarioDefinitionVersion definition, ScenarioObject item)
    {
        var conflicts = new List<string>();
        var byCode = definition.ObjectTypes.ToDictionary(type => type.Code, StringComparer.Ordinal);
        var mixins = new List<ScenarioObjectType>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var code in Deserialize<List<string>>(item.MixinTypeCodesJson) ?? [])
        {
            if (!seen.Add(code)) { conflicts.Add($"duplicate mixin '{code}'"); continue; }
            if (!byCode.TryGetValue(code, out var type)) { conflicts.Add($"missing mixin '{code}'"); continue; }
            mixins.Add(type);
        }

        var fields = new Dictionary<string, FieldState>(StringComparer.Ordinal);
        var defaults = new JsonObject();
        var defaultSources = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var type in mixins)
            Merge(type.ProfileSchemaJson, type.ProfileDefaultsJson, type.Code, fields, defaults, defaultSources, conflicts);
        Merge(item.LocalProfileSchemaJson, item.LocalProfileDefaultsJson, "object", fields, defaults, defaultSources, conflicts);

        var entityValues = ParseObject(item.ProfileValuesJson);
        var effective = (JsonObject)defaults.DeepClone();
        var effectiveSources = new Dictionary<string, string>(defaultSources, StringComparer.Ordinal);
        foreach (var pair in entityValues)
        {
            effective[pair.Key] = pair.Value?.DeepClone();
            effectiveSources[pair.Key] = "entity";
        }

        return new(
            mixins,
            fields.OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .Select(pair => new ResolvedProfileField(pair.Key, (JsonObject)pair.Value.Schema.DeepClone(), pair.Value.Required, pair.Value.Sources.ToArray()))
                .ToList(),
            defaults,
            (JsonObject)entityValues.DeepClone(),
            effective,
            effectiveSources,
            conflicts);
    }

    internal static string ContractFingerprint(JsonObject schema)
    {
        var contract = new JsonObject();
        foreach (var name in new[] { "type", "minLength", "maxLength", "minimum", "maximum" })
            if (schema[name] is { } value) contract[name] = value.DeepClone();
        if (schema["enum"] is JsonArray values)
            contract["enum"] = new JsonArray(values.Select(value => value?.DeepClone()).OrderBy(value => value?.ToJsonString(), StringComparer.Ordinal).ToArray());
        return contract.ToJsonString();
    }

    private static void Merge(
        string schemaJson,
        string defaultsJson,
        string source,
        IDictionary<string, FieldState> fields,
        JsonObject defaults,
        IDictionary<string, string> defaultSources,
        ICollection<string> conflicts)
    {
        var schema = ParseObject(schemaJson);
        var required = (schema["required"] as JsonArray)?.Select(value => value?.GetValue<string>()).OfType<string>().ToHashSet(StringComparer.Ordinal)
            ?? new HashSet<string>(StringComparer.Ordinal);
        if (schema["properties"] is JsonObject properties)
        {
            foreach (var pair in properties)
            {
                if (pair.Value is not JsonObject fieldSchema) continue;
                if (fields.TryGetValue(pair.Key, out var existing))
                {
                    if (!StringComparer.Ordinal.Equals(ContractFingerprint(existing.Schema), ContractFingerprint(fieldSchema)))
                    {
                        conflicts.Add($"profile field '{pair.Key}' differs at '{source}'");
                        continue;
                    }
                    existing.Schema = (JsonObject)fieldSchema.DeepClone();
                    existing.Required |= required.Contains(pair.Key);
                    existing.Sources.Add(source);
                }
                else
                {
                    fields[pair.Key] = new FieldState((JsonObject)fieldSchema.DeepClone(), required.Contains(pair.Key), source);
                }
            }
        }

        foreach (var pair in ParseObject(defaultsJson))
        {
            defaults[pair.Key] = pair.Value?.DeepClone();
            defaultSources[pair.Key] = source;
        }
    }

    private static T? Deserialize<T>(string json) => string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json);
    private static JsonObject ParseObject(string json) => JsonNode.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json) as JsonObject ?? [];
}
