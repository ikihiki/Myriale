using System.Text.Json;
using System.Text.Json.Serialization;

namespace Myriale.Api.Domain.Scenarios;

[JsonConverter(typeof(ConditionExpressionJsonConverter))]
public abstract record ConditionExpression
{
    public static ConditionExpression Empty { get; } = new AlwaysCondition();
    public static ConditionExpression FromJson(string json) => new ScenarioRuleJsonCodec().DecodeCondition(json);
}

public sealed record AlwaysCondition : ConditionExpression;
public sealed record AllCondition(IReadOnlyList<ConditionExpression> Conditions) : ConditionExpression;
public sealed record AnyCondition(IReadOnlyList<ConditionExpression> Conditions) : ConditionExpression;
public sealed record NotCondition(ConditionExpression Condition) : ConditionExpression;
public sealed record PredicateCondition(string Operator, string Path, JsonElement? Expected = null) : ConditionExpression;

[JsonConverter(typeof(EffectSetJsonConverter))]
public sealed record EffectSet(IReadOnlyList<ScenarioEffect> Effects)
{
    public static EffectSet Empty { get; } = new([]);
    public static EffectSet FromJson(string json) => new ScenarioRuleJsonCodec().DecodeEffects(json);
}

public abstract record ScenarioEffect(string Type);
public sealed record StateEffect(string EffectType, string? Path, JsonElement? Value, string? ObjectCode, string? ObjectId) : ScenarioEffect(EffectType);
public sealed record MoveObjectEffect(string? ObjectCode, string? ObjectId, string? LocationCode, string? LocationId) : ScenarioEffect("move-object");
public sealed record MoveSessionEffect(string? LocationCode, string? LocationId) : ScenarioEffect("move-session");
public sealed record SetSessionFlagEffect(string? Flag, bool? Value) : ScenarioEffect("set-session-flag");
public sealed record TextEffect(string EffectType, string? Text) : ScenarioEffect(EffectType);
public sealed record EmitEventEffect(
    string? Event, string? LocationCode, string? LocationId,
    IReadOnlyDictionary<string, JsonElement> Payload) : ScenarioEffect("emit-event");
public sealed record CompleteSessionEffect() : ScenarioEffect("complete-session");

public sealed record ScenarioModuleBinding(
    string ModuleId,
    string Version,
    string Digest,
    JsonElement Configuration);

public sealed record ScenarioActionRule(
    string Code,
    string ActionCode,
    ConditionExpression Condition,
    int Priority,
    string? AuthoringNote,
    EffectSet Effects,
    ScenarioModuleBinding? ModuleBinding);

public readonly record struct StateSchema(JsonElement Value);
public readonly record struct StateValue(JsonElement Value);
public readonly record struct PublicProjection(JsonElement Value);

public sealed class ScenarioRuleJsonCodec
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public ConditionExpression DecodeCondition(string json) =>
        JsonSerializer.Deserialize<ConditionExpression>(Fallback(json, "{}"), Options)
        ?? throw new JsonException("A condition is required.");

    public EffectSet DecodeEffects(string json) =>
        JsonSerializer.Deserialize<EffectSet>(Fallback(json, "[]"), Options)
        ?? throw new JsonException("An effect set is required.");

    public StateSchema DecodeSchema(string json) => new(Parse(json, "{}", JsonValueKind.Object));
    public StateValue DecodeState(string json) => new(Parse(json, "{}", JsonValueKind.Object));
    public PublicProjection DecodeProjection(string json) => new(Parse(json, "{}", JsonValueKind.Object));

    public string Encode(ConditionExpression value) => JsonSerializer.Serialize(value, Options);
    public string Encode(EffectSet value) => JsonSerializer.Serialize(value, Options);
    public string Encode(StateSchema value) => value.Value.GetRawText();
    public string Encode(StateValue value) => value.Value.GetRawText();
    public string Encode(PublicProjection value) => value.Value.GetRawText();
    public JsonElement ToElement(ConditionExpression value) => JsonSerializer.SerializeToElement(value, Options);
    public JsonElement ToElement(EffectSet value) => JsonSerializer.SerializeToElement(value, Options);
    public JsonElement ParseElement(string json) => Parse(json, "{}", null);

    private static string Fallback(string? json, string fallback) => string.IsNullOrWhiteSpace(json) ? fallback : json;

    private static JsonElement Parse(string? json, string fallback, JsonValueKind? requiredKind)
    {
        using var document = JsonDocument.Parse(Fallback(json, fallback));
        var value = document.RootElement.Clone();
        if (requiredKind is { } kind && value.ValueKind != kind)
            throw new JsonException($"Expected JSON {kind} but found {value.ValueKind}.");
        return value;
    }
}

