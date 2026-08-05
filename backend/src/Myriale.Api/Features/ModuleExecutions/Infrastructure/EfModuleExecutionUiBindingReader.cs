using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ModuleExecutions.Application.Ports;

namespace Myriale.Api.Features.ModuleExecutions.Infrastructure;

internal sealed class EfModuleExecutionUiBindingReader(ApplicationDbContext db) : IModuleExecutionUiBindingReader
{
    public Task<ModuleExecutionUiBinding?> FindAsync(string ownerId, string executionId, CancellationToken cancellationToken) =>
        db.ModuleExecutions.AsNoTracking()
            .Where(x => x.Id == executionId && x.OwnerId == ownerId)
            .Select(x => new ModuleExecutionUiBinding(x.ModuleId, x.ModuleVersion, x.ModuleDigest, x.ContractVersion))
            .SingleOrDefaultAsync(cancellationToken);
}
