using System.Text.Json;
using System.Text.RegularExpressions;

namespace Myriale.Api.Features.ScenarioTurns.Infrastructure;

public static class ScenarioActionArgumentValidator
{
    public static void Validate(JsonElement schema, JsonElement value)
    {
        if (!IsValid(schema, value)) throw new ScenarioTurnValidationException("invalid_action_arguments");
    }

    private static bool IsValid(JsonElement schema, JsonElement value)
    {
        if (schema.ValueKind != JsonValueKind.Object) return false;
        if (schema.TryGetProperty("enum", out var allowed)
            && !allowed.EnumerateArray().Any(candidate => JsonElement.DeepEquals(candidate, value))) return false;
        if (schema.TryGetProperty("type", out var type) && type.ValueKind == JsonValueKind.String
            && !MatchesType(type.GetString(), value)) return false;

        return value.ValueKind switch
        {
            JsonValueKind.Object => ValidateObject(schema, value),
            JsonValueKind.Array => ValidateArray(schema, value),
            JsonValueKind.String => ValidateString(schema, value.GetString()!),
            JsonValueKind.Number => ValidateNumber(schema, value),
            _ => true,
        };
    }

    private static bool ValidateObject(JsonElement schema, JsonElement value)
    {
        var properties = schema.TryGetProperty("properties", out var propertySchemas) && propertySchemas.ValueKind == JsonValueKind.Object
            ? propertySchemas
            : default;
        if (schema.TryGetProperty("required", out var required) && required.ValueKind == JsonValueKind.Array
            && required.EnumerateArray().Any(name => name.ValueKind != JsonValueKind.String || !value.TryGetProperty(name.GetString()!, out _))) return false;

        foreach (var property in value.EnumerateObject())
        {
            if (properties.ValueKind == JsonValueKind.Object && properties.TryGetProperty(property.Name, out var propertySchema))
            {
                if (!IsValid(propertySchema, property.Value)) return false;
            }
            else if (schema.TryGetProperty("additionalProperties", out var additional) && additional.ValueKind == JsonValueKind.False)
            {
                return false;
            }
        }
        return true;
    }

    private static bool ValidateArray(JsonElement schema, JsonElement value)
    {
        var length = value.GetArrayLength();
        if (schema.TryGetProperty("minItems", out var min) && length < min.GetInt32()) return false;
        if (schema.TryGetProperty("maxItems", out var max) && length > max.GetInt32()) return false;
        if (schema.TryGetProperty("items", out var items) && value.EnumerateArray().Any(item => !IsValid(items, item))) return false;
        return true;
    }

    private static bool ValidateString(JsonElement schema, string value)
    {
        if (schema.TryGetProperty("minLength", out var min) && value.Length < min.GetInt32()) return false;
        if (schema.TryGetProperty("maxLength", out var max) && value.Length > max.GetInt32()) return false;
        if (schema.TryGetProperty("pattern", out var pattern) && !Regex.IsMatch(value, pattern.GetString()!)) return false;
        return true;
    }

    private static bool ValidateNumber(JsonElement schema, JsonElement value)
    {
        var number = value.GetDecimal();
        if (schema.TryGetProperty("minimum", out var min) && number < min.GetDecimal()) return false;
        if (schema.TryGetProperty("maximum", out var max) && number > max.GetDecimal()) return false;
        return true;
    }

    private static bool MatchesType(string? type, JsonElement value) => type switch
    {
        "object" => value.ValueKind == JsonValueKind.Object,
        "array" => value.ValueKind == JsonValueKind.Array,
        "string" => value.ValueKind == JsonValueKind.String,
        "number" => value.ValueKind == JsonValueKind.Number,
        "integer" => value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out _),
        "boolean" => value.ValueKind is JsonValueKind.True or JsonValueKind.False,
        "null" => value.ValueKind == JsonValueKind.Null,
        _ => false,
    };
}
