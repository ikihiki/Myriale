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
    NarrativeSessionStateInput SessionState,
    IReadOnlyList<NarrativeAllowedSignal> AllowedSignals);
