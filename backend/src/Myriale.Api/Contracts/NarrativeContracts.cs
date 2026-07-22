using System.Text.Json;
using Myriale.ModuleSdk;

namespace Myriale.Api.Contracts;

public static class NarrativeDialogueSchema
{
    public const string Version = "narrative-dialogue.v8";

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

public static class NarrativeContextSchema
{
    public const string Version = "narrative-context.v2";
}

public sealed record NarrativeLorebookEntryInput(
    string Id,
    string Text,
    string CanonStatus = "canon",
    string Kind = "rule");
public sealed record NarrativeSessionMemoryInput(
    string? Summary,
    IReadOnlyList<NarrativeLorebookEntryInput> Lorebook);

public sealed record NarrativePriorModuleOutcomeInput(
    string Code,
    IReadOnlyList<ModuleFact> PublicFacts,
    IReadOnlyList<ModuleEvent> EmittedEvents,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts);

public sealed record NarrativeAllowedSignal(string Code, string TriggerDescription);

public sealed record NarrativeContextDiagnostics(
    string SchemaVersion,
    IReadOnlyList<string> ComponentIds,
    int SizeBytes,
    string Hash);

public sealed record NarrativePromptInstructions(
    string Version,
    string Perspective,
    string Tone,
    string FreedomPolicy,
    IReadOnlyList<string> Rules);

public sealed record NarrativeDialogueRequest(
    string SchemaVersion,
    string ContextSchemaVersion,
    NarrativeContextDiagnostics ContextDiagnostics,
    NarrativeScenarioInput Scenario,
    IReadOnlyList<NarrativeDialogueTurnInput> RecentTurns,
    NarrativeSessionMemoryInput Memory,
    IReadOnlyList<NarrativePriorModuleOutcomeInput> PriorModuleOutcomes,
    string InteractionType,
    NarrativePromptInstructions Prompt,
    string PlayerInput,
    NarrativeSessionStateInput SessionState,
    string? CurrentProgressionNode,
    IReadOnlyList<NarrativeAllowedSignal> AllowedSignals,
    bool IncludeInterpretation);

public sealed record NarrativeDialogueTurnInput(string? PlayerInput, string? Narrative);
public sealed record NarrativeProgressionSignal(string Code, string Evidence);
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
