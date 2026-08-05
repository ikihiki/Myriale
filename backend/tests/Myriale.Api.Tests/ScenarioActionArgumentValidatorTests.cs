using System.Text.Json;

namespace Myriale.Api.Tests;

public sealed class ScenarioActionArgumentValidatorTests
{
    private static readonly JsonElement Schema = Element("""
        {
          "type":"object",
          "additionalProperties":false,
          "required":["mode","target","steps"],
          "properties":{
            "mode":{"type":"string","enum":["quiet","loud"]},
            "target":{"type":"object","additionalProperties":false,"required":["code"],"properties":{"code":{"type":"string","minLength":2,"maxLength":8}}},
            "steps":{"type":"array","minItems":1,"maxItems":2,"items":{"type":"integer","minimum":1,"maximum":3}}
          }
        }
        """);

    [Fact]
    public void Validate_AcceptsArgumentsMatchingSelectedCandidateSchema() =>
        ScenarioActionArgumentValidator.Validate(Schema, Element("""{"mode":"quiet","target":{"code":"door"},"steps":[1,3]}"""));

    [Theory]
    [InlineData("{\"mode\":\"unknown\",\"target\":{\"code\":\"door\"},\"steps\":[1]}")]
    [InlineData("{\"mode\":\"quiet\",\"target\":{},\"steps\":[1]}")]
    [InlineData("{\"mode\":\"quiet\",\"target\":{\"code\":\"door\",\"extra\":true},\"steps\":[1]}")]
    [InlineData("{\"mode\":\"quiet\",\"target\":{\"code\":\"door\"},\"steps\":[0]}")]
    [InlineData("{\"mode\":\"quiet\",\"target\":{\"code\":\"door\"},\"steps\":[1,2,3]}")]
    [InlineData("{\"mode\":\"quiet\",\"target\":{\"code\":\"door\"},\"steps\":[1],\"extra\":true}")]
    public void Validate_RejectsSchemaViolations(string json)
    {
        var exception = Assert.Throws<ScenarioTurnValidationException>(() =>
            ScenarioActionArgumentValidator.Validate(Schema, Element(json)));

        Assert.Equal("invalid_action_arguments", exception.Code);
    }

    private static JsonElement Element(string json) => JsonSerializer.Deserialize<JsonElement>(json);
}
