using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.ModuleExecutions;
using Myriale.Api.Data;

namespace Myriale.Api.Infrastructure.ModuleExecutions;

public sealed class EfModuleExecutionRepository(ApplicationDbContext db) : IModuleExecutionRepository
{
    public Task<ModuleExecution?> GetOwnedAsync(string executionId, string ownerId, bool tracking, CancellationToken cancellationToken)
    {
        IQueryable<ModuleExecution> query = db.ModuleExecutions.Include(x => x.Requests).Include(x => x.OutcomeApplication);
        if (!tracking) query = query.AsNoTracking();
        return query.SingleOrDefaultAsync(x => x.Id == executionId && x.OwnerId == ownerId, cancellationToken);
    }

    public Task<ModuleExecutionRequest?> GetReceiptAsync(string ownerId, string requestId, bool tracking, CancellationToken cancellationToken)
    {
        IQueryable<ModuleExecutionRequest> query = db.ModuleExecutionRequests;
        if (!tracking) query = query.AsNoTracking();
        return query.SingleOrDefaultAsync(x => x.OwnerId == ownerId && x.RequestId == requestId, cancellationToken);
    }

    public void Add(ModuleExecution execution, ModuleExecutionRequest receipt) { db.ModuleExecutions.Add(execution); db.ModuleExecutionRequests.Add(receipt); }
    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
    public void ClearTracking() => db.ChangeTracker.Clear();
}
