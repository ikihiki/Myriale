using System.Text.Json;
using System.Text.Json.Nodes;
using Myriale.Api.Services;
using Myriale.Api.Domain.Scenarios;

namespace Myriale.Api.Tests;

public sealed class ScenarioRuleEvaluatorTests
{
    private readonly ScenarioRuleEvaluator _evaluator = new();
    private readonly JsonObject _state = JsonNode.Parse("""{"open":false,"count":3,"name":"door","nested":{"value":7}}""")!.AsObject();
    private readonly IReadOnlyDictionary<string, bool> _flags = new Dictionary<string, bool> { ["enabled"] = true, ["blocked"] = false };
    private readonly JsonElement _arguments = JsonSerializer.SerializeToElement(new { amount = 4, mode = "quiet" });

    [Theory]
    [InlineData("{}", true)]
    [InlineData("{\"op\":\"eq\",\"path\":\"state.open\",\"value\":false}", true)]
    [InlineData("{\"op\":\"ne\",\"path\":\"state.name\",\"value\":\"other\"}", true)]
    [InlineData("{\"op\":\"lt\",\"path\":\"state.count\",\"value\":4}", true)]
    [InlineData("{\"op\":\"lte\",\"path\":\"state.count\",\"value\":3}", true)]
    [InlineData("{\"op\":\"gt\",\"path\":\"arguments.amount\",\"value\":3}", true)]
    [InlineData("{\"op\":\"gte\",\"path\":\"state.nested.value\",\"value\":7}", true)]
    [InlineData("{\"op\":\"in\",\"path\":\"arguments.mode\",\"value\":[\"loud\",\"quiet\"]}", true)]
    [InlineData("{\"op\":\"exists\",\"path\":\"session.flags.enabled\"}", true)]
    [InlineData("{\"and\":[{\"op\":\"eq\",\"path\":\"session.flags.enabled\",\"value\":true},{\"not\":{\"op\":\"eq\",\"path\":\"session.flags.blocked\",\"value\":true}}]}", true)]
    [InlineData("{\"or\":[{\"op\":\"eq\",\"path\":\"state.count\",\"value\":99},{\"op\":\"eq\",\"path\":\"state.count\",\"value\":3}]}", true)]
    public void Evaluate_SupportsCanonicalRecursiveConditions(string condition, bool expected)
    {
        Assert.Equal(expected, Evaluate(condition));
    }

    [Theory]
    [InlineData("not-json")]
    [InlineData("[]")]
    [InlineData("{\"op\":\"unknown\",\"path\":\"state.open\",\"value\":false}")]
    [InlineData("{\"op\":\"lt\",\"path\":\"state.name\",\"value\":4}")]
    [InlineData("{\"op\":\"lt\",\"path\":\"state.count\",\"value\":\"4\"}")]
    [InlineData("{\"and\":{}}")]
    [InlineData("{\"not\":{\"op\":\"unknown\",\"path\":\"state.open\",\"value\":false}}")]
    [InlineData("{\"op\":\"eq\",\"path\":\"unknown.value\",\"value\":1}")]
    [InlineData("{\"op\":\"eq\",\"path\":\"state.missing\",\"value\":null}")]
    public void Evaluate_MalformedOrUnresolvableConditionsFailClosed(string condition)
    {
        Assert.False(Evaluate(condition));
    }

    [Fact]
    public void Evaluate_MissingSessionFlagExistsIsFalse()
    {
        Assert.False(Evaluate("{\"op\":\"exists\",\"path\":\"session.flags.missing\"}"));
    }

    private bool Evaluate(string condition)
    {
        try { return _evaluator.Evaluate(ConditionExpression.FromJson(condition), _state, _flags, _arguments); }
        catch (JsonException) { return false; }
    }
}
