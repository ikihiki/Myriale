using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Modules.Runtime;
using Myriale.ModuleSdk;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class NarrativeContextBuilder(
    ApplicationDbContext db,
    INarrativeRecentTurnSelector recentTurnSelector) : INarrativeContextBuilder
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
        var recentTurns = recentTurnSelector.Select(newestTurns);

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
                    outcome.Code,
                    outcome.PublicFacts,
                    outcome.EmittedEvents,
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

        var scenarioInput = new NarrativeScenarioInput(
            session.Scenario.Title,
            session.Scenario.Summary,
            session.Scenario.Genre,
            session.Scenario.Tone,
            session.Scenario.Lore,
            session.Scenario.AiFreedom,
            session.SelectedHero,
            session.Scenario.Opening);
        var sessionState = new NarrativeSessionStateInput(session.State.Revision, flags);
        var memory = new NarrativeSessionMemoryInput(null, []);
        var componentIds = new List<string> { "scenario", "session-state", "memory" };
        if (recentTurns.Count > 0) componentIds.Add("recent-turns");
        if (priorModuleOutcomes.Count > 0) componentIds.Add("module-outcomes");
        if (session.Progress is not null) componentIds.Add("progression");
        var diagnosticBytes = JsonSerializer.SerializeToUtf8Bytes(new
        {
            scenarioInput,
            recentTurns,
            memory,
            priorModuleOutcomes,
            sessionState,
            currentProgressionNode = session.Progress?.CurrentNode.Code,
            allowedSignals,
        });
        var diagnostics = new NarrativeContextDiagnostics(
            NarrativeContextSchema.Version,
            componentIds,
            diagnosticBytes.Length,
            Convert.ToHexString(SHA256.HashData(diagnosticBytes)).ToLowerInvariant());

        return new NarrativeDialogueContext(
            NarrativeContextSchema.Version,
            diagnostics,
            scenarioInput,
            recentTurns,
            memory,
            priorModuleOutcomes,
            sessionState,
            session.Progress?.CurrentNode.Code,
            allowedSignals);
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
