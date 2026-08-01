namespace Myriale.Api.Contracts;

public sealed record CreateScenarioRequest(
    string Title,
    string? Summary,
    string? Genre,
    string? Tone,
    string? Lore,
    string? AiFreedom,
    string? HeroMode,
    bool? HeroFreeGenerationAllowed,
    string? Hero,
    string? Opening,
    string? IllustrationStyle,
    string? IllustrationMood,
    string? IllustrationNegative,
    string? SampleScene);

public sealed record ScenarioDraftResponse(
    string Id,
    string Title,
    string Summary,
    string Genre,
    string Tone,
    string Lore,
    string AiFreedom,
    string HeroMode,
    bool HeroFreeGenerationAllowed,
    string Hero,
    string Opening,
    string IllustrationStyle,
    string IllustrationMood,
    string IllustrationNegative,
    string SampleScene,
    string Status,
    DateOnly UpdatedAt);

public sealed record RecommendScenarioHeroRequest(string? CurrentName, string? CurrentProfile);

public sealed record ScenarioHeroRecommendationResponse(string Name, string Profile, string Message);

public sealed record ScenarioErrorResponse(string Message, IReadOnlyDictionary<string, string[]> Errors);
