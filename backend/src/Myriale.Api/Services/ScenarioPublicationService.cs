using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record ScenarioDefinitionReadiness(bool IsReady, IReadOnlyDictionary<string, string[]> Errors);

public sealed class ScenarioDefinitionReadinessPolicy(ScenarioDefinitionAuthoringService authoring)
{
    public ScenarioDefinitionReadiness Evaluate(ScenarioDefinitionVersion definition)
    {
        var errors = authoring.Validate(authoring.ToRequest(definition), true);
        return new(errors.Count == 0, errors);
    }
}

public enum ScenarioPublicationOutcome { Published, NotFound, Conflict, NotReady }
public sealed record ScenarioPublicationResult(
    ScenarioPublicationOutcome Outcome,
    ScenarioDefinitionVersion? Definition = null,
    IReadOnlyDictionary<string, string[]>? Errors = null);

public sealed class ScenarioPublicationService(
    ApplicationDbContext db,
    ScenarioDefinitionAuthoringService authoring,
    ScenarioDefinitionReadinessPolicy readinessPolicy)
{
    public async Task<ScenarioDefinitionReadiness?> GetReadinessAsync(string scenarioId, CancellationToken cancellationToken)
    {
        var definition = await authoring.GetLatestAsync(scenarioId, cancellationToken);
        return definition is null ? null : readinessPolicy.Evaluate(definition);
    }

    public async Task<ScenarioPublicationResult> PublishAsync(string scenarioId, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var definition = await authoring.GetLatestAsync(scenarioId, cancellationToken);
        if (definition is null) return new(ScenarioPublicationOutcome.NotFound);
        if (definition.Status != DefinitionStatus.Draft) return new(ScenarioPublicationOutcome.Conflict, definition);

        var readiness = readinessPolicy.Evaluate(definition);
        if (!readiness.IsReady) return new(ScenarioPublicationOutcome.NotReady, definition, readiness.Errors);

        var scenario = await db.Scenarios.SingleAsync(item => item.Id == scenarioId, cancellationToken);
        definition.SnapshotScenario(scenario);
        var now = DateTimeOffset.UtcNow;
        definition.Publish(now);
        scenario.Publish(now);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new(ScenarioPublicationOutcome.Published, definition);
    }
}
