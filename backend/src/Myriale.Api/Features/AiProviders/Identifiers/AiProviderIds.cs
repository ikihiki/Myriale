using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.AiProviders.Identifiers;

[CrossSliceContract]
[UnitOf<string>(
    UnitGenerateOptions.ParseMethod |
    UnitGenerateOptions.JsonConverter |
    UnitGenerateOptions.Normalize |
    UnitGenerateOptions.Validate)]
public readonly partial struct AiProviderProfileId
{
    private partial void Normalize(ref string value) => value = value?.Trim().ToLowerInvariant() ?? string.Empty;

    private partial void Validate()
    {
        if (value.Length is 0 or > 80 || value.Any(c => !(char.IsLetterOrDigit(c) || c is '-' or '_' or '.')))
            throw new ArgumentException("ID must be 1-80 letters, numbers, '.', '_' or '-'.", "value");
    }
}

[CrossSliceContract]
[UnitOf<string>(
    UnitGenerateOptions.ParseMethod |
    UnitGenerateOptions.JsonConverter |
    UnitGenerateOptions.Normalize |
    UnitGenerateOptions.Validate)]
public readonly partial struct AiCredentialId
{
    private partial void Normalize(ref string value) => value = value?.Trim().ToLowerInvariant() ?? string.Empty;

    private partial void Validate()
    {
        if (value.Length is 0 or > 80 || value.Any(c => !(char.IsLetterOrDigit(c) || c is '-' or '_' or '.')))
            throw new ArgumentException("ID must be 1-80 letters, numbers, '.', '_' or '-'.", "value");
    }
}

[CrossSliceContract]
[UnitOf<Guid>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter)]
public readonly partial struct AiProviderProfileValidationId;
