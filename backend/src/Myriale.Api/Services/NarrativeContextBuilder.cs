using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Modules.Runtime;
using Myriale.ModuleSdk;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class NarrativeContextBuilder(
    ApplicationDbContext db,
    INarrativeTokenEstimator tokenEstimator,
    IOptions<NarrativeContextOptions> options) : INarrativeContextBuilder
{
    public async Task<NarrativeDialogueContext> BuildDialogueAsync(
        string ownerId,
        string sessionId,
        string interactionType,
        CancellationToken cancellationToken)
    {
        var session = await db.Sessions.AsNoTracking()
            .Include(item => item.Scenario)
            .Include(item => item.State)
            .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken)
            ?? throw new NarrativeGenerationException("Narrative context source is unavailable.");

        var newestTurns = await db.SessionTurns.AsNoTracking()
            .Include(turn => turn.PlayerInput)
            .Where(turn => turn.SessionId == sessionId && turn.Kind == "narrative")
            .OrderByDescending(turn => turn.Position)
            .Select(turn => new NarrativeDialogueTurnInput(
                turn.PlayerInput == null ? null : turn.PlayerInput.Text,
                turn.NarrativeBody))
            .ToListAsync(cancellationToken);
        var recentTurns = SelectRecentTurns(newestTurns, options.Value.RecentTurnsTokenBudget);

        var storedOutcomeJson = await db.SessionTurns.AsNoTracking()
            .Where(turn => turn.SessionId == sessionId
                && turn.Session.OwnerId == ownerId
                && turn.Kind == "module"
                && turn.ModuleExecution != null
                && turn.ModuleExecution.Status == ModuleExecutionStatuses.Completed
                && turn.ModuleExecution.OutcomeJson != null)
            .OrderBy(turn => turn.Position)
            .Select(turn => turn.ModuleExecution!.OutcomeJson!)
            .ToListAsync(cancellationToken);
        IReadOnlyList<NarrativePriorModuleOutcomeInput> priorModuleOutcomes;
        try
        {
            var moduleJson = ModuleJsonSerializerOptions.Create();
            priorModuleOutcomes = storedOutcomeJson.Select(json =>
            {
                var outcome = JsonSerializer.Deserialize<ModuleOutcome>(json, moduleJson)
                    ?? throw new JsonException("Stored module outcome is empty.");
                return new NarrativePriorModuleOutcomeInput(
                    outcome.PublicFacts,
                    outcome.NarrativeHints,
                    outcome.ForbiddenNarrativeFacts);
            }).ToArray();
        }
        catch (JsonException exception)
        {
            throw new NarrativeGenerationException("Stored module outcome is invalid.", exception);
        }

        var flags = JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(session.State.FlagsJson)
            ?? new Dictionary<string, bool>();
        var allowedSignals = interactionType == NarrativeInteractionTypes.Clarification
            ? []
            : await LoadAllowedSignalsAsync(session.Progress, cancellationToken);

        return new NarrativeDialogueContext(
            NarrativeContextSchema.Version,
            new NarrativeScenarioInput(
                session.Scenario.Title,
                session.Scenario.Summary,
                session.Scenario.Genre,
                session.Scenario.Tone,
                session.Scenario.Lore,
                session.Scenario.AiFreedom,
                session.Scenario.Hero,
                session.Scenario.Opening),
            recentTurns,
            new NarrativeSessionMemoryInput(null, []),
            priorModuleOutcomes,
            new NarrativeSessionStateInput(session.State.Revision, flags),
            session.Progress?.CurrentNode.Code,
            allowedSignals);
    }

    private IReadOnlyList<NarrativeDialogueTurnInput> SelectRecentTurns(
        IReadOnlyList<NarrativeDialogueTurnInput> newestTurns,
        int tokenBudget)
    {
        if (tokenBudget <= 0) return [];
        var selected = new List<NarrativeDialogueTurnInput>();
        var usedTokens = 0;
        foreach (var turn in newestTurns)
        {
            var cost = tokenEstimator.EstimateTokens(turn);
            if (cost <= 0) throw new NarrativeGenerationException("Narrative token estimator returned an invalid cost.");
            if (cost > tokenBudget - usedTokens) break;
            selected.Add(turn);
            usedTokens += cost;
        }
        selected.Reverse();
        return selected;
    }

    private async Task<IReadOnlyList<NarrativeAllowedSignal>> LoadAllowedSignalsAsync(
        SessionProgressState? progress,
        CancellationToken cancellationToken)
    {
        if (progress is null) return [];
        var allowedCodes = JsonSerializer.Deserialize<IReadOnlyList<string>>(progress.CurrentNode.AllowedNarrativeSignalsJson) ?? [];
        var seen = new HashSet<string>(StringComparer.Ordinal);
        if (allowedCodes.Any(code => string.IsNullOrWhiteSpace(code)
                || code.Length > 80
                || code.Any(character => !(char.IsLower(character) || char.IsDigit(character) || character == '-'))
                || !seen.Add(code)))
            throw new NarrativeGenerationException("Scenario progression contains an invalid narrative signal allowlist.");
        if (allowedCodes.Count == 0) return [];

        var transitions = await db.ScenarioProgressionTransitions.AsNoTracking()
            .Where(transition => transition.SourceNodeId == progress.CurrentNodeId
                && allowedCodes.Contains(transition.SignalCode))
            .Select(transition => new { transition.SignalCode, transition.TriggerDescription })
            .ToDictionaryAsync(transition => transition.SignalCode, StringComparer.Ordinal, cancellationToken);
        if (transitions.Count != allowedCodes.Count)
            throw new NarrativeGenerationException("Scenario progression signal is missing a transition definition.");

        return allowedCodes.Select(code =>
        {
            var transition = transitions[code];
            if (string.IsNullOrWhiteSpace(transition.TriggerDescription) || transition.TriggerDescription.Length > 1000)
                throw new NarrativeGenerationException("Scenario progression signal is missing a valid trigger description.");
            return new NarrativeAllowedSignal(code, transition.TriggerDescription.Trim());
        }).ToArray();
    }
}
