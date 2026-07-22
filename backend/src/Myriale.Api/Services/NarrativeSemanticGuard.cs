using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed record ValidatedNarrativeProgressionSignal(string Code, string ServerEvidence);

public static partial class NarrativeSemanticGuard
{
    private static readonly IReadOnlyDictionary<string, Func<string, NarrativeSessionStateInput, string?, bool>> SignalEvidenceRules =
        new Dictionary<string, Func<string, NarrativeSessionStateInput, string?, bool>>(StringComparer.Ordinal)
        {
            ["constellation-door-reached"] = HasConstellationDoorArrivalEvidence,
        };

    private static readonly IReadOnlyDictionary<string, string> SemanticAliases = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["fabricated"] = "invent", ["fabricate"] = "invent", ["invented"] = "invent", ["inventing"] = "invent",
        ["madeup"] = "invent", ["makeup"] = "invent", ["created"] = "invent",
        ["different"] = "another", ["additional"] = "another", ["new"] = "another",
        ["result"] = "outcome", ["results"] = "outcome", ["conclusion"] = "outcome", ["ending"] = "outcome",
        ["again"] = "again", ["reopened"] = "open", ["reopen"] = "open", ["opened"] = "open",
        ["復活した"] = "復活", ["蘇った"] = "復活", ["よみがえった"] = "復活",
        ["再び"] = "again", ["また"] = "again", ["もう一度"] = "again",
        ["門"] = "gate", ["扉"] = "gate", ["敵"] = "enemy", ["封印"] = "seal",
        ["開く"] = "open", ["開いた"] = "open", ["開かれた"] = "open", ["開放された"] = "open",
        ["突然"] = "理由なく", ["勝手に"] = "理由なく", ["ひとりでに"] = "理由なく",
    };

    public static IReadOnlyList<ValidatedNarrativeProgressionSignal> ValidateProgressionSignals(
        IReadOnlyList<NarrativeProgressionSignal> signals,
        IReadOnlyList<NarrativeAllowedSignal> allowedSignals,
        string playerInput,
        NarrativeSessionStateInput sessionState,
        string? currentProgressionNode)
    {
        if (signals.Count > 1)
            throw new NarrativeSignalValidationException($"Narrative provider returned too many progression signals: count={signals.Count}, max=1.");

        var allowedCodes = allowedSignals.Select(signal => signal.Code).ToHashSet(StringComparer.Ordinal);
        var validated = new List<ValidatedNarrativeProgressionSignal>(signals.Count);
        foreach (var signal in signals)
        {
            var violations = new List<string>();
            if (string.IsNullOrWhiteSpace(signal.Code)) violations.Add("code is empty");
            else
            {
                if (signal.Code.Length > 80) violations.Add($"code length={signal.Code.Length} max=80");
                if (signal.Code.Any(character => !(char.IsLower(character) || char.IsDigit(character) || character == '-')))
                    violations.Add("code contains invalid characters");
                if (!allowedCodes.Contains(signal.Code)) violations.Add($"code is not allowed code={signal.Code}");
                if (!SignalEvidenceRules.TryGetValue(signal.Code, out var rule))
                    violations.Add($"code has no server evidence rule code={signal.Code}");
                else if (!rule(playerInput, sessionState, currentProgressionNode))
                    violations.Add($"authoritative player input/state does not satisfy code={signal.Code}");
            }
            if (string.IsNullOrWhiteSpace(signal.Evidence)) violations.Add("provider evidence is empty");
            else if (signal.Evidence.Length > 500) violations.Add($"provider evidence length={signal.Evidence.Length} max=500");

            if (violations.Count > 0)
                throw new NarrativeSignalValidationException($"Narrative provider returned an invalid progression signal: {string.Join("; ", violations)}");

            validated.Add(new ValidatedNarrativeProgressionSignal(
                signal.Code,
                $"server-rule:{signal.Code};state-revision:{sessionState.Revision};node:{currentProgressionNode ?? "none"}"));
        }

        return validated;
    }

    public static IReadOnlyList<string> MatchForbiddenFacts(string narrative, IEnumerable<string> forbiddenFacts)
    {
        var normalizedNarrative = Normalize(narrative);
        var compactNarrative = Compact(normalizedNarrative);
        var narrativeConcepts = Concepts(normalizedNarrative);

        return forbiddenFacts
            .Select(fact => fact.Trim())
            .Where(fact => fact.Length > 0)
            .Where(fact =>
            {
                var normalizedFact = Normalize(fact);
                var compactFact = Compact(normalizedFact);
                if (compactFact.Length >= 4 && compactNarrative.Contains(compactFact, StringComparison.Ordinal)) return true;

                var factConcepts = Concepts(normalizedFact)
                    .Where(concept => concept is not "do" and not "not" and not "must" and not "never")
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();
                return factConcepts.Length >= 2 && factConcepts.All(narrativeConcepts.Contains);
            })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static bool HasConstellationDoorArrivalEvidence(
        string playerInput,
        NarrativeSessionStateInput sessionState,
        string? currentProgressionNode)
    {
        if (!string.Equals(currentProgressionNode, "exploration", StringComparison.Ordinal)) return false;
        if (sessionState.Revision < 0) return false;

        var normalized = Normalize(playerInput);
        var compact = Compact(normalized);
        var hasTarget = compact.Contains("星座", StringComparison.Ordinal)
            && compact.Contains("扉", StringComparison.Ordinal)
            || compact.Contains("constellationdoor", StringComparison.Ordinal);
        if (!hasTarget) return false;

        string[] rejected =
        [
            "行かない", "進まない", "向かわない", "到達していない", "着いていない", "まだ", "遠くから", "見るだけ", "眺める", "観察", "尋ね", "聞く", "話す", "ふり", "つもり", "予定",
            "donot", "dont", "wont", "cannot", "cant", "notreach", "notarrive", "lookat", "observe", "askabout", "talkabout", "fromafar", "pretend", "plan", "intend", "wantto"
        ];
        if (rejected.Any(compact.Contains)) return false;

        string[] arrivalActions =
        [
            "到達", "辿り着", "たどり着", "着いた", "着く", "前まで進", "場所まで進", "扉へ進", "扉に進", "扉へ向か", "扉に向か", "扉まで歩", "扉へ移動",
            "reach", "arrive", "proceedtothe", "gotothe", "walktothe", "movetothe", "traveltothe"
        ];
        return arrivalActions.Any(compact.Contains);
    }

    private static HashSet<string> Concepts(string normalized)
    {
        var concepts = new HashSet<string>(StringComparer.Ordinal);
        foreach (Match match in WordRegex().Matches(normalized))
        {
            var token = match.Value;
            if (token.Any(IsCjk) && token.Length > 4) continue;
            concepts.Add(SemanticAliases.TryGetValue(token, out var alias) ? alias : token);
        }

        foreach (var (phrase, alias) in SemanticAliases)
            if (normalized.Contains(phrase, StringComparison.Ordinal)) concepts.Add(alias);
        return concepts;
    }

    private static bool IsCjk(char character) =>
        character is >= '\u3040' and <= '\u30ff'
            or >= '\u3400' and <= '\u4dbf'
            or >= '\u4e00' and <= '\u9fff';

    private static string Normalize(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormKC).ToLowerInvariant();
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);
            builder.Append(category is UnicodeCategory.Control or UnicodeCategory.Format
                ? ' '
                : char.IsPunctuation(character) || char.IsSymbol(character) ? ' ' : character);
        }
        return WhitespaceRegex().Replace(builder.ToString(), " ").Trim();
    }

    private static string Compact(string value) => WhitespaceRegex().Replace(value, string.Empty);

    [GeneratedRegex(@"[\p{L}\p{N}]+", RegexOptions.CultureInvariant)]
    private static partial Regex WordRegex();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex WhitespaceRegex();
}
