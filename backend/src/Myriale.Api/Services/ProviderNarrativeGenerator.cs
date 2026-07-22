using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.AI;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class ProviderNarrativeGenerator(
    IAiTextProvider provider,
    ILogger<ProviderNarrativeGenerator> logger) : INarrativeGenerator, IActionRecommendationGenerator
{
    private static readonly JsonSerializerOptions Strict = new(JsonSerializerDefaults.Web) { UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
    private const string DialogueSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"schemaVersion\":{\"type\":\"string\",\"const\":\"narrative-dialogue.v8\"},\"turnType\":{\"type\":\"string\",\"enum\":[\"action-result\",\"npc-reply\",\"clarification\"]},\"heading\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":120},\"body\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":20000},\"signals\":{\"type\":\"array\",\"maxItems\":1,\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"code\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":80,\"pattern\":\"^[a-z0-9-]+$\"},\"evidence\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":500}},\"required\":[\"code\",\"evidence\"]}},\"interpretation\":{\"type\":[\"string\",\"null\"],\"maxLength\":500}},\"required\":[\"schemaVersion\",\"turnType\",\"heading\",\"body\",\"signals\",\"interpretation\"]}";
    private const string BodySchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"body\":{\"type\":\"string\"}},\"required\":[\"body\"]}";
    private const string RecommendationSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"suggestion\":{\"type\":\"string\"}},\"required\":[\"suggestion\"]}";

    public async Task<NarrativeGeneration<NarrativeDialogueResult>> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken)
    {
        var providerRequest = CreateRequest(
            "narrative_dialogue",
            DialogueSchema,
            BuildSystem(request.Prompt),
            JsonSerializer.Serialize(request, Strict));
        var sentPrompt = SerializePrompt(providerRequest);
        AiTextResponse response;
        try
        {
            response = await provider.GenerateAsync(providerRequest, cancellationToken);
        }
        catch (AiProviderException exception)
        {
            throw WithDiagnostics(exception, sentPrompt, exception.ProviderResponseExcerpt);
        }
        try
        {
            return new(
                Deserialize<NarrativeDialogueResult>(response, "narrative_dialogue"),
                response.Metadata,
                sentPrompt,
                response.Text);
        }
        catch (AiProviderException exception)
        {
            throw WithDiagnostics(exception, sentPrompt, response.Text);
        }
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

    private static AiProviderException WithDiagnostics(AiProviderException exception, string sentPrompt, string? receivedResult) => new(
        exception.Code,
        exception.Message,
        exception.Retryable,
        exception.RetryAfter,
        exception,
        exception.ProviderResponseExcerpt,
        sentPrompt,
        receivedResult);

    private static string SerializePrompt(AiTextRequest request) => JsonSerializer.Serialize(new
    {
        messages = request.Messages.Select(message => new { role = message.Role.Value, content = message.Text }),
        responseFormat = new
        {
            schemaName = request.ResponseFormat.SchemaName,
            schema = request.ResponseFormat.Schema?.GetRawText(),
        },
    }, Strict);

    private T Deserialize<T>(AiTextResponse response, string schemaName)
    {
        try { return JsonSerializer.Deserialize<T>(response.Text, Strict) ?? throw new JsonException("Empty JSON result."); }
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

    private static string Sha256(string value) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private static string BuildSystem(NarrativePromptInstructions prompt) => JsonSerializer.Serialize(prompt, Strict);
}
