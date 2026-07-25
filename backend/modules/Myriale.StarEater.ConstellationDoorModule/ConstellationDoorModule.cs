using System.Text.Json;
using Myriale.ModuleSdk;

[assembly: MyrialeModuleEntryPoint(typeof(Myriale.StarEater.ConstellationDoorModule.ConstellationDoorModule))]

namespace Myriale.StarEater.ConstellationDoorModule;

public sealed class ConstellationDoorModule : IMyrialeModule
{
    public const string ModuleId = "com.myriale.star-eater.constellation-door";
    public const string Version = "1.0.0";

    public ModuleManifest GetManifest() => new(
        ModuleId,
        Version,
        "閉じた星座の扉",
        "Object action bindingから任意に利用できるダイス判定extensionです。通常の扉ルールはscenario dataで表現します。",
        ModuleContractVersions.V1,
        new ModuleConfigurationManifest(1, 1,
        [
            new("purpose", "string", "判定目的", true),
            new("diceCount", "integer", "ダイス数", true),
            new("diceSides", "integer", "ダイス面数", true),
            new("modifier", "integer", "補正値", true),
            new("target", "integer", "目標値", true),
        ]),
        new ModuleUiManifest(
            new ModuleUiEntry("resources/runtime.mjs", "myriale-constellation-door", ["resources/module.css"]),
            null,
            null),
        [],
        new ModuleLimits(16_384, 16_384, 4_096, 0));

    public ValueTask<ModuleValidationResult> ValidateConfigAsync(ModuleValidationRequest request, CancellationToken cancellationToken)
    {
        var issues = new List<ModuleValidationIssue>();
        if (!TryReadConfig(request.Configuration, out _, out var error))
            issues.Add(new ModuleValidationIssue(error.Path, error.Code, error.Message, ModuleValidationSeverity.Error));
        return ValueTask.FromResult(new ModuleValidationResult(issues));
    }

    public ValueTask<ModuleInitializationResult> InitializeAsync(ModuleInitializationRequest request, CancellationToken cancellationToken)
    {
        if (!TryReadConfig(request.Configuration, out var config, out var error))
            return ValueTask.FromResult(new ModuleInitializationResult(
                ModuleExecutionStatuses.Failed, Json(new { }), Json(new { }), [],
                Error: new ModuleError(error.Code, error.Message)));

        return ValueTask.FromResult(new ModuleInitializationResult(
            ModuleExecutionStatuses.Active,
            Json(new { rolled = false }),
            View(config, null),
            [new ModuleAvailableAction("roll", "判定する", true, RandomValueCount: 1, Arguments: [])]));
    }

    public ValueTask<ModuleTransitionResult> DispatchAsync(ModuleDispatchRequest request, CancellationToken cancellationToken)
    {
        if (!TryReadConfig(request.Configuration, out var config, out var configError))
            return ValueTask.FromResult(Failed(request, configError.Code, configError.Message));
        if (request.Action.ValueKind != JsonValueKind.Object || request.Action.EnumerateObject().Count() != 1
            || !request.Action.TryGetProperty("id", out var id) || id.ValueKind != JsonValueKind.String || id.GetString() != "roll")
            return ValueTask.FromResult(Failed(request, "invalid_action", "判定開始以外の操作は受け付けられません。"));
        if (request.State.TryGetProperty("rolled", out var rolled) && rolled.ValueKind == JsonValueKind.True)
            return ValueTask.FromResult(Failed(request, "already_rolled", "この判定はすでに完了しています。"));
        if (request.RandomValues.Count < config.DiceCount)
            return ValueTask.FromResult(Failed(request, "insufficient_random_values", "ホスト乱数が不足しています。"));

        var dice = request.RandomValues.Take(config.DiceCount)
            .Select(value => (int)(value % (uint)config.DiceSides) + 1)
            .ToArray();
        var subtotal = dice.Sum();
        var total = subtotal + config.Modifier;
        var succeeded = total >= config.Target;
        var code = succeeded ? "constellation-door-opened" : "constellation-guardian-awakened";
        var title = succeeded ? "星座の扉が開いた" : "図書館の守護者が目覚めた";
        var summary = succeeded
            ? $"出目{FormatDice(dice)}、合計{total}で目標値{config.Target}に成功し、閉じた星座の扉が開いた。"
            : $"出目{FormatDice(dice)}、合計{total}で目標値{config.Target}に届かず、防衛機構が起動した。";
        var outcome = new ModuleOutcome(
            "constellation-door-check", code, title, summary,
            [new ModuleFact("dice-result", summary)],
            [new ModuleEvent(code, Json(new { confirmed = true }))],
            succeeded
                ? ["閉じた星座の扉が開いた確定結果を描写する。"]
                : ["判定失敗と図書館の守護者の起動を確定結果として描写する。"],
            ["ダイスの出目、合計、成功・失敗を変更しない。", "確定していない別の判定結果を追加しない。"]);

        var result = new RollResult(dice, subtotal, config.Modifier, total, config.Target, succeeded, code);
        return ValueTask.FromResult(new ModuleTransitionResult(
            ModuleExecutionStatuses.Completed,
            request.ExpectedRevision + 1,
            Json(new { rolled = true, result }),
            View(config, result),
            [],
            [new ModuleEvent("dice-rolled", Json(new { dice, total, succeeded }))],
            outcome));
    }

