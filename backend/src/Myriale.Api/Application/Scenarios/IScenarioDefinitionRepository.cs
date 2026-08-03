using Myriale.Api.Data;

namespace Myriale.Api.Application.Scenarios;

public interface IScenarioDefinitionRepository
{
    Task<ScenarioDefinitionVersion?> GetDraftAsync(string scenarioId, CancellationToken cancellationToken);
    Task<ScenarioDefinitionVersion?> GetLatestPublishedAsync(string scenarioId, CancellationToken cancellationToken);
    Task<ScenarioDefinitionVersion?> GetByIdAsync(string definitionId, CancellationToken cancellationToken);
    Task AddAsync(ScenarioDefinitionVersion definition, CancellationToken cancellationToken);
}
