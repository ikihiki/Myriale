using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModuleExecutions.Application.Ports;

[CrossSliceContract]
public sealed record ModuleExecutionUiBinding(string ModuleId, string ModuleVersion, string ModuleDigest, string ContractVersion);

[CrossSliceContract]
public interface IModuleExecutionUiBindingReader
{
    Task<ModuleExecutionUiBinding?> FindAsync(string ownerId, string executionId, CancellationToken cancellationToken);
}
