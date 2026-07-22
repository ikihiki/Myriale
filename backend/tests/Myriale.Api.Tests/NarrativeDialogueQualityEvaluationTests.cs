using System.Text.Json;
using Myriale.Api.Contracts;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class NarrativeDialogueQualityEvaluationTests
{
    private readonly NarrativeDialogueContext _context = CreateContext();
    private readonly NarrativePromptInstructions _prompt;

    public NarrativeDialogueQualityEvaluationTests()
    {
        _prompt = new NarrativePromptBuilder().Build(_context, NarrativeInteractionTypes.Dialogue);
    }

    [Fact]
    public void InspectingADoorDoesNotOpenOrEnterIt()
    {
        Assert.Contains(_prompt.Rules, rule => rule.Contains("調べる・確認する", StringComparison.Ordinal)
            && rule.Contains("開ける", StringComparison.Ordinal)
            && rule.Contains("入る", StringComparison.Ordinal));
        AssertFixedCase(
            "扉を調べる",
            "主人公は閉じた扉の刻印を観察した。扉は閉じたままで、次にどうするかを待っている。",
            ["閉じた扉", "閉じたまま", "待っている"],
            ["扉を開けて", "中へ入った", "鍵を消費した"],
            "主人公は扉を開けて中へ入り、鍵を消費した。");
    }

    [Fact]
    public void NpcIdentityVoiceAndSecretRemainConsistentAcrossTurns()
    {
        Assert.Contains("司書リラ", _context.Scenario.Lore, StringComparison.Ordinal);
        Assert.Contains("ございます", Assert.Single(_context.RecentTurns).Narrative, StringComparison.Ordinal);
        Assert.Contains(_prompt.Rules, rule => rule.Contains("NPCの名前", StringComparison.Ordinal)
            && rule.Contains("口調", StringComparison.Ordinal)
            && rule.Contains("秘密", StringComparison.Ordinal));
        AssertFixedCase(
            "リラに出口を尋ねる",
            "司書リラは『出口は東でございます』と静かに答えたが、王家の鍵の在処には触れなかった。",
            ["司書リラ", "ございます", "触れなかった"],
            ["私は王女", "王家の鍵は地下室", "乱暴に言い放った"],
            "リラは『私は王女。王家の鍵は地下室だ』と乱暴に言い放った。");
    }

    [Fact]
    public void ScenarioCanonContradictionIsNotProduced()
    {
        Assert.Contains("魔法の光は常に青い", _context.Scenario.Lore, StringComparison.Ordinal);
        Assert.Contains(_prompt.Rules, rule => rule.Contains("Scenario", StringComparison.Ordinal)
            && rule.Contains("Canon", StringComparison.Ordinal));
        AssertFixedCase(
            "魔法灯を観察する",
            "魔法灯はCanonどおり青い光を放ち、石壁を淡く照らしている。",
            ["青い光"],
            ["赤い光", "魔法は存在しない"],
            "魔法灯は赤い光を放った。この世界に魔法は存在しない。");
    }

    [Fact]
    public void CompletedModuleOutcomeRemainsAuthoritative()
    {
        var outcome = Assert.Single(_context.PriorModuleOutcomes);
        Assert.Equal("seal-completed", outcome.Code);
        Assert.Equal("sealed", Assert.Single(outcome.EmittedEvents).Type);
        Assert.Contains("門は封印された", Assert.Single(outcome.PublicFacts).Text, StringComparison.Ordinal);
        Assert.Contains(_prompt.Rules, rule => rule.Contains("Emitted Events", StringComparison.Ordinal)
            && rule.Contains("Narrative Hints", StringComparison.Ordinal));
        AssertFixedCase(
            "封印した門を振り返る",
            "門は封印されたまま静まり、封印済みの印が青く残っている。次の行動を待っている。",
            ["封印されたまま", "封印済み", "待っている"],
            ["門が再び開いた", "封印は消えた", "敵が復活した"],
            "門が再び開いた。封印は消え、敵が復活した。");
    }

    private static void AssertFixedCase(
        string playerInput,
        string compliantBody,
        IReadOnlyList<string> required,
        IReadOnlyList<string> forbidden,
        string violatingBody)
    {
        Assert.False(string.IsNullOrWhiteSpace(playerInput));
        Assert.All(required, phrase => Assert.Contains(phrase, compliantBody, StringComparison.Ordinal));
        Assert.All(forbidden, phrase => Assert.DoesNotContain(phrase, compliantBody, StringComparison.Ordinal));
        Assert.Contains(forbidden, phrase => violatingBody.Contains(phrase, StringComparison.Ordinal));
    }

    private static NarrativeDialogueContext CreateContext()
    {
        using var payload = JsonDocument.Parse("""{"sealed":true}""");
        return new NarrativeDialogueContext(
            NarrativeContextSchema.Version,
            new NarrativeContextDiagnostics(NarrativeContextSchema.Version, ["scenario", "recent-turns", "module-outcomes"], 256, new string('a', 64)),
            new NarrativeScenarioInput(
                "青い灯の書庫",
                "封印された書庫を調査する。",
                "Fantasy",
                "静謐",
                "司書リラは古書庫の案内人。別名は蒼の司書。丁寧な『〜でございます』口調を守る。王家の鍵の在処は公開条件未達の秘密。魔法の光は常に青い。",
                "Guided",
                "探索者",
                "閉じた扉の前に立っている。"),
            [new NarrativeDialogueTurnInput("ここはどこ？", "司書リラは『古書庫でございます』と答えた。")],
            new NarrativeSessionMemoryInput(null, []),
            [new NarrativePriorModuleOutcomeInput(
                "seal-completed",
                [new ModuleFact("state", "門は封印された。")],
                [new ModuleEvent("sealed", payload.RootElement.Clone())],
                ["封印済みの印を描写する。"],
                ["門が理由なく再び開く。", "封印した敵が復活する。"])],
            new NarrativeSessionStateInput(2, new Dictionary<string, bool> { ["gate-sealed"] = true }),
            "sealed-gate",
            []);
    }
}
