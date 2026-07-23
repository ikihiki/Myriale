using System.Text;
using System.Text.RegularExpressions;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed record NarrativeBodyQualityAssessment(bool IsAcceptable, IReadOnlyList<string> Violations)
{
    public static NarrativeBodyQualityAssessment Passed { get; } = new(true, []);
}

public sealed partial class NarrativeBodyQualityGuard
{
    private static readonly string[] DetailMarkers = ["詳しく", "詳細", "丁寧に説明", "歴史", "役割", "detail", "explain fully", "in depth"];
    private static readonly string[] NpcMarkers = ["尋ね", "訊ね", "質問", "教えて", "答えて", "説明して", "話しかけ", "語って", "?", "？", " ask ", "tell me", "explain"];
    private static readonly string[] ObservationMarkers = ["観察", "確認", "状態", "見る", "見つめ", "調べ", "振り返", "observe", "inspect", "check", "state"];
    private static readonly string[] ConsequentialActions = ["扉を開け", "扉が開い", "中へ入", "中に入", "鍵を消費", "契約した", "攻撃した", "飲み干した"];

    public NarrativeBodyQualityAssessment Assess(NarrativeDialogueRequest request, string? body)
    {
        var violations = new List<string>();
        var trimmed = body?.Trim() ?? string.Empty;
        if (trimmed.Length == 0) return new(false, ["body-empty"]);
        if (trimmed.Length > 20_000) return new(false, ["body-too-long"]);

        var minimumLength = RequiresLongDetail(request.PlayerInput) ? 240
            : IsExplicitNpcQuestion(request) ? 50
            : string.Equals(request.InteractionType, NarrativeInteractionTypes.Clarification, StringComparison.Ordinal) ? 30
            : 40;
        if (trimmed.Length < minimumLength) violations.Add("insufficient-detail");

        if (IsNonAdvancingInput(request.PlayerInput) && ConsequentialActions.Any(trimmed.Contains))
            violations.Add("player-agency");

        if (string.Equals(request.InteractionType, NarrativeInteractionTypes.Clarification, StringComparison.Ordinal)
            && (ConsequentialActions.Any(trimmed.Contains) || ContainsAny(trimmed, "新たに起き", "先へ進", "次へ進", "到達した")))
            violations.Add("clarification-advanced");

        var normalizedBody = NormalizeForComparison(trimmed);
        if (request.RecentTurns.Any(turn => !string.IsNullOrWhiteSpace(turn.Narrative)
            && IsRepeatedNarrative(normalizedBody, NormalizeForComparison(turn.Narrative!))))
            violations.Add("repeated-narrative");

        foreach (var term in ProtectedConcreteTerms.Where(request.PlayerInput.Contains))
        {
            if (!trimmed.Contains(term, StringComparison.Ordinal)
                || ConcreteTermSubstitutions.TryGetValue(term, out var substitutions)
                && substitutions.Any(trimmed.Contains))
                violations.Add($"entity-name-drift:{term}");
        }

        var playerHeldItem = FindPlayerHeldItem(request);
        if (playerHeldItem is not null
            && !ExplicitlyTransfersItem(request.PlayerInput, playerHeldItem)
            && AssignsItemToNpc(request, trimmed, playerHeldItem))
            violations.Add($"player-held-item-transfer:{playerHeldItem}");

        if (AgreedConditionalMovementWasOmitted(request.PlayerInput, trimmed))
            violations.Add("conditional-action-omitted");

        if (IsPossessionQuestion(request.PlayerInput)
            && playerHeldItem is not null
            && !DirectlyAnswersCurrentHolder(trimmed, playerHeldItem))
            violations.Add("ownership-answer-missing");

        var doorCheckPending = NarrativeSemanticGuard.DeriveProgressionSignals(
            request.AllowedSignals,
            request.PlayerInput,
            request.SessionState,
            request.CurrentProgressionNode).Any(signal => signal.Code == "constellation-door-reached");
        if (doorCheckPending && ContainsAny(trimmed,
            "扉が開いた", "扉は開いた", "扉を開いた", "扉が開き", "扉は開き", "扉を開き",
            "開き始め", "開いていく", "開こうと", "開きかけ", "扉の向こう", "扉の先", "扉の奥",
            "判定に成功", "判定は成功", "判定に失敗", "判定は失敗", "守護者が目覚め", "guardian awakened"))
            violations.Add("module-gated-outcome");

        if (IsNarrowAnswerRequest(request.PlayerInput)
            && ContainsAny(trimmed, "次の行動", "次にどう", "どうします", "どうするか", "選択肢", "何を確かめるか"))
            violations.Add("unrequested-choice-appendix");

        if (IsExplicitNpcQuestion(request))
        {
            var npcName = FindAddressedNpc(request);
            if (npcName is not null && !trimmed.Contains(npcName, StringComparison.Ordinal)) violations.Add("npc-identity");
            if (request.Scenario.Lore.Contains("ございます", StringComparison.Ordinal) && !trimmed.Contains("ござい", StringComparison.Ordinal))
                violations.Add("npc-voice");
            if (PlayerAnswerRegex().IsMatch(trimmed)) violations.Add("npc-speaker-inversion");
            if (MentionsMagicLamp(request.PlayerInput)
                && (!trimmed.Contains("灯", StringComparison.Ordinal) || !trimmed.Contains("青", StringComparison.Ordinal)))
                violations.Add("npc-lore-grounding");
        }

        if (ObservationMarkers.Any(request.PlayerInput.Contains) && MentionsDoor(request.PlayerInput))
        {
            foreach (var flag in request.SessionState.Flags.Where(item => item.Key.Contains("open", StringComparison.OrdinalIgnoreCase)))
            {
                if (!flag.Value && !trimmed.Contains("閉", StringComparison.Ordinal)) violations.Add("state-fact-missing");
                if (!flag.Value && trimmed.Contains("扉", StringComparison.Ordinal) && trimmed.Contains("開", StringComparison.Ordinal)) violations.Add("state-contradiction");
            }
        }

        var relevantOutcomes = request.PriorModuleOutcomes.Where(outcome => OutcomeIsRelevant(request.PlayerInput, outcome)).ToArray();
        foreach (var outcome in relevantOutcomes)
        {
            if (outcome.PublicFacts.Count > 0 && outcome.PublicFacts.Any(fact => MissingAuthoritativeConcept(trimmed, fact.Text)))
                violations.Add("module-public-fact-missing");
            if (outcome.NarrativeHints.Count > 0 && outcome.NarrativeHints.Any(hint => MissingAuthoritativeConcept(trimmed, hint)))
                violations.Add("module-hint-missing");
        }

        if (IsExplicitNpcQuestion(request) && request.Memory.Summary is { Length: > 0 } summary)
        {
            foreach (var concept in new[] { "信頼", "守", "慎重" }.Where(summary.Contains))
                if (!trimmed.Contains(concept, StringComparison.Ordinal)) violations.Add($"npc-continuity-{concept}");
        }

        var forbiddenFacts = request.PriorModuleOutcomes.SelectMany(outcome => outcome.ForbiddenNarrativeFacts)
            .Concat(UndisclosedMemorySecrets(request));
        var forbidden = NarrativeSemanticGuard.MatchForbiddenFacts(trimmed, forbiddenFacts);
        if (forbidden.Count > 0) violations.Add("forbidden-fact");

        return violations.Count == 0 ? NarrativeBodyQualityAssessment.Passed : new(false, violations.Distinct(StringComparer.Ordinal).ToArray());
    }

