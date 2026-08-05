using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.RegularExpressions;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModulePackages.Domain;

public sealed record ModulePackageInspection(
    ModulePackageDigest Digest,
    ModulePackageModuleId ModuleId,
    ModulePackageVersion Version,
    ModuleManifest Manifest,
    ModulePackageFormat Format,
    IReadOnlySet<string> Files);

public sealed class ModulePackage
{
    private ModulePackage() { }

    [Key, MaxLength(64)] public ModulePackageDigest Digest { get; private set; }
    [Required, MaxLength(200)] public ModulePackageModuleId ModuleId { get; private set; }
    [Required, MaxLength(64)] public ModulePackageVersion Version { get; private set; }
    [Required, MaxLength(32)] public string ContractVersion { get; private set; } = string.Empty;
    [Required, MaxLength(200)] public string DisplayName { get; private set; } = string.Empty;
    [MaxLength(2000)] public string Description { get; private set; } = string.Empty;
    [Required] internal string ManifestJson { get; private set; } = string.Empty;
    public ModulePackageFormat Format { get; private set; }
    public ModulePackageStatus Status { get; private set; }
    [MaxLength(2000)] public string? LastError { get; private set; }
    public bool IsEnabled { get; private set; }
    public long Revision { get; private set; }
    public DateTimeOffset InstalledAt { get; private set; }
    public DateTimeOffset LastScannedAt { get; private set; }

    public bool IsAvailable => Status == ModulePackageStatus.Verified && IsEnabled;

    public static ModulePackage Install(ModulePackageInspection inspection, DateTimeOffset now) => new()
    {
        Digest = inspection.Digest,
        ModuleId = inspection.ModuleId,
        Version = inspection.Version,
        ContractVersion = inspection.Manifest.ContractVersion,
        DisplayName = inspection.Manifest.DisplayName,
        Description = inspection.Manifest.Description,
        ManifestJson = JsonSerializer.Serialize(inspection.Manifest, ModuleJsonSerializerOptions.Create()),
        Format = inspection.Format,
        Status = ModulePackageStatus.Staged,
        IsEnabled = false,
        Revision = 0,
        InstalledAt = now,
        LastScannedAt = now,
    };

    public void MarkVerified(DateTimeOffset now)
    {
        Status = ModulePackageStatus.Verified;
        LastError = null;
        LastScannedAt = now;
        Revision++;
    }

    public void MarkMissing(string error, DateTimeOffset now)
    {
        Status = ModulePackageStatus.Missing;
        IsEnabled = false;
        LastError = RequireError(error);
        LastScannedAt = now;
        Revision++;
    }

    public void MarkInvalid(string error, DateTimeOffset now)
    {
        Status = ModulePackageStatus.Invalid;
        IsEnabled = false;
        LastError = RequireError(error);
        LastScannedAt = now;
        Revision++;
    }

    public void Enable(long expectedRevision)
    {
        RequireRevision(expectedRevision);
        if (Status != ModulePackageStatus.Verified) throw new ModulePackageUnavailableException("Unavailable module packages cannot be enabled.");
        if (!IsEnabled) { IsEnabled = true; Revision++; }
    }

    public void Disable(long expectedRevision)
    {
        RequireRevision(expectedRevision);
        if (IsEnabled) { IsEnabled = false; Revision++; }
    }

    internal ModuleManifest ReadManifest() => JsonSerializer.Deserialize<ModuleManifest>(ManifestJson, ModuleJsonSerializerOptions.Create())
        ?? throw new JsonException("Stored module manifest is empty.");

    private void RequireRevision(long expectedRevision)
    {
        if (Revision != expectedRevision) throw new ModulePackageRevisionConflictException(expectedRevision, Revision);
    }

    private static string RequireError(string error) => string.IsNullOrWhiteSpace(error)
        ? throw new ArgumentException("An availability error is required.", nameof(error))
        : error.Trim();
}

public sealed class ModulePackageRevisionConflictException(long expected, long actual)
    : Exception($"Module package revision conflict. Expected {expected}, actual {actual}.")
{
    public long ExpectedRevision { get; } = expected;
    public long ActualRevision { get; } = actual;
}

public sealed class ModulePackageUnavailableException(string message) : Exception(message);
