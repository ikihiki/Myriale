using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.AiProviders.Application;

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
        using var payload = JsonDocument.Parse(handler.LastBody);
        Assert.Equal(0.4, payload.RootElement.GetProperty("temperature").GetDouble());
        Assert.Equal(1200, payload.RootElement.GetProperty("max_tokens").GetInt32());
        Assert.False(payload.RootElement.GetProperty("chat_template_kwargs").GetProperty("enable_thinking").GetBoolean());
        Assert.Equal("stop", result.Metadata.FinishReason);
    }

    [Fact]
    public async Task Generate_AppliesAndRecordsPerRequestGenerationOverrides()
    {
        var handler = Success();
        var provider = Create(handler, Catalog(Profile("runpod", "https://example.test/v1", "Qwen/Qwen3-8B", "shared")), new CredentialResolver("secret"));
        var overrides = new AiGenerationOverrides(
            Temperature: 0.8,
            TopP: 0.95,
            RepetitionPenalty: 1.05,
            Seed: 42,
            MaxOutputTokens: 4096,
            ThinkingEnabled: true,
            RetryAttempts: 0);

        var result = await provider.GenerateAsync(Request(overrides), default);

        using var payload = JsonDocument.Parse(handler.LastBody);
        var root = payload.RootElement;
        Assert.Equal(0.8, root.GetProperty("temperature").GetDouble());
        Assert.Equal(0.95, root.GetProperty("top_p").GetDouble());
        Assert.Equal(1.05, root.GetProperty("repetition_penalty").GetDouble());
        Assert.Equal(42, root.GetProperty("seed").GetInt64());
        Assert.Equal(4096, root.GetProperty("max_tokens").GetInt32());
        Assert.True(root.GetProperty("chat_template_kwargs").GetProperty("enable_thinking").GetBoolean());
        Assert.Same(overrides, result.Metadata.GenerationOverrides);
    }

    [Fact]
    public async Task GenerateForProfile_AppendsProfileSystemPromptWithoutReplacingApplicationPrompt()
    {
        var handler = Success();
        var provider = Create(handler, Catalog(Profile("styled", "https://example.test/v1", "model", "shared", "余韻のある日本語で描く。")), new CredentialResolver("secret"));

        await provider.GenerateForProfileAsync(new AiProviderProfileId("styled"), Request(), default);

        using var payload = JsonDocument.Parse(handler.LastBody);
        var systemMessage = payload.RootElement.GetProperty("messages")[0].GetProperty("content").GetString();
        Assert.Contains("application contract", systemMessage, StringComparison.Ordinal);
        Assert.Contains("余韻のある日本語で描く。", systemMessage, StringComparison.Ordinal);
        Assert.Contains("built-in instruction", systemMessage, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GenerateForProfile_ResolvesSharedCredentialWithoutProfileSecret()
    {
        var handler = Success(); var resolver = new CredentialResolver("shared-secret");
        var provider = Create(handler, Catalog(Profile("acme", "https://acme.test/v1", "acme-model", "shared-main")), resolver);
        await provider.GenerateForProfileAsync(new AiProviderProfileId("acme"), Request(), default);
        Assert.Equal(new AiCredentialId("shared-main"), resolver.LastId);
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
    public async Task Generate_HttpFailureRetainsRawBodyAndAttemptMetadata()
    {
        const string body = "{\"error\":{\"message\":\"invalid schema\",\"detail\":\"full diagnostic\"}}";
        var response = new HttpResponseMessage(HttpStatusCode.BadRequest) { Content = new StringContent(body) };
        response.Headers.Add("x-request-id", "request-failed");
        var overrides = new AiGenerationOverrides(Temperature: 0, RetryAttempts: 0);

        var exception = await Assert.ThrowsAsync<AiProviderException>(() =>
            Create(new QueueHandler(response), maxAttempts: 1).GenerateAsync(Request(overrides), default));

        Assert.Equal(body, exception.ReceivedResult);
        Assert.Contains("invalid schema", exception.ProviderResponseExcerpt, StringComparison.Ordinal);
        Assert.NotNull(exception.Metadata);
        Assert.Equal(new AiProviderProfileId("runpod"), exception.Metadata.Provider);
        Assert.Equal("test-model", exception.Metadata.Model);
        Assert.Equal("request-failed", exception.Metadata.ResponseId);
        Assert.Equal(1, exception.Metadata.AttemptCount);
        Assert.Null(exception.Metadata.InputTokens);
        Assert.Null(exception.Metadata.OutputTokens);
        Assert.True(exception.Metadata.LatencyMilliseconds >= 0);
        Assert.Same(overrides, exception.Metadata.GenerationOverrides);
    }

    [Fact]
    public async Task Generate_InvalidSuccessEnvelopeRetainsRawBodyAndAttemptMetadata()
    {
        const string body = "{\"id\":\"response-invalid\",\"choices\":[]}";
        var handler = new QueueHandler(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        });

        var exception = await Assert.ThrowsAsync<AiProviderException>(() =>
            Create(handler, maxAttempts: 1).GenerateAsync(Request(), default));

        Assert.Equal(AiProviderErrorCodes.SchemaFailure, exception.Code);
        Assert.Equal(body, exception.ReceivedResult);
        Assert.NotNull(exception.Metadata);
        Assert.Equal(1, exception.Metadata.AttemptCount);
        Assert.True(exception.Metadata.LatencyMilliseconds >= 0);
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

    [Fact]
    public async Task Generate_RequestCanDisableRetries()
    {
        var handler = new QueueHandler(new HttpResponseMessage(HttpStatusCode.InternalServerError) { Content = new StringContent("unavailable") });

        await Assert.ThrowsAsync<AiProviderException>(() =>
            Create(handler, maxAttempts: 3).GenerateAsync(Request(new AiGenerationOverrides(RetryAttempts: 0)), default));

        Assert.Equal(1, handler.RequestCount);
    }

    [Fact]
    public async Task Generate_RequestCanOverrideConfiguredRetryAttempts()
    {
        var unavailable = new HttpResponseMessage(HttpStatusCode.InternalServerError) { Content = new StringContent("unavailable") };
        var handler = new QueueHandler(unavailable, SuccessResponse());

        var result = await Create(handler, maxAttempts: 1)
            .GenerateAsync(Request(new AiGenerationOverrides(RetryAttempts: 1)), default);

        Assert.Equal(2, handler.RequestCount);
        Assert.Equal(2, result.Metadata.AttemptCount);
    }

    private static OpenAiCompatibleTextProvider Create(QueueHandler handler, IAiProfileCatalog? catalog = null, IAiRuntimeCredentialResolver? resolver = null, int maxAttempts = 2)
    {
        catalog ??= Catalog(Profile("runpod", "https://example.test/openai/v1", "test-model", "runpod"));
        resolver ??= new CredentialResolver("secret");
        var active = new ActiveAiProviderQueryService(new Reader(new AiProviderProfileId("runpod")), catalog);
        return new(new Factory(new HttpClient(handler)), resolver, Options.Create(new AiProviderOptions { MaxAttempts = maxAttempts, InitialBackoffMilliseconds = 0 }), catalog, active, NullLogger<OpenAiCompatibleTextProvider>.Instance);
    }
    private static AiProfileDescriptor Profile(string id, string baseUrl, string model, string credentialId, string systemPrompt = "") => new(new AiProviderProfileId(id), id, baseUrl, model, new AiCredentialId(credentialId), true, AiProfileDefinitionSource.Deployment, 0, SystemPrompt: systemPrompt);
    private static IAiProfileCatalog Catalog(params AiProfileDescriptor[] profiles) => new CatalogStub(profiles);
    private static QueueHandler Success() => new(SuccessResponse());
    private static HttpResponseMessage SuccessResponse() => new(HttpStatusCode.OK) { Content = new StringContent("{\"id\":\"resp-1\",\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":11,\"completion_tokens\":4}}", Encoding.UTF8, "application/json") };
    private static AiTextRequest Request(AiGenerationOverrides? overrides = null) { using var schema = JsonDocument.Parse("{\"type\":\"object\"}"); return new([new ChatMessage(ChatRole.System, "built-in instruction"), new ChatMessage(ChatRole.User, "test")], ChatResponseFormat.ForJsonSchema(schema.RootElement.Clone(), "test"), overrides); }
    private sealed class CatalogStub(IEnumerable<AiProfileDescriptor> values) : IAiProfileCatalog
    {
        private readonly Dictionary<AiProviderProfileId, AiProfileDescriptor> _profiles = values.ToDictionary(x => x.Id);
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) { var first = _profiles.Keys.First(); return Task.FromResult(new AiProfileCatalogSnapshot(_profiles, first, first)); }
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId id, CancellationToken ct) => Task.FromResult(_profiles[id]);
        public async Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) => requested ?? (await GetAsync(ct)).DefaultActionDecisionProfileId;
        public async Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) => requested ?? (await GetAsync(ct)).DefaultNarrativeProfileId;
    }
    private sealed class CredentialResolver(string secret) : IAiRuntimeCredentialResolver { public AiCredentialId? LastId { get; private set; } public Task<ResolvedAiCredential?> ResolveAsync(AiCredentialId id, CancellationToken ct) { LastId = id; return Task.FromResult<ResolvedAiCredential?>(new(secret, AiCredentialSource.Database, 1, "masked")); } }
    private sealed class Reader(AiProviderProfileId provider) : IActiveAiProviderSettingsReader { public Task<ActiveAiProviderSelection?> GetAsync(CancellationToken ct) => Task.FromResult<ActiveAiProviderSelection?>(new(provider, 1)); }
    private sealed class Factory(HttpClient client) : IHttpClientFactory { public HttpClient CreateClient(string name) => client; }
    private sealed class QueueHandler(params HttpResponseMessage[] responses) : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new(responses); public string LastBody { get; private set; } = ""; public Uri? LastUri { get; private set; } public int RequestCount { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) { RequestCount++; LastUri = request.RequestUri; LastBody = await request.Content!.ReadAsStringAsync(ct); return _responses.Dequeue(); }
    }
}
