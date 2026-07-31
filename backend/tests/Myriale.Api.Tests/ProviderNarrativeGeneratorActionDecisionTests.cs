using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class ProviderNarrativeGeneratorActionDecisionTests
{
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
        Assert.Equal(JsonSerializer.Serialize(request, new JsonSerializerOptions(JsonSerializerDefaults.Web)), textProvider.Request.Messages[1].Text);
        var enumValues = textProvider.Request.ResponseFormat.Schema!.Value
            .GetProperty("properties").GetProperty("selectionCode").GetProperty("enum")
            .EnumerateArray().Select(item => item.GetString()).ToList();
        Assert.Equal(["object:door/traverse", "system:clarify", "system:no-op"], enumValues);

        var audit = JsonSerializer.Deserialize<ModelActionDecisionPromptAudit>(generated.SentPrompt!, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.Equal(ScenarioTurnSchemas.ModelActionDecisionPrompt, audit!.PromptVersion);
        Assert.Equal(ScenarioActionDecisionModelMapper.SystemPrompt, audit.SystemPrompt);
        Assert.Equal(
            JsonSerializer.Serialize(request, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            JsonSerializer.Serialize(audit.ModelRequest, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        Assert.Equal(ScenarioTurnSchemas.ModelActionDecisionResult, audit.ResponseSchemaVersion);
        Assert.Equal(textProvider.ResponseText, generated.ReceivedResult);
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
            return Task.FromResult(new AiTextResponse(ResponseText, new("test", "model", "response", 1, 1, 2, 1, "stop")));
        }

        public Task<AiTextResponse> GenerateForProviderAsync(string provider, string credential, AiTextRequest request, CancellationToken cancellationToken) =>
            GenerateAsync(request, cancellationToken);

        public Task TestConnectionAsync(string provider, string credential, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
