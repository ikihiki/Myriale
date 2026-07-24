namespace Myriale.Api.Services;

public sealed class NarrativeContextOptions
{
    public const string SectionName = "NarrativeContext";
    public int RecentTurnsTokenBudget { get; set; } = 4096;
}
