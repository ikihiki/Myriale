using Myriale.Api.Features.Scenarios.Application;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Tests;

public sealed class ScenarioProfileConfigurationResolverTests
{
    [Fact]
    public void Resolve_ComposesOrderedMixinsLocalDefaultsAndEntityValues()
    {
        var first = Type("described", """
            {"type":"object","additionalProperties":false,"properties":{
              "role":{"type":"string","label":"Role","minLength":2},
              "active":{"type":"boolean"}},"required":["role"]}
            """, "{\"role\":\"watcher\",\"active\":false}");
        var second = Type("specialized", """
            {"type":"object","additionalProperties":false,"properties":{
              "role":{"type":"string","label":"Specialized role","description":"Later presentation wins","minLength":2},
              "level":{"type":"number","minimum":0}},"required":[]}
            """, "{\"role\":\"guide\",\"level\":1}");
        var item = new ScenarioObject
        {
            MixinTypeCodesJson = "[\"described\",\"specialized\"]",
            LocalProfileSchemaJson = """
                {"type":"object","additionalProperties":false,"properties":{"enabled":{"type":"boolean"}},"required":["enabled"]}
                """,
            LocalProfileDefaultsJson = "{\"enabled\":true}",
            ProfileValuesJson = "{\"role\":\"keeper\",\"level\":3}",
        };

        var resolved = new ScenarioProfileConfigurationResolver().Resolve(
            new ScenarioDefinitionVersion { ObjectTypes = [first, second] }, item);

        Assert.Empty(resolved.Conflicts);
        Assert.Equal("guide", resolved.Defaults["role"]!.GetValue<string>());
        Assert.Equal("keeper", resolved.EffectiveValues["role"]!.GetValue<string>());
        Assert.Equal(3, resolved.EffectiveValues["level"]!.GetValue<int>());
        Assert.True(resolved.EffectiveValues["enabled"]!.GetValue<bool>());
        Assert.Equal("entity", resolved.EffectiveValueSources["role"]);
        var role = Assert.Single(resolved.Fields, field => field.Code == "role");
        Assert.True(role.Required);
        Assert.Equal(["described", "specialized"], role.Sources);
        Assert.Equal("Specialized role", role.Schema["label"]!.GetValue<string>());
    }

    [Fact]
    public void Resolve_ReportsIncompatibleScalarContracts()
    {
        var first = Type("one", """
            {"type":"object","additionalProperties":false,"properties":{"value":{"type":"string"}},"required":[]}
            """, "{}");
        var second = Type("two", """
            {"type":"object","additionalProperties":false,"properties":{"value":{"type":"number"}},"required":[]}
            """, "{}");
        var item = new ScenarioObject { MixinTypeCodesJson = "[\"one\",\"two\"]" };

        var resolved = new ScenarioProfileConfigurationResolver().Resolve(
            new ScenarioDefinitionVersion { ObjectTypes = [first, second] }, item);

        Assert.Contains(resolved.Conflicts, conflict => conflict.Contains("profile field 'value'"));
    }

    private static ScenarioObjectType Type(string code, string schema, string defaults) => new()
    {
        Id = new ScenarioObjectTypeId($"type-{code}"),
        Code = code,
        ProfileSchemaJson = schema,
        ProfileDefaultsJson = defaults,
    };
}
