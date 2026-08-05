
namespace Myriale.Api.Features.ModuleExecutions.Application;

public interface IModuleExecutionRepository
{
    Task<ModuleExecution?> GetOwnedAsync(ModuleExecutionId executionId, AccountId ownerId, bool tracking, CancellationToken cancellationToken);
    Task<ModuleExecutionRequest?> GetReceiptAsync(AccountId ownerId, string requestId, bool tracking, CancellationToken cancellationToken);
    void Add(ModuleExecution execution, ModuleExecutionRequest receipt);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    void ClearTracking();
}
