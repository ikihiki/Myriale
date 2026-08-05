
namespace Myriale.Api.Features.Scenarios.Application;

public interface IScenarioDefinitionRepository
{
    Task<ScenarioDefinitionVersion?> GetDraftAsync(ScenarioId scenarioId, CancellationToken cancellationToken);
    Task<ScenarioDefinitionVersion?> GetLatestPublishedAsync(ScenarioId scenarioId, CancellationToken cancellationToken);
    Task<ScenarioDefinitionVersion?> GetByIdAsync(ScenarioDefinitionVersionId definitionId, CancellationToken cancellationToken);
    Task AddAsync(ScenarioDefinitionVersion definition, CancellationToken cancellationToken);
}
