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
    Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(string profileId, ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionAsync(request, cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(string profileId, PostStateNarrativeRequest request, CancellationToken cancellationToken) =>
        GeneratePostStateNarrativeAsync(request, cancellationToken);
}

public interface INarrativeGenerator
{
    Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<string>> GenerateForProfileAsync(string profileId, NarrativeHandoffRequest request, CancellationToken cancellationToken) =>
        GenerateAsync(request, cancellationToken);
}
