using System.Text.Json;

namespace Myriale.Api.Domain.Scenarios;

public readonly record struct ConditionExpression(JsonElement Value)
{
    public static ConditionExpression Empty => new(ScenarioRuleJsonCodec.EmptyObject);
    public static ConditionExpression FromJson(string json) => new(new ScenarioRuleJsonCodec().DecodeCondition(json).Value);
}

public readonly record struct EffectSet(JsonElement Value)
{
    public static EffectSet Empty => new(ScenarioRuleJsonCodec.EmptyArray);
    public static EffectSet FromJson(string json) => new(new ScenarioRuleJsonCodec().DecodeEffects(json).Value);
}

public readonly record struct StateSchema(JsonElement Value);
public readonly record struct StateValue(JsonElement Value);
public readonly record struct PublicProjection(JsonElement Value);
public readonly record struct ActionRules(JsonElement Value);

public sealed class ScenarioRuleJsonCodec
{
    private static readonly JsonElement EmptyObjectValue = ParseLiteral("{}");
    private static readonly JsonElement EmptyArrayValue = ParseLiteral("[]");
    public static JsonElement EmptyObject => EmptyObjectValue.Clone();
    public static JsonElement EmptyArray => EmptyArrayValue.Clone();

    public ConditionExpression DecodeCondition(string json) => new(Parse(json, "{}", JsonValueKind.Object));
    public EffectSet DecodeEffects(string json) => new(Parse(json, "[]", JsonValueKind.Array));
    public StateSchema DecodeSchema(string json) => new(Parse(json, "{}", JsonValueKind.Object));
    public StateValue DecodeState(string json) => new(Parse(json, "{}", JsonValueKind.Object));
    public PublicProjection DecodeProjection(string json) => new(Parse(json, "{}", JsonValueKind.Object));
    public ActionRules DecodeActionRules(string json) => new(Parse(json, "[]", JsonValueKind.Array));

    public string Encode(ConditionExpression value) => value.Value.GetRawText();
    public string Encode(EffectSet value) => value.Value.GetRawText();
    public string Encode(StateSchema value) => value.Value.GetRawText();
    public string Encode(StateValue value) => value.Value.GetRawText();
    public string Encode(PublicProjection value) => value.Value.GetRawText();
    public string Encode(ActionRules value) => value.Value.GetRawText();

    public JsonElement ParseElement(string json) => Parse(json, "{}", null);

    private static JsonElement Parse(string? json, string fallback, JsonValueKind? requiredKind)
    {
        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? fallback : json);
        var value = document.RootElement.Clone();
        if (requiredKind is { } kind && value.ValueKind != kind)
            throw new JsonException($"Expected JSON {kind} but found {value.ValueKind}.");
        return value;
    }

    private static JsonElement ParseLiteral(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
