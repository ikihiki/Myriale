using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class NarrativeProviderRequestBudgeter(IOptions<NarrativeContextOptions> options)
{
    private const int BytesPerEstimatedToken = 3;

    public NarrativeDialogueRequest Fit(
        NarrativeDialogueRequest request,
        Func<NarrativeDialogueRequest, AiTextRequest> providerRequestFactory)
    {
        ArgumentNullException.ThrowIfNull(providerRequestFactory);
        var budget = options.Value.FinalProviderRequestTokenBudget;
        var recentTurns = request.RecentTurns.ToList();
        var lorebook = request.Memory.Lorebook.ToList();
        var summary = request.Memory.Summary;
        var outcomes = request.PriorModuleOutcomes.ToList();

        while (true)
        {
            var candidate = WithContext(request, recentTurns, summary, lorebook, outcomes);
            if (EstimateTokens(providerRequestFactory(candidate)) <= budget) return candidate;

            // Preserve the newest turn, highest-ranked lore entry, and latest module outcome while
            // shedding lower-priority historical material in a deterministic order.
            if (recentTurns.Count > 1)
            {
                recentTurns.RemoveAt(0);
                continue;
            }
            if (summary is not null)
            {
                summary = null;
                continue;
            }
            if (lorebook.Count > 1)
            {
                lorebook.RemoveAt(lorebook.Count - 1);
                continue;
            }
            if (outcomes.Count > 1)
            {
                outcomes.RemoveAt(0);
                continue;
            }

            throw new NarrativeGenerationException(
                "Required authoritative narrative context exceeds the final provider request token budget.");
        }
    }

    public int EstimateTokens(AiTextRequest request)
    {
        var bytes = Encoding.UTF8.GetByteCount(Serialize(request));
        return Math.Max(1, (bytes + BytesPerEstimatedToken - 1) / BytesPerEstimatedToken);
    }

    public string Serialize(AiTextRequest request) => JsonSerializer.Serialize(new
    {
        messages = request.Messages.Select(message => new { role = message.Role.Value, content = message.Text }),
        responseFormat = new
        {
            schemaName = request.ResponseFormat.SchemaName,
            schema = request.ResponseFormat.Schema?.GetRawText(),
        },
    });

    private static NarrativeDialogueRequest WithContext(
        NarrativeDialogueRequest request,
        IReadOnlyList<NarrativeDialogueTurnInput> recentTurns,
        string? summary,
        IReadOnlyList<NarrativeLorebookEntryInput> lorebook,
        IReadOnlyList<NarrativePriorModuleOutcomeInput> outcomes)
    {
        var memory = new NarrativeSessionMemoryInput(summary, lorebook);
        var componentIds = new List<string> { "scenario", "session-state", "memory" };
        if (recentTurns.Count > 0) componentIds.Add("recent-turns");
        if (outcomes.Count > 0) componentIds.Add("module-outcomes");
        if (request.CurrentProgressionNode is not null) componentIds.Add("progression");
        var diagnosticBytes = JsonSerializer.SerializeToUtf8Bytes(new
        {
            scenarioInput = request.Scenario,
            recentTurns,
            memory,
            priorModuleOutcomes = outcomes,
            sessionState = request.SessionState,
            currentProgressionNode = request.CurrentProgressionNode,
            allowedSignals = request.AllowedSignals,
        });
        var diagnostics = new NarrativeContextDiagnostics(
            NarrativeContextSchema.Version,
            componentIds,
            diagnosticBytes.Length,
            Convert.ToHexString(SHA256.HashData(diagnosticBytes)).ToLowerInvariant());

        return request with
        {
            ContextDiagnostics = diagnostics,
            RecentTurns = recentTurns.ToArray(),
            Memory = memory,
            PriorModuleOutcomes = outcomes.ToArray(),
        };
    }
}
