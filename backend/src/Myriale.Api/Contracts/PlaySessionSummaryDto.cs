namespace Myriale.Api.Contracts;

public sealed record PlaySessionSummaryDto(
    string Id,
    string ScenarioId,
    string ScenarioTitle,
    string State,
    string HeroName,
    int Turn,
    string Summary,
    string? TurnDisplay);
