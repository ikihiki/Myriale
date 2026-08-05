using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModuleExecutions.Application.Ports;

[CrossSliceContract]
public sealed record ModuleExecutionUiBinding(ModulePackageModuleId ModuleId, ModulePackageVersion ModuleVersion, ModulePackageDigest ModuleDigest, string ContractVersion);

[CrossSliceContract]
public interface IModuleExecutionUiBindingReader
{
    Task<ModuleExecutionUiBinding?> FindAsync(AccountId ownerId, ModuleExecutionId executionId, CancellationToken cancellationToken);
}
