using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed class ScenarioDefinitionQueryService(ApplicationDbContext db, ScenarioDefinitionMapper mapper)
{
    public async Task<ScenarioRuleDataResponse?> GetDraftAsync(ScenarioId scenarioId, CancellationToken cancellationToken) =>
        await ProjectAsync(scenarioId, DefinitionStatus.Draft, cancellationToken);

    public async Task<ScenarioRuleDataResponse?> GetLatestPublishedAsync(ScenarioId scenarioId, CancellationToken cancellationToken)
    {
        var id = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Where(x => x.ScenarioId == scenarioId && x.Status == DefinitionStatus.Published)
            .OrderByDescending(x => x.Version).Select(x => (ScenarioDefinitionVersionId?)x.Id).FirstOrDefaultAsync(cancellationToken);
        return id is null ? null : await GetByIdAsync(id.Value, cancellationToken);
    }

    public async Task<ScenarioRuleDataResponse?> GetByIdAsync(ScenarioDefinitionVersionId definitionId, CancellationToken cancellationToken)
    {
        var definition = await Graph().SingleOrDefaultAsync(x => x.Id == definitionId, cancellationToken);
        return definition is null ? null : mapper.ToResponse(definition);
    }

    public async Task<ScenarioRuleDataResponse?> GetEditableAsync(ScenarioId scenarioId, CancellationToken cancellationToken) =>
        await GetDraftAsync(scenarioId, cancellationToken) ?? await GetLatestPublishedAsync(scenarioId, cancellationToken);

    private async Task<ScenarioRuleDataResponse?> ProjectAsync(ScenarioId scenarioId, DefinitionStatus status, CancellationToken cancellationToken)
    {
        var definition = await Graph().Where(x => x.ScenarioId == scenarioId && x.Status == status)
            .OrderByDescending(x => x.Version).FirstOrDefaultAsync(cancellationToken);
        return definition is null ? null : mapper.ToResponse(definition);
    }

    private IQueryable<ScenarioDefinitionVersion> Graph() => db.ScenarioDefinitionVersions.AsNoTracking()
        .Include(x => x.Locations).Include(x => x.ObjectTypes).ThenInclude(x => x.Actions).Include(x => x.Objects);
}
