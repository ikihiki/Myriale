using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.AI;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class ProviderNarrativeGenerator(
    IAiTextProvider provider,
    ILogger<ProviderNarrativeGenerator> logger) : INarrativeGenerator, IActionRecommendationGenerator, IScenarioTurnAi
{
    private static readonly JsonSerializerOptions Strict = new(JsonSerializerDefaults.Web) { UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
    private const string BodySchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"body\":{\"type\":\"string\"}},\"required\":[\"body\"]}";
    private const string RecommendationSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"suggestion\":{\"type\":\"string\"}},\"required\":[\"suggestion\"]}";

    private const string ActionDecisionSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"schemaVersion\":{\"const\":\"rule-action-decision.v1\"},\"objectId\":{\"type\":\"string\"},\"actionId\":{\"type\":\"string\"},\"arguments\":{\"type\":\"object\"}},\"required\":[\"schemaVersion\",\"objectId\",\"actionId\",\"arguments\"]}";
    private const string PostStateNarrativeSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"schemaVersion\":{\"const\":\"post-state-narrative.v1\"},\"heading\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":120},\"body\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":20000}},\"required\":[\"schemaVersion\",\"heading\",\"body\"]}";

    public async Task<NarrativeGeneration<RuleActionDecisionResult>> DecideActionAsync(RuleActionDecisionRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest("rule_action_decision", ActionDecisionSchema,
            "候補に含まれる enabled な objectId/actionId を1つ選び、arguments と共にJSONだけを返す。状態、効果、module identityは返さない。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var result = Deserialize<RuleActionDecisionResult>(response, "rule_action_decision");
        return new(result, response.Metadata, JsonSerializer.Serialize(request, Strict), response.Text);
    }

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest("post_state_narrative", PostStateNarrativeSchema,
            "確定済みの事後公開状態とfactsだけを正史として、状態を変更しないナラティブJSONを返す。forbidden factsは記述しない。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var result = Deserialize<PostStateNarrativeResult>(response, "post_state_narrative");
        if (string.IsNullOrWhiteSpace(result.Heading) || string.IsNullOrWhiteSpace(result.Body))
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid post-state narrative.", false);
        return new(result with { Heading = result.Heading.Trim(), Body = result.Body.Trim() }, response.Metadata, JsonSerializer.Serialize(request, Strict), response.Text);
    }

    public async Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest(
            "narrative_handoff",
            BodySchema,
            "確定済み公開情報だけを用いてmodule-handoff本文をJSONで返す。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var body = Deserialize<NarrativeHandoffResponse>(response, "narrative_handoff").Body.Trim();
        if (string.IsNullOrWhiteSpace(body) || body.Length > 20_000)
        {
            logger.LogWarning(
                "AI Provider narrative body failed semantic validation. Provider={Provider} Model={Model} ResponseId={ResponseId} BodyLength={BodyLength} IsEmpty={IsEmpty}",
                response.Metadata.Provider, response.Metadata.Model, response.Metadata.ResponseId, body.Length, string.IsNullOrWhiteSpace(body));
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid narrative body.", false);
        }
        return new(body, response.Metadata);
    }
    public async Task<NarrativeActionRecommendationResult> RecommendActionAsync(NarrativeActionRecommendationRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest(
            "action_recommendation",
            RecommendationSchema,
            "プレイヤーの次の行動候補を1つだけJSONで返す。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var result = Deserialize<NarrativeActionRecommendationResult>(response, "action_recommendation");
        if (string.IsNullOrWhiteSpace(result.Suggestion) || result.Suggestion.Length > 500)
        {
            logger.LogWarning(
                "AI Provider action recommendation failed semantic validation. Provider={Provider} Model={Model} ResponseId={ResponseId} SuggestionLength={SuggestionLength} IsEmpty={IsEmpty}",
                response.Metadata.Provider, response.Metadata.Model, response.Metadata.ResponseId, result.Suggestion?.Length ?? 0, string.IsNullOrWhiteSpace(result.Suggestion));
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid action recommendation.", false);
        }
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

    private T Deserialize<T>(AiTextResponse response, string schemaName)
    {
        try
        {
            var json = StripJsonFence(response.Text);
            return JsonSerializer.Deserialize<T>(json, Strict) ?? throw new JsonException("Empty JSON result.");
        }
        catch (JsonException exception)
        {
            logger.LogWarning(
                exception,
                "AI Provider structured output did not match the application contract. Provider={Provider} Model={Model} Schema={SchemaName} ResponseId={ResponseId} OutputLength={OutputLength} OutputSha256={OutputSha256} JsonPath={JsonPath} LineNumber={LineNumber} BytePositionInLine={BytePositionInLine}",
                response.Metadata.Provider,
                response.Metadata.Model,
                schemaName,
                response.Metadata.ResponseId,
                response.Text.Length,
                Sha256(response.Text),
                exception.Path,
                exception.LineNumber,
                exception.BytePositionInLine);
            throw new AiProviderException(
                AiProviderErrorCodes.SchemaFailure,
                $"AI Provider returned invalid structured output for {schemaName} at {exception.Path ?? "<root>"}.",
                false,
                null,
                exception);
        }
    }

    private static string StripJsonFence(string value)
    {
        var trimmed = value.Trim();
        if (!trimmed.StartsWith("```", StringComparison.Ordinal) || !trimmed.EndsWith("```", StringComparison.Ordinal))
            return trimmed;

        var firstLineEnd = trimmed.IndexOf('\n');
        if (firstLineEnd < 0) return trimmed;
        var opening = trimmed[..firstLineEnd].TrimEnd('\r');
        if (opening is not ("```" or "```json" or "```JSON")) return trimmed;
        return trimmed[(firstLineEnd + 1)..^3].Trim();
    }

    private static string Sha256(string value) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

}
