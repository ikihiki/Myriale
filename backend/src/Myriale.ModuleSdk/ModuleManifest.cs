namespace Myriale.ModuleSdk;

public sealed record ModuleManifest(
    string Id,
    string Version,
    string DisplayName,
    string Description,
    string ContractVersion,
    ModuleConfigurationManifest Configuration,
    ModuleUiManifest UserInterfaces,
    IReadOnlyList<string> Capabilities,
    ModuleLimits Limits);

public sealed record ModuleConfigurationManifest(
    int SchemaVersion,
    int StateSchemaVersion,
    IReadOnlyList<ModuleFieldDefinition> Fields);

public sealed record ModuleFieldDefinition(
    string Path,
    string Kind,
    string Label,
    bool Required,
    string? Description = null);

public sealed record ModuleUiManifest(
    ModuleUiEntry? Runtime,
    ModuleUiEntry? Authoring,
    ModuleUiEntry? ResultSummary);

public sealed record ModuleUiEntry(
    string ScriptPath,
    string ElementName,
    IReadOnlyList<string> StylePaths);

public sealed record ModuleLimits(
    int MaxConfigurationBytes,
    int MaxStateBytes,
    int MaxActionBytes,
    int MaxEffects);
