using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;

namespace Myriale.Api.Services;

public static class AiProviderErrorCodes
{
    public const string Timeout = "timeout";
    public const string RateLimited = "rate_limited";
    public const string ProviderUnavailable = "provider_unavailable";
    public const string InvalidCredential = "invalid_credential";
    public const string ModelNotFound = "model_not_found";
    public const string SchemaFailure = "schema_failure";
    public const string ContentRejected = "content_rejected";
}

public sealed class AiProviderException(
    string code,
    string message,
    bool retryable,
    TimeSpan? retryAfter = null,
    Exception? inner = null,
    string? providerResponseExcerpt = null,
    string? sentPrompt = null,
    string? receivedResult = null)
    : Exception(message, inner)
{
    public string Code { get; } = code;
    public bool Retryable { get; } = retryable;
    public TimeSpan? RetryAfter { get; } = retryAfter;
    public string? SentPrompt { get; } = sentPrompt;
    public string? ReceivedResult { get; } = receivedResult;
    public string? ProviderResponseExcerpt { get; } = providerResponseExcerpt;
}

public sealed record AiTextRequest(
    IReadOnlyList<ChatMessage> Messages,
    ChatResponseFormatJson ResponseFormat);
public sealed record AiGenerationMetadata(string Provider, string Model, string? ResponseId, int? InputTokens, int? OutputTokens, long LatencyMilliseconds, int AttemptCount, string? FinishReason);
public sealed record AiTextResponse(string Text, AiGenerationMetadata Metadata);
public sealed record NarrativeGeneration<T>(
    T Value,
    AiGenerationMetadata Metadata,
    string? SentPrompt = null,
    string? ReceivedResult = null);

public interface IAiTextProvider
{
    Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken);
    Task TestConnectionAsync(string provider, string credential, CancellationToken cancellationToken);
}

