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
            && NormalizeForComparison(turn.Narrative!) == normalizedBody))
            violations.Add("repeated-narrative");

        foreach (var term in ProtectedConcreteTerms.Where(request.PlayerInput.Contains))
            if (!trimmed.Contains(term, StringComparison.Ordinal)) violations.Add($"entity-name-drift:{term}");

        var doorCheckPending = NarrativeSemanticGuard.DeriveProgressionSignals(
            request.AllowedSignals,
            request.PlayerInput,
            request.SessionState,
            request.CurrentProgressionNode).Any(signal => signal.Code == "constellation-door-reached");
        if (doorCheckPending && ContainsAny(trimmed, "扉が開いた", "扉は開いた", "扉を開いた", "判定に成功", "判定に失敗", "守護者が目覚め", "guardian awakened"))
            violations.Add("module-gated-outcome");

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

    internal static bool IsExplicitNpcQuestion(NarrativeDialogueRequest request) =>
        !string.Equals(request.InteractionType, NarrativeInteractionTypes.Clarification, StringComparison.Ordinal)
        && NpcMarkers.Any(request.PlayerInput.Contains);

    private static bool IsNonAdvancingInput(string input) => ContainsAny(input,
        "開けたり", "入ったりはしない", "開けない", "入らない", "新しい行動はしない", "遠くから", "見るだけ", "観察する", "確認したい");

    private static string? FindAddressedNpc(NarrativeDialogueRequest request)
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
        return null;
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

    private static string NormalizeForComparison(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var rune in value.Normalize(NormalizationForm.FormKC).EnumerateRunes())
            if (Rune.IsLetterOrDigit(rune)) builder.Append(rune.ToString().ToLowerInvariant());
        return builder.ToString();
    }

    private static bool ContainsAny(string value, params string[] candidates) => candidates.Any(value.Contains);

    [GeneratedRegex(@"(?:探索者|Player|プレイヤー)(?:.{0,32})(?:答え|返答|応じ)", RegexOptions.CultureInvariant | RegexOptions.Singleline)]
    private static partial Regex PlayerAnswerRegex();

    [GeneratedRegex(@"([\p{L}]{2,12})は", RegexOptions.CultureInvariant)]
    private static partial Regex NpcNameRegex();
}
