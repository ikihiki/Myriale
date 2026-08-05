using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionExecutions.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.SessionExecutions.Infrastructure;

public sealed class EfSessionExecutionRepository(ApplicationDbContext db) : ISessionExecutionRepository
{
    public Task<SessionExecution?> GetOwnedAsync(SessionExecutionId executionId, AccountId ownerId, bool tracking, CancellationToken cancellationToken)
    {
        IQueryable<SessionExecution> query = db.SessionExecutions.Include(item => item.Attempts);
        if (!tracking) query = query.AsNoTracking();
        return query.SingleOrDefaultAsync(item => item.Id == executionId && item.Session.OwnerId == ownerId, cancellationToken);
    }

    public async Task<SessionExecutionMutationResult> MutateOwnedWithLockAsync(SessionExecutionId executionId, AccountId ownerId, Action<SessionExecution> mutation, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = db.Database.IsNpgsql()
            ? await db.SessionExecutions.FromSqlInterpolated($$"""
                SELECT * FROM "SessionExecutions" WHERE "Id" = {{executionId}} FOR UPDATE
                """).SingleOrDefaultAsync(cancellationToken)
            : await db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == executionId, cancellationToken);
        if (execution is null)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return SessionExecutionMutationResult.NotFound;
        }
        await db.Entry(execution).Reference(item => item.Session).LoadAsync(cancellationToken);
        await db.Entry(execution).Collection(item => item.Attempts).LoadAsync(cancellationToken);
        if (execution.Session.OwnerId != ownerId)
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
