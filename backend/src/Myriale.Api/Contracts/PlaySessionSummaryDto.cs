namespace Myriale.Api.Contracts;

public sealed record PlaySessionSummaryDto(
    string Id,
    string ScenarioId,
    string ScenarioTitle,
    string SelectedHero,
    string Status,
    string? HeadTurnId,
    int? HeadTurnPosition,
    int TurnCount,
    string? LatestSummary,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
