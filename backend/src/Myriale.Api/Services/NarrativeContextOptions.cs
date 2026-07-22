namespace Myriale.Api.Services;

public sealed class NarrativeContextOptions
{
    public const string SectionName = "NarrativeContext";
    public int FinalProviderRequestTokenBudget { get; set; } = 16_384;
    public int RecentTurnsTokenBudget { get; set; } = 4096;
    public int MemoryTokenBudget { get; set; } = 2048;
    public int MaxLorebookEntries { get; set; } = 12;
    public int SummaryIntervalTurns { get; set; } = 10;
}
