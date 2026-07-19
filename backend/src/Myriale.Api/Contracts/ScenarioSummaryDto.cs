namespace Myriale.Api.Contracts;

public sealed record ScenarioSummaryDto(
    string Id,
    string Title,
    string Genre,
    string Status,
    DateOnly UpdatedAt,
    string Summary,
    string HeroMode,
    bool HeroFreeGenerationAllowed,
    string Hero);
