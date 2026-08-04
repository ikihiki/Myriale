using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

internal sealed record ModulePackageRuntimeDescriptor(
    ModulePackageIdentity Identity,
    ModuleManifest Manifest,
    byte[] AssemblyBytes);
