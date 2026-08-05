using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;
using Microsoft.Extensions.Logging.Abstractions;

namespace Myriale.Api.Tests;

public sealed class ProviderNarrativeGeneratorActionDecisionTests
{
    private static readonly JsonSerializerOptions ReadableJson = new(JsonSerializerDefaults.Web)
    {
        Encoder = JavaScriptEncoder.Create(UnicodeRanges.All),
    };

    [Fact]
    public async Task DecideAction_UsesExactPromptDynamicEnumAndAuditEnvelope()
    {
        var textProvider = new CapturingProvider("""{"schemaVersion":"model-action-decision-result.v3","selectionCode":"system:clarify","arguments":{}}""");
        var mapper = new ScenarioActionDecisionModelMapper();
        var generator = new ProviderNarrativeGenerator(textProvider, mapper, NullLogger<ProviderNarrativeGenerator>.Instance);
        var request = Request();

        var generated = await generator.DecideActionAsync(request, default);

        Assert.Equal("system:clarify", generated.Value.SelectionCode);
        Assert.Equal(ScenarioActionDecisionModelMapper.SystemPrompt, textProvider.Request!.Messages[0].Text);
        Assert.Equal(JsonSerializer.Serialize(request, ReadableJson), textProvider.Request.Messages[1].Text);
        var enumValues = textProvider.Request.ResponseFormat.Schema!.Value
            .GetProperty("properties").GetProperty("selectionCode").GetProperty("enum")
            .EnumerateArray().Select(item => item.GetString()).ToList();
        Assert.Equal(["object:door/traverse", "system:clarify", "system:no-op"], enumValues);

        Assert.Contains("ここはどこ？", textProvider.Request.Messages[1].Text, StringComparison.Ordinal);
        Assert.Contains("部屋", textProvider.Request.Messages[1].Text, StringComparison.Ordinal);
        Assert.DoesNotContain("\\u3053\\u3053", textProvider.Request.Messages[1].Text, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(ScenarioActionDecisionModelMapper.SystemPrompt, generated.SentPrompt!, StringComparison.Ordinal);
        Assert.Contains("ここはどこ？", generated.SentPrompt!, StringComparison.Ordinal);
        Assert.Contains("部屋", generated.SentPrompt!, StringComparison.Ordinal);
        Assert.DoesNotContain("\\u3053\\u3053", generated.SentPrompt!, StringComparison.OrdinalIgnoreCase);
        var audit = JsonSerializer.Deserialize<ModelActionDecisionPromptAudit>(generated.SentPrompt!, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.Equal(ScenarioTurnSchemas.ModelActionDecisionPrompt, audit!.PromptVersion);
        Assert.Equal(ScenarioActionDecisionModelMapper.SystemPrompt, audit.SystemPrompt);
        Assert.Equal(
            JsonSerializer.Serialize(request, ReadableJson),
            JsonSerializer.Serialize(audit.ModelRequest, ReadableJson));
        Assert.Equal(ScenarioTurnSchemas.ModelActionDecisionResult, audit.ResponseSchemaVersion);
        Assert.Equal(textProvider.ResponseText, generated.ReceivedResult);
    }

    [Fact]
    public async Task GeneratePostStateNarrative_DeclaresSchemaVersionTypeForOpenAiStrictSchema()
    {
        var textProvider = new CapturingProvider("""{"schemaVersion":"post-state-narrative.v1","heading":"告白","body":"レンは真相を認めた。"}""");
        var generator = new ProviderNarrativeGenerator(
            textProvider,
            new ScenarioActionDecisionModelMapper(),
            NullLogger<ProviderNarrativeGenerator>.Instance);

        await generator.GeneratePostStateNarrativeAsync(PostStateRequest(), default);

        var schemaVersion = textProvider.Request!.ResponseFormat.Schema!.Value
            .GetProperty("properties").GetProperty("schemaVersion");
        Assert.Equal("string", schemaVersion.GetProperty("type").GetString());
        Assert.Equal(ScenarioTurnSchemas.PostStateNarrative, schemaVersion.GetProperty("const").GetString());
    }

    private static PostStateNarrativeRequest PostStateRequest()
    {
        var state = JsonSerializer.Deserialize<JsonElement>("{\"stance\":\"confessed\",\"evidenceAcknowledged\":true}");
        var argumentSchema = JsonSerializer.Deserialize<JsonElement>("{\"type\":\"object\",\"additionalProperties\":false}");
        var location = new RulePublicLocation(new ScenarioLocationId("room"), "interview-room", "取調室", "窓のない小部屋。");
        var item = new RulePublicObject(new ScenarioObjectId("ren"), "keeper-ren", "灯台守レン", location.Id, false, 1, state);
        var action = new RulePublicAction(item.Id, new ScenarioObjectTypeActionId("present-evidence"), "present-evidence", "保守記録を突きつける", "証拠を提示する。", argumentSchema, true);
        return new(
            ScenarioTurnSchemas.PostStateNarrative,
            new("灯台守の告白", "会話劇", "ミステリー", "緊張", "", "低", "調査官", [], "レンと向き合う。"),
            "この記録を見ろ。",
            item,
            action,
            new("rule-post-state.v1", location, [item], new Dictionary<string, bool>(), 1),
            ["レンは手動消灯を認めた。"],
            [],
            ["短く告白させる。"],
            ["標識灯は故障で消えた"]);
    }

    private static ModelActionDecisionRequest Request()
    {
        var empty = JsonSerializer.Deserialize<JsonElement>("{}");
        return new(
            ScenarioTurnSchemas.ModelActionDecisionRequest,
            "ここはどこ？",
            new(new("room", "部屋", ""), [new("door", "扉", "location", empty)]),
            [new("door", "扉", [new("object:door/traverse", "traverse", "進む", "扉の先へ進む", empty)])],
            [
                new("system:clarify", "clarify", "確認", "確認する", empty),
                new("system:no-op", "no-op", "待機", "何もしない", empty),
            ]);
    }

    private sealed class CapturingProvider(string responseText) : IAiTextProvider
    {
        public string ResponseText { get; } = responseText;
        public AiTextRequest? Request { get; private set; }

        public Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken)
        {
            Request = request;
            return Task.FromResult(new AiTextResponse(ResponseText, new(new AiProviderProfileId("test"), "model", "response", 1, 1, 2, 1, "stop")));
        }

        public Task<AiTextResponse> GenerateForProviderAsync(AiProviderProfileId provider, string credential, AiTextRequest request, CancellationToken cancellationToken) =>
            GenerateAsync(request, cancellationToken);

        public Task TestConnectionAsync(AiProviderProfileId provider, string credential, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
