using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Myriale.Api.Services;

public static partial class NarrativeSemanticGuard
{
    private static readonly IReadOnlyDictionary<string, string> SemanticAliases = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["fabricated"] = "invent",
        ["fabricate"] = "invent",
        ["invented"] = "invent",
        ["inventing"] = "invent",
        ["madeup"] = "invent",
        ["makeup"] = "invent",
        ["created"] = "invent",
        ["different"] = "another",
        ["additional"] = "another",
        ["new"] = "another",
        ["result"] = "outcome",
        ["results"] = "outcome",
        ["conclusion"] = "outcome",
        ["ending"] = "outcome",
        ["again"] = "again",
        ["reopened"] = "open",
        ["reopen"] = "open",
        ["opened"] = "open",
        ["復活した"] = "復活",
        ["蘇った"] = "復活",
        ["よみがえった"] = "復活",
        ["再び"] = "again",
        ["また"] = "again",
        ["もう一度"] = "again",
        ["門"] = "gate",
        ["扉"] = "gate",
        ["敵"] = "enemy",
        ["封印"] = "seal",
        ["開く"] = "open",
        ["開いた"] = "open",
        ["開かれた"] = "open",
        ["開放された"] = "open",
        ["消える"] = "disappear",
        ["消えた"] = "disappear",
        ["失われた"] = "disappear",
        ["なくなった"] = "disappear",
        ["突然"] = "理由なく",
        ["勝手に"] = "理由なく",
        ["ひとりでに"] = "理由なく",
    };

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
