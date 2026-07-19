using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

public interface IModuleRuntime
{
    Task<ModuleValidationResult> ValidateConfigAsync(ModulePackageIdentity identity, ModuleValidationRequest request, CancellationToken cancellationToken);
    Task<ModuleInitializationResult> InitializeAsync(ModulePackageIdentity identity, ModuleInitializationRequest request, CancellationToken cancellationToken);
    Task<ModuleTransitionResult> DispatchAsync(ModulePackageIdentity identity, ModuleDispatchRequest request, CancellationToken cancellationToken);
}
