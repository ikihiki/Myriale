using System.Security.Cryptography;
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
    INarrativeRecentTurnSelector recentTurnSelector,
    IOptions<NarrativeContextOptions> options) : INarrativeContextBuilder
{
    public async Task<NarrativeDialogueContext> BuildDialogueAsync(
        string ownerId,
        string sessionId,
        string interactionType,
        string playerInput,
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
        var memory = await LoadMemoryAsync(sessionId, playerInput, recentTurns, session.Progress?.CurrentNode.Code, cancellationToken);
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

    private async Task<NarrativeSessionMemoryInput> LoadMemoryAsync(
        string sessionId,
        string playerInput,
        IReadOnlyList<NarrativeDialogueTurnInput> recentTurns,
        string? progressionNode,
        CancellationToken cancellationToken)
    {
        var memoryBudget = options.Value.MemoryTokenBudget;
        if (memoryBudget <= 0) return new NarrativeSessionMemoryInput(null, []);

        var summary = await db.SessionSummaries.AsNoTracking()
            .Where(item => item.SessionId == sessionId)
            .OrderByDescending(item => item.Version)
            .FirstOrDefaultAsync(cancellationToken);
        var summaryText = summary?.Body;
        var usedTokens = EstimateTokens(summaryText);
        if (usedTokens > memoryBudget)
        {
            var maxChars = Math.Max(0, memoryBudget * 4);
            summaryText = summaryText is null ? null : summaryText[..Math.Min(summaryText.Length, maxChars)];
            usedTokens = EstimateTokens(summaryText);
        }

        var query = string.Join('\n', new[]
        {
            playerInput,
            progressionNode ?? string.Empty,
            summary?.CurrentLocation ?? string.Empty,
            recentTurns.LastOrDefault()?.PlayerInput ?? string.Empty,
            recentTurns.LastOrDefault()?.Narrative ?? string.Empty,
        });
        var notes = await db.SessionNotes.AsNoTracking()
            .Where(note => note.SessionId == sessionId && note.CanonStatus != "unconfirmed")
            .ToListAsync(cancellationToken);
        var ranked = notes
            .Select(note => new { Note = note, Score = RelevanceScore(note, query) })
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Note.CanonStatus == "canon" ? 0 : 1)
            .ThenByDescending(item => item.Note.UpdatedAt)
            .Take(options.Value.MaxLorebookEntries);
        var selected = new List<NarrativeLorebookEntryInput>();
        foreach (var item in ranked)
        {
            var aliases = JsonSerializer.Deserialize<IReadOnlyList<string>>(item.Note.AliasesJson) ?? [];
            var statusRule = item.Note.CanonStatus == "rumor"
                ? "RUMOR — possibility only; never assert as established fact"
                : "CANON — established fact";
            var text = $"[{statusRule}] {item.Note.Title} ({string.Join(", ", aliases)}): {item.Note.Body}";
            var cost = EstimateTokens(text);
            if (cost > memoryBudget - usedTokens) continue;
            selected.Add(new NarrativeLorebookEntryInput(item.Note.Id, text, item.Note.CanonStatus, item.Note.Kind));
            usedTokens += cost;
        }
        return new NarrativeSessionMemoryInput(summaryText, selected);
    }

    private static int RelevanceScore(SessionNote note, string query)
    {
        var score = note.CanonStatus == "canon" ? 10 : 0;
        if (query.Contains(note.Title, StringComparison.OrdinalIgnoreCase)) score += 100;
        var aliases = JsonSerializer.Deserialize<IReadOnlyList<string>>(note.AliasesJson) ?? [];
        score += aliases.Count(alias => query.Contains(alias, StringComparison.OrdinalIgnoreCase)) * 60;
        var terms = query.Split([' ', '\n', '\r', '\t', '、', '。', '「', '」'], StringSplitOptions.RemoveEmptyEntries)
            .Where(term => term.Length >= 2).Distinct(StringComparer.OrdinalIgnoreCase);
        score += terms.Count(term => note.Body.Contains(term, StringComparison.OrdinalIgnoreCase)) * 5;
        return score;
    }

    private static int EstimateTokens(string? text) => string.IsNullOrEmpty(text)
        ? 0
        : Math.Max(1, (System.Text.Encoding.UTF8.GetByteCount(text) + 3) / 4);

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
