using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public interface IActionRecommendationGenerator
{
    Task<NarrativeActionRecommendationResult> RecommendActionAsync(
        NarrativeActionRecommendationRequest request,
        CancellationToken cancellationToken);
}

public interface INarrativeGenerator
{
    Task<string> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken);
    Task<NarrativeDialogueResult> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken);
}
