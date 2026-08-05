using System.Buffers;
using System.Numerics;
using System.Security.Cryptography;
using System.Text.Json;

namespace Myriale.Api.Features.ModuleExecutions.Infrastructure;

public static class ModuleRequestFingerprint
{
    public static bool TryCreate(Action<Utf8JsonWriter> write, out string fingerprint)
    {
        try
        {
            var buffer = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(buffer)) write(writer);
            fingerprint = Convert.ToHexString(SHA256.HashData(buffer.WrittenSpan)).ToLowerInvariant();
            return true;
        }
        catch (Exception exception) when (exception is JsonException or FormatException)
        {
            fingerprint = string.Empty;
            return false;
        }
    }

    public static void WriteCanonical(Utf8JsonWriter writer, JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                var properties = value.EnumerateObject().OrderBy(property => property.Name, StringComparer.Ordinal).ToArray();
                if (properties.Select(property => property.Name).Distinct(StringComparer.Ordinal).Count() != properties.Length)
                    throw new JsonException("Duplicate JSON property names are not supported.");
                foreach (var property in properties)
                {
                    writer.WritePropertyName(property.Name);
                    WriteCanonical(writer, property.Value);
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in value.EnumerateArray()) WriteCanonical(writer, item);
                writer.WriteEndArray();
                break;
            case JsonValueKind.String:
                writer.WriteStringValue(value.GetString());
                break;
            case JsonValueKind.Number:
                writer.WriteRawValue(CanonicalizeNumber(value.GetRawText()));
                break;
            case JsonValueKind.True:
                writer.WriteBooleanValue(true);
                break;
            case JsonValueKind.False:
                writer.WriteBooleanValue(false);
                break;
            case JsonValueKind.Null:
                writer.WriteNullValue();
                break;
            default:
                throw new JsonException("Undefined JSON cannot be fingerprinted.");
        }
    }


    private static string CanonicalizeNumber(string raw)
    {
        var negative = raw.Length > 0 && raw[0] == '-';
        var unsigned = negative ? raw[1..] : raw;
        var exponentIndex = unsigned.IndexOfAny(['e', 'E']);
        var significand = exponentIndex < 0 ? unsigned : unsigned[..exponentIndex];
        var exponent = exponentIndex < 0
            ? BigInteger.Zero
            : BigInteger.Parse(unsigned[(exponentIndex + 1)..]);
        var decimalIndex = significand.IndexOf('.');
        var fractionalDigits = decimalIndex < 0 ? 0 : significand.Length - decimalIndex - 1;
        var digits = decimalIndex < 0 ? significand : significand.Remove(decimalIndex, 1);
        digits = digits.TrimStart('0');
        if (digits.Length == 0) return "0";
        exponent -= fractionalDigits;
        var trailingZeros = digits.Length - digits.TrimEnd('0').Length;
        if (trailingZeros > 0)
        {
            digits = digits[..^trailingZeros];
            exponent += trailingZeros;
        }
        return $"{(negative ? "-" : string.Empty)}{digits}e{exponent}";
    }

}
