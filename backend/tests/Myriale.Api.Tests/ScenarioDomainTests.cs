using Myriale.Api.Data;

namespace Myriale.Api.Tests;

public sealed class ScenarioDomainTests
{
    [Fact]
    public void HeroPolicy_RejectsUnknownWireValue()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new HeroPolicy("sometimes"));
        Assert.Equal("select", HeroPolicy.Select.Value);
    }

    [Fact]
    public void PublishedDefinition_IsImmutable()
    {
        var definition = new ScenarioDefinitionVersion
        {
            Id = "definition", ScenarioId = "scenario", Version = 1, Status = DefinitionStatus.Draft,
            ScenarioTitle = new ScenarioTitle("Title"), CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
        };
        definition.Publish(DateTimeOffset.UtcNow);

        Assert.Throws<InvalidOperationException>(() => definition.SnapshotScenario(Scenario.Create(
            "scenario", "author", new ScenarioTitle("Changed"), DateTimeOffset.UtcNow)));
    }

    [Fact]
    public void DefinitionSnapshot_PinsNarrativeGuidance()
    {
        var now = DateTimeOffset.UtcNow;
        var scenario = Scenario.Create("scenario", "author", new ScenarioTitle("Original"), now);
        scenario.Edit(new ScenarioTitle("Original"), "summary", "genre", "tone", "original lore", "original guidance",
            HeroPolicy.Free, false, "hero", "original opening", new IllustrationPrompt("style"), new IllustrationPrompt("mood"),
            new IllustrationPrompt("negative"), "scene", now);
        var definition = new ScenarioDefinitionVersion
        {
            Id = "definition", ScenarioId = scenario.Id, Version = 1, Status = DefinitionStatus.Draft,
            ScenarioTitle = scenario.Title, CreatedAt = now, UpdatedAt = now,
        };
        definition.SnapshotScenario(scenario);

        scenario.Edit(new ScenarioTitle("Changed"), "changed", "changed", "changed", "changed lore", "changed guidance",
            HeroPolicy.Fixed, false, "changed hero", "changed opening", new IllustrationPrompt("changed"), new IllustrationPrompt("changed"),
            new IllustrationPrompt("changed"), "changed", now.AddMinutes(1));

        Assert.Equal("Original", definition.ScenarioTitle.Value);
        Assert.Equal("original lore", definition.ScenarioLore);
        Assert.Equal("original guidance", definition.ScenarioAiFreedom);
        Assert.Equal("original opening", definition.ScenarioOpening);
    }
}
