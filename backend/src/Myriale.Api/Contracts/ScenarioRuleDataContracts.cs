using System.Text.Json;
using System.Text.Json.Serialization;

namespace Myriale.Api.Contracts;

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
    IReadOnlyList<ScenarioGenericActionRuleInput>? ActionRules = null);

public sealed record ScenarioObjectTypeActionInput(
    string Code,
    string Label,
    string? Description,
    JsonElement ArgumentSchema,
    JsonElement AvailabilityCondition,
    string Visibility,
    string ExecutionMode);

public sealed record ScenarioObjectInput(
    string Code,
    string Name,
    string LocationCode,
    JsonElement InitialStateOverride,
    bool IsGlobal,
    IReadOnlyList<ScenarioObjectRuleMutationInput> ActionRules,
    IReadOnlyList<string> MixinTypeCodes,
    JsonElement StateSchema,
    JsonElement DefaultState,
    JsonElement PublicProjection,
    IReadOnlyList<ScenarioObjectTypeActionInput> Actions);

public sealed record ScenarioGenericActionRuleInput(
    string Code,
    string ActionCode,
    JsonElement Condition,
    int Priority,
    string? AuthoringNote,
    JsonElement Effects,
    ScenarioModuleBindingInput? ModuleBinding);

[JsonConverter(typeof(ScenarioObjectRuleMutationInputJsonConverter))]
public sealed class ScenarioObjectRuleMutationInput
{
    private string? _authoringNote;
    private ScenarioModuleBindingInput? _moduleBinding;

    public string Operation { get; set; } = string.Empty;
    public string? TargetTypeCode { get; set; }
    public string? TargetRuleCode { get; set; }
    public string? Code { get; set; }
    public string? ActionCode { get; set; }
    public JsonElement? Condition { get; set; }
    public int? Priority { get; set; }
    public string? AuthoringNote
    {
        get => _authoringNote;
        set { _authoringNote = value; AuthoringNoteSpecified = true; }
    }
    public JsonElement? Effects { get; set; }
    public ScenarioModuleBindingInput? ModuleBinding
    {
        get => _moduleBinding;
        set { _moduleBinding = value; ModuleBindingSpecified = true; }
    }

    [JsonIgnore] public bool AuthoringNoteSpecified { get; private set; }
    [JsonIgnore] public bool ModuleBindingSpecified { get; private set; }
}

public sealed class ScenarioObjectRuleMutationInputJsonConverter : JsonConverter<ScenarioObjectRuleMutationInput>
{
    public override ScenarioObjectRuleMutationInput Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object) throw new JsonException("A rule mutation must be a JSON object.");
        var result = new ScenarioObjectRuleMutationInput
        {
            Operation = String(root, "operation") ?? string.Empty,
            TargetTypeCode = String(root, "targetTypeCode"),
            TargetRuleCode = String(root, "targetRuleCode"),
            Code = String(root, "code"),
            ActionCode = String(root, "actionCode"),
            Condition = Element(root, "condition"),
            Priority = root.TryGetProperty("priority", out var priority) && priority.ValueKind == JsonValueKind.Number ? priority.GetInt32() : null,
            Effects = Element(root, "effects"),
        };
        if (root.TryGetProperty("authoringNote", out var note)) result.AuthoringNote = note.ValueKind == JsonValueKind.Null ? null : note.GetString();
        if (root.TryGetProperty("moduleBinding", out var binding))
            result.ModuleBinding = binding.ValueKind == JsonValueKind.Null ? null : binding.Deserialize<ScenarioModuleBindingInput>(options);
        return result;
    }

    public override void Write(Utf8JsonWriter writer, ScenarioObjectRuleMutationInput value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("operation", value.Operation);
        WriteString(writer, "targetTypeCode", value.TargetTypeCode);
        WriteString(writer, "targetRuleCode", value.TargetRuleCode);
        WriteString(writer, "code", value.Code);
        WriteString(writer, "actionCode", value.ActionCode);
        if (value.Condition is { } condition) { writer.WritePropertyName("condition"); condition.WriteTo(writer); }
        if (value.Priority is { } priority) writer.WriteNumber("priority", priority);
        if (value.AuthoringNoteSpecified) { writer.WritePropertyName("authoringNote"); JsonSerializer.Serialize(writer, value.AuthoringNote, options); }
        if (value.Effects is { } effects) { writer.WritePropertyName("effects"); effects.WriteTo(writer); }
        if (value.ModuleBindingSpecified) { writer.WritePropertyName("moduleBinding"); JsonSerializer.Serialize(writer, value.ModuleBinding, options); }
        writer.WriteEndObject();
    }

    private static string? String(JsonElement root, string name) => root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static JsonElement? Element(JsonElement root, string name) => root.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null ? value.Clone() : null;
    private static void WriteString(Utf8JsonWriter writer, string name, string? value) { if (value is not null) writer.WriteString(name, value); }
}

public sealed record ScenarioModuleBindingInput(
    string ModuleId,
    string Version,
    string Digest,
    JsonElement Configuration);

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
