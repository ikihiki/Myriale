using System.Text.Json;
using Myriale.ModuleSdk;
using Myriale.StarEater.GuardianBattleModule;

namespace Myriale.StarEater.GuardianBattleModule.Tests;

public sealed class GuardianBattleModuleTests
{
    private readonly GuardianBattleModule _module = new();
    private static readonly JsonElement Configuration = JsonSerializer.SerializeToElement(new { playerName="巡礼者", enemyName="守護者", playerHp=20, enemyHp=12, playerAttack=5, enemyAttack=4, skillName="星図閃", skillPower=10, skillUses=1, fleeChance=50, victoryCode="guardian-defeated", defeatCode="guardian-victorious", fleeCode="guardian-escaped", victoryFlag="guardian-defeated" });

    [Fact]
    public async Task MultipleRoundsRemainOneActiveStateUntilVictory()
    {
        var initialized = await _module.InitializeAsync(new("init", Configuration, Binding(), []), default);
        var first = await Dispatch(initialized.State, 0, "attack", 0, 0);
        Assert.Equal(ModuleExecutionStatuses.Active, first.Status);
        Assert.Equal(2, first.ViewState.GetProperty("round").GetInt32());
        var second = await Dispatch(first.State, 1, "skill", 4, 0);
        Assert.Equal(ModuleExecutionStatuses.Completed, second.Status);
        Assert.Equal("guardian-defeated", second.Outcome?.Code);
        Assert.Empty(second.Outcome!.Effects);
        Assert.Equal(0, second.ViewState.GetProperty("enemyHp").GetInt32());
    }

    [Fact]
    public async Task HostRandomnessControlsEscapeAndUnexpectedActionFieldsAreRejected()
    {
        var initialized = await _module.InitializeAsync(new("init", Configuration, Binding(), []), default);
        var action = JsonSerializer.SerializeToElement(new { id="flee", playerHp=999, status="victory" });
        var rejected = await _module.DispatchAsync(new("flee-invalid", 0, Configuration, Binding(), initialized.State, action, [75, 0]), default);
        Assert.Equal(ModuleExecutionStatuses.Failed, rejected.Status);
        Assert.Equal("invalid_action", rejected.Error?.Code);
        var validAction = JsonSerializer.SerializeToElement(new { id="flee" });
        var result = await _module.DispatchAsync(new("flee", 0, Configuration, Binding(), initialized.State, validAction, [75, 0]), default);
        Assert.Equal(ModuleExecutionStatuses.Active, result.Status);
        Assert.Equal(18, result.ViewState.GetProperty("playerHp").GetInt32());
        var escaped = await _module.DispatchAsync(new("escape", 1, Configuration, Binding(), result.State, validAction, [25, 0]), default);
        Assert.Equal("guardian-escaped", escaped.Outcome?.Code);
    }

    [Fact]
    public async Task FixedRandomValuesCanProduceDefeat()
    {
        var fragile = JsonSerializer.SerializeToElement(new { playerName="巡礼者", enemyName="守護者", playerHp=3, enemyHp=99, playerAttack=1, enemyAttack=8, skillName="星図閃", skillPower=2, skillUses=1, fleeChance=0, victoryCode="guardian-defeated", defeatCode="guardian-victorious", fleeCode="guardian-escaped", victoryFlag="guardian-defeated" });
        var initialized = await _module.InitializeAsync(new("init", fragile, Binding(), []), default);
        var result = await _module.DispatchAsync(new("defeat", 0, fragile, Binding(), initialized.State, JsonSerializer.SerializeToElement(new { id="attack" }), [0, 4]), default);
        Assert.Equal(ModuleExecutionStatuses.Completed, result.Status);
        Assert.Equal("guardian-victorious", result.Outcome?.Code);
        Assert.Empty(result.Outcome!.Effects);
        Assert.Equal(0, result.ViewState.GetProperty("playerHp").GetInt32());
    }

    [Fact]
    public async Task SameStateActionAndRandomValuesAreDeterministic()
    {
        var initialized = await _module.InitializeAsync(new("init", Configuration, Binding(), []), default);
        var first = await Dispatch(initialized.State, 0, "defend", 3, 4);
        var second = await Dispatch(initialized.State, 0, "defend", 3, 4);
        Assert.Equal(first.State.GetRawText(), second.State.GetRawText());
        Assert.Equal(first.ViewState.GetRawText(), second.ViewState.GetRawText());
    }

    private ValueTask<ModuleTransitionResult> Dispatch(JsonElement state, long revision, string action, params uint[] random) =>
        _module.DispatchAsync(new($"request-{revision}-{action}", revision, Configuration, Binding(), state, JsonSerializer.SerializeToElement(new { id=action }), random), default);
    private static ModuleObjectActionContext Binding() => new("guardian", "battle", "engage", Json("{}"), Json("{}"));
    private static JsonElement Json(string json) => JsonDocument.Parse(json).RootElement.Clone();
}
