using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModuleExecutions.Application.Services;

[CrossSliceContract]
public sealed record ModuleExecutionUiBinding(ModulePackageModuleId ModuleId, ModulePackageVersion ModuleVersion, ModulePackageDigest ModuleDigest, string ContractVersion);

[CrossSliceContract]
public interface IModuleExecutionUiBindingService
{
    Task<ModuleExecutionUiBinding?> FindAsync(AccountId ownerId, ModuleExecutionId executionId, CancellationToken cancellationToken);
}
