namespace Myriale.Api.Features.Scenarios.Domain;

public interface IDomainEvent;

public interface IHasDomainEvents
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    IReadOnlyList<IDomainEvent> DequeueDomainEvents();
}

public sealed record ScenarioDefinitionPublished(
    ScenarioId ScenarioId,
    ScenarioDefinitionVersionId DefinitionVersionId,
    int Version,
    DateTimeOffset PublishedAt) : IDomainEvent;

public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken);
}
