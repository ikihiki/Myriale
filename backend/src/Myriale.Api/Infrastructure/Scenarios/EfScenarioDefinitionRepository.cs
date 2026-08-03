using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.Scenarios;
using Myriale.Api.Data;

namespace Myriale.Api.Infrastructure.Scenarios;

public sealed class EfScenarioDefinitionRepository(ApplicationDbContext db) : IScenarioDefinitionRepository
{
    public Task<ScenarioDefinitionVersion?> GetDraftAsync(string scenarioId, CancellationToken cancellationToken) =>
        Graph().SingleOrDefaultAsync(x => x.ScenarioId == scenarioId && x.Status == DefinitionStatus.Draft, cancellationToken);

    public Task<ScenarioDefinitionVersion?> GetLatestPublishedAsync(string scenarioId, CancellationToken cancellationToken) =>
        Graph().Where(x => x.ScenarioId == scenarioId && x.Status == DefinitionStatus.Published)
            .OrderByDescending(x => x.Version).FirstOrDefaultAsync(cancellationToken);

    public Task<ScenarioDefinitionVersion?> GetByIdAsync(string definitionId, CancellationToken cancellationToken) =>
        Graph().SingleOrDefaultAsync(x => x.Id == definitionId, cancellationToken);

    public async Task AddAsync(ScenarioDefinitionVersion definition, CancellationToken cancellationToken) =>
        await db.ScenarioDefinitionVersions.AddAsync(definition, cancellationToken);

    private IQueryable<ScenarioDefinitionVersion> Graph() => db.ScenarioDefinitionVersions
        .Include(x => x.ProgressionNodes)
        .Include(x => x.ProgressionTransitions)
        .Include(x => x.Locations)
        .Include(x => x.ObjectTypes).ThenInclude(x => x.Actions)
        .Include(x => x.Objects);
}
