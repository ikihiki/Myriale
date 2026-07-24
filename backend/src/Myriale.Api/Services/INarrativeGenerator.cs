using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public interface IActionRecommendationGenerator
{
    Task<NarrativeActionRecommendationResult> RecommendActionAsync(
        NarrativeActionRecommendationRequest request,
        CancellationToken cancellationToken);
}

public interface IScenarioTurnAi
{
    Task<NarrativeGeneration<RuleActionDecisionResult>> DecideActionAsync(RuleActionDecisionRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken);
}

public interface INarrativeGenerator
{
    Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken);
}
