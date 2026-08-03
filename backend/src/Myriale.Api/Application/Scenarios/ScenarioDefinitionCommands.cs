using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Application.Scenarios;

public sealed record CreateScenarioDefinitionDraftCommand(string ScenarioId, string AuthorId);
public sealed record SaveScenarioDefinitionCommand(string ScenarioId, string AuthorId, ScenarioRuleDataRequest Request);
public sealed record PublishScenarioDefinitionCommand(string ScenarioId, string AuthorId);
public enum ScenarioDefinitionCommandOutcome { Success, NotFound, Invalid, Conflict, NotReady }
public sealed record ScenarioDefinitionCommandResult(ScenarioDefinitionCommandOutcome Outcome, ScenarioRuleDataResponse? Definition = null, IReadOnlyDictionary<string, string[]>? Errors = null, bool Created = false);

public sealed class CreateScenarioDefinitionDraftUseCase(
    ApplicationDbContext db, IScenarioDefinitionRepository repository, ScenarioDefinitionDraftService drafts, ScenarioDefinitionMapper mapper)
{
    public async Task<ScenarioDefinitionCommandResult> ExecuteAsync(CreateScenarioDefinitionDraftCommand command, CancellationToken cancellationToken)
    {
        if (!await db.Scenarios.AnyAsync(x => x.Id == command.ScenarioId && x.AuthorId == command.AuthorId, cancellationToken))
            return new(ScenarioDefinitionCommandOutcome.NotFound);
        var existing = await repository.GetDraftAsync(command.ScenarioId, cancellationToken);
        if (existing is not null) return new(ScenarioDefinitionCommandOutcome.Success, mapper.ToResponse(existing));
        try { return new(ScenarioDefinitionCommandOutcome.Success, mapper.ToResponse(await drafts.GetOrCreateDraftAsync(command.ScenarioId, cancellationToken)), Created: true); }
        catch (DbUpdateConcurrencyException) { return new(ScenarioDefinitionCommandOutcome.Conflict); }
    }
}

public sealed class SaveScenarioDefinitionUseCase(
    ApplicationDbContext db, IScenarioDefinitionRepository repository, ScenarioDefinitionDraftService drafts,
    ScenarioDefinitionValidator validator, ScenarioDefinitionWriter writer, ScenarioDefinitionMapper mapper)
{
    public async Task<ScenarioDefinitionCommandResult> ExecuteAsync(SaveScenarioDefinitionCommand command, CancellationToken cancellationToken)
    {
        var scenario = await db.Scenarios.SingleOrDefaultAsync(
            x => x.Id == command.ScenarioId && x.AuthorId == command.AuthorId, cancellationToken);
        if (scenario is null) return new(ScenarioDefinitionCommandOutcome.NotFound);
        var draft = await repository.GetDraftAsync(command.ScenarioId, cancellationToken);
        if (draft is null && await repository.GetLatestPublishedAsync(command.ScenarioId, cancellationToken) is not null)
            return new(ScenarioDefinitionCommandOutcome.Conflict);
        var errors = validator.PreparePut(draft, command.Request);
        foreach (var pair in validator.Validate(command.Request, false))
            errors[pair.Key] = errors.TryGetValue(pair.Key, out var existing) ? existing.Concat(pair.Value).Distinct().ToArray() : pair.Value;
        if (errors.Count > 0) return new(ScenarioDefinitionCommandOutcome.Invalid, Errors: errors);
        draft ??= await drafts.GetOrCreateDraftAsync(command.ScenarioId, cancellationToken);
        draft.SnapshotScenario(scenario);
        writer.Replace(draft, command.Request, DateTimeOffset.UtcNow);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return new(ScenarioDefinitionCommandOutcome.Conflict); }
        return new(ScenarioDefinitionCommandOutcome.Success, mapper.ToResponse(draft));
    }
}

public sealed class PublishScenarioDefinitionUseCase(
    ApplicationDbContext db, IScenarioDefinitionRepository repository, ScenarioDefinitionReadinessPolicy readiness,
    ScenarioDefinitionMapper mapper, IDomainEventDispatcher dispatcher)
{
    public async Task<ScenarioDefinitionCommandResult> ExecuteAsync(PublishScenarioDefinitionCommand command, CancellationToken cancellationToken)
    {
        var scenario = await db.Scenarios.SingleOrDefaultAsync(
            x => x.Id == command.ScenarioId && x.AuthorId == command.AuthorId, cancellationToken);
        if (scenario is null) return new(ScenarioDefinitionCommandOutcome.NotFound);
        var definition = await repository.GetDraftAsync(command.ScenarioId, cancellationToken);
        if (definition is null) return new(ScenarioDefinitionCommandOutcome.NotFound);
        var result = readiness.Evaluate(definition);
        if (!result.IsReady) return new(ScenarioDefinitionCommandOutcome.NotReady, Errors: result.Errors);
        var now = DateTimeOffset.UtcNow;
        definition.SnapshotScenario(scenario); definition.Publish(now); scenario.Publish(now);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return new(ScenarioDefinitionCommandOutcome.Conflict); }
        // Events are intentionally dispatched synchronously after commit/save. No outbox is provided.
        await dispatcher.DispatchAsync(definition.DequeueDomainEvents(), cancellationToken);
        return new(ScenarioDefinitionCommandOutcome.Success, mapper.ToResponse(definition));
    }
}
