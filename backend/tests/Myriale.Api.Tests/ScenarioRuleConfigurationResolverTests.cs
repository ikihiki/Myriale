using System.Text.Json;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Domain.Scenarios;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class ScenarioRuleConfigurationResolverTests
{
    [Fact]
    public void Resolve_ComposesOrderedMixinsThenObjectLocalConfiguration()
    {
        var first = Type("openable", "{\"open\":false}", "{\"include\":[\"open\"]}", Action("open", "開ける"));
        var second = Type("exit", "{\"destination\":\"outside\"}", "{\"include\":[\"destination\"]}", Action("leave", "出る"));
        var item = new ScenarioObject
        {
            Id = "object-1",
            MixinTypeCodesJson = "[\"openable\",\"exit\"]",
            LocalStateSchemaJson = "{\"type\":\"object\",\"properties\":{\"direction\":{\"type\":\"string\"}}}",
            LocalDefaultStateJson = "{\"direction\":\"west\"}", LocalPublicProjectionJson = "{\"include\":[\"direction\"]}",
            LocalActionsJson = JsonSerializer.Serialize(new[] { InputAction("inspect", "調べる") }), InitialStateOverrideJson = "{\"open\":true}"
        };
        var definition = new ScenarioDefinitionVersion { ObjectTypes = [first, second], Objects = [item] };

        var resolver = new ScenarioRuleConfigurationResolver();
        var resolved = resolver.Resolve(definition, item);
        var initial = resolver.InitialState(definition, item);

        Assert.Empty(resolved.Conflicts);
        Assert.Equal(["openable", "exit"], resolved.Mixins.Select(type => type.Code));
        Assert.Equal(["inspect", "leave", "open"], resolved.Actions.Select(action => action.Code));
        Assert.True(initial["open"]!.GetValue<bool>());
        Assert.Equal("outside", initial["destination"]!.GetValue<string>());
        Assert.Equal("west", initial["direction"]!.GetValue<string>());
        Assert.Contains("direction", resolved.PublicFields);
    }

    [Fact]
    public void Resolve_ReportsIncompatibleContractsInsteadOfOverriding()
    {
        var first = Type("one", "{\"value\":false}", "{}", Action("use", "使う"));
        var second = Type("two", "{\"value\":\"no\"}", "{}", Action("use", "別の使い方"));
        first.StateSchemaJson = "{\"type\":\"object\",\"properties\":{\"value\":{\"type\":\"boolean\"}}}";
        second.StateSchemaJson = "{\"type\":\"object\",\"properties\":{\"value\":{\"type\":\"string\"}}}";
        var item = new ScenarioObject { Id = "object-1", MixinTypeCodesJson = "[\"one\",\"two\"]" };
        var resolved = new ScenarioRuleConfigurationResolver().Resolve(new ScenarioDefinitionVersion { ObjectTypes = [first, second], Objects = [item] }, item);
        Assert.Contains(resolved.Conflicts, conflict => conflict.Contains("state 'value'"));
        Assert.Contains(resolved.Conflicts, conflict => conflict.Contains("action 'use'"));
    }

    [Fact]
    public void Resolve_AppliesOneGenericRuleToEveryObjectOfTheType()
    {
        var type = Type("door", "{\"open\":false}", "{}", Action("open", "Open"));
        type.GenericActionRulesJson = "[{\"code\":\"open-default\",\"actionCode\":\"open\",\"condition\":{},\"priority\":10,\"authoringNote\":\"generic\",\"effects\":[{\"type\":\"emit-fact\",\"text\":\"generic\"}],\"moduleBinding\":null}]";
        var first = new ScenarioObject { Id = "first", MixinTypeCodesJson = "[\"door\"]" };
        var second = new ScenarioObject { Id = "second", MixinTypeCodesJson = "[\"door\"]" };
        var definition = new ScenarioDefinitionVersion { ObjectTypes = [type], Objects = [first, second] };
        var resolver = new ScenarioRuleConfigurationResolver();

        var firstRule = Assert.Single(resolver.Resolve(definition, first).Rules);
        var secondRule = Assert.Single(resolver.Resolve(definition, second).Rules);

        Assert.Equal("open-default", firstRule.RuleCode);
        Assert.Equal(firstRule.Id, secondRule.Id);
        Assert.Equal(firstRule.EffectsJson, secondRule.EffectsJson);
    }

    [Fact]
    public void Resolve_ObjectMutationsReplaceSuppressAndPatchWithoutLeakingToAnotherObject()
    {
        var type = Type("door", "{\"open\":false}", "{}", Action("open", "Open"));
        type.GenericActionRulesJson = """
            [
              {"code":"override-me","actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":10,"authoringNote":"generic override","effects":[{"type":"emit-fact","text":"generic override"}],"moduleBinding":null},
              {"code":"delete-me","actionCode":"open","condition":{},"priority":20,"authoringNote":"generic delete","effects":[{"type":"emit-fact","text":"generic delete"}],"moduleBinding":null},
              {"code":"adjust-me","actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":30,"authoringNote":"generic adjust","effects":[{"type":"emit-fact","text":"generic adjust"}],"moduleBinding":{"moduleId":"example.module","version":"1.0.0","digest":"sha256:test","configuration":{}}}
            ]
            """;
        var customized = new ScenarioObject
        {
            Id = "customized", MixinTypeCodesJson = "[\"door\"]",
            ActionRuleMutationsJson = """
              [
                {"operation":"override","targetTypeCode":"door","targetRuleCode":"override-me","actionCode":"open","condition":{},"priority":110,"authoringNote":"object override","effects":[{"type":"emit-fact","text":"object override"}],"moduleBinding":null},
                {"operation":"delete","targetTypeCode":"door","targetRuleCode":"delete-me"},
                {"operation":"adjust","targetTypeCode":"door","targetRuleCode":"adjust-me","priority":130,"authoringNote":null,"moduleBinding":null},
                {"operation":"add","code":"object-add","actionCode":"open","condition":{},"priority":140,"authoringNote":"object add","effects":[{"type":"emit-fact","text":"object add"}],"moduleBinding":null}
              ]
              """
        };
        var untouched = new ScenarioObject { Id = "untouched", MixinTypeCodesJson = "[\"door\"]" };
        var definition = new ScenarioDefinitionVersion { ObjectTypes = [type], Objects = [customized, untouched] };
        var resolver = new ScenarioRuleConfigurationResolver();

        var customizedRules = resolver.Resolve(definition, customized).Rules.ToDictionary(rule => rule.RuleCode);
        var untouchedRules = resolver.Resolve(definition, untouched).Rules.ToDictionary(rule => rule.RuleCode);

        Assert.Equal("object override", customizedRules["override-me"].AuthoringNote);
        Assert.Contains("object override", customizedRules["override-me"].EffectsJson);
        Assert.DoesNotContain("delete-me", customizedRules);
        Assert.Equal(130, customizedRules["adjust-me"].Priority);
        Assert.Null(customizedRules["adjust-me"].AuthoringNote);
        Assert.Contains("state.open", customizedRules["adjust-me"].ConditionJson);
        Assert.Contains("generic adjust", customizedRules["adjust-me"].EffectsJson);
        Assert.Null(customizedRules["adjust-me"].ModuleId);
        Assert.Equal(1, customizedRules["object-add"].SourceRank);

        Assert.Equal(3, untouchedRules.Count);
        Assert.Equal("generic override", untouchedRules["override-me"].AuthoringNote);
        Assert.Contains("delete-me", untouchedRules);
        Assert.Equal(30, untouchedRules["adjust-me"].Priority);
        Assert.Equal("generic adjust", untouchedRules["adjust-me"].AuthoringNote);
    }

    private static ScenarioObjectType Type(string code, string defaults, string projection, ScenarioObjectTypeAction action) => new()
    {
        Id = $"type-{code}", Code = code,
        StateSchemaJson = defaults.Contains("false") ? "{\"type\":\"object\",\"properties\":{\"open\":{\"type\":\"boolean\"}}}" :
            defaults.Contains("destination") ? "{\"type\":\"object\",\"properties\":{\"destination\":{\"type\":\"string\"}}}" :
            "{\"type\":\"object\",\"properties\":{\"value\":{\"type\":\"boolean\"}}}",
        DefaultStateJson = defaults, PublicProjectionJson = projection, Actions = [action]
    };
    private static ScenarioObjectTypeAction Action(string code, string label) => new() { Id = $"action-{code}-{label}", Code = code, Label = label, ArgumentSchemaJson = "{}", AvailabilityConditionJson = "{}" };
    private static ScenarioObjectTypeActionInput InputAction(string code, string label) => new(code, label, "", Element("{}"), ConditionExpression.Empty, "ai-choice", "rule");
    private static JsonElement Element(string json) => JsonDocument.Parse(json).RootElement.Clone();
}