    internal static bool RequiresLongDetail(string input) => DetailMarkers.Any(input.Contains);

    internal static bool IsNarrowAnswerRequest(string input) => ContainsAny(input,
        "だけ教えて", "だけ、", "だけを", "関係だけ", "分かる範囲で", "わかる範囲で", "only tell", "only explain");

    internal static bool IsExplicitNpcQuestion(NarrativeDialogueRequest request) =>
        !string.Equals(request.InteractionType, NarrativeInteractionTypes.Clarification, StringComparison.Ordinal)
        && NpcMarkers.Any(request.PlayerInput.Contains);

    private static bool IsNonAdvancingInput(string input) => ContainsAny(input,
        "開けたり", "入ったりはしない", "開けない", "入らない", "新しい行動はしない", "遠くから", "見るだけ", "観察する", "確認したい");

    internal static string? FindAddressedNpc(NarrativeDialogueRequest request)
    {
        if (request.PlayerInput.Contains("リラ", StringComparison.Ordinal) && request.Scenario.Lore.Contains("司書リラ", StringComparison.Ordinal))
            return "司書リラ";
        foreach (Match match in NpcNameRegex().Matches(request.Scenario.Lore))
        {
            var candidate = match.Groups[1].Value;
            if (candidate.Length >= 2 && request.PlayerInput.Contains(candidate, StringComparison.Ordinal)) return candidate;
            var shortName = candidate.Length > 2 ? candidate[^2..] : candidate;
            if (request.PlayerInput.Contains(shortName, StringComparison.Ordinal)) return candidate;
        }
        foreach (Match match in AddressedNameRegex().Matches(request.PlayerInput))
        {
            var candidate = match.Groups[1].Value;
            if (candidate.Length is < 2 or > 8) continue;
            if (request.RecentTurns.Any(turn => turn.Narrative?.Contains(candidate, StringComparison.Ordinal) == true)) return candidate;
        }
        return null;
    }

