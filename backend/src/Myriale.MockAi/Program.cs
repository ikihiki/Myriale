using System.Text.Json;

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

app.MapPost("/mock-ai/rule-action-decision", (MockRuleActionDecisionRequest request) =>
{
    var selected = MockRuleActionSelector.Select(request);
    return Results.Ok(new { schemaVersion = "model-action-decision-result.v3", selectionCode = selected.SelectionCode, arguments = new { } });
});

app.MapPost("/mock-ai/post-state-narrative", (MockPostStateNarrativeRequest request) =>
{
    var facts = request.Facts.Count == 0 ? "確定した状態" : string.Join("、", request.Facts);
    var movedOutside = string.Equals(request.PostState.CurrentLocation.Code, "outside", StringComparison.Ordinal)
        || request.Facts.Any(fact => fact.Contains("外へ出た", StringComparison.Ordinal));
    var body = movedOutside
        ? $"{request.SelectedObject.Name}が開き、冷たい夜風が流れ込む。あなたは研究施設の外へ踏み出した。{facts}"
        : $"{request.SelectedObject.Name}への行動が完了した。{facts}を踏まえて物語は続く。";
    return Results.Ok(new { schemaVersion = "post-state-narrative.v1", heading = request.SelectedAction.Label, body });
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
            "基本情報案を3つ提示しました。採用、編集、破棄を選べます。",
            [new("summary-1", "## 物語の目的\n\n地下に沈んだ王都で、禁書を読むたびに書き換わる星座の謎を追います。\n\n- 水没した書庫を探索する\n- 失われる記憶の代償を選ぶ", "title/genre/loreからMarkdownの基本情報を生成しました。")],
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
    IReadOnlyList<MockNarrativeRecentTurn> RecentTurns,
    MockNarrativeSessionState SessionState);

public sealed record MockActionRecommendationResult(string Suggestion);

public sealed record MockRuleActionDecisionRequest(string SchemaVersion, string PlayerInput, MockActionDecisionScene Scene, IReadOnlyList<MockObjectActions> ObjectActions, IReadOnlyList<MockActionDecisionCandidate> SystemActions);
public sealed record MockActionDecisionScene(MockActionDecisionLocation CurrentLocation, IReadOnlyList<MockActionDecisionVisibleObject> VisibleObjects);
public sealed record MockActionDecisionLocation(string Code, string Name, string Description);
public sealed record MockActionDecisionVisibleObject(string Code, string Name, string Scope, JsonElement PublicState);
public sealed record MockObjectActions(string ObjectCode, string ObjectName, IReadOnlyList<MockActionDecisionCandidate> Actions);
public sealed record MockActionDecisionCandidate(string SelectionCode, string ActionCode, string Label, string Description, JsonElement ArgumentSchema);
public sealed record MockRulePublicLocation(string Id, string Code, string Name, string Description);
public sealed record MockRulePublicAction(string ObjectId, string ActionId, string Code, string Label, string Description, JsonElement ArgumentSchema, bool Enabled);
public sealed record MockPostStateNarrativeRequest(string SchemaVersion, MockNarrativeScenario Scenario, string PlayerInput, MockRulePublicObject SelectedObject, MockRulePublicAction SelectedAction, MockRulePostState PostState, IReadOnlyList<string> Facts, IReadOnlyList<JsonElement> Events, IReadOnlyList<string> NarrativeHints, IReadOnlyList<string> ForbiddenNarrativeFacts);
public sealed record MockRulePostState(string SchemaVersion, MockRulePublicLocation CurrentLocation, IReadOnlyList<MockRulePublicObject> Objects, IReadOnlyDictionary<string, bool> SessionFlags, long SessionStateRevision);
public sealed record MockRulePublicObject(string Id, string Code, string Name, string LocationId, bool IsGlobal, long Revision, JsonElement State);

public static class MockRuleActionSelector
{
    private static readonly (string[] InputTerms, string[] ObjectTerms)[] Directions =
    [
        (["西", "west"], ["西", "west"]),
        (["東", "east"], ["東", "east"]),
        (["北", "north"], ["北", "north"]),
        (["南", "south"], ["南", "south"]),
    ];

    public static MockActionDecisionCandidate Select(MockRuleActionDecisionRequest request)
    {
        var input = request.PlayerInput;
        var clarify = SystemAction(request, "clarify");
        var noOp = SystemAction(request, "no-op");

        if (ContainsAny(input, "待つ", "待機", "何もしない", "しばらくここで様子を見る")) return noOp ?? clarify ?? First(request);
        if (ContainsAny(input, "見回す", "観察", "確認", "見る"))
        {
            var target = MatchingObject(request, input);
            var inspect = target?.Actions.FirstOrDefault(action => action.ActionCode is "inspect" or "examine");
            if (inspect is not null) return inspect;
            return noOp ?? clarify ?? First(request);
        }

        if (ContainsAny(input, "進む", "移動", "入る"))
        {
            var target = MatchingObject(request, input);
            var movement = target?.Actions.FirstOrDefault(action => action.ActionCode == "traverse")
                ?? DirectionalObject(request, input)?.Actions.FirstOrDefault(action => action.ActionCode == "traverse");
            if (movement is not null) return movement;
        }

        if (ContainsAny(input, "話す", "聞く", "尋ねる"))
        {
            var target = MatchingObject(request, input);
            var talk = target?.Actions.FirstOrDefault(action => action.ActionCode == "talk");
            if (talk is not null) return talk;
        }

        if (ContainsAny(input, "扉を使う", "ドアを使う")) return clarify ?? noOp ?? First(request);
        var explicitTarget = MatchingObject(request, input) ?? DirectionalObject(request, input);
        var explicitAction = ExplicitAction(explicitTarget, input);
        if (explicitAction is not null) return explicitAction;

        if (input.Contains('?', StringComparison.Ordinal) || input.Contains('？', StringComparison.Ordinal)
            || ContainsAny(input, "どこ", "なぜ", "どうして", "何ですか", "教えて"))
            return clarify ?? noOp ?? First(request);
        return clarify ?? noOp ?? First(request);
    }

    private static MockObjectActions? MatchingObject(MockRuleActionDecisionRequest request, string input) =>
        request.ObjectActions.FirstOrDefault(group =>
            input.Contains(group.ObjectCode, StringComparison.OrdinalIgnoreCase)
            || input.Contains(group.ObjectName, StringComparison.OrdinalIgnoreCase));

    private static MockObjectActions? DirectionalObject(MockRuleActionDecisionRequest request, string input)
    {
        foreach (var (inputTerms, objectTerms) in Directions)
        {
            if (!inputTerms.Any(term => input.Contains(term, StringComparison.OrdinalIgnoreCase))) continue;
            return request.ObjectActions.FirstOrDefault(group =>
                objectTerms.Any(term => $"{group.ObjectCode} {group.ObjectName}".Contains(term, StringComparison.OrdinalIgnoreCase)));
        }
        return null;
    }

    private static MockActionDecisionCandidate? ExplicitAction(MockObjectActions? target, string input)
    {
        if (target is null) return null;
        var terms = ContainsAny(input, "開ける", "開く", "open") ? new[] { "開", "open" }
            : ContainsAny(input, "調べる", "inspect", "examine") ? new[] { "調べ", "inspect", "examine" }
            : ContainsAny(input, "戦う", "攻撃", "fight", "attack") ? new[] { "戦", "攻撃", "fight", "attack" }
            : ContainsAny(input, "押す", "press", "push") ? new[] { "押", "press", "push" }
            : [];
        return terms.Length == 0 ? null : target.Actions.FirstOrDefault(action =>
            terms.Any(term => $"{action.ActionCode} {action.Label} {action.Description}".Contains(term, StringComparison.OrdinalIgnoreCase)));
    }

    private static MockActionDecisionCandidate? SystemAction(MockRuleActionDecisionRequest request, string actionCode) =>
        request.SystemActions.FirstOrDefault(action => action.ActionCode == actionCode);

    private static MockActionDecisionCandidate First(MockRuleActionDecisionRequest request) =>
        request.ObjectActions.SelectMany(group => group.Actions).Concat(request.SystemActions).FirstOrDefault()
        ?? throw new InvalidOperationException("No model action candidate is available.");

    private static bool ContainsAny(string input, params string[] terms) =>
        terms.Any(term => input.Contains(term, StringComparison.OrdinalIgnoreCase));
}

public sealed record MockNarrativeRecentTurn(string? PlayerInput, string? Narrative);

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
    IReadOnlyList<MockScenarioNpc> Npcs,
    string Opening);

public sealed record MockScenarioNpc(
    string Code,
    string Name,
    string InitialLocationCode,
    string ProfileMarkdown);

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
public sealed record MockNarrativeEvent(string Type, JsonElement Payload);
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
    IReadOnlyList<MockScenarioNpc> Npcs,
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
