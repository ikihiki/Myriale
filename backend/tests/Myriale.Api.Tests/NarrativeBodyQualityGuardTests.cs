using System.Text;
using System.Text.Json;
using Myriale.Api.Contracts;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class NarrativeBodyQualityGuardTests
{
    private readonly NarrativeBodyQualityGuard _guard = new();

    [Fact]
    public void ProductionEvaluationInputsReceiveDeterministicBodiesThatPassTheSameQualityConcepts()
    {
        using var sealedPayload = JsonDocument.Parse("""{"sealed":true}""");
        var sealedOutcome = new NarrativePriorModuleOutcomeInput(
            "seal-completed",
            [new ModuleFact("state", "星座の門は青い封印で閉ざされた。")],
            [new ModuleEvent("sealed", sealedPayload.RootElement.Clone())],
            ["青い封印が残っていることを描写する。"],
            ["星座の門の封印が消える。", "封印した影が復活する。"]);
        var keyOutcome = new NarrativePriorModuleOutcomeInput(
            "key-accounted-for",
            [new ModuleFact("inventory", "銀の鍵はPlayerが保持している。")],
            [],
            ["銀の鍵の所在をPlayerの管理下として扱う。"],
            ["司書リラが銀の鍵を盗んだ。"]);

        var cases = new[]
        {
            Case("player-agency", Request(NarrativeInteractionTypes.Dialogue, "閉じた扉を調べる。扉を開けたり中へ入ったりはしない。"), 40, [], [["扉", "開", "入"], ["鍵", "消費"]]),
            Case("clarification", Request(NarrativeInteractionTypes.Clarification, "今わかっている状況だけを確認したい。新しい行動はしない。"), 30, [], [["次", "進"], ["扉", "開"]]),
            Case("lore-and-npc-voice", Request(NarrativeInteractionTypes.Dialogue, "司書リラに魔法灯について尋ねる。"), 50, [["リラ"], ["青", "灯"], ["ござい"]], [["赤", "灯"]]),
            Case("session-state", Request(NarrativeInteractionTypes.Dialogue, "扉の現在の状態を観察する。", new Dictionary<string, bool> { ["door-open"] = false }), 40, [["閉"]], [["開", "扉"]]),
            Case("module-authority", Request(NarrativeInteractionTypes.Dialogue, "封印した星座の門を振り返る。", outcomes: [sealedOutcome]), 50, [["封印"], ["青"]], [["封印", "消"], ["影", "復活"]]),
            Case("forbidden-paraphrase", Request(NarrativeInteractionTypes.Dialogue, "銀の鍵の所在を確認する。", outcomes: [keyOutcome]), 40, [["鍵"]], [["リラ", "鍵", "盗"], ["司書", "鍵", "持ち去"]]),
            Case("long-npc-reply", Request(NarrativeInteractionTypes.Dialogue, "司書リラに、この書庫の歴史と青い魔法灯の役割を、丁寧な口調で詳しく説明してもらう。"), 240, [["リラ"], ["青", "灯"], ["ござい"]], [["赤", "灯"]]),
            Case("signal-negative", Request(NarrativeInteractionTypes.Dialogue, "星座の扉にはまだ近づかず、遠くから眺める。"), 30, [], []),
            Case("signal-positive", Request(NarrativeInteractionTypes.Dialogue, "閉じた星座の扉の前まで進み、扉に到達した。"), 30, [], []),
        };

        foreach (var item in cases)
        {
            var first = DeterministicSafeNarrativeBodyBuilder.Build(item.Request);
            var second = DeterministicSafeNarrativeBodyBuilder.Build(item.Request);
            Assert.Equal(first, second);
            Assert.True(_guard.Assess(item.Request, first).IsAcceptable, $"{item.Id}: {string.Join(',', _guard.Assess(item.Request, first).Violations)}");
            Assert.True(first.Length >= item.MinimumLength, $"{item.Id}: body length {first.Length}");
            var normalized = Normalize(first);
            Assert.All(item.Required, group => Assert.True(ContainsAll(normalized, group), $"{item.Id}: missing {string.Join('+', group)}"));
            Assert.All(item.Forbidden, group => Assert.False(ContainsAll(normalized, group), $"{item.Id}: contained {string.Join('+', group)}"));
            Assert.Empty(NarrativeSemanticGuard.MatchForbiddenFacts(first, item.Request.PriorModuleOutcomes.SelectMany(outcome => outcome.ForbiddenNarrativeFacts)));
        }
    }

    [Fact]
    public void GuardRejectsShortUngroundedAgencyAdvancingAndForbiddenBodies()
    {
        var npc = Request(NarrativeInteractionTypes.Dialogue, "司書リラに魔法灯について尋ねる。");
        Assert.Contains("insufficient-detail", _guard.Assess(npc, "リラは答えた。青い。ございます。").Violations);
        Assert.Contains("npc-identity", _guard.Assess(npc, new string('長', 60) + "青い灯でございます。").Violations);

        var agency = Request(NarrativeInteractionTypes.Dialogue, "閉じた扉を調べる。扉を開けたり中へ入ったりはしない。");
        Assert.Contains("player-agency", _guard.Assess(agency, "探索者は扉を開け、中へ入った。そこで周囲を十分に確認し、行動を完了した。重要な判断もすでに確定している。").Violations);

        var forbidden = new NarrativePriorModuleOutcomeInput("key", [], [], [], ["司書リラが銀の鍵を盗んだ。"]);
        var forbiddenRequest = Request(NarrativeInteractionTypes.Dialogue, "銀の鍵の所在を確認する。", outcomes: [forbidden]);
        Assert.Contains("forbidden-fact", _guard.Assess(forbiddenRequest, "確定情報として、司書リラが銀の鍵を盗んだことが明らかになった。探索者はその結果を受け入れるほかない。 ").Violations);
    }

    [Fact]
    public void GuardRejectsRepeatedNarrativeConcreteNameDriftSpeakerInversionAndPrematureModuleOutcome()
    {
        var repeated = Request(NarrativeInteractionTypes.Dialogue, "扉を調べる。") with
        {
            RecentTurns = [new NarrativeDialogueTurnInput("前の行動", "閉じた扉は静かなままで、探索者は次の判断を待っている。")],
        };
        Assert.Contains("repeated-narrative", _guard.Assess(repeated, "閉じた扉は静かなままで、探索者は次の判断を待っている。").Violations);

        var drift = Request(NarrativeInteractionTypes.Dialogue, "星図灯を扉の星座模様にかざす。");
        Assert.Contains("entity-name-drift:星座模様", _guard.Assess(drift, "探索者は星図灯を星座の模型へ向け、周囲を慎重に確かめている。扉の状態はまだ変わっていない。").Violations);

        var inverted = Request(NarrativeInteractionTypes.Dialogue, "司書リラに魔法灯について尋ねる。");
        Assert.Contains("npc-speaker-inversion", _guard.Assess(inverted, "探索者は司書リラへ向き直り、青い魔法灯について丁寧に答えたのでございます。返答の後も判断は探索者に委ねられている。").Violations);

        var gated = Request(NarrativeInteractionTypes.Dialogue, "銀の鍵を使って閉じた星座の扉を開ける。判定を行う。");
        Assert.Contains("module-gated-outcome", _guard.Assess(gated, "探索者が銀の鍵を差し込むと扉が開いた。星座の光が広がり、判定は成功した。次の行動を選べる状態になった。").Violations);
    }

    private static EvaluationCase Case(string id, NarrativeDialogueRequest request, int minimum, IReadOnlyList<IReadOnlyList<string>> required, IReadOnlyList<IReadOnlyList<string>> forbidden) =>
        new(id, request, minimum, required, forbidden);

    private static NarrativeDialogueRequest Request(
        string interactionType,
        string playerInput,
        IReadOnlyDictionary<string, bool>? flags = null,
        IReadOnlyList<NarrativePriorModuleOutcomeInput>? outcomes = null)
    {
        var scenario = new NarrativeScenarioInput(
            "星喰いの地下図書館", "閉ざされた地下図書館を慎重に探索する。", "Fantasy", "静謐",
            "魔法灯は常に青い。閉じた扉はPlayerが明示するまで開かない。司書リラは丁寧な『〜でございます』口調を守る。",
            "Guided", "探索者", "水没した閲覧室にいる。");
        return new NarrativeDialogueRequest(
            NarrativeDialogueSchema.Version,
            NarrativeContextSchema.Version,
            new NarrativeContextDiagnostics(NarrativeContextSchema.Version, ["scenario"], 1024, new string('a', 64)),
            scenario,
            [new NarrativeDialogueTurnInput("ここはどこ？", "司書リラは『地下図書館でございます。青い魔法灯が足元を照らしております』と答えた。")],
            new NarrativeSessionMemoryInput("Playerは慎重に探索し、銀の鍵を自分で保持している。", [new NarrativeLorebookEntryInput("lamp", "魔法灯の光は必ず青い。")]),
            outcomes ?? [],
            interactionType,
            new NarrativePromptInstructions("test", "探索者", "静謐", "canon only", []),
            playerInput,
            new NarrativeSessionStateInput(4, flags ?? new Dictionary<string, bool> { ["door-open"] = false, ["player-has-silver-key"] = true }),
            "exploration",
            [new NarrativeAllowedSignal("constellation-door-reached", "Playerが閉じた星座の扉へ実際に到達したとき。")],
            false);
    }

    private static string Normalize(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var rune in value.Normalize(NormalizationForm.FormKC).EnumerateRunes())
            if (Rune.IsLetterOrDigit(rune)) builder.Append(rune.ToString().ToLowerInvariant());
        return builder.ToString();
    }

    private static bool ContainsAll(string normalized, IReadOnlyList<string> concepts) =>
        concepts.All(concept => normalized.Contains(Normalize(concept), StringComparison.Ordinal));

    private sealed record EvaluationCase(string Id, NarrativeDialogueRequest Request, int MinimumLength, IReadOnlyList<IReadOnlyList<string>> Required, IReadOnlyList<IReadOnlyList<string>> Forbidden);
}
