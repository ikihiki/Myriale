using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

internal interface IModulePackageRuntimeCatalog
{
    Task<ModulePackageRuntimeDescriptor> ResolveEnabledAsync(ModulePackageIdentity identity, CancellationToken cancellationToken);
}

internal sealed record ModulePackageRuntimeDescriptor(
    ModulePackageIdentity Identity,
    ModuleManifest Manifest,
    byte[] AssemblyBytes);
