using System.Text.Json;

namespace Myriale.Api.Tests;

public sealed class ScenarioActionDecisionModelMapperTests
{
    private readonly ScenarioActionDecisionModelMapper mapper = new();

    [Fact]
    public void CreateRequest_UsesEnabledCodeOnlyGroupedCandidates()
    {
        var request = mapper.CreateRequest("進む", Snapshot());
        var json = JsonSerializer.Serialize(request);

        Assert.Equal(ScenarioTurnSchemas.ModelActionDecisionRequest, request.SchemaVersion);
        Assert.Equal("room", request.Scene.CurrentLocation.Code);
        Assert.Equal(["passage", "terminal", "system"], request.Scene.VisibleObjects.Select(item => item.Code));
        Assert.Equal(["location", "location", "location"], request.Scene.VisibleObjects.Select(item => item.Scope));
        Assert.Equal(3, request.ObjectActions.Count);
        Assert.Equal("object:passage/use", request.ObjectActions.Single(item => item.ObjectCode == "passage").Actions[0].SelectionCode);
        Assert.Equal("object:terminal/use", request.ObjectActions.Single(item => item.ObjectCode == "terminal").Actions[0].SelectionCode);
        Assert.Equal("object:system/inspect", request.ObjectActions.Single(item => item.ObjectCode == "system").Actions[0].SelectionCode);
        Assert.Equal(["system:clarify", "system:no-op"], request.SystemActions.Select(item => item.SelectionCode));
        Assert.DoesNotContain("disabled-action", json, StringComparison.Ordinal);
        Assert.DoesNotContain("OBJ-", json, StringComparison.Ordinal);
        Assert.DoesNotContain("ACT-", json, StringComparison.Ordinal);
        Assert.DoesNotContain("SNAPSHOT", json, StringComparison.Ordinal);
        Assert.DoesNotContain("revision", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("enabled", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CreateResponseSchema_UsesExactSelectionCodeEnum()
    {
        var request = mapper.CreateRequest("進む", Snapshot());
        var schema = mapper.CreateResponseSchema(request);
        var values = schema.GetProperty("properties").GetProperty("selectionCode").GetProperty("enum")
            .EnumerateArray().Select(item => item.GetString()).ToList();

        Assert.Equal(request.ObjectActions.SelectMany(item => item.Actions).Concat(request.SystemActions).Select(item => item.SelectionCode), values);
        Assert.False(schema.GetProperty("additionalProperties").GetBoolean());
        Assert.Equal(ScenarioTurnSchemas.ModelActionDecisionResult,
            schema.GetProperty("properties").GetProperty("schemaVersion").GetProperty("const").GetString());
    }

    [Theory]
    [InlineData("object:passage/use", "OBJ-PASSAGE", "ACT-PASSAGE-USE")]
    [InlineData("object:terminal/use", "OBJ-TERMINAL", "ACT-TERMINAL-USE")]
    [InlineData("object:system/inspect", "OBJ-AUTHORED-SYSTEM", "ACT-INSPECT")]
    [InlineData("system:clarify", "system", "SYS-CLARIFY")]
    public void MapResult_MapsExactSelectionCodeToOriginalEnabledAction(string selectionCode, string objectId, string actionId)
    {
        var result = mapper.MapResult(Snapshot(), new(
            ScenarioTurnSchemas.ModelActionDecisionResult,
            selectionCode,
            Element("{}")));

        Assert.Equal(ScenarioTurnSchemas.ActionDecision, result.SchemaVersion);
        Assert.Equal(objectId, result.ObjectId.AsPrimitive());
        Assert.Equal(actionId, result.ActionId.AsPrimitive());
    }

    [Theory]
    [InlineData(ScenarioTurnSchemas.ModelActionDecisionResult, "object:missing/use")]
    [InlineData(ScenarioTurnSchemas.ModelActionDecisionResult, "object:passage")]
    [InlineData(ScenarioTurnSchemas.ModelActionDecisionResult, "object:passage/disabled-action")]
    [InlineData("model-action-decision-result.v2", "object:passage/use")]
    public void MapResult_RejectsUnknownMalformedDisabledOrWrongVersion(string schemaVersion, string selectionCode)
    {
        var exception = Assert.Throws<ScenarioTurnValidationException>(() => mapper.MapResult(Snapshot(), new(
            schemaVersion,
            selectionCode,
            Element("{}"))));

        Assert.Contains(exception.Code, new[] { "unknown_model_action_selection", "invalid_model_action_decision" });
    }

    [Fact]
    public void MapResult_RejectsNonObjectArguments()
    {
        var exception = Assert.Throws<ScenarioTurnValidationException>(() => mapper.MapResult(Snapshot(), new(
            ScenarioTurnSchemas.ModelActionDecisionResult,
            "object:passage/use",
            Element("[]"))));

        Assert.Equal("invalid_model_action_decision", exception.Code);
    }

    [Fact]
    public void InternalV1SnapshotAndDecisionRemainReadable()
    {
        var snapshot = JsonSerializer.Deserialize<RuleActionSnapshot>(JsonSerializer.Serialize(Snapshot()));
        var decision = JsonSerializer.Deserialize<RuleActionDecisionResult>("""
            {"schemaVersion":"rule-action-decision.v1","objectId":"OBJ-PASSAGE","actionId":"ACT-PASSAGE-USE","arguments":{}}
            """, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        Assert.Equal(ScenarioTurnSchemas.ActionSnapshot, snapshot!.SchemaVersion);
        Assert.Equal(ScenarioTurnSchemas.ActionDecision, decision!.SchemaVersion);
    }

    private static RuleActionSnapshot Snapshot() => new(
        ScenarioTurnSchemas.ActionSnapshot,
        "SNAPSHOT-INTERNAL",
        new(new ScenarioLocationId("LOC-ROOM"), "room", "研究室", "静かな部屋"),
        [
            new(new ScenarioObjectId("OBJ-PASSAGE"), "passage", "接続廊下", new ScenarioLocationId("LOC-ROOM"), false, 7, Element("{\"open\":true}")),
            new(new ScenarioObjectId("OBJ-TERMINAL"), "terminal", "端末", new ScenarioLocationId("LOC-ROOM"), false, 8, Element("{}")),
            new(new ScenarioObjectId("OBJ-AUTHORED-SYSTEM"), "system", "作者定義system", new ScenarioLocationId("LOC-ROOM"), false, 9, Element("{}")),
        ],
        [
            new(new ScenarioObjectId("OBJ-PASSAGE"), new ScenarioObjectTypeActionId("ACT-PASSAGE-USE"), "use", "使う", "廊下を使う", Element("{\"type\":\"object\",\"additionalProperties\":false}"), true),
            new(new ScenarioObjectId("OBJ-TERMINAL"), new ScenarioObjectTypeActionId("ACT-TERMINAL-USE"), "use", "使う", "端末を使う", Element("{\"type\":\"object\"}"), true),
            new(new ScenarioObjectId("OBJ-AUTHORED-SYSTEM"), new ScenarioObjectTypeActionId("ACT-INSPECT"), "inspect", "調べる", "対象を調べる", Element("{\"type\":\"object\"}"), true),
            new(new ScenarioObjectId("OBJ-PASSAGE"), new ScenarioObjectTypeActionId("ACT-DISABLED"), "disabled-action", "無効", "無効", Element("{\"type\":\"object\"}"), false),
            new(new ScenarioObjectId("system"), new ScenarioObjectTypeActionId("SYS-CLARIFY"), "clarify", "確認", "確認する", Element("{\"type\":\"object\"}"), true),
            new(new ScenarioObjectId("system"), new ScenarioObjectTypeActionId("SYS-NOOP"), "no-op", "待機", "何もしない", Element("{\"type\":\"object\"}"), true),
        ]);

    private static JsonElement Element(string json) => JsonSerializer.Deserialize<JsonElement>(json);
}
