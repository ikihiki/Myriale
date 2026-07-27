using System.Text.Json;

namespace Myriale.Api.Contracts;

public sealed record ScenarioNpcSettings(
    string Code,
    string Name,
    string Role,
    string InitialLocationCode,
    string Personality,
    string Behavior,
    string Voice,
    string FirstPerson,
    string PublicKnowledge,
    string Secrets);

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
            return JsonSerializer.Deserialize<List<ScenarioNpcSettings>>(json, Options) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
