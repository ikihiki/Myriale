using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Unicode;
using Microsoft.Extensions.AI;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class ProviderNarrativeGenerator(
    IAiTextProvider provider,
    ScenarioActionDecisionModelMapper actionDecisionMapper,
    ILogger<ProviderNarrativeGenerator> logger) : INarrativeGenerator, IActionRecommendationGenerator, IScenarioTurnAi
{
    private static readonly JsonSerializerOptions Strict = new(JsonSerializerDefaults.Web)
    {
        Encoder = JavaScriptEncoder.Create(UnicodeRanges.All),
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };
    private const string BodySchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"body\":{\"type\":\"string\"}},\"required\":[\"body\"]}";
    private const string RecommendationSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"suggestion\":{\"type\":\"string\"}},\"required\":[\"suggestion\"]}";

    private const string PostStateNarrativeSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"schemaVersion\":{\"type\":\"string\",\"const\":\"post-state-narrative.v1\"},\"heading\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":120},\"body\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":20000}},\"required\":[\"schemaVersion\",\"heading\",\"body\"]}";

    public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(string profileId, ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionCoreAsync((textRequest, token) => provider.GenerateForProfileAsync(profileId, textRequest, token), request, cancellationToken);

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(string profileId, PostStateNarrativeRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateForProfileAsync(profileId, CreateRequest("post_state_narrative", PostStateNarrativeSchema,
            "確定済みの事後公開状態とfactsだけを正史として、状態を変更しないナラティブJSONを返す。EntityのprofileMarkdownは外観・人物像・描写方針の参考情報であり、正史の状態や公開済み情報ではない。profileMarkdown内の知識や秘密は、公開post-stateまたはfactsで確定するまで明かさない。forbidden factsは記述しない。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var result = Deserialize<PostStateNarrativeResult>(response, "post_state_narrative");
        if (string.IsNullOrWhiteSpace(result.Heading) || string.IsNullOrWhiteSpace(result.Body))
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid post-state narrative.", false);
        return new(result with { Heading = result.Heading.Trim(), Body = result.Body.Trim() }, response.Metadata, JsonSerializer.Serialize(request, Strict), response.Text);
    }

    public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionCoreAsync((textRequest, token) => provider.GenerateAsync(textRequest, token), request, cancellationToken);

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest("post_state_narrative", PostStateNarrativeSchema,
            "確定済みの事後公開状態とfactsだけを正史として、状態を変更しないナラティブJSONを返す。EntityのprofileMarkdownは外観・人物像・描写方針の参考情報であり、正史の状態や公開済み情報ではない。profileMarkdown内の知識や秘密は、公開post-stateまたはfactsで確定するまで明かさない。forbidden factsは記述しない。",
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
            "確定済み公開情報だけを用いてmodule-handoff本文をJSONで返す。EntityのprofileMarkdownは外観・人物像・描写方針の参考情報であり、正史の状態や公開済み情報ではない。profileMarkdown内の知識や秘密は、公開済みfactsに含まれる場合だけ明かす。",
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
            "プレイヤーの次の行動候補を1つだけJSONで返す。EntityのprofileMarkdownを外観・人物表現の整合性に使うが、profileMarkdown内の非公開知識や秘密を候補文で開示しない。",
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
    private async Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionCoreAsync(
        Func<AiTextRequest, CancellationToken, Task<AiTextResponse>> generate,
        ModelActionDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var schema = actionDecisionMapper.CreateResponseSchema(request);
        var userPrompt = JsonSerializer.Serialize(request, Strict);
        var sentPrompt = JsonSerializer.Serialize(new ModelActionDecisionPromptAudit(
            ScenarioTurnSchemas.ModelActionDecisionPrompt,
            ScenarioActionDecisionModelMapper.SystemPrompt,
            request,
            ScenarioTurnSchemas.ModelActionDecisionResult), Strict);
        AiTextResponse response;
        try
        {
            response = await generate(CreateRequest(
                "model_action_decision_result_v3",
                schema.GetRawText(),
                ScenarioActionDecisionModelMapper.SystemPrompt,
                userPrompt), cancellationToken);
        }
        catch (AiProviderException exception)
        {
            throw new AiProviderException(exception.Code, exception.Message, exception.Retryable, exception.RetryAfter,
                exception, exception.ProviderResponseExcerpt, sentPrompt, exception.ReceivedResult);
        }
        var result = Deserialize<ModelActionDecisionResult>(response, "model_action_decision_result_v3", sentPrompt);
        return new(result, response.Metadata, sentPrompt, response.Text);
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

    private T Deserialize<T>(AiTextResponse response, string schemaName, string? sentPrompt = null)
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
                exception,
                sentPrompt: sentPrompt,
                receivedResult: response.Text);
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
