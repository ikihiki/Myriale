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
              "schemaVersion": "narrative-dialogue.v1",
              "turnType": "action-result",
              "heading": "銀の鍵を掲げる",
              "body": "扉の星座が淡く輝いた。",
              "signals": [
                { "code": "constellation-door-reached" }
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
    public async Task DialogueResultRejectsUnknownTopLevelField()
    {
        var generator = CreateGenerator("""
            {
              "schemaVersion": "narrative-dialogue.v1",
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
              "schemaVersion": "narrative-dialogue.v1",
              "turnType": "action-result",
              "heading": "銀の鍵を掲げる",
              "body": "扉の星座が淡く輝いた。",
              "signals": [
                {
                  "code": "constellation-door-reached",
                  "confidence": 1
                }
              ]
            }
            """);

        await Assert.ThrowsAsync<JsonException>(() => generator.GenerateDialogueAsync(CreateRequest(), default));
    }

    private static MockAiNarrativeGenerator CreateGenerator(string responseJson)
    {
        var client = new HttpClient(new StaticJsonHandler(responseJson))
        {
            BaseAddress = new Uri("http://mock-ai.test"),
        };
        return new MockAiNarrativeGenerator(new StaticHttpClientFactory(client));
    }

    private static NarrativeDialogueRequest CreateRequest() => new(
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
        NarrativeInteractionTypes.Dialogue,
        "銀の鍵を掲げる",
        new NarrativeSessionStateInput(0, new Dictionary<string, bool>()),
        ["constellation-door-reached"],
        false);

    private sealed class StaticHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StaticJsonHandler(string responseJson) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json"),
            });
    }
}
