namespace Myriale.Api.Domain.Scenarios;

public interface IDomainEvent;

public interface IHasDomainEvents
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    IReadOnlyList<IDomainEvent> DequeueDomainEvents();
}

public sealed record ScenarioDefinitionPublished(
    string ScenarioId,
    string DefinitionVersionId,
    int Version,
    DateTimeOffset PublishedAt) : IDomainEvent;

public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken);
}
