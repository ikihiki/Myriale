using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModulePackages.Infrastructure;

internal sealed record ModulePackageRuntimeDescriptor(
    ModulePackageIdentity Identity,
    ModuleManifest Manifest,
    byte[] AssemblyBytes);