    internal static string? FindPlayerHeldItem(NarrativeDialogueRequest request)
    {
        var authoritative = string.Join(" ", new[] { request.Scenario.Opening, request.Memory.Summary ?? string.Empty }
            .Concat(request.PriorModuleOutcomes.SelectMany(outcome => outcome.PublicFacts.Select(fact => fact.Text))));
        var match = PlayerHeldItemRegex().Match(authoritative);
        return match.Success ? match.Groups[1].Value : null;
    }

    private static bool ExplicitlyTransfersItem(string input, string item) =>
        input.Contains(item, StringComparison.Ordinal)
        && ContainsAny(input, "渡す", "手渡す", "預ける", "譲る", "受け取って", "貸す");

    private static bool AssignsItemToNpc(NarrativeDialogueRequest request, string narrative, string item)
    {
        var npc = FindAddressedNpc(request);
        var holderMarkers = new[] { "握", "持って", "手に", "所持", "保持", "自分の" };
        var references = ItemReferences(item);
        if (npc is not null && references.Any(reference => holderMarkers.Any(marker => AssignsSubjectItem(narrative, npc, reference, marker)))) return true;
        return IsExplicitNpcQuestion(request)
            && new[] { "彼", "彼女", "旅人", "司書" }.Any(subject => references.Any(reference => holderMarkers.Any(marker => AssignsSubjectItem(narrative, subject, reference, marker))));
    }

    private static bool AgreedConditionalMovementWasOmitted(string input, string narrative)
    {
        var conditional = ContainsAny(input, "了承するなら", "同意するなら", "承諾するなら", "応じるなら", "頷いたら", "うなずいたら");
        var requestsMovement = ContainsAny(input, "歩き出", "向かう", "移動する", "出発する", "進み始め", "乗り込");
        var agreement = ContainsAny(narrative, "了承", "同意", "承諾", "応じ", "頷", "うなず");
        var movement = ContainsAny(narrative, "歩き出", "向かった", "向かい始め", "移動した", "出発した", "進み始め", "乗り込");
        return conditional && requestsMovement && agreement && !movement;
    }

    internal static bool IsPossessionQuestion(string input) => ContainsAny(input,
        "誰のもの", "持ち主", "所有者", "誰が持", "どちらが持", "今持っている", "握っているのは", "私の切符", "自分の切符");

    private static bool DirectlyAnswersCurrentHolder(string narrative, string item)
    {
        var references = ItemReferences(item);
        var playerHolder = new[] { "あなた", "探索者", "Player", "プレイヤー", "主人公", "サヤ" }
            .Any(subject => references.Any(reference => ContainsInOrder(narrative, subject, reference, "握")
                || ContainsInOrder(narrative, subject, reference, "持")));
        return playerHolder || references.Any(reference => ContainsAny(narrative,
            $"{reference}を握っているのはあなた", $"{reference}を持っているのはあなた", $"{reference}は探索者が保持"));
    }

    private static string[] ItemReferences(string item)
    {
        var generic = new[] { "切符", "鍵", "手紙", "本", "剣", "杖" }.FirstOrDefault(item.EndsWith);
        return generic is null || string.Equals(generic, item, StringComparison.Ordinal) ? [item] : [item, generic];
    }

    private static bool AssignsSubjectItem(string value, string subject, string item, string holderMarker)
    {
        var subjectIndex = value.IndexOf(subject, StringComparison.Ordinal);
        if (subjectIndex < 0) return false;
        var itemIndex = value.IndexOf(item, subjectIndex + subject.Length, StringComparison.Ordinal);
        if (itemIndex < 0 || itemIndex - subjectIndex > 48) return false;
        var segment = value[subjectIndex..itemIndex];
        if (new[] { "あなた", "探索者", "Player", "プレイヤー", "主人公", "サヤ" }.Any(segment.Contains)) return false;
        var markerIndex = value.IndexOf(holderMarker, itemIndex + item.Length, StringComparison.Ordinal);
        return markerIndex >= 0 && markerIndex - itemIndex <= 24;
    }

    private static bool ContainsInOrder(string value, string first, string second, string third)
    {
        var firstIndex = value.IndexOf(first, StringComparison.Ordinal);
        if (firstIndex < 0) return false;
        var secondIndex = value.IndexOf(second, firstIndex + first.Length, StringComparison.Ordinal);
        if (secondIndex < 0 || secondIndex - firstIndex > 80) return false;
        var thirdIndex = value.IndexOf(third, secondIndex + second.Length, StringComparison.Ordinal);
        return thirdIndex >= 0 && thirdIndex - secondIndex <= 40;
    }

    private static bool MentionsDoor(string input) => input.Contains("扉", StringComparison.Ordinal) || input.Contains("door", StringComparison.OrdinalIgnoreCase);

    private static bool MentionsMagicLamp(string input) => input.Contains("魔法灯", StringComparison.Ordinal) || input.Contains("灯", StringComparison.Ordinal);

