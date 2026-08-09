namespace Myriale.Api.Features.Scenarios.Contracts;

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
    ScenarioId Id,
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

public sealed record ScenarioNarrativeTestCase(
    IReadOnlyList<NarrativeRecentTurnInput> RecentTurns,
    string PlayerInput,
    RulePublicObject SelectedObject,
    RulePublicAction SelectedAction,
    RulePostState PostState,
    IReadOnlyList<string> Facts,
    IReadOnlyList<System.Text.Json.JsonElement> Events,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts,
    IReadOnlyList<NarrativeEntityInput> Entities);

public sealed record ImportScenarioNarrativeTestRequest(SessionId SessionId, SessionTurnId TurnId);
public sealed record ImportScenarioNarrativeTestResponse(SessionId SessionId, SessionTurnId TurnId, ScenarioNarrativeTestCase TestCase);
public sealed record CompareScenarioDraftNarrativeRequest(CreateScenarioRequest Draft, ScenarioNarrativeTestCase TestCase);
public sealed record ScenarioNarrativeTestResult(string Heading, string Body, string Model, long LatencyMilliseconds);
public sealed record CompareScenarioDraftNarrativeResponse(
    ScenarioDefinitionVersionId PublishedDefinitionVersionId,
    AiProviderProfileId AiProfileId,
    ScenarioNarrativeTestResult Published,
    ScenarioNarrativeTestResult Draft);

public sealed record RecommendScenarioHeroRequest(string? CurrentName, string? CurrentProfile);

public sealed record ScenarioHeroRecommendationResponse(string Name, string Profile, string Message);

public sealed record ScenarioErrorResponse(string Message, IReadOnlyDictionary<string, string[]> Errors);
