using System.Text;

namespace Myriale.Api.Features.NarrativeGeneration.Application.Services;

public interface INarrativeTokenEstimator
{
    int EstimateTokens(NarrativeRecentTurnInput turn);
}

public sealed class Utf8NarrativeTokenEstimator : INarrativeTokenEstimator
{
    private const int StructuralOverhead = 8;
    private const int BytesPerEstimatedToken = 3;

    public int EstimateTokens(NarrativeRecentTurnInput turn)
    {
        var byteCount = Encoding.UTF8.GetByteCount(turn.PlayerInput ?? string.Empty)
            + Encoding.UTF8.GetByteCount(turn.Narrative ?? string.Empty);
        return StructuralOverhead + (byteCount + BytesPerEstimatedToken - 1) / BytesPerEstimatedToken;
    }
}
