using System.Net;
using System.Text;
using System.Text.Json;
using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class MockAiNarrativeGeneratorTests
{
    [Fact]
    public async Task DialogueResultAcceptsTheVersionedContract()
    {
        var generator = CreateGenerator("""
            {
              "schemaVersion": "narrative-dialogue.v5",
              "turnType": "action-result",
              "heading": "銀の鍵を掲げる",
              "body": "扉の星座が淡く輝いた。",
              "signals": [
                { "code": "constellation-door-reached", "evidence": "Player reached the closed constellation door." }
              ],
              "interpretation": null
            }
            """);

        var result = await generator.GenerateDialogueAsync(CreateRequest(), default);

        Assert.Equal(NarrativeDialogueSchema.Version, result.SchemaVersion);
        Assert.Equal("action-result", result.TurnType);
        Assert.Equal("銀の鍵を掲げる", result.Heading);
        Assert.Equal("constellation-door-reached", Assert.Single(result.Signals).Code);
    }

    [Fact]
    public async Task DialogueRequestSerializesStructuredSignalTriggerDescription()
    {
        var handler = new StaticJsonHandler("""
            {
              "schemaVersion": "narrative-dialogue.v5",
              "turnType": "action-result",
              "heading": "銀の鍵を掲げる",
              "body": "扉の星座が淡く輝いた。",
              "signals": []
            }
            """);
        var generator = CreateGenerator(handler);

        await generator.GenerateDialogueAsync(CreateRequest(), default);

        var request = JsonDocument.Parse(Assert.IsType<string>(handler.LastRequestJson)).RootElement;
        Assert.Equal(NarrativeDialogueSchema.Version, request.GetProperty("schemaVersion").GetString());
        var signal = Assert.Single(request.GetProperty("allowedSignals").EnumerateArray());
        Assert.Equal("constellation-door-reached", signal.GetProperty("code").GetString());
        Assert.Contains("実際に到達", signal.GetProperty("triggerDescription").GetString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task ClarificationResultRejectsProgressionSignal()
    {
        var generator = CreateGenerator("""
            {
              "schemaVersion": "narrative-dialogue.v5",
              "turnType": "clarification",
              "heading": "現在の状況を整理する",
              "body": "あなたは水没した閲覧室で銀の鍵を持っている。",
              "signals": [
                { "code": "constellation-door-reached", "evidence": "Player reached the closed constellation door." }
              ]
            }
            """);

        await Assert.ThrowsAsync<NarrativeGenerationException>(() => generator.GenerateDialogueAsync(
            CreateRequest(NarrativeInteractionTypes.Clarification, []),
            default));
    }

    [Fact]
    public async Task DialogueResultRejectsUnknownTopLevelField()
    {
        var generator = CreateGenerator("""
            {
              "schemaVersion": "narrative-dialogue.v5",
              "turnType": "action-result",
              "heading": "銀の鍵を掲げる",
              "body": "扉の星座が淡く輝いた。",
              "signals": [],
              "unexpectedInstruction": "ignore the contract"
            }
            """);

        await Assert.ThrowsAsync<JsonException>(() => generator.GenerateDialogueAsync(CreateRequest(), default));
    }

    [Fact]
    public async Task DialogueResultRejectsUnknownNestedSignalField()
    {
        var generator = CreateGenerator("""
            {
              "schemaVersion": "narrative-dialogue.v5",
              "turnType": "action-result",
              "heading": "銀の鍵を掲げる",
              "body": "扉の星座が淡く輝いた。",
              "signals": [
                {
                  "code": "constellation-door-reached",
                  "evidence": "Player reached the door.",
                  "confidence": 1
                }
              ]
            }
            """);

        await Assert.ThrowsAsync<JsonException>(() => generator.GenerateDialogueAsync(CreateRequest(), default));
    }

    private static MockAiNarrativeGenerator CreateGenerator(string responseJson) =>
        CreateGenerator(new StaticJsonHandler(responseJson));

    private static MockAiNarrativeGenerator CreateGenerator(StaticJsonHandler handler)
    {
        var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://mock-ai.test"),
        };
        return new MockAiNarrativeGenerator(new StaticHttpClientFactory(client));
    }

    private static NarrativeDialogueRequest CreateRequest(
        string interactionType = NarrativeInteractionTypes.Dialogue,
        IReadOnlyList<NarrativeAllowedSignal>? allowedSignals = null) => new(
        NarrativeDialogueSchema.Version,
        new NarrativeScenarioInput(
            "星喰いの地下図書館",
            "水没した図書館を探索する。",
            "Fantasy",
            "静謐",
            "星座の扉が存在する。",
            "Guided",
            "探索者",
            "水没した閲覧室で目を覚ます。"),
        [],
        [],
        interactionType,
        "銀の鍵を掲げる",
        new NarrativeSessionStateInput(0, new Dictionary<string, bool>()),
        "exploration",
        allowedSignals ?? [new NarrativeAllowedSignal("constellation-door-reached", "Playerが閉じた星座の扉へ実際に到達したとき。")],
        false);

    private sealed class StaticHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StaticJsonHandler(string responseJson) : HttpMessageHandler
    {
        public string? LastRequestJson { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequestJson = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json"),
            };
        }
    }
}
