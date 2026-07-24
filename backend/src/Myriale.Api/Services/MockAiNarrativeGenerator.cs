using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class MockAiNarrativeGenerator(IHttpClientFactory httpClientFactory)
    : INarrativeGenerator, IActionRecommendationGenerator, IScenarioTurnAi
{
    private static readonly JsonSerializerOptions StrictDialogueResultJsonOptions = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<NarrativeGeneration<RuleActionDecisionResult>> DecideActionAsync(RuleActionDecisionRequest request, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("MockAi");
        using var response = await client.PostAsJsonAsync("/mock-ai/rule-action-decision", request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new NarrativeGenerationException("Action decision provider returned an error.");
        var result = await response.Content.ReadFromJsonAsync<RuleActionDecisionResult>(StrictDialogueResultJsonOptions, cancellationToken)
            ?? throw new NarrativeGenerationException("Action decision provider returned an invalid response.");
        return new(result, MockMetadata(), JsonSerializer.Serialize(request), JsonSerializer.Serialize(result));
    }

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("MockAi");
        using var response = await client.PostAsJsonAsync("/mock-ai/post-state-narrative", request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new NarrativeGenerationException("Post-state narrative provider returned an error.");
        var result = await response.Content.ReadFromJsonAsync<PostStateNarrativeResult>(StrictDialogueResultJsonOptions, cancellationToken)
            ?? throw new NarrativeGenerationException("Post-state narrative provider returned an invalid response.");
        return new(result, MockMetadata(), JsonSerializer.Serialize(request), JsonSerializer.Serialize(result));
    }

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

    public async Task<NarrativeGeneration<NarrativeDialogueResult>> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken)
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
            || result.Interpretation?.Length > 200
            || result.Interpretation?.Contains('\n') == true
            || result.Interpretation?.Contains('\r') == true)
            throw new NarrativeGenerationException("Narrative provider returned an invalid response.");
        var normalized = result with
        {
            Heading = result.Heading.Trim(),
            Body = result.Body.Trim(),
            Interpretation = request.IncludeInterpretation ? result.Interpretation?.Trim() : null,
        };
        return new(
            normalized,
            MockMetadata(),
            JsonSerializer.Serialize(request),
            JsonSerializer.Serialize(normalized));
    }

    public async Task<NarrativeGeneration<string>> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient("MockAi");
        using var response = await client.PostAsJsonAsync("/mock-ai/narrative-handoff", request, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new NarrativeGenerationException("Narrative provider returned an error.");
        var body = await response.Content.ReadFromJsonAsync<NarrativeHandoffResponse>(cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(body?.Body) || body.Body.Length > 20_000)
            throw new NarrativeGenerationException("Narrative provider returned an invalid response.");
        return new(body.Body.Trim(), MockMetadata());
    }
    private static AiGenerationMetadata MockMetadata() => new("mock", "deterministic", null, null, null, 0, 1, "stop");
}

public class NarrativeGenerationException(string message, Exception? innerException = null) : Exception(message, innerException);

public sealed class NarrativeSignalValidationException(string message) : NarrativeGenerationException(message);
