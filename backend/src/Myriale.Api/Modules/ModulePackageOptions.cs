namespace Myriale.Api.Modules;

public sealed class ModulePackageOptions
{
    public const string SectionName = "Modules";

    public string StoragePath { get; set; } = "module-storage";
    public long MaxArchiveBytes { get; set; } = 16 * 1024 * 1024;
    public long MaxExpandedBytes { get; set; } = 64 * 1024 * 1024;
    public long MaxEntryBytes { get; set; } = 16 * 1024 * 1024;
    public int MaxEntries { get; set; } = 256;
}
