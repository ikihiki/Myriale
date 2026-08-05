using Myriale.Api.Data;

namespace Myriale.Api.Features.ModuleExecutions.Application;

public interface IModuleExecutionRepository
{
    Task<ModuleExecution?> GetOwnedAsync(string executionId, string ownerId, bool tracking, CancellationToken cancellationToken);
    Task<ModuleExecutionRequest?> GetReceiptAsync(string ownerId, string requestId, bool tracking, CancellationToken cancellationToken);
    void Add(ModuleExecution execution, ModuleExecutionRequest receipt);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    void ClearTracking();
}