public sealed class ConditionExpressionJsonConverter : JsonConverter<ConditionExpression>
{
    public override ConditionExpression Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        return Parse(document.RootElement);
    }

    public override void Write(Utf8JsonWriter writer, ConditionExpression value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        switch (value)
        {
            case AlwaysCondition:
                break;
            case AllCondition all:
                writer.WritePropertyName("and");
                WriteChildren(writer, all.Conditions, options);
                break;
            case AnyCondition any:
                writer.WritePropertyName("or");
                WriteChildren(writer, any.Conditions, options);
                break;
            case NotCondition not:
                writer.WritePropertyName("not");
                JsonSerializer.Serialize(writer, not.Condition, options);
                break;
            case PredicateCondition predicate:
                writer.WriteString("op", predicate.Operator);
                writer.WriteString("path", predicate.Path);
                if (predicate.Operator != "exists")
                {
                    writer.WritePropertyName("value");
                    if (predicate.Expected is { } expected) expected.WriteTo(writer); else writer.WriteNullValue();
                }
                break;
            default:
                throw new JsonException($"Unsupported condition variant '{value.GetType().Name}'.");
        }
        writer.WriteEndObject();
    }

    private static ConditionExpression Parse(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object) throw new JsonException("A condition must be a JSON object.");
        var properties = value.EnumerateObject().ToArray();
        if (properties.Length == 0) return ConditionExpression.Empty;
        if (properties.Length == 1 && properties[0].Name is "and" or "or")
        {
            if (properties[0].Value.ValueKind != JsonValueKind.Array) throw new JsonException($"Condition '{properties[0].Name}' must be an array.");
            var children = properties[0].Value.EnumerateArray().Select(Parse).ToArray();
            return properties[0].Name == "and" ? new AllCondition(children) : new AnyCondition(children);
        }
        if (properties.Length == 1 && properties[0].Name == "not") return new NotCondition(Parse(properties[0].Value));
        if (properties.Any(property => property.Name is not ("op" or "path" or "value")))
            throw new JsonException("Unsupported condition property.");
        if (!value.TryGetProperty("op", out var opElement) || opElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Condition operator is required.");
        if (!value.TryGetProperty("path", out var pathElement) || pathElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Condition path is required.");
        var op = opElement.GetString()!;
        if (op is not ("eq" or "ne" or "lt" or "lte" or "gt" or "gte" or "in" or "exists"))
            throw new JsonException($"Unsupported condition operator '{op}'.");
        if (op == "exists")
        {
            if (properties.Length != 2 || value.TryGetProperty("value", out _)) throw new JsonException("Exists conditions accept only op and path.");
            return new PredicateCondition(op, pathElement.GetString()!);
        }
        if (properties.Length != 3 || !value.TryGetProperty("value", out var expected))
            throw new JsonException("Comparison conditions require op, path, and value.");
        return new PredicateCondition(op, pathElement.GetString()!, expected.Clone());
    }

    private static void WriteChildren(Utf8JsonWriter writer, IReadOnlyList<ConditionExpression> conditions, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach (var condition in conditions) JsonSerializer.Serialize(writer, condition, options);
        writer.WriteEndArray();
    }
}

public sealed class EffectSetJsonConverter : JsonConverter<EffectSet>
{
    private static readonly HashSet<string> StateTypes = ["set-state", "increment-state", "append-set", "remove-set"];
    private static readonly HashSet<string> TextTypes = ["emit-fact", "add-narrative-hint", "forbid-narrative-fact"];

