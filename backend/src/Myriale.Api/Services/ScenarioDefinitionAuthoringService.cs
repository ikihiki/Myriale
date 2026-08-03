using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.Scenarios;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

/// <summary>Compatibility facade for older internal callers. HTTP endpoints use explicit use cases.</summary>
public sealed class ScenarioDefinitionAuthoringService(
    IScenarioDefinitionRepository repository,
    ScenarioDefinitionDraftService drafts,
    ScenarioDefinitionValidator validator,
    ScenarioDefinitionWriter writer,
    ScenarioDefinitionMapper mapper,
    ApplicationDbContext db)
{
    public ScenarioDefinitionAuthoringService(ApplicationDbContext db) : this(
        new Myriale.Api.Infrastructure.Scenarios.EfScenarioDefinitionRepository(db),
        CreateDraftService(db),
        new ScenarioDefinitionValidator(CreateMapper()),
        new ScenarioDefinitionWriter(db, new Myriale.Api.Domain.Scenarios.ScenarioRuleJsonCodec()),
        CreateMapper(), db)
    { }

    private static ScenarioDefinitionMapper CreateMapper() => new(new Myriale.Api.Domain.Scenarios.ScenarioRuleJsonCodec());
    private static ScenarioDefinitionDraftService CreateDraftService(ApplicationDbContext db)
    {
        var codec = new Myriale.Api.Domain.Scenarios.ScenarioRuleJsonCodec();
        var mapper = new ScenarioDefinitionMapper(codec);
        var repository = new Myriale.Api.Infrastructure.Scenarios.EfScenarioDefinitionRepository(db);
        return new(db, repository, mapper, new ScenarioDefinitionWriter(db, codec));
    }

    public async Task<ScenarioDefinitionVersion?> GetLatestAsync(string scenarioId, CancellationToken cancellationToken) =>
        await repository.GetDraftAsync(scenarioId, cancellationToken) ?? await repository.GetLatestPublishedAsync(scenarioId, cancellationToken);
    public Task<ScenarioDefinitionVersion> GetOrCreateDraftAsync(string scenarioId, CancellationToken cancellationToken) => drafts.GetOrCreateDraftAsync(scenarioId, cancellationToken);
    public Dictionary<string, string[]> Validate(ScenarioRuleDataRequest request, bool forPublish) => validator.Validate(request, forPublish);
    public Dictionary<string, string[]> PreparePut(ScenarioDefinitionVersion? draft, ScenarioRuleDataRequest request) => validator.PreparePut(draft, request);
    public ScenarioRuleDataResponse ToResponse(ScenarioDefinitionVersion version) => mapper.ToResponse(version);
    public ScenarioRuleDataRequest ToRequest(ScenarioDefinitionVersion version) => mapper.ToRequest(version);
    public async Task<ScenarioDefinitionVersion> SaveAsync(ScenarioDefinitionVersion version, ScenarioRuleDataRequest request, CancellationToken cancellationToken)
    {
        version.SnapshotScenario(await db.Scenarios.SingleAsync(x => x.Id == version.ScenarioId, cancellationToken));
        writer.Replace(version, request, DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(cancellationToken);
        return version;
    }
}
