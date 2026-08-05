using Myriale.Api.Architecture;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModulePackages.Application.Ports;

[CrossSliceContract]
public sealed record ModulePackageSnapshot(
    ModulePackageDigest Digest,
    ModulePackageModuleId ModuleId,
    ModulePackageVersion Version,
    string ContractVersion,
    string DisplayName,
    string Description,
    ModuleManifest Manifest,
    ModulePackageFormat Format,
    ModulePackageStatus Status,
    bool IsEnabled,
    long Revision,
    DateTimeOffset InstalledAt,
    DateTimeOffset LastScannedAt,
    string? LastError)
{
    public bool IsAvailable => Status == ModulePackageStatus.Verified && IsEnabled;
}

[CrossSliceContract]
public enum ModulePackageAvailability { Available, NotFound, Disabled, Unavailable }
[CrossSliceContract]
public sealed record ModulePackageResolution(ModulePackageAvailability Availability, ModulePackageSnapshot? Package = null);

[CrossSliceContract]
public interface IModulePackageCatalog
{
    Task<IReadOnlyList<ModulePackageSnapshot>> ListAsync(CancellationToken cancellationToken);
    Task<ModulePackageSnapshot?> GetAsync(ModulePackageDigest digest, CancellationToken cancellationToken);
    Task<ModulePackageResolution> ResolveAsync(ModulePackageModuleId moduleId, ModulePackageVersion version, ModulePackageDigest digest, CancellationToken cancellationToken);
}

public enum ModulePackageAddOutcome { Added, Conflict }

public interface IModulePackageRepository
{
    Task<IReadOnlyList<ModulePackage>> ListTrackedAsync(CancellationToken cancellationToken);
    Task<ModulePackage?> GetTrackedAsync(ModulePackageDigest digest, CancellationToken cancellationToken);
    Task<ModulePackage?> FindIdentityAsync(ModulePackageModuleId moduleId, ModulePackageVersion version, CancellationToken cancellationToken);
    Task<ModulePackageAddOutcome> AddAsync(ModulePackage package, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
}

public sealed record StagedModulePackage(string Token, ModulePackageDigest Digest);

public interface IModulePackageArtifactStore
{
    Task<StagedModulePackage> StageAsync(Stream input, CancellationToken cancellationToken);
    Task<Stream> OpenStagedAsync(StagedModulePackage staged, CancellationToken cancellationToken);
    Task PromoteAsync(StagedModulePackage staged, ModulePackageInspection inspection, CancellationToken cancellationToken);
    Task<ModulePackageArtifactVerification> VerifyAsync(ModulePackageSnapshot package, CancellationToken cancellationToken);
    Task DeleteAsync(ModulePackageDigest digest, CancellationToken cancellationToken);
    Task RepairAsync(ModulePackageSnapshot package, CancellationToken cancellationToken);
    Task DeleteStagedAsync(StagedModulePackage staged, CancellationToken cancellationToken);
    Task<byte[]> ReadAssemblyAsync(ModulePackageSnapshot package, CancellationToken cancellationToken);
    Task<byte[]> ReadResourceAsync(ModulePackageSnapshot package, string relativePath, CancellationToken cancellationToken);
    IAsyncEnumerable<ModulePackageInboxArtifact> EnumerateInboxAsync(CancellationToken cancellationToken);
    Task<Stream> OpenInboxAsync(ModulePackageInboxArtifact artifact, CancellationToken cancellationToken);
    Task DeleteInboxAsync(ModulePackageInboxArtifact artifact, CancellationToken cancellationToken);
}

public sealed record ModulePackageArtifactVerification(bool IsValid, bool IsMissing, string? Error = null);
public sealed record ModulePackageInboxArtifact(string Name, string Path);

public interface IModulePackageInspector
{
    Task<ModulePackageInspection> InspectAsync(ModulePackageDigest digest, Stream input, CancellationToken cancellationToken);
}

public sealed class ModulePackageConcurrencyException(string message, Exception? inner = null) : Exception(message, inner);

internal static class ModulePackageSnapshots
{
    public static ModulePackageSnapshot ToSnapshot(this ModulePackage package) => new(
        package.Digest, package.ModuleId, package.Version, package.ContractVersion, package.DisplayName,
        package.Description, package.ReadManifest(), package.Format, package.Status, package.IsEnabled,
        package.Revision, package.InstalledAt, package.LastScannedAt, package.LastError);
}
