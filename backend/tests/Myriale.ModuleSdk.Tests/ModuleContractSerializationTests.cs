using System.Text.Json;
using Myriale.ModuleSdk;

namespace Myriale.ModuleSdk.Tests;

public sealed class ModuleContractSerializationTests
{
    private static readonly JsonSerializerOptions JsonOptions = ModuleJsonSerializerOptions.Create();

    [Fact]
    public void Manifest_SerializesWithWebDefaults()
    {
        var manifest = new ModuleManifest(
            "com.myriale.turn-based-battle",
            "1.0.0",
            "ターン制戦闘",
            "HPを使用する戦闘モジュール",
            ModuleContractVersions.V1,
            new ModuleConfigurationManifest(
                1,
                1,
                [new ModuleFieldDefinition("/boss/maxHp", "integer", "ボスの最大HP", true)]),
            new ModuleUiManifest(
                new ModuleUiEntry("resources/runtime.mjs", "myriale-turn-battle", ["resources/module.css"]),
                null,
                null),
            ["read:session-state", ModuleCapabilities.EmitSessionEffects],
            new ModuleLimits(65_536, 1_048_576, 65_536, 100));

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(manifest, JsonOptions));
        var root = document.RootElement;

        Assert.Equal("com.myriale.turn-based-battle", root.GetProperty("id").GetString());
        Assert.Equal("1.0.0", root.GetProperty("version").GetString());
        Assert.Equal("1", root.GetProperty("contractVersion").GetString());
        Assert.Equal(1, root.GetProperty("configuration").GetProperty("schemaVersion").GetInt32());
        Assert.Equal(1, root.GetProperty("configuration").GetProperty("stateSchemaVersion").GetInt32());
        Assert.Equal("runtime.mjs", Path.GetFileName(root.GetProperty("userInterfaces").GetProperty("runtime").GetProperty("scriptPath").GetString()));
        Assert.False(root.GetProperty("userInterfaces").TryGetProperty("authoring", out _));
    }

    [Fact]
    public void DispatchRequest_RoundTripsOpaquePayloads()
    {
        var request = new ModuleDispatchRequest(
            "REQ-1",
            7,
            Json("""{"boss":{"maxHp":36}}"""),
            Json("""{"sessionId":"SES-1","clues":["clock-frequency"]}"""),
            Json("""{"round":3,"bossHp":24}"""),
            Json("""{"type":"future-action","targets":["boss"]}"""),
            [4, 2]);

        var json = JsonSerializer.Serialize(request, JsonOptions);
        var restored = JsonSerializer.Deserialize<ModuleDispatchRequest>(json, JsonOptions);

        Assert.NotNull(restored);
        Assert.Equal("REQ-1", restored.RequestId);
        Assert.Equal(7, restored.ExpectedRevision);
        Assert.Equal(36, restored.Configuration.GetProperty("boss").GetProperty("maxHp").GetInt32());
        Assert.Equal("clock-frequency", restored.Context.GetProperty("clues")[0].GetString());
        Assert.Equal("future-action", restored.Action.GetProperty("type").GetString());
        Assert.Equal([4u, 2u], restored.RandomValues);
    }

    [Fact]
    public void TransitionResult_RoundTripsEffectsInOrder()
    {
        var outcome = new ModuleOutcome(
            "success",
            "victory",
            "戦闘終了",
            "館主を退けた。",
            [new ModuleFact("battle-result", "主人公が勝利した")],
            [
                new ModuleEffect("set-parameter", Json("""{"targetId":"hero","parameterId":"hp","value":7}""")),
                new ModuleEffect(ModuleEffectTypes.SetFlag, Json("""{"flagId":"boss-defeated","value":true}"""))
            ],
            [new ModuleEvent("machine-collapse", Json("""{"sceneId":"collapse"}"""))],
            ["戦闘直後の静寂を描写する"],
            ["主人公を無傷として描写しない"]);

        var transition = new ModuleTransitionResult(
            ModuleExecutionStatuses.Completed,
            8,
            Json("""{"round":8}"""),
            Json("""{"result":"victory"}"""),
            [],
            [],
            outcome);

        var json = JsonSerializer.Serialize(transition, JsonOptions);
        using var document = JsonDocument.Parse(json);
        Assert.True(document.RootElement.TryGetProperty("uiEvents", out _));
        Assert.True(document.RootElement.GetProperty("outcome").TryGetProperty("emittedEvents", out _));

        var restored = JsonSerializer.Deserialize<ModuleTransitionResult>(json, JsonOptions);

        Assert.NotNull(restored?.Outcome);
        Assert.Equal("victory", restored.Outcome.Code);
        Assert.Equal("set-parameter", restored.Outcome.Effects[0].Type);
        Assert.Equal("set-flag", restored.Outcome.Effects[1].Type);
        Assert.Equal(7, restored.Outcome.Effects[0].Payload.GetProperty("value").GetInt32());
    }

    [Fact]
    public void ErrorAndValidationSeverity_RoundTripWithStableWireValues()
    {
        var result = new ModuleInitializationResult(
            ModuleExecutionStatuses.Failed,
            Json("{}"),
            Json("{}"),
            [],
            Error: new ModuleError(
                "module.configuration.invalid",
                "設定を確認してください。",
                Json("""{"path":"/enemies"}""")));
        var issue = new ModuleValidationIssue(
            "/enemies",
            "battle.enemy.required",
            "敵を1体以上設定してください。",
            ModuleValidationSeverity.Error);

        using var resultDocument = JsonDocument.Parse(JsonSerializer.Serialize(result, JsonOptions));
        using var issueDocument = JsonDocument.Parse(JsonSerializer.Serialize(issue, JsonOptions));

        Assert.Equal("module.configuration.invalid", resultDocument.RootElement.GetProperty("error").GetProperty("code").GetString());
        Assert.Equal("/enemies", resultDocument.RootElement.GetProperty("error").GetProperty("details").GetProperty("path").GetString());
        Assert.Equal("error", issueDocument.RootElement.GetProperty("severity").GetString());
    }

    [Fact]
    public void ValidationResult_DoesNotSerializeComputedValidity()
    {
        var result = new ModuleValidationResult(
            [new ModuleValidationIssue("/title", "required", "必須です。", ModuleValidationSeverity.Error)]);

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(result, JsonOptions));

        Assert.True(document.RootElement.TryGetProperty("issues", out _));
        Assert.False(document.RootElement.TryGetProperty("isValid", out _));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ValidationSeverity_RejectsNumericWireValue()
    {
        const string json = """{"path":"/title","code":"required","message":"必須です。","severity":2}""";

        Assert.Throws<JsonException>(() =>
            JsonSerializer.Deserialize<ModuleValidationIssue>(json, JsonOptions));
    }

    [Fact]
    public void SerializerOptions_CreateReturnsIndependentInstances()
    {
        var first = ModuleJsonSerializerOptions.Create();
        var second = ModuleJsonSerializerOptions.Create();

        first.WriteIndented = true;

        Assert.NotSame(first, second);
        Assert.False(second.WriteIndented);
    }

    private static JsonElement Json(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
