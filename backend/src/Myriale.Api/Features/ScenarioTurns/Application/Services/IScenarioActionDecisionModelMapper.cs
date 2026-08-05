using System.Text.Json;
using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ScenarioTurns.Application.Services;

[CrossSliceContract]
public interface IScenarioActionDecisionModelMapper
{
    string SystemPrompt { get; }

    ModelActionDecisionRequest CreateRequest(string playerInput, RuleActionSnapshot snapshot);

    RuleActionDecisionResult MapResult(RuleActionSnapshot snapshot, ModelActionDecisionResult result);

    JsonElement CreateResponseSchema(ModelActionDecisionRequest request);
}
