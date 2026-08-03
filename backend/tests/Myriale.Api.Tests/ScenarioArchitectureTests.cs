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

        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);
        var scenarioRevision = db.Model.FindEntityType(typeof(Scenario))!.FindProperty(nameof(Scenario.Revision));
        var definitionRevision = db.Model.FindEntityType(typeof(ScenarioDefinitionVersion))!.FindProperty(nameof(ScenarioDefinitionVersion.Revision));
        Assert.True(scenarioRevision!.IsConcurrencyToken);
        Assert.True(definitionRevision!.IsConcurrencyToken);
    }
}
