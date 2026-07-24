using System.Text.Json;
using Myriale.ModuleSdk;

[assembly: MyrialeModuleEntryPoint(typeof(Myriale.StarEater.GuardianBattleModule.GuardianBattleModule))]

namespace Myriale.StarEater.GuardianBattleModule;

public sealed class GuardianBattleModule : IMyrialeModule
{
    public const string ModuleId = "com.myriale.rules.turn-battle";
    public const string Version = "1.0.0";
    private static readonly string[] ActionIds = ["attack", "defend", "skill", "flee"];

    public ModuleManifest GetManifest() => new(
        ModuleId, Version, "ターン制バトル", "シナリオ非依存の小規模なターン制戦闘です。", ModuleContractVersions.V1,
        new ModuleConfigurationManifest(1, 1,
        [
            new("playerName", "string", "プレイヤー名", true), new("enemyName", "string", "敵名", true),
            new("playerHp", "integer", "プレイヤーHP", true), new("enemyHp", "integer", "敵HP", true),
            new("playerAttack", "integer", "攻撃力", true), new("enemyAttack", "integer", "敵攻撃力", true),
            new("skillName", "string", "スキル名", true), new("skillPower", "integer", "スキル威力", true),
            new("skillUses", "integer", "スキル回数", true), new("fleeChance", "integer", "逃走率", true),
            new("victoryCode", "string", "勝利Outcome", true), new("defeatCode", "string", "敗北Outcome", true),
            new("fleeCode", "string", "逃走Outcome", true),
        ]),
        new ModuleUiManifest(new ModuleUiEntry("resources/runtime.mjs", "myriale-turn-battle", ["resources/module.css"]), null, null),
        [], new ModuleLimits(16_384, 16_384, 4_096, 0));

    public ValueTask<ModuleValidationResult> ValidateConfigAsync(ModuleValidationRequest request, CancellationToken cancellationToken)
    {
        var issues = TryReadConfig(request.Configuration, out _, out var error)
            ? [] : new[] { new ModuleValidationIssue(error.Path, error.Code, error.Message, ModuleValidationSeverity.Error) };
        return ValueTask.FromResult(new ModuleValidationResult(issues));
    }

    public ValueTask<ModuleInitializationResult> InitializeAsync(ModuleInitializationRequest request, CancellationToken cancellationToken)
    {
        if (!TryReadConfig(request.Configuration, out var config, out var error))
            return ValueTask.FromResult(new ModuleInitializationResult(ModuleExecutionStatuses.Failed, Json(new { }), Json(new { }), [], Error: new(error.Code, error.Message)));
        var state = new BattleState(config.PlayerHp, config.EnemyHp, 1, config.SkillUses, false, "player-then-enemy", "active", null, 0, 0);
        return ValueTask.FromResult(new ModuleInitializationResult(ModuleExecutionStatuses.Active, Json(state), View(config, state), Actions(state)));
    }

    public ValueTask<ModuleTransitionResult> DispatchAsync(ModuleDispatchRequest request, CancellationToken cancellationToken)
    {
        if (!TryReadConfig(request.Configuration, out var config, out var error)) return ValueTask.FromResult(Failed(request, error.Code, error.Message));
        BattleState? state;
        try { state = request.State.Deserialize<BattleState>(ModuleJsonSerializerOptions.Create()); }
        catch (JsonException) { state = null; }
        if (state is null || state.Status != "active") return ValueTask.FromResult(Failed(request, "battle_not_active", "戦闘は進行中ではありません。"));
        if (request.Action.ValueKind != JsonValueKind.Object || request.Action.EnumerateObject().Count() != 1
            || !request.Action.TryGetProperty("id", out var idValue) || idValue.ValueKind != JsonValueKind.String
            || idValue.GetString() is not { } action || !ActionIds.Contains(action))
            return ValueTask.FromResult(Failed(request, "invalid_action", "利用できない戦闘Actionです。"));
        if (action == "skill" && state.SkillUsesRemaining <= 0) return ValueTask.FromResult(Failed(request, "skill_unavailable", "スキルの使用回数が残っていません。"));
        if (request.RandomValues.Count < 2) return ValueTask.FromResult(Failed(request, "insufficient_random_values", "ホスト乱数が不足しています。"));

        var playerHp = state.PlayerHp;
        var enemyHp = state.EnemyHp;
        var skillUses = state.SkillUsesRemaining;
        var playerDamage = 0;
        var enemyDamage = 0;
        var fled = false;
        var defending = action == "defend";
        if (action == "flee") fled = request.RandomValues[0] % 100 < config.FleeChance;
        else if (action == "attack") playerDamage = RollDamage(config.PlayerAttack, request.RandomValues[0]);
        else if (action == "skill") { playerDamage = RollDamage(config.SkillPower, request.RandomValues[0]); skillUses--; }
        enemyHp = Math.Max(0, enemyHp - playerDamage);
        if (!fled && enemyHp > 0)
        {
            enemyDamage = RollDamage(config.EnemyAttack, request.RandomValues[1]);
            if (defending) enemyDamage = Math.Max(1, enemyDamage / 2);
            playerHp = Math.Max(0, playerHp - enemyDamage);
        }

        var status = fled ? "fled" : enemyHp == 0 ? "victory" : playerHp == 0 ? "defeat" : "active";
        var next = new BattleState(playerHp, enemyHp, state.Round + (status == "active" ? 1 : 0), skillUses, defending, state.ActionOrder, status, action, playerDamage, enemyDamage);
        if (status == "active")
            return ValueTask.FromResult(new ModuleTransitionResult(ModuleExecutionStatuses.Active, request.ExpectedRevision + 1, Json(next), View(config, next), Actions(next),
                [new ModuleEvent("round-resolved", Json(new { round = state.Round, action, playerDamage, enemyDamage }))]));

        var code = status switch { "victory" => config.VictoryCode, "defeat" => config.DefeatCode, _ => config.FleeCode };
        var title = status switch { "victory" => "戦闘に勝利した", "defeat" => "戦闘に敗北した", _ => "戦闘から逃走した" };
        var summary = $"{config.PlayerName}は{config.EnemyName}との戦闘を{status}で終えた。残りHPは{playerHp}、敵HPは{enemyHp}、経過ラウンドは{state.Round}。";
        var outcome = new ModuleOutcome("turn-battle", code, title, summary,
            [new("battle-result", summary), new("remaining-resources", $"残りHP {playerHp}、スキル残り {skillUses}回。")],
            [new(code, Json(new { playerHp, enemyHp, rounds = state.Round, skillUses }))],
            ["勝敗、逃走、残りHP、使用済みスキルを確定結果として描写する。"],
            ["敗北を勝利へ変更しない。", "消費済みスキルを復元しない。", "撃破済みの敵を理由なく復活させない。"]);
        return ValueTask.FromResult(new ModuleTransitionResult(ModuleExecutionStatuses.Completed, request.ExpectedRevision + 1, Json(next), View(config, next), [],
            [new ModuleEvent("battle-completed", Json(new { status, code }))], outcome));
    }

