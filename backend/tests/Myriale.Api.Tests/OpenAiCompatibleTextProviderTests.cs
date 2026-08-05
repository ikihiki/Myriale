using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class OpenAiCompatibleTextProviderTests
{
    [Fact]
    public async Task Generate_UsesRuntimeProfileCredentialAndStrictSchema()
    {
        var handler = Success(); var catalog = Catalog(Profile("runpod", "https://example.test/openai/v1", "Qwen/Qwen3-8B", "shared"));
        var provider = Create(handler, catalog, new CredentialResolver("secret"));
        var result = await provider.GenerateAsync(Request(), default);
        Assert.Equal("https://example.test/openai/v1/chat/completions", handler.LastUri?.ToString());
        Assert.Contains("\"strict\":true", handler.LastBody, StringComparison.Ordinal);
        Assert.Contains("chat_template_kwargs", handler.LastBody, StringComparison.Ordinal);
        Assert.Equal("stop", result.Metadata.FinishReason);
    }

    [Fact]
    public async Task GenerateForProfile_ResolvesSharedCredentialWithoutProfileSecret()
    {
        var handler = Success(); var resolver = new CredentialResolver("shared-secret");
        var provider = Create(handler, Catalog(Profile("acme", "https://acme.test/v1", "acme-model", "shared-main")), resolver);
        await provider.GenerateForProfileAsync("acme", Request(), default);
        Assert.Equal("shared-main", resolver.LastId);
        Assert.DoesNotContain("shared-secret", handler.LastBody, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized, AiProviderErrorCodes.InvalidCredential, false)]
    [InlineData(HttpStatusCode.TooManyRequests, AiProviderErrorCodes.RateLimited, true)]
    [InlineData(HttpStatusCode.InternalServerError, AiProviderErrorCodes.ProviderUnavailable, true)]
    [InlineData(HttpStatusCode.BadRequest, AiProviderErrorCodes.SchemaFailure, false)]
    public async Task Generate_NormalizesProviderErrors(HttpStatusCode status, string code, bool retryable)
    {
        var handler = new QueueHandler(new HttpResponseMessage(status) { Content = new StringContent("{\"error\":\"failure\"}") });
        var exception = await Assert.ThrowsAsync<AiProviderException>(() => Create(handler, maxAttempts: 1).GenerateAsync(Request(), default));
        Assert.Equal(code, exception.Code); Assert.Equal(retryable, exception.Retryable);
    }

    [Fact]
    public async Task Generate_RetriesRateLimit()
    {
        var limited = new HttpResponseMessage(HttpStatusCode.TooManyRequests) { Content = new StringContent("rate limited") };
        limited.Headers.RetryAfter = new System.Net.Http.Headers.RetryConditionHeaderValue(TimeSpan.Zero);
        var handler = new QueueHandler(limited, SuccessResponse());
        var result = await Create(handler).GenerateAsync(Request(), default);
        Assert.Equal(2, handler.RequestCount); Assert.Equal(2, result.Metadata.AttemptCount);
    }

    private static OpenAiCompatibleTextProvider Create(QueueHandler handler, IAiProfileCatalog? catalog = null, IAiRuntimeCredentialResolver? resolver = null, int maxAttempts = 2)
    {
        catalog ??= Catalog(Profile("runpod", "https://example.test/openai/v1", "test-model", "runpod"));
        resolver ??= new CredentialResolver("secret");
        var active = new ActiveAiProviderQueryService(new Reader("runpod"), catalog);
        return new(new Factory(new HttpClient(handler)), resolver, Options.Create(new AiProviderOptions { MaxAttempts = maxAttempts, InitialBackoffMilliseconds = 0 }), catalog, active, NullLogger<OpenAiCompatibleTextProvider>.Instance);
    }
    private static AiProfileDescriptor Profile(string id, string baseUrl, string model, string credentialId) => new(id, id, baseUrl, model, credentialId, true, AiProfileDefinitionSource.Deployment, 0);
    private static IAiProfileCatalog Catalog(params AiProfileDescriptor[] profiles) => new CatalogStub(profiles);
    private static QueueHandler Success() => new(SuccessResponse());
    private static HttpResponseMessage SuccessResponse() => new(HttpStatusCode.OK) { Content = new StringContent("{\"id\":\"resp-1\",\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":11,\"completion_tokens\":4}}", Encoding.UTF8, "application/json") };
    private static AiTextRequest Request() { using var schema = JsonDocument.Parse("{\"type\":\"object\"}"); return new([new ChatMessage(ChatRole.User, "test")], ChatResponseFormat.ForJsonSchema(schema.RootElement.Clone(), "test")); }
    private sealed class CatalogStub(IEnumerable<AiProfileDescriptor> values) : IAiProfileCatalog
    {
        private readonly Dictionary<string, AiProfileDescriptor> _profiles = values.ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) { var first = _profiles.Keys.First(); return Task.FromResult(new AiProfileCatalogSnapshot(_profiles, first, first)); }
        public Task<AiProfileDescriptor> ResolveAsync(string id, CancellationToken ct) => Task.FromResult(_profiles[id]);
        public async Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken ct) => requested ?? (await GetAsync(ct)).DefaultActionDecisionProfileId;
        public async Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken ct) => requested ?? (await GetAsync(ct)).DefaultNarrativeProfileId;
    }
    private sealed class CredentialResolver(string secret) : IAiRuntimeCredentialResolver { public string? LastId { get; private set; } public Task<ResolvedAiCredential?> ResolveAsync(string id, CancellationToken ct) { LastId = id; return Task.FromResult<ResolvedAiCredential?>(new(secret, AiCredentialSource.Database, 1, "masked")); } }
    private sealed class Reader(string provider) : IActiveAiProviderSettingsReader { public Task<ActiveAiProviderSelection?> GetAsync(CancellationToken ct) => Task.FromResult<ActiveAiProviderSelection?>(new(provider, 1)); }
    private sealed class Factory(HttpClient client) : IHttpClientFactory { public HttpClient CreateClient(string name) => client; }
    private sealed class QueueHandler(params HttpResponseMessage[] responses) : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new(responses); public string LastBody { get; private set; } = ""; public Uri? LastUri { get; private set; } public int RequestCount { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) { RequestCount++; LastUri = request.RequestUri; LastBody = await request.Content!.ReadAsStringAsync(ct); return _responses.Dequeue(); }
    }
}
