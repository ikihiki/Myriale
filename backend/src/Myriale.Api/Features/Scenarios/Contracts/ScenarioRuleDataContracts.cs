using System.Text.Json;
using System.Text.Json.Serialization;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.Scenarios.Contracts;

public sealed record ScenarioRuleDataRequest(
    int SchemaVersion,
    IReadOnlyList<ScenarioLocationInput> Locations,
    IReadOnlyList<ScenarioObjectTypeInput> ObjectTypes,
    IReadOnlyList<ScenarioObjectInput> Objects,
    [property: JsonRequired] string StartLocationCode);

public sealed record ScenarioLocationInput(string Code, string Name, string? Description, JsonElement AuthoringData);

public sealed record ScenarioObjectTypeInput(
    string Code,
    string Name,
    string? Description,
    int SchemaVersion,
    JsonElement StateSchema,
    JsonElement DefaultState,
    JsonElement PublicProjection,
    IReadOnlyList<ScenarioObjectTypeActionInput> Actions,
    IReadOnlyList<ScenarioActionRule>? ActionRules = null);

public sealed record ScenarioObjectTypeActionInput(
    string Code,
    string Label,
    string? Description,
    JsonElement ArgumentSchema,
    ConditionExpression AvailabilityCondition,
    string Visibility,
    string ExecutionMode);

public sealed record ScenarioObjectInput(
    string Code,
    string Name,
    string ProfileMarkdown,
    string LocationCode,
    JsonElement InitialStateOverride,
    bool IsGlobal,
    IReadOnlyList<ScenarioObjectRuleMutationInput> ActionRules,
    IReadOnlyList<string> MixinTypeCodes,
    JsonElement StateSchema,
    JsonElement DefaultState,
    JsonElement PublicProjection,
    IReadOnlyList<ScenarioObjectTypeActionInput> Actions);

public enum ScenarioRuleMutationOperation { Add, Override, Delete, Adjust }

[JsonConverter(typeof(ScenarioObjectRuleMutationInputJsonConverter))]
public sealed class ScenarioObjectRuleMutationInput
{
    private ConditionExpression? _condition;
    private int? _priority;
    private string? _authoringNote;
    private EffectSet? _effects;
    private ScenarioModuleBinding? _moduleBinding;

    public ScenarioRuleMutationOperation Operation { get; set; }
    public string? TargetTypeCode { get; set; }
    public string? TargetRuleCode { get; set; }
    public string? Code { get; set; }
    public string? ActionCode { get; set; }
    public ConditionExpression? Condition
    {
        get => _condition;
        set { _condition = value; ConditionSpecified = true; }
    }
    public int? Priority
    {
        get => _priority;
        set { _priority = value; PrioritySpecified = true; }
    }
    public string? AuthoringNote
    {
        get => _authoringNote;
        set { _authoringNote = value; AuthoringNoteSpecified = true; }
    }
    public EffectSet? Effects
    {
        get => _effects;
        set { _effects = value; EffectsSpecified = true; }
    }
    public ScenarioModuleBinding? ModuleBinding
    {
        get => _moduleBinding;
        set { _moduleBinding = value; ModuleBindingSpecified = true; }
    }

    [JsonIgnore] public bool ConditionSpecified { get; private set; }
    [JsonIgnore] public bool PrioritySpecified { get; private set; }
    [JsonIgnore] public bool AuthoringNoteSpecified { get; private set; }
    [JsonIgnore] public bool EffectsSpecified { get; private set; }
    [JsonIgnore] public bool ModuleBindingSpecified { get; private set; }
}