    private static int RollDamage(int power, uint value) => Math.Max(1, power - 2 + (int)(value % 5));
    private static IReadOnlyList<ModuleAvailableAction> Actions(BattleState state) =>
        [new("attack", "攻撃", true, RandomValueCount: 2, Arguments: []), new("defend", "防御", true, RandomValueCount: 2, Arguments: []), new("skill", "スキル", state.SkillUsesRemaining > 0, state.SkillUsesRemaining > 0 ? null : "使用回数がありません", 2, []), new("flee", "逃走", true, RandomValueCount: 2, Arguments: [])];
    private static JsonElement View(Config config, BattleState state) => Json(new { config.PlayerName, config.EnemyName, playerMaxHp = config.PlayerHp, enemyMaxHp = config.EnemyHp, state.PlayerHp, state.EnemyHp, state.Round, skillName = config.SkillName, state.SkillUsesRemaining, state.Status, state.LastAction, state.LastPlayerDamage, state.LastEnemyDamage });
    private static ModuleTransitionResult Failed(ModuleDispatchRequest request, string code, string message) => new(ModuleExecutionStatuses.Failed, request.ExpectedRevision, request.State, Json(new { }), [], [], Error: new(code, message));

    private static bool TryReadConfig(JsonElement json, out Config config, out ConfigError error)
    {
        config = default!; error = default;
        if (json.ValueKind != JsonValueKind.Object) return Fail("$", "invalid_configuration", "設定はオブジェクトで指定してください。", out error);
        if (!Text(json, "playerName", out var playerName) || !Text(json, "enemyName", out var enemyName) || !Text(json, "skillName", out var skillName)
            || !Text(json, "victoryCode", out var victoryCode) || !Text(json, "defeatCode", out var defeatCode) || !Text(json, "fleeCode", out var fleeCode))
            return Fail("$", "required", "名称とOutcome設定を指定してください。", out error);
        if (!Int(json, "playerHp", 1, 999, out var playerHp) || !Int(json, "enemyHp", 1, 999, out var enemyHp)
            || !Int(json, "playerAttack", 1, 999, out var playerAttack) || !Int(json, "enemyAttack", 1, 999, out var enemyAttack)
            || !Int(json, "skillPower", 1, 999, out var skillPower) || !Int(json, "skillUses", 0, 99, out var skillUses)
            || !Int(json, "fleeChance", 0, 100, out var fleeChance))
            return Fail("$", "out_of_range", "戦闘能力値が範囲外です。", out error);
        config = new(playerName, enemyName, playerHp, enemyHp, playerAttack, enemyAttack, skillName, skillPower, skillUses, fleeChance, victoryCode, defeatCode, fleeCode);
        return true;
    }
    private static bool Text(JsonElement json, string name, out string value) { value = ""; if (!json.TryGetProperty(name, out var item) || item.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(item.GetString())) return false; value = item.GetString()!.Trim(); return true; }
    private static bool Int(JsonElement json, string name, int min, int max, out int value) { value = 0; return json.TryGetProperty(name, out var item) && item.TryGetInt32(out value) && value >= min && value <= max; }
    private static bool Fail(string path, string code, string message, out ConfigError error) { error = new(path, code, message); return false; }
    private static JsonElement Json<T>(T value) => JsonSerializer.SerializeToElement(value, ModuleJsonSerializerOptions.Create());
    private sealed record Config(string PlayerName, string EnemyName, int PlayerHp, int EnemyHp, int PlayerAttack, int EnemyAttack, string SkillName, int SkillPower, int SkillUses, int FleeChance, string VictoryCode, string DefeatCode, string FleeCode);
    private sealed record BattleState(int PlayerHp, int EnemyHp, int Round, int SkillUsesRemaining, bool Defending, string ActionOrder, string Status, string? LastAction, int LastPlayerDamage, int LastEnemyDamage);
    private readonly record struct ConfigError(string Path, string Code, string Message);
}