    private static ModuleTransitionResult Failed(ModuleDispatchRequest request, string code, string message) => new(
        ModuleExecutionStatuses.Failed, request.ExpectedRevision, request.State, Json(new { }), [], [],
        Error: new ModuleError(code, message));

    private static JsonElement View(Config config, RollResult? result) => Json(new
    {
        purpose = config.Purpose,
        diceExpression = $"{config.DiceCount}d{config.DiceSides}",
        modifier = config.Modifier,
        target = config.Target,
        result,
    });

    private static bool TryReadConfig(JsonElement json, out Config config, out ConfigError error)
    {
        config = default!;
        error = default;
        if (json.ValueKind != JsonValueKind.Object) return Fail("$", "invalid_configuration", "設定はオブジェクトで指定してください。", out error);
        if (!json.TryGetProperty("purpose", out var purposeValue) || purposeValue.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(purposeValue.GetString()))
            return Fail("purpose", "required", "判定目的を指定してください。", out error);
        if (!TryInt(json, "diceCount", 1, 20, out var diceCount)) return Fail("diceCount", "out_of_range", "ダイス数は1から20で指定してください。", out error);
        if (!TryInt(json, "diceSides", 2, 1000, out var diceSides)) return Fail("diceSides", "out_of_range", "ダイス面数は2から1000で指定してください。", out error);
        if (!TryInt(json, "modifier", -1000, 1000, out var modifier)) return Fail("modifier", "out_of_range", "補正値は-1000から1000で指定してください。", out error);
        if (!TryInt(json, "target", -1000, 21000, out var target)) return Fail("target", "out_of_range", "目標値は-1000から21000で指定してください。", out error);
        config = new Config(purposeValue.GetString()!.Trim(), diceCount, diceSides, modifier, target);
        return true;
    }

    private static bool TryInt(JsonElement json, string name, int min, int max, out int value)
    {
        value = 0;
        return json.TryGetProperty(name, out var property) && property.TryGetInt32(out value) && value >= min && value <= max;
    }

    private static bool Fail(string path, string code, string message, out ConfigError error)
    {
        error = new ConfigError(path, code, message);
        return false;
    }

    private static string FormatDice(IEnumerable<int> dice) => $"[{string.Join(", ", dice)}]";
    private static JsonElement Json<T>(T value) => JsonSerializer.SerializeToElement(value, ModuleJsonSerializerOptions.Create());
    private sealed record Config(string Purpose, int DiceCount, int DiceSides, int Modifier, int Target);
    private sealed record RollResult(int[] Dice, int Subtotal, int Modifier, int Total, int Target, bool Succeeded, string OutcomeCode);
    private readonly record struct ConfigError(string Path, string Code, string Message);
}
