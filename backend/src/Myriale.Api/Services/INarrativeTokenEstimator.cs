using System.Text;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public interface INarrativeTokenEstimator
{
    int EstimateTokens(NarrativeDialogueTurnInput turn);
}

public sealed class Utf8NarrativeTokenEstimator : INarrativeTokenEstimator
{
    private const int StructuralOverhead = 8;
    private const int BytesPerEstimatedToken = 3;

    public int EstimateTokens(NarrativeDialogueTurnInput turn)
    {
        var byteCount = Encoding.UTF8.GetByteCount(turn.PlayerInput ?? string.Empty)
            + Encoding.UTF8.GetByteCount(turn.Narrative ?? string.Empty);
        return StructuralOverhead + (byteCount + BytesPerEstimatedToken - 1) / BytesPerEstimatedToken;
    }
}
