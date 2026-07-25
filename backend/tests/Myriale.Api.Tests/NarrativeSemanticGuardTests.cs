using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class NarrativeSemanticGuardTests
{
    [Theory]
    [InlineData("Do not invent another outcome.", "A different result was fabricated.")]
    [InlineData("門が理由なく再び開く。", "封印の門が突然また開放された。")]
    public void ForbiddenFactsMatchNormalizedParaphrases(string forbiddenFact, string narrative)
    {
        Assert.Contains(forbiddenFact, NarrativeSemanticGuard.MatchForbiddenFacts(narrative, [forbiddenFact]));
    }

    [Fact]
    public void UnrelatedNarrativeDoesNotMatchForbiddenFact()
    {
        Assert.Empty(NarrativeSemanticGuard.MatchForbiddenFacts(
            "封印された門は静かなままだ。",
            ["門が理由なく再び開く。"]));
    }
}