public sealed class AiProviderOptions
{
    public const string SectionName = "AiProvider";
    public string Provider { get; set; } = "mock";
    public string Model { get; set; } = "gpt-4.1-mini";
    public string? BaseUrl { get; set; }
    public string? ApiKey { get; set; }
    public int TimeoutSeconds { get; set; } = 300;
    public int MaxOutputTokens { get; set; } = 1200;
    public double Temperature { get; set; } = 0.4;
    public int MaxAttempts { get; set; } = 2;
    public int InitialBackoffMilliseconds { get; set; } = 500;
    public int SessionRequestsPerMinute { get; set; } = 12;
    public int UserRequestsPerMinute { get; set; } = 30;
    public int MaxTokensPerSession { get; set; } = 250_000;
    public int LeaseRecoveryIntervalSeconds { get; set; } = 60;
    public Dictionary<string, AiProviderProfileOptions> Providers { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class AiProviderProfileOptions
{
    public string? BaseUrl { get; set; }
    public string? Model { get; set; }
    public string? ApiKey { get; set; }
}

public interface IAiCredentialStore
{
    Task SaveAsync(string provider, string displayName, string secret, CancellationToken cancellationToken);
    Task<string?> GetAsync(string provider, CancellationToken cancellationToken);
    Task DeleteAsync(string provider, CancellationToken cancellationToken);
    string Mask(string secret);
}

public sealed class OpenAiCompatibleTextProvider(
    IHttpClientFactory clients,
    IAiCredentialStore credentials,
    IOptions<AiProviderOptions> configuredOptions,
    ILogger<OpenAiCompatibleTextProvider> logger) : IAiTextProvider
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken)
    {
        var configured = configuredOptions.Value;
        var provider = Normalize(configured.Provider);
        var options = ResolveOptions(configured, provider);
        if (provider is not ("openai" or "runpod"))
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "実AI Providerが設定されていません。", false);
        var credential = await credentials.GetAsync(provider, cancellationToken) ?? options.ApiKey;
        if (string.IsNullOrWhiteSpace(credential))
            throw new AiProviderException(AiProviderErrorCodes.InvalidCredential, "AI Provider credentialが設定されていません。", false);
        return await SendWithRetryAsync(provider, options, credential, request, cancellationToken);
    }

    public async Task TestConnectionAsync(string provider, string credential, CancellationToken cancellationToken)
    {
        provider = Normalize(provider);
        if (provider is not ("openai" or "runpod"))
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "未対応のAI Providerです。", false);
        var options = ResolveOptions(configuredOptions.Value, provider);
        using var schema = JsonDocument.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"ok\":{\"type\":\"boolean\"}},\"required\":[\"ok\"]}");
        var probe = new AiTextRequest(
            [
                new ChatMessage(ChatRole.System, "Return JSON only."),
                new ChatMessage(ChatRole.User, "Return {\"ok\":true}.")
            ],
            ChatResponseFormat.ForJsonSchema(schema.RootElement, "myriale_connection_test"));
        await SendWithRetryAsync(provider, options, credential, probe, cancellationToken);
    }

    private async Task<AiTextResponse> SendWithRetryAsync(string provider, AiProviderOptions options, string credential, AiTextRequest request, CancellationToken cancellationToken)
    {
        AiProviderException? last = null;
        for (var attempt = 1; attempt <= Math.Max(1, options.MaxAttempts); attempt++)
        {
            try { return await SendAsync(provider, options, credential, request, attempt, cancellationToken); }
            catch (AiProviderException exception) when (exception.Retryable && attempt < Math.Max(1, options.MaxAttempts))
            {
                last = exception;
                var delay = exception.RetryAfter ?? TimeSpan.FromMilliseconds(Math.Max(0, options.InitialBackoffMilliseconds) * Math.Pow(2, attempt - 1));
                logger.LogWarning(
                    exception,
                    "AI Provider request attempt failed and will be retried. Provider={Provider} Model={Model} Schema={SchemaName} Attempt={Attempt} MaxAttempts={MaxAttempts} ErrorCode={ErrorCode} RetryDelayMilliseconds={RetryDelayMilliseconds}",
                    provider,
                    options.Model,
                    request.ResponseFormat.SchemaName,
                    attempt,
                    options.MaxAttempts,
                    exception.Code,
                    delay.TotalMilliseconds);
                await Task.Delay(delay, cancellationToken);
            }
        }
        throw last ?? new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider request failed.", true);
    }

    private async Task<AiTextResponse> SendAsync(string provider, AiProviderOptions options, string credential, AiTextRequest input, int attempt, CancellationToken cancellationToken)
    {
        var client = clients.CreateClient("OpenAiCompatible");
        var endpoint = new Uri(new Uri(ResolveBaseUrl(provider, options.BaseUrl)), "chat/completions");
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credential);
        request.Content = new StringContent(JsonSerializer.Serialize(new
        {
            model = options.Model,
            messages = input.Messages.Select(message => new { role = message.Role.Value, content = message.Text }),
            temperature = options.Temperature,
            max_tokens = options.MaxOutputTokens,
            // Microsoft.Extensions.AI owns the provider-neutral messages and response format. This adapter owns
            // the final OpenAI-compatible wire shape so OpenAI and Runpod vLLM receive the same strict contract.
            response_format = new
            {
                type = "json_schema",
                json_schema = new
                {
                    name = input.ResponseFormat.SchemaName,
                    strict = true,
                    schema = JsonNode.Parse(input.ResponseFormat.Schema?.GetRawText()
                        ?? throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "Structured output schema is required.", false))
                }
            }
        }, Json), Encoding.UTF8, "application/json");
        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds)));
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            stopwatch.Stop();
            if (!response.IsSuccessStatusCode)
            {
                var providerException = await ClassifyAsync(response);
                logger.LogWarning(
                    "AI Provider returned an unsuccessful response. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} StatusCode={StatusCode} ReasonPhrase={ReasonPhrase} ProviderRequestId={ProviderRequestId} ErrorCode={ErrorCode} ResponseBody={ResponseBody}",
                    provider,
                    options.Model,
                    input.ResponseFormat.SchemaName,
                    endpoint.GetLeftPart(UriPartial.Path),
                    attempt,
                    (int)response.StatusCode,
                    response.ReasonPhrase,
                    ProviderRequestId(response),
                    providerException.Code,
                    providerException.ProviderResponseExcerpt);
                throw providerException;
            }
            await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: timeout.Token);
            var root = document.RootElement;
            var choice = root.GetProperty("choices")[0];
            var finishReason = choice.TryGetProperty("finish_reason", out var finish) ? finish.GetString() : null;
            if (finishReason is "content_filter") throw new AiProviderException(AiProviderErrorCodes.ContentRejected, "AI Provider rejected the content.", false);
            var text = choice.GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(text)) throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned empty structured output.", false);
            int? inputTokens = null, outputTokens = null;
            if (root.TryGetProperty("usage", out var usage))
            {
                if (usage.TryGetProperty("prompt_tokens", out var promptTokens)) inputTokens = promptTokens.GetInt32();
                if (usage.TryGetProperty("completion_tokens", out var completionTokens)) outputTokens = completionTokens.GetInt32();
            }
            return new AiTextResponse(text, new(provider, options.Model, root.TryGetProperty("id", out var id) ? id.GetString() : null, inputTokens, outputTokens, stopwatch.ElapsedMilliseconds, attempt, finishReason));
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(exception,
                "AI Provider request timed out. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} TimeoutSeconds={TimeoutSeconds}",
                provider, options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt, options.TimeoutSeconds);
            throw new AiProviderException(AiProviderErrorCodes.Timeout, "AI Provider request timed out.", true, null, exception);
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception,
                "AI Provider transport failed. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} HttpRequestError={HttpRequestError} StatusCode={StatusCode}",
                provider, options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt, exception.HttpRequestError, exception.StatusCode is null ? null : (int)exception.StatusCode);
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider is unavailable.", true, null, exception);
        }
        catch (Exception exception) when (exception is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            logger.LogWarning(exception,
                "AI Provider response envelope was invalid. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} ExceptionType={ExceptionType}",
                provider, options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt, exception.GetType().Name);
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned an invalid response envelope.", false, null, exception);
        }
    }

    private static async Task<AiProviderException> ClassifyAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        var retryAfter = response.Headers.RetryAfter?.Delta
            ?? (response.Headers.RetryAfter?.Date is { } date ? date - DateTimeOffset.UtcNow : null);
        var lower = body.ToLowerInvariant();
        var excerpt = SafeProviderResponseExcerpt(body);
        return response.StatusCode switch
        {
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => new(AiProviderErrorCodes.InvalidCredential, "AI Provider rejected the credential.", false, null, null, excerpt),
            HttpStatusCode.NotFound when lower.Contains("model") => new(AiProviderErrorCodes.ModelNotFound, "AI model was not found.", false, null, null, excerpt),
            HttpStatusCode.TooManyRequests => new(AiProviderErrorCodes.RateLimited, "AI Provider rate limit exceeded.", true, retryAfter, null, excerpt),
            HttpStatusCode.BadRequest when lower.Contains("content") || lower.Contains("safety") => new(AiProviderErrorCodes.ContentRejected, "AI Provider rejected the content.", false, null, null, excerpt),
            HttpStatusCode.BadRequest => new(AiProviderErrorCodes.SchemaFailure, "AI Provider rejected the structured output request.", false, null, null, excerpt),
            >= HttpStatusCode.InternalServerError => new(AiProviderErrorCodes.ProviderUnavailable, "AI Provider is unavailable.", true, retryAfter, null, excerpt),
            _ => new(AiProviderErrorCodes.ProviderUnavailable, "AI Provider request failed.", false, null, null, excerpt),
        };
    }


    private static string? ProviderRequestId(HttpResponseMessage response)
    {
        foreach (var name in new[] { "x-request-id", "request-id", "cf-ray" })
            if (response.Headers.TryGetValues(name, out var values)) return values.FirstOrDefault();
        return null;
    }

    private static string SafeProviderResponseExcerpt(string body)
    {
        const int maxLength = 1_000;
        var compact = string.Join(' ', body.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        foreach (var prefix in new[] { "Bearer ", "sk-", "rpa_" })
        {
            var start = compact.IndexOf(prefix, StringComparison.OrdinalIgnoreCase);
            while (start >= 0)
            {
                var end = compact.IndexOfAny([' ', '\"', '\'', ',', '}', ']'], start + prefix.Length);
                if (end < 0) end = compact.Length;
                compact = string.Concat(compact.AsSpan(0, start), "[REDACTED]", compact.AsSpan(end));
                start = compact.IndexOf(prefix, start + "[REDACTED]".Length, StringComparison.OrdinalIgnoreCase);
            }
        }
        return compact.Length <= maxLength ? compact : compact[..maxLength] + "…";
    }

    private static AiProviderOptions ResolveOptions(AiProviderOptions configured, string provider)
    {
        configured.Providers.TryGetValue(provider, out var profile);
        var isActiveProvider = string.Equals(Normalize(configured.Provider), provider, StringComparison.OrdinalIgnoreCase);
        return new AiProviderOptions
        {
            Provider = provider,
            // Forge injects the active Provider settings at the AiProvider root. Those values must win over
            // appsettings.json profiles, whose Runpod values are documentation placeholders.
            BaseUrl = isActiveProvider ? configured.BaseUrl ?? profile?.BaseUrl : profile?.BaseUrl ?? configured.BaseUrl,
            Model = isActiveProvider ? ResolveModel(configured.Model, profile?.Model) : ResolveModel(profile?.Model, configured.Model),
            ApiKey = isActiveProvider ? configured.ApiKey ?? profile?.ApiKey : profile?.ApiKey ?? configured.ApiKey,
            TimeoutSeconds = configured.TimeoutSeconds,
            MaxOutputTokens = configured.MaxOutputTokens,
            Temperature = configured.Temperature,
            MaxAttempts = configured.MaxAttempts,
            InitialBackoffMilliseconds = configured.InitialBackoffMilliseconds,
        };
    }

    private static string ResolveModel(params string?[] candidates) =>
        candidates.FirstOrDefault(candidate => !string.IsNullOrWhiteSpace(candidate))
        ?? throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI model is required.", false);

    private static string ResolveBaseUrl(string provider, string? configured) =>
        (configured ?? (provider == "openai" ? "https://api.openai.com/v1/" : throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "Runpod BaseUrl is required.", false))).TrimEnd('/') + "/";
    private static string Normalize(string provider) => provider.Trim().ToLowerInvariant();
}
