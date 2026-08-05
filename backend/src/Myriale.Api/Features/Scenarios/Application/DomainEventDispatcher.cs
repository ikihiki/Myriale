using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Features.Scenarios.Application;

public interface IDomainEventDispatcher
{
    Task DispatchAsync(IEnumerable<IDomainEvent> events, CancellationToken cancellationToken);
}

public sealed class DomainEventDispatcher(IServiceProvider services) : IDomainEventDispatcher
{
    public async Task DispatchAsync(IEnumerable<IDomainEvent> events, CancellationToken cancellationToken)
    {
        foreach (var domainEvent in events)
        {
            var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(domainEvent.GetType());
            foreach (var handler in services.GetServices(handlerType))
            {
                var method = handlerType.GetMethod(nameof(IDomainEventHandler<IDomainEvent>.HandleAsync))!;
                await (Task)method.Invoke(handler, [domainEvent, cancellationToken])!;
            }
        }
    }
}

/// <summary>
/// Production handler for the synchronous post-save publication event. This is intentionally
/// observability-only; delivery is in-process and no transactional outbox is provided.
/// </summary>
public sealed class ScenarioDefinitionPublishedLoggingHandler(
    ILogger<ScenarioDefinitionPublishedLoggingHandler> logger)
    : IDomainEventHandler<ScenarioDefinitionPublished>
{
    public Task HandleAsync(ScenarioDefinitionPublished domainEvent, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Scenario definition published: ScenarioId={ScenarioId}, DefinitionVersionId={DefinitionVersionId}, Version={Version}, PublishedAt={PublishedAt}",
            domainEvent.ScenarioId, domainEvent.DefinitionVersionId, domainEvent.Version, domainEvent.PublishedAt);
        return Task.CompletedTask;
    }
}
