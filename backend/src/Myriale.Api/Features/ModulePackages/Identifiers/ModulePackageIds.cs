using System.Text.RegularExpressions;
using Myriale.Api.Architecture;
using UnitGenerator;

namespace Myriale.Api.Features.ModulePackages.Identifiers;

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter | UnitGenerateOptions.Normalize | UnitGenerateOptions.Validate)]
public readonly partial struct ModulePackageDigest
{
    private static readonly Regex Pattern = new("^[0-9a-f]{64}$", RegexOptions.CultureInvariant);
    private partial void Normalize(ref string value) => value = value?.Trim().ToLowerInvariant() ?? string.Empty;
    private partial void Validate() { if (!Pattern.IsMatch(value)) throw new ArgumentException("Module package digest must be a lowercase SHA-256 value.", "value"); }
}

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter | UnitGenerateOptions.Normalize | UnitGenerateOptions.Validate)]
public readonly partial struct ModulePackageModuleId
{
    private static readonly Regex Pattern = new("^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$", RegexOptions.CultureInvariant);
    private partial void Normalize(ref string value) => value = value?.Trim() ?? string.Empty;
    private partial void Validate() { if (value.Length > 200 || !Pattern.IsMatch(value)) throw new ArgumentException("Module ID must use reverse-domain format.", "value"); }
}

[CrossSliceContract]
[UnitOf<string>(UnitGenerateOptions.ParseMethod | UnitGenerateOptions.JsonConverter | UnitGenerateOptions.Normalize | UnitGenerateOptions.Validate)]
public readonly partial struct ModulePackageVersion
{
    private static readonly Regex Pattern = new("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$", RegexOptions.CultureInvariant);
    private partial void Normalize(ref string value) => value = value?.Trim() ?? string.Empty;
    private partial void Validate() { if (value.Length > 64 || !Pattern.IsMatch(value)) throw new ArgumentException("Module version must be SemVer.", "value"); }
}
