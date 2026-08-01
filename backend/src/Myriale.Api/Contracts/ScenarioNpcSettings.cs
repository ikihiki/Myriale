using System.Text.Json;

namespace Myriale.Api.Contracts;

public sealed record ScenarioNpcSettings(
    string Code,
    string Name,
    string InitialLocationCode,
    string ProfileMarkdown);

public static class ScenarioNpcSettingsJson
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(IReadOnlyList<ScenarioNpcSettings>? npcs) =>
        JsonSerializer.Serialize(npcs ?? [], Options);

    public static IReadOnlyList<ScenarioNpcSettings> Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array) return [];
            return document.RootElement.EnumerateArray()
                .Where(element => element.ValueKind == JsonValueKind.Object)
                .Select(DeserializeNpc)
                .Where(npc => npc is not null)
                .Cast<ScenarioNpcSettings>()
                .ToList();
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static ScenarioNpcSettings? DeserializeNpc(JsonElement element)
    {
        var code = Read(element, "code");
        var name = Read(element, "name");
        var initialLocationCode = Read(element, "initialLocationCode");
        if (string.IsNullOrWhiteSpace(code) && string.IsNullOrWhiteSpace(name)) return null;

        var profile = Read(element, "profileMarkdown");
        if (string.IsNullOrWhiteSpace(profile)) profile = LegacyProfile(element);
        return new(code, name, initialLocationCode, profile);
    }

    private static string LegacyProfile(JsonElement element)
    {
        var sections = new (string Heading, string Content)[]
        {
            ("役割", Read(element, "role")),
            ("性格", Read(element, "personality")),
            ("行動・演技指針", Read(element, "behavior")),
            ("話し方", JoinVoice(Read(element, "firstPerson"), Read(element, "voice"))),
            ("公開知識", Read(element, "publicKnowledge")),
            ("秘密・条件付き知識", Read(element, "secrets")),
        };
        return string.Join("\n\n", sections
            .Where(section => !string.IsNullOrWhiteSpace(section.Content))
            .Select(section => $"## {section.Heading}\n\n{section.Content.Trim()}"));
    }

    private static string JoinVoice(string firstPerson, string voice) => string.Join("\n", new[]
    {
        string.IsNullOrWhiteSpace(firstPerson) ? string.Empty : $"- 一人称: {firstPerson.Trim()}",
        string.IsNullOrWhiteSpace(voice) ? string.Empty : $"- 口調: {voice.Trim()}",
    }.Where(value => value.Length > 0));

    private static string Read(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? string.Empty
            : string.Empty;
}
