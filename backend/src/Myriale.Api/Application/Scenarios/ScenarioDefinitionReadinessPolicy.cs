using Myriale.Api.Data;

namespace Myriale.Api.Application.Scenarios;

public sealed record ScenarioDefinitionReadiness(bool IsReady, IReadOnlyDictionary<string, string[]> Errors);

public sealed class ScenarioDefinitionReadinessPolicy(ScenarioDefinitionValidator validator, ScenarioDefinitionMapper mapper)
{
    public ScenarioDefinitionReadiness Evaluate(ScenarioDefinitionVersion definition)
    {
        var errors = validator.Validate(mapper.ToRequest(definition), true);
        return new(errors.Count == 0, errors);
    }
}
