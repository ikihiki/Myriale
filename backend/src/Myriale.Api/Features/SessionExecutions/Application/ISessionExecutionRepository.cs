
namespace Myriale.Api.Features.SessionExecutions.Application;

public interface ISessionExecutionRepository
{
    Task<SessionExecution?> GetOwnedAsync(SessionExecutionId executionId, AccountId ownerId, bool tracking, CancellationToken cancellationToken);
    Task<SessionExecutionMutationResult> MutateOwnedAsync(SessionExecutionId executionId, AccountId ownerId, Action<SessionExecution> mutation, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public enum SessionExecutionMutationResult { Success, NotFound, Conflict }
