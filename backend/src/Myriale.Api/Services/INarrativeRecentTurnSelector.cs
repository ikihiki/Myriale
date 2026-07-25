using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public interface INarrativeRecentTurnSelector
{
    IReadOnlyList<NarrativeRecentTurnInput> Select(IReadOnlyList<NarrativeRecentTurnInput> newestTurns);
}

public sealed class NarrativeRecentTurnSelector(
    INarrativeTokenEstimator tokenEstimator,
    IOptions<NarrativeContextOptions> options) : INarrativeRecentTurnSelector
{
    public IReadOnlyList<NarrativeRecentTurnInput> Select(IReadOnlyList<NarrativeRecentTurnInput> newestTurns)
    {
        var tokenBudget = options.Value.RecentTurnsTokenBudget;
        if (tokenBudget <= 0) return [];
        var selected = new List<NarrativeRecentTurnInput>();
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
}
