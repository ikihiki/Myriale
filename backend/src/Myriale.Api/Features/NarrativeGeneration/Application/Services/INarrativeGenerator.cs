using Myriale.Api.Architecture;

namespace Myriale.Api.Features.NarrativeGeneration.Application.Services;

public interface IActionRecommendationGenerator
{
    Task<NarrativeActionRecommendationResult> RecommendActionAsync(
        NarrativeActionRecommendationRequest request,
        CancellationToken cancellationToken);
}

[CrossSliceContract]
public interface IScenarioTurnAiService
{
    Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(AiProviderProfileId profileId, ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionAsync(request, cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(AiProviderProfileId profileId, PostStateNarrativeRequest request, CancellationToken cancellationToken) =>
        GeneratePostStateNarrativeAsync(request, cancellationToken);
}

public interface INarrativeGenerator
{
    Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<string>> GenerateForProfileAsync(AiProviderProfileId profileId, NarrativeHandoffRequest request, CancellationToken cancellationToken) =>
        GenerateAsync(request, cancellationToken);
}
