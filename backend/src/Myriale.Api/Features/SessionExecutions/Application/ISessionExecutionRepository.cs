
namespace Myriale.Api.Features.SessionExecutions.Application;

public interface ISessionExecutionRepository
{
    Task<SessionExecution?> GetOwnedAsync(string executionId, string ownerId, bool tracking, CancellationToken cancellationToken);
    Task<SessionExecutionMutationResult> MutateOwnedWithLockAsync(string executionId, string ownerId, Action<SessionExecution> mutation, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public enum SessionExecutionMutationResult { Success, NotFound, Conflict }
