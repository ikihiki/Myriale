using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Myriale.Api.Tests;

public sealed class OpenAiCompatiblePlaygroundChatTransportTests
{
    [Fact]
    public async Task Send_SerializesStrictToolAndParsesAssistantToolCalls()
    {
        var handler = new QueueHandler(Response("""
            {"id":"response-1","choices":[{"finish_reason":"tool_calls","message":{"role":"assistant","content":null,"tool_calls":[{"id":"call-1","type":"function","function":{"name":"preview_rule_action","arguments":"{\"selectionCode\":\"system:no-op\",\"arguments\":{}}"}}]}}],"usage":{"prompt_tokens":12,"completion_tokens":4}}
            """));
        var transport = Create(handler);

        var result = await transport.SendAsync(Profile(), "secret", new(
            [new("system", "server markdown"), new("user", "wait")], Tool(), null), default);

        using var payload = JsonDocument.Parse(handler.Bodies.Single());
        Assert.Equal("auto", payload.RootElement.GetProperty("tool_choice").GetString());
        var function = payload.RootElement.GetProperty("tools")[0].GetProperty("function");
        Assert.Equal("preview_rule_action", function.GetProperty("name").GetString());
        Assert.True(function.GetProperty("strict").GetBoolean());
        Assert.Equal("tool_calls", result.Metadata.FinishReason);
        var call = Assert.Single(result.Message.ToolCalls!);
        Assert.Equal("call-1", call.Id);
        Assert.Equal("preview_rule_action", call.Name);
        Assert.Contains("system:no-op", call.ArgumentsJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Send_SerializesAssistantToolCallsAndToolFollowUpMessages()
    {
        var handler = new QueueHandler(Response("""
            {"id":"response-2","choices":[{"finish_reason":"stop","message":{"role":"assistant","content":"Nothing changes."}}],"usage":{"prompt_tokens":20,"completion_tokens":3}}
            """));
        var transport = Create(handler);
        var calls = new[] { new AiPlaygroundToolCall("call-1", "preview_rule_action", "{\"selectionCode\":\"system:no-op\",\"arguments\":{}}") };

        var result = await transport.SendAsync(Profile(), "secret", new(
            [
                new("system", "server markdown"),
                new("assistant", null, ToolCalls: calls),
                new("tool", "{\"status\":\"valid\"}", "call-1"),
            ], Tool(), null), default);

        using var payload = JsonDocument.Parse(handler.Bodies.Single());
        var messages = payload.RootElement.GetProperty("messages");
        Assert.Equal("call-1", messages[1].GetProperty("tool_calls")[0].GetProperty("id").GetString());
        Assert.Equal("tool", messages[2].GetProperty("role").GetString());
        Assert.Equal("call-1", messages[2].GetProperty("tool_call_id").GetString());
        Assert.Equal("Nothing changes.", result.Message.Content);
    }

    private static OpenAiCompatiblePlaygroundChatTransport Create(HttpMessageHandler handler) => new(
        new Factory(new HttpClient(handler)),
        Options.Create(new AiProviderOptions { TimeoutSeconds = 5, MaxOutputTokens = 100, Temperature = 0.2 }),
        NullLogger<OpenAiCompatiblePlaygroundChatTransport>.Instance);

    private static AiProfileDescriptor Profile() => new(new("profile"), "Profile", "https://example.test/v1", "model", new("credential"), true, AiProfileDefinitionSource.Database, 3);

    private static JsonElement Tool() => JsonSerializer.SerializeToElement(new
    {
        type = "function",
        function = new
        {
            name = "preview_rule_action",
            strict = true,
            parameters = new { type = "object", additionalProperties = false },
        },
    });

    private static HttpResponseMessage Response(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json"),
    };

    private sealed class Factory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class QueueHandler(params HttpResponseMessage[] responses) : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> queue = new(responses);
        public List<string> Bodies { get; } = [];
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Bodies.Add(await request.Content!.ReadAsStringAsync(cancellationToken));
            return queue.Dequeue();
        }
    }
}
