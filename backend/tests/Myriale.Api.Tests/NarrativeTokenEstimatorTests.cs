using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class NarrativeTokenEstimatorTests
{
    private readonly Utf8NarrativeTokenEstimator _estimator = new();

    [Fact]
    public void EmptyTurnStillHasStructuralCost()
    {
        Assert.Equal(8, _estimator.EstimateTokens(new NarrativeDialogueTurnInput(null, null)));
    }

    [Fact]
    public void EstimateCountsUtf8BytesFromBothFields()
    {
        Assert.Equal(12, _estimator.EstimateTokens(new NarrativeDialogueTurnInput("abc", "あいう")));
    }

    [Fact]
    public void EstimateIsDeterministic()
    {
        var turn = new NarrativeDialogueTurnInput("銀の鍵", "扉へ進む");
        Assert.Equal(_estimator.EstimateTokens(turn), _estimator.EstimateTokens(turn));
    }
}
