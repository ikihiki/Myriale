using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ModuleExecutions.Application.Services;

namespace Myriale.Api.Features.ModuleExecutions.Infrastructure;

internal sealed class EfModuleExecutionUiBindingReader(ApplicationDbContext db) : IModuleExecutionUiBindingService
{
    public Task<ModuleExecutionUiBinding?> FindAsync(AccountId ownerId, ModuleExecutionId executionId, CancellationToken cancellationToken) =>
        db.ModuleExecutions.AsNoTracking()
            .Where(x => x.Id == executionId && x.OwnerId == ownerId)
            .Select(x => new ModuleExecutionUiBinding(x.ModuleId, x.ModuleVersion, x.ModuleDigest, x.ContractVersion))
            .SingleOrDefaultAsync(cancellationToken);
}
