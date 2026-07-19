namespace Myriale.Api.Modules.Runtime;

public sealed class ModuleRuntimeOptions
{
    public const string SectionName = "ModuleRuntime";

    public int MaxConcurrentInvocations { get; set; } = 16;
    public int MaxCachedAssemblies { get; set; } = 32;
    public int MaxContextBytes { get; set; } = 256 * 1024;
    public int MaxResponseBytes { get; set; } = 1024 * 1024;
    public int MaxCollectionItems { get; set; } = 1024;
}
