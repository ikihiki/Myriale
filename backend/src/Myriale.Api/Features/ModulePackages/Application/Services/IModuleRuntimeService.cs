using Myriale.Api.Architecture;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModulePackages.Application.Services;

[CrossSliceContract]
public interface IModuleRuntimeService
{
    Task<ModuleValidationResult> ValidateConfigAsync(ModulePackageIdentity identity, ModuleValidationRequest request, CancellationToken cancellationToken);
    Task<ModuleInitializationResult> InitializeAsync(ModulePackageIdentity identity, ModuleInitializationRequest request, CancellationToken cancellationToken);
    Task<ModuleTransitionResult> DispatchAsync(ModulePackageIdentity identity, ModuleDispatchRequest request, CancellationToken cancellationToken);
}
