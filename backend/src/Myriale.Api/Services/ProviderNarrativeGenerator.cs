using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.AI;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class ProviderNarrativeGenerator(IAiTextProvider provider) : INarrativeGenerator, IActionRecommendationGenerator
{
    private static readonly JsonSerializerOptions Strict = new(JsonSerializerDefaults.Web) { UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
    private const string DialogueSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"schemaVersion\":{\"type\":\"string\"},\"turnType\":{\"type\":\"string\",\"enum\":[\"action-result\",\"npc-reply\",\"clarification\"]},\"heading\":{\"type\":\"string\"},\"body\":{\"type\":\"string\"},\"signals\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"code\":{\"type\":\"string\"},\"evidence\":{\"type\":\"string\"}},\"required\":[\"code\",\"evidence\"]}},\"interpretation\":{\"type\":[\"string\",\"null\"]}},\"required\":[\"schemaVersion\",\"turnType\",\"heading\",\"body\",\"signals\",\"interpretation\"]}";
    private const string BodySchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"body\":{\"type\":\"string\"}},\"required\":[\"body\"]}";
    private const string RecommendationSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"suggestion\":{\"type\":\"string\"}},\"required\":[\"suggestion\"]}";

    public async Task<NarrativeGeneration<NarrativeDialogueResult>> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest(
            "narrative_dialogue",
            DialogueSchema,
            BuildSystem(request.Prompt),
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        return new(Deserialize<NarrativeDialogueResult>(response.Text), response.Metadata);
    }
    public async Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest(
            "narrative_handoff",
            BodySchema,
            "確定済み公開情報だけを用いてmodule-handoff本文をJSONで返す。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var body = Deserialize<NarrativeHandoffResponse>(response.Text).Body.Trim();
        if (string.IsNullOrWhiteSpace(body) || body.Length > 20_000)
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid narrative body.", false);
        return new(body, response.Metadata);
    }
    public async Task<NarrativeActionRecommendationResult> RecommendActionAsync(NarrativeActionRecommendationRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest(
            "action_recommendation",
            RecommendationSchema,
            "プレイヤーの次の行動候補を1つだけJSONで返す。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var result = Deserialize<NarrativeActionRecommendationResult>(response.Text);
        if (string.IsNullOrWhiteSpace(result.Suggestion) || result.Suggestion.Length > 500)
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid action recommendation.", false);
        return result with { Suggestion = result.Suggestion.Trim() };
    }
    private static AiTextRequest CreateRequest(string schemaName, string schemaJson, string systemPrompt, string userPrompt)
    {
        using var schema = JsonDocument.Parse(schemaJson);
        return new AiTextRequest(
            [
                new ChatMessage(ChatRole.System, systemPrompt),
                new ChatMessage(ChatRole.User, userPrompt)
            ],
            ChatResponseFormat.ForJsonSchema(schema.RootElement.Clone(), schemaName));
    }

    private static T Deserialize<T>(string json)
    {
        try { return JsonSerializer.Deserialize<T>(json, Strict) ?? throw new JsonException("Empty JSON result."); }
        catch (JsonException exception) { throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid structured output.", false, null, exception); }
    }
    private static string BuildSystem(NarrativePromptInstructions prompt) => JsonSerializer.Serialize(prompt, Strict);
}
