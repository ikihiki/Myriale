using System.Text.Json;
using Myriale.ModuleSdk;

namespace Myriale.Api.Contracts;

public static class NarrativeDocumentSchemas
{
    public const string ScenarioOpening = "scenario-opening.v1";
    public const string ModuleHandoff = "module-handoff.v1";
}

public sealed record NarrativeScenarioInput(
    string Title,
    string Summary,
    string Genre,
    string Tone,
    string Lore,
    string AiFreedom,
    string Hero,
    string Opening);

public sealed record NarrativeOutcomeInput(
    string Category,
    string Code,
    string Title,
    string Summary,
    IReadOnlyList<ModuleFact> PublicFacts,
    IReadOnlyList<ModuleEvent> EmittedEvents,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts);

public sealed record NarrativeSessionStateInput(
    long Revision,
    IReadOnlyDictionary<string, bool> Flags);

public sealed record NarrativeRecentTurnInput(string? PlayerInput, string? Narrative);

public sealed record NarrativeActionRecommendationRequest(
    NarrativeScenarioInput Scenario,
    IReadOnlyList<NarrativeRecentTurnInput> RecentTurns,
    NarrativeSessionStateInput SessionState);

public sealed record NarrativeActionRecommendationResult(string Suggestion);

public sealed record NarrativeHandoffRequest(
    NarrativeScenarioInput Scenario,
    NarrativeOutcomeInput Outcome,
    JsonElement FinalPublicModuleState,
    NarrativeSessionStateInput SessionState);

public sealed record NarrativeHandoffResponse(string Body);

public sealed record NarrativeHandoffErrorResponse(string Code, string Message);
