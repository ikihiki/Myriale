var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
var app = builder.Build();


app.MapDefaultEndpoints();

app.MapPost("/mock-ai/hero-recommendation", (MockHeroRecommendationRequest request) =>
{
    var name = request.Title.Contains("月虹", StringComparison.Ordinal) ? "ルネ" : "ノクト";
    var profile = request.Title.Contains("月虹", StringComparison.Ordinal)
        ? "失われた庭園の色を探し、十三回目の鐘の意味を読み解く記憶の採集者。"
        : $"{request.Title}の導入と世界観を手掛かりに、物語の謎を追う旅人。";
    return Results.Ok(new MockHeroRecommendationResponse(
        name,
        profile,
        "AIがシナリオ設定から主人公案を推薦しました。内容を確認・修正してから確定してください。"));
});

app.MapPost("/mock-ai/scenario-assist", (MockScenarioAssistRequest request) =>
{
    var response = request.Kind switch
    {
        "summary" => new MockScenarioAssistResponse(
            "概要案を3つ提示しました。採用、編集、破棄を選べます。",
            [new("summary-1", "地下に沈んだ王都で、禁書を読むたびに星座が書き換わる探索譚。", "title/genre/loreから安全なDraft概要を生成しました。")],
            null,
            null,
            null),
        "lore-check" => new MockScenarioAssistResponse(
            "モックAIが世界観の矛盾候補を2件見つけました。",
            [new("lore-1", "死者の名前を読む条件と記憶喪失の範囲を明確化すると、セッション中の判定が安定します。", "Loreの発火条件を明文化します。")],
            null,
            null,
            null),
        "illustration-style" => new MockScenarioAssistResponse(
            "モックAIがシナリオに合う画風候補を提示しました。",
            [new("style-1", "銅版画風、影絵、水彩写本。低彩度で星図の金線だけを強調。", "既存のムードとNG要素に合わせました。")],
            null,
            null,
            null),
        "illustration-prompt" => new MockScenarioAssistResponse(
            "モックAIが画像生成用プロンプトとネガティブプロンプトを分離して生成しました。",
            [new("prompt-1", "submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette", "プロンプトとNG要素を分離しました。")],
            "submerged archive, apprentice librarian, antique star map, copperplate engraving, muted palette",
            request.IllustrationNegative,
            null),
        "illustration-preview" => new MockScenarioAssistResponse(
            "モックAIがサンプルシーンのテキストプレビューを生成しました。",
            [],
            null,
            null,
            $"[Mock preview / 保存対象外] {request.SampleScene} / {request.IllustrationStyle} / {request.IllustrationMood}"),
        _ => new MockScenarioAssistResponse("モックAIが提案を生成しました。", [], null, null, null),
    };

    return Results.Ok(response);
});

app.Run();

public sealed record MockHeroRecommendationRequest(
    string Id,
    string Title,
    string Genre,
    string Tone,
    string Lore,
    string Opening,
    string? CurrentName,
    string? CurrentProfile);

public sealed record MockHeroRecommendationResponse(string Name, string Profile, string Message);

public sealed record MockScenarioAssistRequest(
    string Kind,
    string Target,
    string Title,
    string Summary,
    string Genre,
    string Tone,
    string Lore,
    string AiFreedom,
    string Hero,
    string Opening,
    string IllustrationStyle,
    string IllustrationMood,
    string IllustrationNegative,
    string SampleScene);

public sealed record MockSuggestion(string Id, string Body, string Rationale);

public sealed record MockScenarioAssistResponse(
    string Message,
    IReadOnlyList<MockSuggestion> Suggestions,
    string? Prompt,
    string? NegativePrompt,
    string? PreviewText);
