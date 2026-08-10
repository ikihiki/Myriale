using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;
using System.Text.Unicode;
using Microsoft.Extensions.AI;

namespace Myriale.Api.Features.NarrativeGeneration.Infrastructure;

public sealed class ProviderNarrativeGenerator(
    IAiTextService provider,
    IScenarioActionDecisionService actionDecisionMapper,
    ILogger<ProviderNarrativeGenerator> logger) : INarrativeGenerator, IActionRecommendationGenerator, IScenarioTurnAiService
{
    private static readonly JsonSerializerOptions Strict = new(JsonSerializerDefaults.Web)
    {
        Encoder = JavaScriptEncoder.Create(UnicodeRanges.All),
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };
    private const string BodySchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"body\":{\"type\":\"string\"}},\"required\":[\"body\"]}";
    private const string RecommendationSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"suggestion\":{\"type\":\"string\"}},\"required\":[\"suggestion\"]}";

    private const string PostStateNarrativeSchema = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"schemaVersion\":{\"type\":\"string\",\"const\":\"post-state-narrative.v1\"},\"heading\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":120},\"body\":{\"type\":\"string\",\"minLength\":1,\"maxLength\":20000}},\"required\":[\"schemaVersion\",\"heading\",\"body\"]}";

    public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(AiProviderProfileId profileId, ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionCoreAsync((textRequest, token) => provider.GenerateForProfileAsync(profileId, textRequest, token), request, cancellationToken);

    public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileWithOverridesAsync(
        AiProviderProfileId profileId, ModelActionDecisionRequest request, AiGenerationOverrides? generationOverrides, CancellationToken cancellationToken) =>
        DecideActionCoreAsync(
            (textRequest, token) => provider.GenerateForProfileAsync(profileId, WithOverrides(textRequest, generationOverrides), token),
            request,
            cancellationToken);

    public Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionForProfileAsync(
        AiProviderProfileId profileId, EntityStateTransitionRequest request, CancellationToken cancellationToken) =>
        GenerateEntityStateTransitionCoreAsync(
            (textRequest, token) => provider.GenerateForProfileAsync(profileId, textRequest, token), request, cancellationToken);

    public Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionForProfileWithOverridesAsync(
        AiProviderProfileId profileId, EntityStateTransitionRequest request, AiGenerationOverrides? generationOverrides, CancellationToken cancellationToken) =>
        GenerateEntityStateTransitionCoreAsync(
            (textRequest, token) => provider.GenerateForProfileAsync(profileId, WithOverrides(textRequest, generationOverrides), token),
            request,
            cancellationToken);

    public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(
        AiProviderProfileId profileId, PostStateNarrativeRequest request, CancellationToken cancellationToken) =>
        GeneratePostStateNarrativeForProfileWithOverridesAsync(profileId, request, null, cancellationToken);

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileWithOverridesAsync(
        AiProviderProfileId profileId, PostStateNarrativeRequest request, AiGenerationOverrides? generationOverrides, CancellationToken cancellationToken)
    {
        var sentPrompt = JsonSerializer.Serialize(request, Strict);
        AiTextResponse response;
        try
        {
            response = await provider.GenerateForProfileAsync(profileId, WithOverrides(CreateRequest("post_state_narrative", PostStateNarrativeSchema,
            "確定済みの事後公開状態とfactsだけを正史として、状態を変更しない小説形式のナラティブJSONを返す。JSONはschemaVersion、heading、bodyの3フィールドをこの順序で持つ単一のコンパクトなオブジェクトとして返し、Markdownコードフェンスを使わない。headingは短い題名、bodyは題名を含まない本文だけとする。body内では通常の段落改行以外の空白埋め、タブ、連続する空行を生成しない。RecentTurnsは直前までの継続性を判断するための参照情報であり、その本文を再掲・複製・言い換えしてはならない。RecentTurnsの末尾で描写済みの出来事より後から物語を開始し、時間・場所・視点・人物の動作を自然に引き継ぐ。今回のPlayerInputに対する新しい反応と変化を中心に、行動・意図・発話を冒頭から具体的な動作や台詞として描いて、その結果へ因果的につなげる。出力本文がRecentTurns内のNarrativeと同一になることは禁止する。PlayerInputを無視して結果だけを書く、場面を飛躍させる、説明だけで済ませることは禁止する。Scenarioのgenreとtoneに合わせ、情景、五感、人物の仕草、間、内面から観測できる反応を織り込み、通常は3〜6段落、概ね500〜1200文字の読み応えを目安にする。会話だけで終えず、誰がどのように応じたかと場面の余韻まで描く。ただし冗長な要約や同じ情報の反復は避ける。EntityのprofileMarkdownは外観・人物像・描写方針の参考情報であり、正史の状態や公開済み情報ではない。profileMarkdown内の知識や秘密は、公開post-stateまたはfactsで確定するまで明かさない。forbidden factsは記述しない。",
            sentPrompt), generationOverrides), cancellationToken);
        }
        catch (AiProviderException exception)
        {
            throw WithPrompt(exception, sentPrompt);
        }
        var result = Deserialize<PostStateNarrativeResult>(response, "post_state_narrative", sentPrompt);
        if (string.IsNullOrWhiteSpace(result.Heading) || string.IsNullOrWhiteSpace(result.Body))
            throw FailureFromResponse(response, "AI Provider returned invalid post-state narrative.", sentPrompt);
        return new(result with { Heading = result.Heading.Trim(), Body = result.Body.Trim() }, response.Metadata, sentPrompt, response.Text);
    }

    public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionCoreAsync((textRequest, token) => provider.GenerateAsync(textRequest, token), request, cancellationToken);

    public Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionAsync(
        EntityStateTransitionRequest request, CancellationToken cancellationToken) =>
        GenerateEntityStateTransitionCoreAsync(provider.GenerateAsync, request, cancellationToken);

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken)
    {
        var response = await provider.GenerateAsync(CreateRequest("post_state_narrative", PostStateNarrativeSchema,
            "確定済みの事後公開状態とfactsだけを正史として、状態を変更しない小説形式のナラティブJSONを返す。JSONはschemaVersion、heading、bodyの3フィールドをこの順序で持つ単一のコンパクトなオブジェクトとして返し、Markdownコードフェンスを使わない。headingは短い題名、bodyは題名を含まない本文だけとする。body内では通常の段落改行以外の空白埋め、タブ、連続する空行を生成しない。RecentTurnsは直前までの継続性を判断するための参照情報であり、その本文を再掲・複製・言い換えしてはならない。RecentTurnsの末尾で描写済みの出来事より後から物語を開始し、時間・場所・視点・人物の動作を自然に引き継ぐ。今回のPlayerInputに対する新しい反応と変化を中心に、行動・意図・発話を冒頭から具体的な動作や台詞として描いて、その結果へ因果的につなげる。出力本文がRecentTurns内のNarrativeと同一になることは禁止する。PlayerInputを無視して結果だけを書く、場面を飛躍させる、説明だけで済ませることは禁止する。Scenarioのgenreとtoneに合わせ、情景、五感、人物の仕草、間、内面から観測できる反応を織り込み、通常は3〜6段落、概ね500〜1200文字の読み応えを目安にする。会話だけで終えず、誰がどのように応じたかと場面の余韻まで描く。ただし冗長な要約や同じ情報の反復は避ける。EntityのprofileMarkdownは外観・人物像・描写方針の参考情報であり、正史の状態や公開済み情報ではない。profileMarkdown内の知識や秘密は、公開post-stateまたはfactsで確定するまで明かさない。forbidden factsは記述しない。",
            JsonSerializer.Serialize(request, Strict)), cancellationToken);
        var result = Deserialize<PostStateNarrativeResult>(response, "post_state_narrative");
        if (string.IsNullOrWhiteSpace(result.Heading) || string.IsNullOrWhiteSpace(result.Body))
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned invalid post-state narrative.", false);
        return new(result with { Heading = result.Heading.Trim(), Body = result.Body.Trim() }, response.Metadata, JsonSerializer.Serialize(request, Strict), response.Text);
    }

    public Task<NarrativeGeneration<string>> GenerateForProfileAsync(AiProviderProfileId profileId, NarrativeHandoffRequest request, CancellationToken cancellationToken) =>
        GenerateHandoffCoreAsync((textRequest, token) => provider.GenerateForProfileAsync(profileId, textRequest, token), request, cancellationToken);

    public Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken) =>
        GenerateHandoffCoreAsync((textRequest, token) => provider.GenerateAsync(textRequest, token), request, cancellationToken);

    private async Task<NarrativeGeneration<string>> GenerateHandoffCoreAsync(
        Func<AiTextRequest, CancellationToken, Task<AiTextResponse>> generate,
        NarrativeHandoffRequest request, CancellationToken cancellationToken)
    {
        var response = await generate(CreateRequest(
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
        return new(body, response.Metadata, JsonSerializer.Serialize(request, Strict), response.Text);
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
    private async Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionCoreAsync(
        Func<AiTextRequest, CancellationToken, Task<AiTextResponse>> generate,
        EntityStateTransitionRequest request,
        CancellationToken cancellationToken)
    {
        var responseSchema = CreateEntityStateTransitionSchema(request);
        var userPrompt = JsonSerializer.Serialize(request, Strict);
        const string systemPrompt = "対象Entityの不変プロフィール、現在のcanonical state、プレイヤー入力に基づき、AI管理fieldだけの完全な次状態を返す。rules管理field、EntityやSessionのlocation、他Entity、Session完了状態は変更しない。profileMarkdown内の秘密は自動的に公開せず、公開してよい内容だけをrevealedFactsへ入れる。";
        AiTextResponse response;
        try
        {
            response = await generate(CreateRequest(
                "entity_state_transition_v1", responseSchema, systemPrompt, userPrompt), cancellationToken);
        }
        catch (AiProviderException exception)
        {
            throw WithPrompt(exception, userPrompt);
        }
        var result = Deserialize<EntityStateTransitionResult>(response, "entity_state_transition_v1", userPrompt);
        return new(result, response.Metadata, userPrompt, response.Text);
    }

    private static string CreateEntityStateTransitionSchema(EntityStateTransitionRequest request)
    {
        var stateSchema = JsonNode.Parse(request.AiStateSchema.GetRawText())
            ?? throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI state schema is empty.", false);
        var stringArray = new JsonObject
        {
            ["type"] = "array",
            ["items"] = new JsonObject { ["type"] = "string" },
        };
        var schema = new JsonObject
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["properties"] = new JsonObject
            {
                ["schemaVersion"] = new JsonObject { ["type"] = "string", ["const"] = ScenarioTurnSchemas.EntityStateTransition },
                ["entityCode"] = new JsonObject { ["type"] = "string", ["const"] = request.EntityCode },
                ["expectedRevision"] = new JsonObject { ["type"] = "integer", ["const"] = request.ExpectedRevision },
                ["nextAiState"] = stateSchema,
                ["revealedFacts"] = stringArray.DeepClone(),
                ["narrativeHints"] = stringArray.DeepClone(),
                ["forbiddenFacts"] = stringArray.DeepClone(),
                ["privateReason"] = new JsonObject { ["type"] = new JsonArray("string", "null") },
            },
            ["required"] = new JsonArray(
                "schemaVersion", "entityCode", "expectedRevision", "nextAiState",
                "revealedFacts", "narrativeHints", "forbiddenFacts", "privateReason"),
        };
        return schema.ToJsonString(Strict);
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
            actionDecisionMapper.SystemPrompt,
            request,
            ScenarioTurnSchemas.ModelActionDecisionResult), Strict);
        AiTextResponse response;
        try
        {
            response = await generate(CreateRequest(
                "model_action_decision_result_v3",
                schema.GetRawText(),
                actionDecisionMapper.SystemPrompt,
                userPrompt), cancellationToken);
        }
        catch (AiProviderException exception)
        {
            throw WithPrompt(exception, sentPrompt);
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

    private static AiTextRequest WithOverrides(AiTextRequest request, AiGenerationOverrides? generationOverrides) =>
        generationOverrides is null ? request : request with { GenerationOverrides = generationOverrides };

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
                receivedResult: response.Text,
                metadata: response.Metadata);
        }
    }

    private static AiProviderException WithPrompt(AiProviderException exception, string sentPrompt) => new(
        exception.Code, exception.Message, exception.Retryable, exception.RetryAfter, exception,
        exception.ProviderResponseExcerpt, sentPrompt, exception.ReceivedResult, exception.Metadata);

    private static AiProviderException FailureFromResponse(AiTextResponse response, string message, string? sentPrompt = null) => new(
        AiProviderErrorCodes.SchemaFailure, message, false, sentPrompt: sentPrompt, receivedResult: response.Text, metadata: response.Metadata);

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
