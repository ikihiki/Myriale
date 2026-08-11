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

        Assert.Contains("headingとbodyは必ず自然な日本語", textProvider.Request!.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("英語だけの文章", textProvider.Request.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("schemaVersion、heading、bodyの3フィールドをこの順序", textProvider.Request!.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("空白埋め、タブ、連続する空行を生成しない", textProvider.Request.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("RecentTurnsは直前までの継続性を判断するための参照情報", textProvider.Request!.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("その本文を再掲・複製・言い換えしてはならない", textProvider.Request.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("RecentTurns内のNarrativeと同一になることは禁止", textProvider.Request.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("3〜6段落", textProvider.Request.Messages[0].Text, StringComparison.Ordinal);
        Assert.Contains("調査官は机の上へ古い記録を置いた。", textProvider.Request.Messages[1].Text, StringComparison.Ordinal);
        Assert.Contains("この記録を見ろ。", textProvider.Request.Messages[1].Text, StringComparison.Ordinal);
        var schemaVersion = textProvider.Request!.ResponseFormat.Schema!.Value
            .GetProperty("properties").GetProperty("schemaVersion");
        Assert.Equal("string", schemaVersion.GetProperty("type").GetString());
        Assert.Equal(ScenarioTurnSchemas.PostStateNarrative, schemaVersion.GetProperty("const").GetString());
    }

    [Fact]
    public async Task EvaluationNarrativeSchemaFailureRetainsPromptResultAndGenerationMetadata()
    {
        const string rawResult = "{not valid narrative json}";
        var textProvider = new CapturingProvider(rawResult);
        var generator = new ProviderNarrativeGenerator(
            textProvider,
            new ScenarioActionDecisionModelMapper(),
            NullLogger<ProviderNarrativeGenerator>.Instance);

        var exception = await Assert.ThrowsAsync<AiProviderException>(() =>
            generator.GeneratePostStateNarrativeForProfileAsync(
                new AiProviderProfileId("evaluation-model"), PostStateRequest(), default));

        Assert.Equal(AiProviderErrorCodes.SchemaFailure, exception.Code);
        Assert.Contains("この記録を見ろ。", exception.SentPrompt, StringComparison.Ordinal);
        Assert.Equal(rawResult, exception.ReceivedResult);
        Assert.NotNull(exception.Metadata);
        Assert.Equal("response", exception.Metadata.ResponseId);
        Assert.Equal(1, exception.Metadata.InputTokens);
        Assert.Equal(1, exception.Metadata.OutputTokens);
        Assert.Equal(2, exception.Metadata.LatencyMilliseconds);
        Assert.Equal("stop", exception.Metadata.FinishReason);
    }

    [Fact]
    public async Task GeneratePostStateNarrative_DecodesByteLevelTokenizerArtifactsInStringValues()
    {
        var textProvider = new CapturingProvider("""{"schemaVersion":"post-state-narrative.v1","heading":"決死ĠのĠ一撃","body":"石像はâĢĶ崩れた.nĊĊカイは息をついた。"}""");
        var generator = new ProviderNarrativeGenerator(textProvider, new ScenarioActionDecisionModelMapper(), NullLogger<ProviderNarrativeGenerator>.Instance);

        var generated = await generator.GeneratePostStateNarrativeAsync(PostStateRequest(), default);

        Assert.Equal("決死 の 一撃", generated.Value.Heading);
        Assert.Equal("石像は—崩れた.\n\nカイは息をついた。", generated.Value.Body);
        Assert.Contains("決死ĠのĠ一撃", generated.ReceivedResult, StringComparison.Ordinal);
    }

    [Fact]
    public async Task EvaluationNarrativeRejectsEnglishOutputAndRetainsAudit()
    {
        const string rawResult = "{\"schemaVersion\":\"post-state-narrative.v1\",\"heading\":\"The Final Blow\",\"body\":\"The stone abomination collapses into rubble.\"}";
        var textProvider = new CapturingProvider(rawResult);
        var generator = new ProviderNarrativeGenerator(textProvider, new ScenarioActionDecisionModelMapper(), NullLogger<ProviderNarrativeGenerator>.Instance);

        var exception = await Assert.ThrowsAsync<AiProviderException>(() =>
            generator.GeneratePostStateNarrativeForProfileAsync(
                new AiProviderProfileId("evaluation-model"), PostStateRequest(), default));

        Assert.Equal(AiProviderErrorCodes.SchemaFailure, exception.Code);
        Assert.Contains("この記録を見ろ。", exception.SentPrompt, StringComparison.Ordinal);
        Assert.Equal(rawResult, exception.ReceivedResult);
        Assert.NotNull(exception.Metadata);
    }

    [Fact]
    public async Task EvaluationProfileMethods_ForwardPerRequestGenerationOverrides()
    {
        var textProvider = new CapturingProvider("""{"schemaVersion":"post-state-narrative.v1","heading":"告白","body":"レンは真相を認めた。"}""");
        var generator = new ProviderNarrativeGenerator(textProvider, new ScenarioActionDecisionModelMapper(), NullLogger<ProviderNarrativeGenerator>.Instance);
        var overrides = new AiGenerationOverrides(0.8, 0.95, 1.05, 42, 1200, false, 0);

        await generator.GeneratePostStateNarrativeForProfileWithOverridesAsync(
            new AiProviderProfileId("evaluation-model"), PostStateRequest(), overrides, default);

        Assert.Equal(overrides, textProvider.Request!.GenerationOverrides);
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
            [new NarrativeRecentTurnInput("記録を取り出す。", "調査官は机の上へ古い記録を置いた。")],
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

    private sealed class CapturingProvider(string responseText) : IAiTextService
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
