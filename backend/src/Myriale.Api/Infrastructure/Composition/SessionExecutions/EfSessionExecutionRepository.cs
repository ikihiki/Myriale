using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionExecutions.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Infrastructure.Composition.SessionExecutions;

public sealed class EfSessionExecutionRepository(ApplicationDbContext db) : ISessionExecutionRepository
{
    public Task<SessionExecution?> GetOwnedAsync(SessionExecutionId executionId, AccountId ownerId, bool tracking, CancellationToken cancellationToken)
    {
        IQueryable<SessionExecution> query = db.SessionExecutions.Include(item => item.Attempts);
        if (!tracking) query = query.AsNoTracking();
        return query.SingleOrDefaultAsync(
            item => item.Id == executionId
                && db.Sessions.Any(session => session.Id == item.SessionId && session.OwnerId == ownerId),
            cancellationToken);
    }

    public async Task<SessionExecutionMutationResult> MutateOwnedAsync(SessionExecutionId executionId, AccountId ownerId, Action<SessionExecution> mutation, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await db.SessionExecutions
            .SingleOrDefaultAsync(item => item.Id == executionId, cancellationToken);
        if (execution is null)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return SessionExecutionMutationResult.NotFound;
        }
        var isOwned = await db.Sessions.AnyAsync(
            session => session.Id == execution.SessionId && session.OwnerId == ownerId,
            cancellationToken);
        await db.Entry(execution).Collection(item => item.Attempts).LoadAsync(cancellationToken);
        if (!isOwned)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return SessionExecutionMutationResult.NotFound;
        }
        mutation(execution);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return SessionExecutionMutationResult.Success;
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return SessionExecutionMutationResult.Conflict;
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
