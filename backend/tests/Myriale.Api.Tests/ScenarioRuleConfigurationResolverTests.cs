using System.Text.Json;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
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
            Id = "object-1", ObjectTypeId = first.Id, ObjectType = first,
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
        var item = new ScenarioObject { Id = "object-1", ObjectTypeId = first.Id, ObjectType = first, MixinTypeCodesJson = "[\"one\",\"two\"]" };
        var resolved = new ScenarioRuleConfigurationResolver().Resolve(new ScenarioDefinitionVersion { ObjectTypes = [first, second], Objects = [item] }, item);
        Assert.Contains(resolved.Conflicts, conflict => conflict.Contains("state 'value'"));
        Assert.Contains(resolved.Conflicts, conflict => conflict.Contains("action 'use'"));
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
    private static ScenarioObjectTypeActionInput InputAction(string code, string label) => new(code, label, "", Element("{}"), Element("{}"), "ai-choice", "rule");
    private static JsonElement Element(string json) => JsonDocument.Parse(json).RootElement.Clone();
}
