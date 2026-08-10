namespace Myriale.Api.Tests;

public sealed class ScenarioNarrativeGenerationServiceTests
{
    [Fact]
    public void Validate_RejectsNarrativeThatDuplicatesARecentTurn()
    {
        var result = new PostStateNarrativeResult(
            ScenarioTurnSchemas.PostStateNarrative,
            "雨宿り",
            "雨音の中、クララは紅茶を差し出した。");
        var recentTurns = new[]
        {
            new NarrativeRecentTurnInput(
                "雨宿りをお願いする。",
                "雨音の中、クララは\n紅茶を差し出した。"),
        };

        var exception = Assert.Throws<ScenarioTurnValidationException>(() =>
            ScenarioNarrativeGenerationService.Validate(result, [], recentTurns));

        Assert.Equal("duplicate_narrative", exception.Code);
    }

    [Fact]
    public void Validate_AllowsNarrativeThatContinuesARecentTurn()
    {
        var result = new PostStateNarrativeResult(
            ScenarioTurnSchemas.PostStateNarrative,
            "雨宿り",
            "クララは客人の問いかけに頷き、暖炉のそばの椅子を勧めた。");
        var recentTurns = new[]
        {
            new NarrativeRecentTurnInput(
                "雨宿りをお願いする。",
                "雨音の中、クララは紅茶を差し出した。"),
        };

        ScenarioNarrativeGenerationService.Validate(result, [], recentTurns);
    }
}
