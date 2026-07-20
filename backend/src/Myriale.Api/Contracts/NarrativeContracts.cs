using System.Text.Json;
using Myriale.ModuleSdk;

namespace Myriale.Api.Contracts;

public static class NarrativeDialogueSchema
{
    public const string Version = "narrative-dialogue.v1";

    public static readonly IReadOnlySet<string> TurnTypes = new HashSet<string>(StringComparer.Ordinal)
    {
        "action-result",
        "npc-reply",
        "clarification",
    };
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

public sealed record NarrativeDialogueRequest(
    string SchemaVersion,
    NarrativeScenarioInput Scenario,
    IReadOnlyList<NarrativeDialogueTurnInput> RecentTurns,
    string InteractionType,
    string PlayerInput,
    NarrativeSessionStateInput SessionState,
    IReadOnlyList<string> AllowedSignals,
    bool IncludeInterpretation);

public sealed record NarrativeDialogueTurnInput(string? PlayerInput, string? Narrative);
public sealed record NarrativeProgressionSignal(string Code);
public sealed record NarrativeDialogueResult(
    string SchemaVersion,
    string TurnType,
    string Heading,
    string Body,
    IReadOnlyList<NarrativeProgressionSignal> Signals,
    string? Interpretation = null);

public sealed record NarrativeActionRecommendationRequest(
    NarrativeScenarioInput Scenario,
    IReadOnlyList<NarrativeDialogueTurnInput> RecentTurns,
    NarrativeSessionStateInput SessionState);

public sealed record NarrativeActionRecommendationResult(string Suggestion);

public sealed record NarrativeHandoffRequest(
    NarrativeScenarioInput Scenario,
    NarrativeOutcomeInput Outcome,
    JsonElement FinalPublicModuleState,
    NarrativeSessionStateInput SessionState);

public sealed record NarrativeHandoffResponse(string Body);

public sealed record NarrativeHandoffErrorResponse(string Code, string Message);
