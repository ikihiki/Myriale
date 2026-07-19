using Myriale.Api.Data;

namespace Myriale.Api.Modules;

public interface IModulePackageService
{
    Task<IReadOnlyList<ModulePackage>> ListAsync(CancellationToken cancellationToken);
    Task<ModulePackageInstallResult> InstallAsync(Stream archive, CancellationToken cancellationToken);
    Task<ModulePackageScanResult> RescanAsync(CancellationToken cancellationToken);
    Task<ModulePackage?> SetEnabledAsync(string digest, bool enabled, CancellationToken cancellationToken);
}
