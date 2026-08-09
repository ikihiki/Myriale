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
    Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionAsync(EntityStateTransitionRequest request, CancellationToken cancellationToken) =>
        throw new NotSupportedException("Entity state transition generation is not configured.");
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(AiProviderProfileId profileId, ModelActionDecisionRequest request, CancellationToken cancellationToken) =>
        DecideActionAsync(request, cancellationToken);
    Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionForProfileAsync(AiProviderProfileId profileId, EntityStateTransitionRequest request, CancellationToken cancellationToken) =>
        GenerateEntityStateTransitionAsync(request, cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(AiProviderProfileId profileId, PostStateNarrativeRequest request, CancellationToken cancellationToken) =>
        GeneratePostStateNarrativeAsync(request, cancellationToken);
    Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileWithOverridesAsync(
        AiProviderProfileId profileId, ModelActionDecisionRequest request, AiGenerationOverrides? generationOverrides, CancellationToken cancellationToken) =>
        DecideActionForProfileAsync(profileId, request, cancellationToken);
    Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionForProfileWithOverridesAsync(
        AiProviderProfileId profileId, EntityStateTransitionRequest request, AiGenerationOverrides? generationOverrides, CancellationToken cancellationToken) =>
        GenerateEntityStateTransitionForProfileAsync(profileId, request, cancellationToken);
    Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileWithOverridesAsync(
        AiProviderProfileId profileId, PostStateNarrativeRequest request, AiGenerationOverrides? generationOverrides, CancellationToken cancellationToken) =>
        GeneratePostStateNarrativeForProfileAsync(profileId, request, cancellationToken);
}

public interface INarrativeGenerator
{
    Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken);
    Task<NarrativeGeneration<string>> GenerateForProfileAsync(AiProviderProfileId profileId, NarrativeHandoffRequest request, CancellationToken cancellationToken) =>
        GenerateAsync(request, cancellationToken);
}
