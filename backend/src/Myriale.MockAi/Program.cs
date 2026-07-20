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

app.MapPost("/mock-ai/action-recommendation", (MockActionRecommendationRequest request) =>
{
    var recent = request.RecentTurns.LastOrDefault()?.Narrative ?? request.Scenario.Opening;
    var suggestion = recent.Contains("扉", StringComparison.Ordinal)
        ? "銀の鍵を扉にかざし、刻まれた星座との対応を確かめる"
        : recent.Contains("人物", StringComparison.Ordinal)
            ? "書架の奥にいる人物へ、ここで何が起きたのか尋ねる"
            : "周囲の安全を確かめながら、目につく手掛かりを詳しく調べる";
    return Results.Ok(new MockActionRecommendationResult(suggestion));
});

app.MapPost("/mock-ai/narrative-dialogue", (MockNarrativeDialogueRequest request) =>
{
    const string schemaVersion = "narrative-dialogue.v8";
    if (!string.Equals(request.SchemaVersion, schemaVersion, StringComparison.Ordinal))
        return Results.BadRequest();
    if (request.InteractionType is not ("dialogue" or "clarification"))
        return Results.BadRequest();
    var input = request.PlayerInput.Trim();
    var recent = request.RecentTurns.LastOrDefault()?.Narrative;
    var context = string.IsNullOrWhiteSpace(recent) ? "図書館の静けさ" : "直前の出来事を踏まえ";
    var isClarification = request.InteractionType == "clarification";
    var isNpcReply = !isClarification && (input.Contains("話", StringComparison.Ordinal)
        || input.Contains("聞", StringComparison.Ordinal)
        || input.Contains("尋", StringComparison.Ordinal)
        || input.Contains("人物", StringComparison.Ordinal));
    var turnType = isClarification ? "clarification" : isNpcReply ? "npc-reply" : "action-result";
    var heading = isClarification ? "現在の状況を整理する" : isNpcReply ? "書架の奥の人物へ問いかける" : "次の手掛かりを確かめる";
    var signals = !isClarification
        && request.AllowedSignals.Any(signal => signal.Code == "constellation-door-reached")
        && input.Contains("扉", StringComparison.Ordinal)
            ? new[] { new MockNarrativeProgressionSignal("constellation-door-reached", "Player input states that the Player proceeds to the closed constellation door.") }
            : [];
    var body = isClarification
        ? "あなたは水没した地下図書館にいて、銀の鍵を持っています。これは理解補助の説明であり、物語の状態は進みません。"
        : $"{context}、あなたの「{input}」という行動を受けて、物語は確定した状況から静かに続いていく。";
    return Results.Ok(new MockNarrativeDialogueResult(
        schemaVersion,
        turnType,
        heading,
        body,
        signals,
        request.IncludeInterpretation
            ? $"「{input}」を、現在の状況に対するPlayerの行動として解釈しました。"
            : null));
});

app.MapPost("/mock-ai/narrative-handoff", (MockNarrativeHandoffRequest request) =>
{
    var facts = string.Join("、", request.Outcome.PublicFacts.Select(fact => fact.Text));
    var body = $"{request.Outcome.Summary} {facts}。物語は確定した結果を受け止め、次の静かな瞬間へ進む。";
    return Results.Ok(new MockNarrativeHandoffResponse(body));
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

public sealed record MockActionRecommendationRequest(
    MockNarrativeScenario Scenario,
    IReadOnlyList<MockNarrativeDialogueTurn> RecentTurns,
    MockNarrativeSessionState SessionState);

public sealed record MockActionRecommendationResult(string Suggestion);

public sealed record MockNarrativeDialogueRequest(
    string SchemaVersion,
    string ContextSchemaVersion,
    MockContextDiagnostics ContextDiagnostics,
    MockNarrativeScenario Scenario,
    IReadOnlyList<MockNarrativeDialogueTurn> RecentTurns,
    MockSessionMemory Memory,
    IReadOnlyList<MockPriorModuleOutcome> PriorModuleOutcomes,
    string InteractionType,
    MockPromptInstructions Prompt,
    string PlayerInput,
    MockNarrativeSessionState SessionState,
    string? CurrentProgressionNode,
    IReadOnlyList<MockAllowedNarrativeSignal> AllowedSignals,
    bool IncludeInterpretation);

public sealed record MockContextDiagnostics(
    string SchemaVersion,
    IReadOnlyList<string> ComponentIds,
    int SizeBytes,
    string Hash);

public sealed record MockPromptInstructions(
    string Version,
    string Perspective,
    string Tone,
    string FreedomPolicy,
    IReadOnlyList<string> Rules);

public sealed record MockLorebookEntry(string Id, string Text);
public sealed record MockSessionMemory(string? Summary, IReadOnlyList<MockLorebookEntry> Lorebook);

public sealed record MockPriorModuleOutcome(
    IReadOnlyList<MockNarrativeFact> PublicFacts,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts);

public sealed record MockAllowedNarrativeSignal(string Code, string TriggerDescription);
public sealed record MockNarrativeDialogueTurn(string? PlayerInput, string? Narrative);
public sealed record MockNarrativeProgressionSignal(string Code, string Evidence);
public sealed record MockNarrativeDialogueResult(
    string SchemaVersion,
    string TurnType,
    string Heading,
    string Body,
    IReadOnlyList<MockNarrativeProgressionSignal> Signals,
    string? Interpretation);

public sealed record MockNarrativeHandoffRequest(
    MockNarrativeScenario Scenario,
    MockNarrativeOutcome Outcome,
    object FinalPublicModuleState,
    MockNarrativeSessionState SessionState);

public sealed record MockNarrativeScenario(
    string Title,
    string Summary,
    string Genre,
    string Tone,
    string Lore,
    string AiFreedom,
    string Hero,
    string Opening);

public sealed record MockNarrativeOutcome(
    string Category,
    string Code,
    string Title,
    string Summary,
    IReadOnlyList<MockNarrativeFact> PublicFacts,
    IReadOnlyList<object> EmittedEvents,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts);

public sealed record MockNarrativeFact(string Type, string Text);
public sealed record MockNarrativeSessionState(long Revision, IReadOnlyDictionary<string, bool> Flags);
public sealed record MockNarrativeHandoffResponse(string Body);

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
