using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class OpenAiCompatibleTextProviderTests
{
    [Fact]
    public async Task Generate_UsesStrictJsonSchemaAndCapturesMetadata()
    {
        var handler = new QueueHandler(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"id\":\"resp-1\",\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":11,\"completion_tokens\":4}}", Encoding.UTF8, "application/json")
        });
        var provider = Create(handler);

        var result = await provider.GenerateAsync(Request(), default);

        Assert.Contains("\"type\":\"json_schema\"", handler.LastBody, StringComparison.Ordinal);
        Assert.Contains("\"strict\":true", handler.LastBody, StringComparison.Ordinal);
        Assert.Equal("resp-1", result.Metadata.ResponseId);
        Assert.Equal(11, result.Metadata.InputTokens);
        Assert.Equal(4, result.Metadata.OutputTokens);
        Assert.Equal("stop", result.Metadata.FinishReason);
    }

    [Fact]
    public async Task Generate_ActiveRootSettingsOverridePlaceholderProfile()
    {
        var handler = new QueueHandler(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"},\"finish_reason\":\"stop\"}]}", Encoding.UTF8, "application/json")
        });
        var options = Options.Create(new AiProviderOptions
        {
            Provider = "runpod",
            BaseUrl = "https://api.runpod.ai/v2/real-endpoint/openai/v1",
            Model = "Qwen/Qwen3-8B",
            ApiKey = "active-key",
            MaxAttempts = 1,
            Providers = new Dictionary<string, AiProviderProfileOptions>(StringComparer.OrdinalIgnoreCase)
            {
                ["runpod"] = new()
                {
                    BaseUrl = "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/openai/v1",
                    Model = "YOUR_VLLM_MODEL"
                }
            }
        });
        var provider = new OpenAiCompatibleTextProvider(
            new Factory(new HttpClient(handler)),
            new CredentialStore(),
            options,
            NullLogger<OpenAiCompatibleTextProvider>.Instance);

        await provider.GenerateAsync(Request(), default);

        Assert.Equal("https://api.runpod.ai/v2/real-endpoint/openai/v1/chat/completions", handler.LastUri?.ToString());
        using var body = JsonDocument.Parse(handler.LastBody);
        Assert.Equal("Qwen/Qwen3-8B", body.RootElement.GetProperty("model").GetString());
    }

    [Fact]
    public async Task Generate_RetriesRateLimitAndReportsFinalAttempt()
    {
        var rateLimited = new HttpResponseMessage(HttpStatusCode.TooManyRequests)
        {
            Content = new StringContent("{\"error\":\"rate limited\"}")
        };
        rateLimited.Headers.RetryAfter = new System.Net.Http.Headers.RetryConditionHeaderValue(TimeSpan.Zero);
        var handler = new QueueHandler(
            rateLimited,
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"id\":\"resp-2\",\"choices\":[{\"message\":{\"content\":\"{\\\"ok\\\":true}\"},\"finish_reason\":\"stop\"}]}", Encoding.UTF8, "application/json")
            });

        var result = await Create(handler).GenerateAsync(Request(), default);

        Assert.Equal(2, handler.RequestCount);
        Assert.Equal(2, result.Metadata.AttemptCount);
    }

    [Fact]
    public async Task Generate_LogsProviderStatusRequestIdAndRedactedErrorBody()
    {
        var response = new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            ReasonPhrase = "Bad Request",
            Content = new StringContent("{\"error\":{\"message\":\"response_format unsupported for Bearer diagnostic-token\"}}")
        };
        response.Headers.TryAddWithoutValidation("x-request-id", "req-diagnostic-1");
        var handler = new QueueHandler(response);
        var logger = new RecordingLogger<OpenAiCompatibleTextProvider>();
        var options = Options.Create(new AiProviderOptions
        {
            Provider = "runpod",
            BaseUrl = "https://example.test/openai/v1",
            Model = "test-model",
            ApiKey = "fallback",
            MaxAttempts = 1
        });
        var provider = new OpenAiCompatibleTextProvider(new Factory(new HttpClient(handler)), new CredentialStore(), options, logger);

        await Assert.ThrowsAsync<AiProviderException>(() => provider.GenerateAsync(Request(), default));

        var entry = Assert.Single(logger.Entries);
        Assert.Contains("StatusCode=400", entry, StringComparison.Ordinal);
        Assert.Contains("ProviderRequestId=req-diagnostic-1", entry, StringComparison.Ordinal);
        Assert.Contains("response_format unsupported", entry, StringComparison.Ordinal);
        Assert.DoesNotContain("diagnostic-token", entry, StringComparison.Ordinal);
        Assert.Contains("[REDACTED]", entry, StringComparison.Ordinal);
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
        Assert.Equal(code, exception.Code);
        Assert.Equal(retryable, exception.Retryable);
    }

    [Fact]
    public async Task Generate_ClassifiesModelNotFound()
    {
        var handler = new QueueHandler(new HttpResponseMessage(HttpStatusCode.NotFound) { Content = new StringContent("model not found") });
        var exception = await Assert.ThrowsAsync<AiProviderException>(() => Create(handler, maxAttempts: 1).GenerateAsync(Request(), default));
        Assert.Equal(AiProviderErrorCodes.ModelNotFound, exception.Code);
    }

    private static OpenAiCompatibleTextProvider Create(QueueHandler handler, int maxAttempts = 2)
    {
        var client = new HttpClient(handler);
        var options = Options.Create(new AiProviderOptions { Provider = "runpod", BaseUrl = "https://example.test/openai/v1", Model = "test-model", ApiKey = "fallback", MaxAttempts = maxAttempts, InitialBackoffMilliseconds = 0 });
        return new OpenAiCompatibleTextProvider(new Factory(client), new CredentialStore(), options, NullLogger<OpenAiCompatibleTextProvider>.Instance);
    }
    private static AiTextRequest Request()
    {
        using var schema = JsonDocument.Parse("{\"type\":\"object\"}");
        return new(
            [new ChatMessage(ChatRole.System, "system"), new ChatMessage(ChatRole.User, "user")],
            ChatResponseFormat.ForJsonSchema(schema.RootElement.Clone(), "test"));
    }

    private sealed class Factory(HttpClient client) : IHttpClientFactory { public HttpClient CreateClient(string name) => client; }
    private sealed class CredentialStore : IAiCredentialStore
    {
        public Task SaveAsync(string provider, string displayName, string secret, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<string?> GetAsync(string provider, CancellationToken cancellationToken) => Task.FromResult<string?>("secret");
        public Task DeleteAsync(string provider, CancellationToken cancellationToken) => throw new NotSupportedException();
        public string Mask(string secret) => throw new NotSupportedException();
    }
    private sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<string> Entries { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            Entries.Add(formatter(state, exception));
    }

    private sealed class QueueHandler(params HttpResponseMessage[] responses) : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new(responses);
        public string LastBody { get; private set; } = string.Empty;
        public Uri? LastUri { get; private set; }
        public int RequestCount { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            LastUri = request.RequestUri;
            LastBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            return _responses.Dequeue();
        }
    }
}
