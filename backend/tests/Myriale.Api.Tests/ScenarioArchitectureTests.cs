using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;

namespace Myriale.Api.Tests;

public sealed class ScenarioArchitectureTests
{
    [Fact]
    public void ScenarioEndpointHandlers_DoNotDependOnApplicationDbContext()
    {
        var handlers = typeof(ScenarioEndpoints).GetMethods(BindingFlags.Static | BindingFlags.NonPublic);
        Assert.NotEmpty(handlers);
        Assert.DoesNotContain(handlers.SelectMany(method => method.GetParameters()), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
    }

    [Fact]
    public void AggregateLifecycleAndConcurrencyProperties_AreNotPubliclySettable()
    {
        Assert.False(typeof(Scenario).GetProperty(nameof(Scenario.Status))!.SetMethod!.IsPublic);
        Assert.False(typeof(Scenario).GetProperty(nameof(Scenario.AuthorId))!.SetMethod!.IsPublic);
        Assert.False(typeof(ScenarioDefinitionVersion).GetProperty(nameof(ScenarioDefinitionVersion.Status))!.SetMethod!.IsPublic);
        Assert.False(typeof(ScenarioDefinitionVersion).GetProperty(nameof(ScenarioDefinitionVersion.Version))!.SetMethod!.IsPublic);

        foreach (var propertyName in new[]
                 {
                     nameof(Scenario.Title), nameof(Scenario.Summary), nameof(Scenario.Genre), nameof(Scenario.Tone),
                     nameof(Scenario.Lore), nameof(Scenario.AiFreedom), nameof(Scenario.HeroMode),
                     nameof(Scenario.HeroFreeGenerationAllowed), nameof(Scenario.Hero), nameof(Scenario.Opening),
                     nameof(Scenario.IllustrationStyle), nameof(Scenario.IllustrationMood), nameof(Scenario.IllustrationNegative),
                     nameof(Scenario.SampleScene),
                 })
            Assert.False(typeof(Scenario).GetProperty(propertyName)!.SetMethod!.IsPublic, propertyName);

        foreach (var propertyName in new[]
                 {
                     nameof(ScenarioDefinitionVersion.ScenarioTitle), nameof(ScenarioDefinitionVersion.ScenarioSummary),
                     nameof(ScenarioDefinitionVersion.ScenarioGenre), nameof(ScenarioDefinitionVersion.ScenarioTone),
                     nameof(ScenarioDefinitionVersion.ScenarioLore), nameof(ScenarioDefinitionVersion.ScenarioAiFreedom),
                     nameof(ScenarioDefinitionVersion.ScenarioHeroMode), nameof(ScenarioDefinitionVersion.ScenarioHeroFreeGenerationAllowed),
                     nameof(ScenarioDefinitionVersion.ScenarioHero), nameof(ScenarioDefinitionVersion.ScenarioOpening),
                     nameof(ScenarioDefinitionVersion.ScenarioIllustrationStyle), nameof(ScenarioDefinitionVersion.ScenarioIllustrationMood),
                     nameof(ScenarioDefinitionVersion.ScenarioIllustrationNegative), nameof(ScenarioDefinitionVersion.ScenarioSampleScene),
                 })
            Assert.False(typeof(ScenarioDefinitionVersion).GetProperty(propertyName)!.SetMethod!.IsPublic, propertyName);

        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);
        var scenarioRevision = db.Model.FindEntityType(typeof(Scenario))!.FindProperty(nameof(Scenario.Revision));
        var definitionRevision = db.Model.FindEntityType(typeof(ScenarioDefinitionVersion))!.FindProperty(nameof(ScenarioDefinitionVersion.Revision));
        Assert.True(scenarioRevision!.IsConcurrencyToken);
        Assert.True(definitionRevision!.IsConcurrencyToken);
    }
}
