
namespace Myriale.Api.Tests;

public sealed class ScenarioDomainTests
{
    [Fact]
    public void HeroMode_RejectsUnknownWireValue()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ScenarioEnumValues.ParseHeroMode("sometimes"));
        Assert.Equal("select", HeroMode.Select.ToWireValue());
        Assert.True(Enum.IsDefined(HeroMode.Select));
    }

    [Fact]
    public void EntityProfilePersistenceFields_DefaultToEmptyJson()
    {
        var type = new ScenarioObjectType();
        var entity = new ScenarioObject();

        Assert.Equal("{}", type.ProfileSchemaJson);
        Assert.Equal("{}", type.ProfileDefaultsJson);
        Assert.Equal("{}", entity.LocalProfileSchemaJson);
        Assert.Equal("{}", entity.LocalProfileDefaultsJson);
        Assert.Equal("{}", entity.ProfileValuesJson);
        Assert.Equal(string.Empty, entity.ProfileMarkdown);
    }

    [Fact]
    public void PublishingDefinition_RecordsTypedDomainEvent()
    {
        var now = DateTimeOffset.UtcNow;
        var definition = ScenarioDefinitionVersion.CreateDraft(new ScenarioDefinitionVersionId("definition"), new ScenarioId("scenario"), 3, now);
        Assert.Equal(3, definition.SchemaVersion);

        definition.Publish(now);

        var published = Assert.IsType<Myriale.Api.Features.Scenarios.Domain.ScenarioDefinitionPublished>(Assert.Single(definition.DomainEvents));
        Assert.Equal(("scenario", "definition", 3), (published.ScenarioId.AsPrimitive(), published.DefinitionVersionId.AsPrimitive(), published.Version));
        Assert.Single(definition.DequeueDomainEvents());
        Assert.Empty(definition.DomainEvents);
    }

    [Fact]
    public void TypedRuleJsonCodec_RejectsWrongShapesAndRoundTripsConditions()
    {
        var codec = new Myriale.Api.Features.Scenarios.Domain.ScenarioRuleJsonCodec();
        var condition = codec.DecodeCondition("{\"op\":\"exists\",\"path\":\"state.open\"}");

        Assert.Contains("state.open", codec.Encode(condition));
        Assert.Throws<System.Text.Json.JsonException>(() => codec.DecodeEffects("{}"));
    }

    [Fact]
    public void PublishedDefinition_IsImmutable()
    {
        var definition = new ScenarioDefinitionVersion
        {
            Id = new ScenarioDefinitionVersionId("definition"),
            ScenarioId = new ScenarioId("scenario"),
            Version = 1,
            Status = DefinitionStatus.Draft,
            ScenarioTitle = new ScenarioTitle("Title"),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        definition.Publish(DateTimeOffset.UtcNow);

        Assert.Throws<InvalidOperationException>(() => definition.SnapshotScenario(Scenario.Create(
            new ScenarioId("scenario"), new AccountId("author"), new ScenarioTitle("Changed"), DateTimeOffset.UtcNow)));
    }

    [Fact]
    public void DefinitionSnapshot_PinsNarrativeGuidance()
    {
        var now = DateTimeOffset.UtcNow;
        var scenario = Scenario.Create(new ScenarioId("scenario"), new AccountId("author"), new ScenarioTitle("Original"), now);
        scenario.Edit(new ScenarioTitle("Original"), "summary", "genre", "tone", "original lore", "original guidance",
            HeroMode.Free, false, "hero", "original opening", new IllustrationPrompt("style"), new IllustrationPrompt("mood"),
            new IllustrationPrompt("negative"), "scene", now);
        var definition = new ScenarioDefinitionVersion
        {
            Id = new ScenarioDefinitionVersionId("definition"),
            ScenarioId = scenario.Id,
            Version = 1,
            Status = DefinitionStatus.Draft,
            ScenarioTitle = scenario.Title,
            CreatedAt = now,
            UpdatedAt = now,
        };
        definition.SnapshotScenario(scenario);

        scenario.Edit(new ScenarioTitle("Changed"), "changed", "changed", "changed", "changed lore", "changed guidance",
            HeroMode.Fixed, false, "changed hero", "changed opening", new IllustrationPrompt("changed"), new IllustrationPrompt("changed"),
            new IllustrationPrompt("changed"), "changed", now.AddMinutes(1));

        Assert.Equal("Original", definition.ScenarioTitle.Value);
        Assert.Equal("original lore", definition.ScenarioLore);
        Assert.Equal("original guidance", definition.ScenarioAiFreedom);
        Assert.Equal("original opening", definition.ScenarioOpening);
    }
}