    public override EffectSet Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        if (document.RootElement.ValueKind != JsonValueKind.Array) throw new JsonException("Effects must be a JSON array.");
        return new(document.RootElement.EnumerateArray().Select(ParseEffect).ToArray());
    }

    public override void Write(Utf8JsonWriter writer, EffectSet value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach (var effect in value.Effects) WriteEffect(writer, effect);
        writer.WriteEndArray();
    }

    private static ScenarioEffect ParseEffect(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object || !value.TryGetProperty("type", out var typeElement) || typeElement.ValueKind != JsonValueKind.String)
            throw new JsonException("Effect type is required.");
        var type = typeElement.GetString()!;
        if (StateTypes.Contains(type))
        {
            RejectUnknown(value, "type", "path", "value", "objectCode", "objectId");
            return new StateEffect(type, String(value, "path"), Element(value, "value"), String(value, "objectCode"), String(value, "objectId"));
        }
        if (TextTypes.Contains(type))
        {
            RejectUnknown(value, "type", "text");
            return new TextEffect(type, String(value, "text"));
        }
        return type switch
        {
            "move-object" => ParseMoveObject(value),
            "move-session" => ParseMoveSession(value),
            "set-session-flag" => ParseFlag(value),
            "emit-event" => ParseEvent(value),
            "complete-session" => ParseComplete(value),
            _ => throw new JsonException($"Unsupported effect type '{type}'."),
        };
    }

    private static ScenarioEffect ParseMoveObject(JsonElement value)
    {
        RejectUnknown(value, "type", "objectCode", "objectId", "locationCode", "locationId");
        return new MoveObjectEffect(String(value, "objectCode"), String(value, "objectId"), String(value, "locationCode"), String(value, "locationId"));
    }

    private static ScenarioEffect ParseMoveSession(JsonElement value)
    {
        RejectUnknown(value, "type", "locationCode", "locationId");
        return new MoveSessionEffect(String(value, "locationCode"), String(value, "locationId"));
    }

    private static ScenarioEffect ParseFlag(JsonElement value)
    {
        RejectUnknown(value, "type", "flag", "value");
        bool? flagValue = value.TryGetProperty("value", out var element) && element.ValueKind is JsonValueKind.True or JsonValueKind.False ? element.GetBoolean() : null;
        return new SetSessionFlagEffect(String(value, "flag"), flagValue);
    }

    private static ScenarioEffect ParseEvent(JsonElement value)
    {
        var payload = value.EnumerateObject()
            .Where(property => property.Name is not ("type" or "event" or "locationCode" or "locationId"))
            .ToDictionary(property => property.Name, property => property.Value.Clone(), StringComparer.Ordinal);
        return new EmitEventEffect(String(value, "event"), String(value, "locationCode"), String(value, "locationId"), payload);
    }

    private static ScenarioEffect ParseComplete(JsonElement value)
    {
        RejectUnknown(value, "type");
        return new CompleteSessionEffect();
    }

    private static void WriteEffect(Utf8JsonWriter writer, ScenarioEffect effect)
    {
        writer.WriteStartObject();
        writer.WriteString("type", effect.Type);
        switch (effect)
        {
            case StateEffect state:
                WriteString(writer, "objectCode", state.ObjectCode); WriteString(writer, "objectId", state.ObjectId);
                WriteString(writer, "path", state.Path); WriteElement(writer, "value", state.Value);
                break;
            case MoveObjectEffect move:
                WriteString(writer, "objectCode", move.ObjectCode); WriteString(writer, "objectId", move.ObjectId);
                WriteString(writer, "locationCode", move.LocationCode); WriteString(writer, "locationId", move.LocationId);
                break;
            case MoveSessionEffect move:
                WriteString(writer, "locationCode", move.LocationCode); WriteString(writer, "locationId", move.LocationId);
                break;
            case SetSessionFlagEffect flag:
                WriteString(writer, "flag", flag.Flag); if (flag.Value is { } flagValue) writer.WriteBoolean("value", flagValue);
                break;
            case TextEffect text:
                WriteString(writer, "text", text.Text);
                break;
            case EmitEventEffect emitted:
                WriteString(writer, "event", emitted.Event); WriteString(writer, "locationCode", emitted.LocationCode); WriteString(writer, "locationId", emitted.LocationId);
                foreach (var pair in emitted.Payload) { writer.WritePropertyName(pair.Key); pair.Value.WriteTo(writer); }
                break;
            case CompleteSessionEffect:
                break;
            default:
                throw new JsonException($"Unsupported effect variant '{effect.GetType().Name}'.");
        }
        writer.WriteEndObject();
    }

    private static string? String(JsonElement root, string name) => root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static JsonElement? Element(JsonElement root, string name) => root.TryGetProperty(name, out var value) ? value.Clone() : null;
    private static void WriteString(Utf8JsonWriter writer, string name, string? value) { if (value is not null) writer.WriteString(name, value); }
    private static void WriteElement(Utf8JsonWriter writer, string name, JsonElement? value) { if (value is { } element) { writer.WritePropertyName(name); element.WriteTo(writer); } }
    private static void RejectUnknown(JsonElement value, params string[] allowed)
    {
        var names = allowed.ToHashSet(StringComparer.Ordinal);
        foreach (var property in value.EnumerateObject())
            if (!names.Contains(property.Name))
                throw new JsonException($"Unsupported property '{property.Name}' for effect '{value.GetProperty("type").GetString()}'.");
    }
}
