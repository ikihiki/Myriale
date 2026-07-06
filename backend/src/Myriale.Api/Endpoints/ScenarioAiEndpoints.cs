using System.Net.Http.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Myriale.Api.Contracts;

namespace Myriale.Api.Endpoints;

public static class ScenarioAiEndpoints
{
    public static RouteGroupBuilder MapScenarioAiEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/scenarios/ai")
            .WithTags("Scenario AI Assistance")
            .RequireCors("MyrialeFrontend")
            .RequireAuthorization();

        group.MapPost("/assist", AssistAsync).WithName("AssistScenarioCreation");
        return group;
    }

    private static async Task<Ok<ScenarioAiAssistResponse>> AssistAsync(
        ScenarioAiAssistRequest request,
        IHttpClientFactory httpClientFactory,
        CancellationToken cancellationToken)
    {
        try
        {
            var client = httpClientFactory.CreateClient("MockAi");
            var response = await client.PostAsJsonAsync("/mock-ai/scenario-assist", request, cancellationToken);
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<ScenarioAiAssistResponse>(cancellationToken: cancellationToken);
            if (body is not null) return TypedResults.Ok(body);
        }
        catch
        {
            // Tests and non-Aspire local runs can still exercise the API with the same deterministic mock behavior.
        }

        return TypedResults.Ok(Fallback(request));
    }

    private static ScenarioAiAssistResponse Fallback(ScenarioAiAssistRequest request) => request.Kind switch
    {
        "summary" => new("概要案を3つ提示しました。採用、編集、破棄を選べます。", [new("summary-1", "地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。", "title/genre/loreから安全なDraft概要を生成しました。")], null, null, null),
        "lore-check" => new("モックAIが世界観の矛盾候補を2件見つけました。", [new("lore-1", "死者の名前を読む条件と記憶喪失の範囲を明確化すると、セッション中の判定が安定します。", "Loreの発火条件を明文化します。")], null, null, null),
        "illustration-style" => new("モックAIがシナリオに合う画風候補を提示しました。", [new("style-1", "銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。", "既存のムードとNG要素に合わせました。")], null, null, null),
        "illustration-prompt" => new("モックAIが画像生成用プロンプトとネガティブプロンプトを分離して生成しました。", [new("prompt-1", "submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette", "プロンプトとNG要素を分離しました。")], "submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette", request.IllustrationNegative, null),
        "illustration-preview" => new("モックAIがサンプルシーンのテキストプレビューを生成しました。", [], null, null, $"[Mock preview / 保存対象外] {request.SampleScene} / {request.IllustrationStyle} / {request.IllustrationMood}"),
        _ => new("モックAIが提案を生成しました。", [], null, null, null),
    };
}
