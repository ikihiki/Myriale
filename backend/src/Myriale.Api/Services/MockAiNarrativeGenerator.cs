using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class MockAiNarrativeGenerator(IHttpClientFactory httpClientFactory)
    : INarrativeGenerator, IActionRecommendationGenerator
{
    private static readonly JsonSerializerOptions StrictDialogueResultJsonOptions = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<NarrativeActionRecommendationResult> RecommendActionAsync(
        NarrativeActionRecommendationRequest request,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("MockAi");
        using var response = await client.PostAsJsonAsync("/mock-ai/action-recommendation", request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new NarrativeGenerationException("Action recommendation provider returned an error.");
        var result = await response.Content.ReadFromJsonAsync<NarrativeActionRecommendationResult>(cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(result?.Suggestion) || result.Suggestion.Length > 500)
            throw new NarrativeGenerationException("Action recommendation provider returned an invalid response.");
        return result with { Suggestion = result.Suggestion.Trim() };
    }

    public async Task<NarrativeDialogueResult> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("MockAi");
        using var response = await client.PostAsJsonAsync("/mock-ai/narrative-dialogue", request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new NarrativeGenerationException("Narrative provider returned an error.");
        var result = await response.Content.ReadFromJsonAsync<NarrativeDialogueResult>(StrictDialogueResultJsonOptions, cancellationToken);
        if (result is null
            || !string.Equals(request.SchemaVersion, NarrativeDialogueSchema.Version, StringComparison.Ordinal)
            || !string.Equals(result.SchemaVersion, NarrativeDialogueSchema.Version, StringComparison.Ordinal)
            || !NarrativeDialogueSchema.TurnTypes.Contains(result.TurnType)
            || string.IsNullOrWhiteSpace(result.Heading)
            || result.Heading.Length > 120
            || string.IsNullOrWhiteSpace(result.Body)
            || result.Body.Length > 20_000
            || result.Signals is null
            || (result.TurnType == "clarification" && result.Signals.Count > 0)
            || (request.IncludeInterpretation && string.IsNullOrWhiteSpace(result.Interpretation))
            || result.Interpretation?.Length > 500)
            throw new NarrativeGenerationException("Narrative provider returned an invalid response.");
        return result with
        {
            Heading = result.Heading.Trim(),
            Body = result.Body.Trim(),
            Interpretation = request.IncludeInterpretation ? result.Interpretation?.Trim() : null,
        };
    }

    public async Task<string> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("MockAi");
        using var response = await client.PostAsJsonAsync("/mock-ai/narrative-handoff", request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new NarrativeGenerationException("Narrative provider returned an error.");
        var body = await response.Content.ReadFromJsonAsync<NarrativeHandoffResponse>(cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(body?.Body) || body.Body.Length > 20_000)
            throw new NarrativeGenerationException("Narrative provider returned an invalid response.");
        return body.Body.Trim();
    }
}

public sealed class NarrativeGenerationException(string message, Exception? innerException = null) : Exception(message, innerException);