public sealed class ScenarioObjectRuleMutationInputJsonConverter : JsonConverter<ScenarioObjectRuleMutationInput>
{
    public override ScenarioObjectRuleMutationInput Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object) throw new JsonException("A rule mutation must be a JSON object.");
        var operation = String(root, "operation") ?? throw new JsonException("A rule mutation operation is required.");
        var result = new ScenarioObjectRuleMutationInput
        {
            Operation = operation switch
            {
                "add" => ScenarioRuleMutationOperation.Add,
                "override" => ScenarioRuleMutationOperation.Override,
                "delete" => ScenarioRuleMutationOperation.Delete,
                "adjust" => ScenarioRuleMutationOperation.Adjust,
                _ => throw new JsonException($"Unsupported rule mutation operation '{operation}'."),
            },
            TargetTypeCode = String(root, "targetTypeCode"),
            TargetRuleCode = String(root, "targetRuleCode"),
            Code = String(root, "code"),
            ActionCode = String(root, "actionCode"),
        };
        if (root.TryGetProperty("condition", out var condition))
            result.Condition = condition.ValueKind == JsonValueKind.Null ? null : condition.Deserialize<ConditionExpression>(options);
        if (root.TryGetProperty("priority", out var priority))
            result.Priority = priority.ValueKind == JsonValueKind.Null ? null : priority.GetInt32();
        if (root.TryGetProperty("authoringNote", out var note)) result.AuthoringNote = note.ValueKind == JsonValueKind.Null ? null : note.GetString();
        if (root.TryGetProperty("effects", out var effects))
            result.Effects = effects.ValueKind == JsonValueKind.Null ? null : effects.Deserialize<EffectSet>(options);
        if (root.TryGetProperty("moduleBinding", out var binding))
            result.ModuleBinding = binding.ValueKind == JsonValueKind.Null ? null : binding.Deserialize<ScenarioModuleBinding>(options);
        return result;
    }

    public override void Write(Utf8JsonWriter writer, ScenarioObjectRuleMutationInput value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("operation", value.Operation switch
        {
            ScenarioRuleMutationOperation.Add => "add",
            ScenarioRuleMutationOperation.Override => "override",
            ScenarioRuleMutationOperation.Delete => "delete",
            ScenarioRuleMutationOperation.Adjust => "adjust",
            _ => throw new JsonException($"Unsupported rule mutation operation '{value.Operation}'."),
        });
        WriteString(writer, "targetTypeCode", value.TargetTypeCode);
        WriteString(writer, "targetRuleCode", value.TargetRuleCode);
        WriteString(writer, "code", value.Code);
        WriteString(writer, "actionCode", value.ActionCode);
        if (value.ConditionSpecified) { writer.WritePropertyName("condition"); JsonSerializer.Serialize(writer, value.Condition, options); }
        if (value.PrioritySpecified) { writer.WritePropertyName("priority"); JsonSerializer.Serialize(writer, value.Priority, options); }
        if (value.AuthoringNoteSpecified) { writer.WritePropertyName("authoringNote"); JsonSerializer.Serialize(writer, value.AuthoringNote, options); }
        if (value.EffectsSpecified) { writer.WritePropertyName("effects"); JsonSerializer.Serialize(writer, value.Effects, options); }
        if (value.ModuleBindingSpecified) { writer.WritePropertyName("moduleBinding"); JsonSerializer.Serialize(writer, value.ModuleBinding, options); }
        writer.WriteEndObject();
    }

    private static string? String(JsonElement root, string name) => root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static void WriteString(Utf8JsonWriter writer, string name, string? value) { if (value is not null) writer.WriteString(name, value); }
}

public sealed record ScenarioRuleDataResponse(
    string ScenarioId,
    string DefinitionVersionId,
    int Version,
    string Status,
    int SchemaVersion,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<ScenarioLocationInput> Locations,
    IReadOnlyList<ScenarioObjectTypeInput> ObjectTypes,
    IReadOnlyList<ScenarioObjectInput> Objects,
    string StartLocationCode);

public sealed record ScenarioDefinitionReadinessResponse(
    string DefinitionVersionId,
    bool Ready,
    IReadOnlyDictionary<string, string[]> Errors);