    private static bool OutcomeIsRelevant(string input, NarrativePriorModuleOutcomeInput outcome) =>
        outcome.PublicFacts.Any(fact => SharesAuthoritativeConcept(input, fact.Text))
        || outcome.NarrativeHints.Any(hint => SharesAuthoritativeConcept(input, hint));

    internal static IEnumerable<string> UndisclosedMemorySecrets(NarrativeDialogueRequest request)
    {
        const string marker = "知識境界:";
        foreach (var entry in request.Memory.Lorebook)
        {
            var start = entry.Text.IndexOf(marker, StringComparison.Ordinal);
            if (start < 0 || !entry.Text.Contains("未開示", StringComparison.Ordinal)) continue;
            start += marker.Length;
            var end = entry.Text.IndexOf("が、この秘密", start, StringComparison.Ordinal);
            if (end < 0) end = entry.Text.IndexOf("。", start, StringComparison.Ordinal);
            if (end > start)
            {
                var secret = entry.Text[start..end].Trim();
                if (secret.Length > 0) yield return secret;
            }
        }
    }

    private static bool MissingAuthoritativeConcept(string narrative, string authoritativeText)
    {
        string[] concepts = ["扉", "門", "封印", "青", "灯", "鍵", "銀", "影", "敵", "Player", "探索者"];
        var required = concepts.Where(concept => authoritativeText.Contains(concept, StringComparison.Ordinal)).ToArray();
        return required.Length > 0 && required.Any(concept => !narrative.Contains(concept, StringComparison.Ordinal));
    }

    private static bool SharesAuthoritativeConcept(string left, string right)
    {
        string[] concepts = ["扉", "門", "封印", "青", "灯", "鍵", "銀", "影", "敵", "Player", "探索者"];
        return concepts.Any(concept => left.Contains(concept, StringComparison.Ordinal) && right.Contains(concept, StringComparison.Ordinal));
    }

    private static readonly string[] ProtectedConcreteTerms = ["星座模様", "星図灯", "銀の鍵"];
    private static readonly IReadOnlyDictionary<string, string[]> ConcreteTermSubstitutions = new Dictionary<string, string[]>(StringComparer.Ordinal)
    {
        ["星座模様"] = ["星座の模型", "星座模型"],
        ["星図灯"] = ["星図の灯", "星図ランプ"],
        ["銀の鍵"] = ["銀色の鍵"],
    };

    private static bool IsRepeatedNarrative(string left, string right)
    {
        if (left == right) return true;
        if (left.Length < 80 || right.Length < 80) return false;

        var leftBigrams = BuildBigramCounts(left);
        var rightBigrams = BuildBigramCounts(right);
        var overlap = 0;
        foreach (var (bigram, count) in leftBigrams)
            if (rightBigrams.TryGetValue(bigram, out var otherCount)) overlap += Math.Min(count, otherCount);

        var total = leftBigrams.Values.Sum() + rightBigrams.Values.Sum();
        return total > 0 && 2d * overlap / total >= 0.86d;
    }

    private static Dictionary<string, int> BuildBigramCounts(string value)
    {
        var counts = new Dictionary<string, int>(StringComparer.Ordinal);
        for (var index = 0; index < value.Length - 1; index++)
        {
            var bigram = value.Substring(index, 2);
            counts[bigram] = counts.GetValueOrDefault(bigram) + 1;
        }
        return counts;
    }

    private static string NormalizeForComparison(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var rune in value.Normalize(NormalizationForm.FormKC).EnumerateRunes())
            if (Rune.IsLetterOrDigit(rune)) builder.Append(rune.ToString().ToLowerInvariant());
        return builder.ToString();
    }

    private static bool ContainsAny(string value, params string[] candidates) => candidates.Any(value.Contains);

    [GeneratedRegex(@"(?:あなた|探索者|Player|プレイヤー|主人公)(?:は|が).{0,32}?([\p{L}]{1,16}(?:切符|鍵|手紙|本|剣|杖))を(?:握って|持って|携えて|保持して)いる", RegexOptions.CultureInvariant)]
    private static partial Regex PlayerHeldItemRegex();

    [GeneratedRegex(@"([\p{L}]{2,8})(?:に|へ|、)", RegexOptions.CultureInvariant)]
    private static partial Regex AddressedNameRegex();

    [GeneratedRegex(@"(?:探索者|Player|プレイヤー)(?:.{0,32})(?:答えた|答える|返答した|返答する|応じた|応じる)", RegexOptions.CultureInvariant | RegexOptions.Singleline)]
    private static partial Regex PlayerAnswerRegex();

    [GeneratedRegex(@"([\p{L}]{2,12})は", RegexOptions.CultureInvariant)]
    private static partial Regex NpcNameRegex();
}
