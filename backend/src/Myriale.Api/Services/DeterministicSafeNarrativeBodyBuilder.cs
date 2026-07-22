using System.Text;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public static class DeterministicSafeNarrativeBodyBuilder
{
    public static string Build(NarrativeDialogueRequest request)
    {
        var body = string.Equals(request.InteractionType, NarrativeInteractionTypes.Clarification, StringComparison.Ordinal)
            ? BuildClarification(request)
            : NarrativeBodyQualityGuard.IsExplicitNpcQuestion(request)
                ? BuildNpcReply(request)
                : BuildObservation(request);

        if (NarrativeBodyQualityGuard.RequiresLongDetail(request.PlayerInput)) body = ExpandDetail(request, body);
        body = RemoveForbiddenSentences(body, request.PriorModuleOutcomes.SelectMany(outcome => outcome.ForbiddenNarrativeFacts));
        return Bound(body, 20_000);
    }

    private static string BuildClarification(NarrativeDialogueRequest request)
    {
        var facts = PublicFacts(request).Concat(StateFacts(request)).ToArray();
        var context = facts.Length > 0 ? string.Join(" ", facts) : request.Scenario.Opening;
        return $"現在確認できる範囲では、{context} 新しい行動や状態変化は起きていない。ここでは確定済みの状況だけを整理し、探索者の判断を待っている。";
    }

    private static string BuildNpcReply(NarrativeDialogueRequest request)
    {
        var npc = FindNpcName(request);
        var grounded = new List<string>();
        if (request.PlayerInput.Contains("灯", StringComparison.Ordinal))
        {
            if (request.Scenario.Lore.Contains("青", StringComparison.Ordinal)) grounded.Add("魔法灯は常に青い光を保つ");
            if (request.RecentTurns.Any(turn => turn.Narrative?.Contains("足元", StringComparison.Ordinal) == true
                && turn.Narrative.Contains("照ら", StringComparison.Ordinal))) grounded.Add("その灯は足元を照らしている");
        }
        grounded.AddRange(PublicFacts(request));
        if (grounded.Count == 0) grounded.Add("公開されている情報からは、これ以上を確定できない");
        var speaker = npc is null ? "問いかけに対し" : $"{npc}は問いに向き直り";
        return $"{speaker}、『{string.Join("。", grounded.Distinct(StringComparer.Ordinal))}のでございます。未確認の事柄を事実とは申し上げられません』と丁寧な応答が返る。探索者が何を確かめるかは、なお本人に委ねられている。";
    }

    private static string BuildObservation(NarrativeDialogueRequest request)
    {
        var facts = PublicFacts(request).Concat(StateFacts(request)).ToList();
        if (facts.Count == 0) facts.Add(request.Scenario.Opening);
        var summary = string.Join(" ", facts.Distinct(StringComparer.Ordinal));
        return $"探索者が確かめられる範囲では、{summary} 観察によって新しい行動が勝手に実行されることはなく、重要な判断と行動は探索者自身に委ねられている。";
    }

    private static string ExpandDetail(NarrativeDialogueRequest request, string initial)
    {
        var builder = new StringBuilder(initial);
        builder.Append("\n\n");
        builder.Append($"確定している舞台は「{request.Scenario.Title}」であり、{request.Scenario.Summary} ");
        builder.Append("公開されている情報と、これまでに確認された出来事だけを区別して説明する。推測や未公開の秘密は、確定した事実として扱わない。");
        builder.Append("\n\n");
        var facts = PublicFacts(request).ToArray();
        builder.Append(facts.Length == 0
            ? $"現在の位置と状況については、{request.Scenario.Opening} これ以上の由来や歴史は公開情報からは確定できない。"
            : $"これまでの公開事実として、{string.Join(" ", facts)} これらは現在の描写でも変えずに保たれる。");
        builder.Append("\n\n");
        builder.Append("ここで述べられる役割は、探索者が周囲を理解し、自分で選択するための手掛かりを示すことに限られる。扉を開く、奥へ入る、物を使うといった結果は、探索者が明示しない限り確定しないのでございます。");
        return builder.ToString();
    }

    private static IEnumerable<string> StateFacts(NarrativeDialogueRequest request)
    {
        if (!request.PlayerInput.Contains("扉", StringComparison.Ordinal)
            && !request.PlayerInput.Contains("door", StringComparison.OrdinalIgnoreCase)) yield break;
        foreach (var flag in request.SessionState.Flags.OrderBy(item => item.Key, StringComparer.Ordinal))
        {
            if (flag.Key.Contains("door", StringComparison.OrdinalIgnoreCase) && flag.Key.Contains("open", StringComparison.OrdinalIgnoreCase))
                yield return flag.Value ? "扉は開いている。" : "扉は閉じた状態のままである。";
            else if (flag.Value && flag.Key.Contains("has-silver-key", StringComparison.OrdinalIgnoreCase))
                yield return "銀の鍵は探索者が保持している。";
        }
    }

    private static IEnumerable<string> PublicFacts(NarrativeDialogueRequest request)
    {
        foreach (var outcome in request.PriorModuleOutcomes)
        {
            foreach (var fact in outcome.PublicFacts) yield return EnsureSentence(fact.Text);
            foreach (var hint in outcome.NarrativeHints) yield return EnsureSentence(hint);
        }
    }

    private static string? FindNpcName(NarrativeDialogueRequest request) =>
        request.PlayerInput.Contains("リラ", StringComparison.Ordinal) && request.Scenario.Lore.Contains("司書リラ", StringComparison.Ordinal)
            ? "司書リラ"
            : null;

    private static string RemoveForbiddenSentences(string body, IEnumerable<string> forbiddenFacts)
    {
        var forbidden = forbiddenFacts.Where(fact => !string.IsNullOrWhiteSpace(fact)).ToArray();
        if (forbidden.Length == 0) return body;
        var sentences = body.Split(['。', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var safe = sentences.Where(sentence => NarrativeSemanticGuard.MatchForbiddenFacts(sentence, forbidden).Count == 0).ToArray();
        return safe.Length == 0 ? "確定済みの公開情報だけを確認し、重要な判断と行動は探索者自身に委ねられている。" : string.Join("。", safe) + "。";
    }

    private static string EnsureSentence(string value) => value.Trim().TrimEnd('。') + "。";
    private static string Bound(string value, int maximum) => value.Length <= maximum ? value : value[..maximum];
}
