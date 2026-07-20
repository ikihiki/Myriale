using System.Net.Http.Json;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public sealed class MockAiNarrativeGenerator(IHttpClientFactory httpClientFactory) : INarrativeGenerator
{
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
