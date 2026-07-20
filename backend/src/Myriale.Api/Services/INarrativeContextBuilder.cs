using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public interface INarrativeContextBuilder
{
    Task<NarrativeDialogueContext> BuildDialogueAsync(
        string ownerId,
        string sessionId,
        string interactionType,
        CancellationToken cancellationToken);
}

public sealed record NarrativeDialogueContext(
    NarrativeScenarioInput Scenario,
    IReadOnlyList<NarrativeDialogueTurnInput> RecentTurns,
    IReadOnlyList<NarrativePriorModuleOutcomeInput> PriorModuleOutcomes,
    NarrativeSessionStateInput SessionState,
    string? CurrentProgressionNode,
    IReadOnlyList<NarrativeAllowedSignal> AllowedSignals);
