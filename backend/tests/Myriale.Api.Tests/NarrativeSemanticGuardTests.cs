using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class NarrativeSemanticGuardTests
{
    private static readonly NarrativeSessionStateInput State = new(7, new Dictionary<string, bool>());
    private static readonly NarrativeAllowedSignal[] Allowed =
    [
        new("constellation-door-reached", "Playerが閉じた星座の扉の場所まで実際に到達したときだけ発火する。"),
    ];

    [Theory]
    [InlineData("閉じた星座の扉を遠くから見るだけ")]
    [InlineData("閉じた星座の扉について話す")]
    [InlineData("閉じた星座の扉へ進むふりをする")]
    [InlineData("I ask about the constellation door from afar.")]
    public void AllowedCodeFailsClosedWhenAuthoritativePlayerInputDoesNotProveTrigger(string playerInput)
    {
        var exception = Assert.Throws<NarrativeSignalValidationException>(() =>
            NarrativeSemanticGuard.ValidateProgressionSignals(
                [new NarrativeProgressionSignal("constellation-door-reached", "The model claims the player arrived.")],
                Allowed,
                playerInput,
                State,
                "exploration"));

        Assert.Contains("authoritative player input/state does not satisfy", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void ValidSignalUsesServerOwnedEvidenceInsteadOfProviderEvidence()
    {
        var signal = Assert.Single(NarrativeSemanticGuard.ValidateProgressionSignals(
            [new NarrativeProgressionSignal("constellation-door-reached", "Untrusted provider prose.")],
            Allowed,
            "閉じた星座の扉へ進む",
            State,
            "exploration"));

        Assert.Equal("constellation-door-reached", signal.Code);
        Assert.Equal("server-rule:constellation-door-reached;state-revision:7;node:exploration", signal.ServerEvidence);
        Assert.DoesNotContain("provider", signal.ServerEvidence, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("閉じた星座の扉へ進む")]
    [InlineData("銀の鍵を使って閉じた星座の扉を開ける")]
    [InlineData("閉じた星座の扉の判定を行う")]
    [InlineData("I attempt to open the constellation door.")]
    [InlineData("I reach the constellation door.")]
    public void SafeDerivationEmitsOnlyServerProvenAllowedSignal(string playerInput)
    {
        var signal = Assert.Single(NarrativeSemanticGuard.DeriveProgressionSignals(
            Allowed,
            playerInput,
            State,
            "exploration"));

        Assert.Equal("constellation-door-reached", signal.Code);
        Assert.Equal("server-rule:constellation-door-reached;state-revision:7;node:exploration", signal.ServerEvidence);
    }

    [Fact]
    public void SafeDerivationIgnoresAllowedCodesWithoutServerEvidenceRules()
    {
        Assert.Empty(NarrativeSemanticGuard.DeriveProgressionSignals(
            [new NarrativeAllowedSignal("model-invented-signal", "Provider-friendly description")],
            "I definitely satisfy the provider-friendly description.",
            State,
            "exploration"));
    }

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
