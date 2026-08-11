using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.AiProviders.Application;


namespace Myriale.Api.Features.AiProviders.Infrastructure;

public sealed class AiProviderOptions
{
    public const string SectionName = "AiProvider";
    public int TimeoutSeconds { get; set; } = 300;
    public int EvaluationTimeoutSeconds { get; set; } = 1800;
    public int MaxOutputTokens { get; set; } = 1200;
    public double Temperature { get; set; } = 0.4;
    public int MaxAttempts { get; set; } = 2;
    public int InitialBackoffMilliseconds { get; set; } = 500;
    public int SessionRequestsPerMinute { get; set; } = 12;
    public int UserRequestsPerMinute { get; set; } = 30;
    public int MaxTokensPerSession { get; set; } = 250_000;
    public int LeaseRecoveryIntervalSeconds { get; set; } = 60;
    public string? DefaultActionDecisionProfileId { get; set; }
    public string? DefaultNarrativeProfileId { get; set; }
}

public sealed class AiRuntimeOptions
{
    public const string SectionName = "AiRuntime";
    public string Mode { get; set; } = "provider";
}

internal sealed record AiProviderRequestOptions(
    string BaseUrl,
    string Model,
    int TimeoutSeconds,
    int MaxOutputTokens,
    double Temperature,
    double? TopP,
    double? RepetitionPenalty,
    long? Seed,
    bool? ThinkingEnabled,
    int MaxAttempts,
    int InitialBackoffMilliseconds);

public sealed class OpenAiCompatibleTextProvider(
    IHttpClientFactory clients,
    IAiRuntimeCredentialResolver credentials,
    IOptions<AiProviderOptions> configuredOptions,
    IAiProfileCatalog catalog,
    ActiveAiProviderQueryService selection,
    ILogger<OpenAiCompatibleTextProvider> logger) : IAiTextService
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken)
    {
        var profileId = await selection.GetActiveProviderAsync(cancellationToken);
        return await GenerateForProfileAsync(profileId, request, cancellationToken);
    }

    public async Task<AiTextResponse> GenerateForProfileAsync(AiProviderProfileId profileId, AiTextRequest request, CancellationToken cancellationToken)
    {
        var profile = await catalog.ResolveAsync(profileId, cancellationToken);
        var credential = await credentials.ResolveAsync(profile.CredentialId, cancellationToken);
        if (credential is null)
            throw new AiProviderException(AiProviderErrorCodes.InvalidCredential, "AI Provider credentialが設定されていません。", false);
        return await SendWithRetryAsync(profile.Id, ResolveProfileOptions(configuredOptions.Value, profile, request.GenerationOverrides), credential.Secret, ApplyProfileSystemPrompt(request, profile.SystemPrompt), cancellationToken);
    }

    public async Task<AiTextResponse> GenerateForProviderAsync(AiProviderProfileId provider, string credential, AiTextRequest request, CancellationToken cancellationToken)
    {
        var profile = await catalog.ResolveAsync(provider, cancellationToken);
        if (string.IsNullOrWhiteSpace(credential))
            throw new AiProviderException(AiProviderErrorCodes.InvalidCredential, "AI Provider credentialが設定されていません。", false);
        return await SendWithRetryAsync(profile.Id, ResolveProfileOptions(configuredOptions.Value, profile, request.GenerationOverrides), credential, ApplyProfileSystemPrompt(request, profile.SystemPrompt), cancellationToken);
    }

    public async Task TestConnectionAsync(AiProviderProfileId provider, string credential, CancellationToken cancellationToken)
    {
        var profile = await catalog.ResolveAsync(provider, cancellationToken);
        using var schema = JsonDocument.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"ok\":{\"type\":\"boolean\"}},\"required\":[\"ok\"]}");
        var probe = new AiTextRequest(
            [
                new ChatMessage(ChatRole.System, "Return JSON only."),
                new ChatMessage(ChatRole.User, "Return {\"ok\":true}.")
            ],
            ChatResponseFormat.ForJsonSchema(schema.RootElement, "myriale_connection_test"));
        await SendWithRetryAsync(profile.Id, ResolveProfileOptions(configuredOptions.Value, profile, probe.GenerationOverrides), credential, probe, cancellationToken);
    }

    private static AiTextRequest ApplyProfileSystemPrompt(AiTextRequest request, string systemPrompt)
    {
        if (string.IsNullOrWhiteSpace(systemPrompt)) return request;
        var messages = request.Messages.ToList();
        var firstSystem = messages.FindIndex(message => message.Role == ChatRole.System);
        var additional = $"\n\nAI profile additional instructions (apply only when consistent with the application contract above):\n{systemPrompt.Trim()}";
        if (firstSystem >= 0)
            messages[firstSystem] = new ChatMessage(ChatRole.System, messages[firstSystem].Text + additional);
        else
            messages.Insert(0, new ChatMessage(ChatRole.System, systemPrompt.Trim()));
        return new AiTextRequest(messages, request.ResponseFormat, request.GenerationOverrides);
    }

    private async Task<AiTextResponse> SendWithRetryAsync(AiProviderProfileId provider, AiProviderRequestOptions options, string credential, AiTextRequest request, CancellationToken cancellationToken)
    {
        AiProviderException? last = null;
        for (var attempt = 1; attempt <= Math.Max(1, options.MaxAttempts); attempt++)
        {
            try { return await SendAsync(provider, options, credential, request, attempt, cancellationToken); }
            catch (AiProviderException exception) when (exception.Retryable && attempt < Math.Max(1, options.MaxAttempts))
            {
                last = exception;
                var delay = exception.RetryAfter ?? TimeSpan.FromMilliseconds(Math.Max(0, options.InitialBackoffMilliseconds) * Math.Pow(2, attempt - 1));
                SessionExecutionTelemetry.ProviderRetries.Add(1, SessionExecutionTelemetry.ProviderTags(provider.AsPrimitive(), options.Model, "retry", exception.Code));
                logger.LogWarning(
                    exception,
                    "AI Provider request attempt failed and will be retried. Provider={Provider} Model={Model} Schema={SchemaName} Attempt={Attempt} MaxAttempts={MaxAttempts} ErrorCode={ErrorCode} RetryDelayMilliseconds={RetryDelayMilliseconds}",
                    provider.AsPrimitive(),
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

    private static string SerializePromptAudit(AiTextRequest input) => JsonSerializer.Serialize(new
    {
        schemaVersion = "ai-prompt-audit.v1",
        messages = input.Messages.Select(message => new { role = message.Role.Value, content = message.Text }),
        responseFormat = new
        {
            schemaName = input.ResponseFormat.SchemaName,
            schema = input.ResponseFormat.Schema,
        },
        generationOverrides = input.GenerationOverrides,
    }, Json);

    private async Task<AiTextResponse> SendAsync(AiProviderProfileId provider, AiProviderRequestOptions options, string credential, AiTextRequest input, int attempt, CancellationToken cancellationToken)
    {
        var sentPrompt = SerializePromptAudit(input);
        var client = clients.CreateClient("OpenAiCompatible");
        var endpoint = new Uri(new Uri(ResolveBaseUrl(options.BaseUrl)), "chat/completions");
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credential);
        var payload = new Dictionary<string, object?>
        {
            ["model"] = options.Model,
            ["messages"] = input.Messages.Select(message => new { role = message.Role.Value, content = message.Text }),
            ["temperature"] = options.Temperature,
            ["max_tokens"] = options.MaxOutputTokens,
            // Microsoft.Extensions.AI owns the provider-neutral messages and response format. This adapter owns
            // the final OpenAI-compatible wire shape so OpenAI and Runpod vLLM receive the same strict contract.
            ["response_format"] = new
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
        };
        if (options.TopP is { } topP) payload["top_p"] = topP;
        if (options.RepetitionPenalty is { } repetitionPenalty) payload["repetition_penalty"] = repetitionPenalty;
        if (options.Seed is { } seed) payload["seed"] = seed;
        // Qwen3 spends its completion budget on hidden reasoning unless thinking is explicitly disabled.
        // OpenAI-compatible vLLM endpoints accept this model-specific chat-template option.
        if (options.Model.Contains("qwen3", StringComparison.OrdinalIgnoreCase))
            payload["chat_template_kwargs"] = new { enable_thinking = options.ThinkingEnabled ?? false };
        request.Content = new StringContent(JsonSerializer.Serialize(payload, Json), Encoding.UTF8, "application/json");
        var stopwatch = Stopwatch.StartNew();
        string? responseBody = null;
        string? providerRequestId = null;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds)));
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            providerRequestId = ProviderRequestId(response);
            if (!response.IsSuccessStatusCode)
            {
                var providerException = await ClassifyAsync(response);
                stopwatch.Stop();
                logger.LogWarning(
                    "AI Provider returned an unsuccessful response. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} StatusCode={StatusCode} ReasonPhrase={ReasonPhrase} ProviderRequestId={ProviderRequestId} ErrorCode={ErrorCode} ResponseBody={ResponseBody}",
                    provider.AsPrimitive(), options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt,
                    (int)response.StatusCode, response.ReasonPhrase, providerRequestId, providerException.Code, providerException.ProviderResponseExcerpt);
                throw WithMetadata(providerException, FailureMetadata(provider, options, input, attempt, stopwatch.ElapsedMilliseconds, providerRequestId), sentPrompt);
            }

            responseBody = await response.Content.ReadAsStringAsync(timeout.Token);
            stopwatch.Stop();
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;
            var choice = root.GetProperty("choices")[0];
            var finishReason = choice.TryGetProperty("finish_reason", out var finish) ? finish.GetString() : null;
            int? inputTokens = null, outputTokens = null;
            if (root.TryGetProperty("usage", out var usage))
            {
                if (usage.TryGetProperty("prompt_tokens", out var promptTokens)) inputTokens = promptTokens.GetInt32();
                if (usage.TryGetProperty("completion_tokens", out var completionTokens)) outputTokens = completionTokens.GetInt32();
            }
            var responseId = root.TryGetProperty("id", out var id) ? id.GetString() : providerRequestId;
            var metadata = new AiGenerationMetadata(provider, options.Model, responseId, inputTokens, outputTokens,
                stopwatch.ElapsedMilliseconds, attempt, finishReason, input.GenerationOverrides);
            var textResult = choice.GetProperty("message").GetProperty("content").GetString();
            if (finishReason is "content_filter")
                throw new AiProviderException(AiProviderErrorCodes.ContentRejected, "AI Provider rejected the content.", false,
                    sentPrompt: sentPrompt, receivedResult: textResult ?? responseBody, metadata: metadata);
            if (string.IsNullOrWhiteSpace(textResult))
                throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned empty structured output.", false,
                    sentPrompt: sentPrompt, receivedResult: responseBody, metadata: metadata);
            SessionExecutionTelemetry.ProviderRequests.Add(1, SessionExecutionTelemetry.ProviderTags(provider.AsPrimitive(), options.Model, "succeeded"));
            return new AiTextResponse(textResult, metadata, sentPrompt);
        }
        catch (AiProviderException exception)
        {
            SessionExecutionTelemetry.ProviderRequests.Add(1, SessionExecutionTelemetry.ProviderTags(provider.AsPrimitive(), options.Model, "failed", exception.Code));
            throw;
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            stopwatch.Stop();
            logger.LogWarning(exception,
                "AI Provider request timed out. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} TimeoutSeconds={TimeoutSeconds}",
                provider, options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt, options.TimeoutSeconds);
            SessionExecutionTelemetry.ProviderRequests.Add(1, SessionExecutionTelemetry.ProviderTags(provider.AsPrimitive(), options.Model, "failed", AiProviderErrorCodes.Timeout));
            throw new AiProviderException(AiProviderErrorCodes.Timeout, "AI Provider request timed out.", true, null, exception,
                sentPrompt: sentPrompt, receivedResult: responseBody, metadata: FailureMetadata(provider, options, input, attempt, stopwatch.ElapsedMilliseconds, providerRequestId));
        }
        catch (HttpRequestException exception)
        {
            stopwatch.Stop();
            logger.LogWarning(exception,
                "AI Provider transport failed. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} HttpRequestError={HttpRequestError} StatusCode={StatusCode}",
                provider, options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt, exception.HttpRequestError, exception.StatusCode is null ? null : (int)exception.StatusCode);
            SessionExecutionTelemetry.ProviderRequests.Add(1, SessionExecutionTelemetry.ProviderTags(provider.AsPrimitive(), options.Model, "failed", AiProviderErrorCodes.ProviderUnavailable));
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider is unavailable.", true, null, exception,
                sentPrompt: sentPrompt, receivedResult: responseBody, metadata: FailureMetadata(provider, options, input, attempt, stopwatch.ElapsedMilliseconds, providerRequestId));
        }
        catch (Exception exception) when (exception is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            stopwatch.Stop();
            logger.LogWarning(exception,
                "AI Provider response envelope was invalid. Provider={Provider} Model={Model} Schema={SchemaName} Endpoint={Endpoint} Attempt={Attempt} ExceptionType={ExceptionType}",
                provider, options.Model, input.ResponseFormat.SchemaName, endpoint.GetLeftPart(UriPartial.Path), attempt, exception.GetType().Name);
            SessionExecutionTelemetry.ProviderRequests.Add(1, SessionExecutionTelemetry.ProviderTags(provider.AsPrimitive(), options.Model, "failed", AiProviderErrorCodes.SchemaFailure));
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned an invalid response envelope.", false, null, exception,
                sentPrompt: sentPrompt, receivedResult: responseBody, metadata: FailureMetadata(provider, options, input, attempt, stopwatch.ElapsedMilliseconds, providerRequestId));
        }
    }

    private static AiGenerationMetadata FailureMetadata(AiProviderProfileId provider, AiProviderRequestOptions options,
        AiTextRequest input, int attempt, long latencyMilliseconds, string? responseId) =>
        new(provider, options.Model, responseId, null, null, latencyMilliseconds, attempt, null, input.GenerationOverrides);

    private static AiProviderException WithMetadata(AiProviderException exception, AiGenerationMetadata metadata, string? sentPrompt = null) => new(
        exception.Code, exception.Message, exception.Retryable, exception.RetryAfter, exception,
        exception.ProviderResponseExcerpt, exception.SentPrompt ?? sentPrompt, exception.ReceivedResult, metadata);

    private static async Task<AiProviderException> ClassifyAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        var retryAfter = response.Headers.RetryAfter?.Delta
            ?? (response.Headers.RetryAfter?.Date is { } date ? date - DateTimeOffset.UtcNow : null);
        var lower = body.ToLowerInvariant();
        var excerpt = SafeProviderResponseExcerpt(body);
        var classified = response.StatusCode switch
        {
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => new AiProviderException(AiProviderErrorCodes.InvalidCredential, "AI Provider rejected the credential.", false),
            HttpStatusCode.NotFound when lower.Contains("model") => new AiProviderException(AiProviderErrorCodes.ModelNotFound, "AI model was not found.", false),
            HttpStatusCode.TooManyRequests => new AiProviderException(AiProviderErrorCodes.RateLimited, "AI Provider rate limit exceeded.", true, retryAfter),
            HttpStatusCode.BadRequest when lower.Contains("content") || lower.Contains("safety") => new AiProviderException(AiProviderErrorCodes.ContentRejected, "AI Provider rejected the content.", false),
            HttpStatusCode.BadRequest => new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider rejected the structured output request.", false),
            >= HttpStatusCode.InternalServerError => new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider is unavailable.", true, retryAfter),
            _ => new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider request failed.", false),
        };
        return new(classified.Code, classified.Message, classified.Retryable, classified.RetryAfter,
            providerResponseExcerpt: excerpt, receivedResult: body);
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

    private static AiProviderRequestOptions ResolveProfileOptions(AiProviderOptions configured, AiProfileDescriptor profile, AiGenerationOverrides? overrides) => new(
        profile.BaseUrl,
        profile.Model,
        profile.Selectable ? configured.TimeoutSeconds : configured.EvaluationTimeoutSeconds,
        overrides?.MaxOutputTokens ?? configured.MaxOutputTokens,
        overrides?.Temperature ?? configured.Temperature,
        overrides?.TopP,
        overrides?.RepetitionPenalty,
        overrides?.Seed,
        overrides?.ThinkingEnabled,
        ResolveMaxAttempts(configured.MaxAttempts, overrides?.RetryAttempts),
        configured.InitialBackoffMilliseconds);

    private static int ResolveMaxAttempts(int configuredMaxAttempts, int? retryAttempts)
    {
        if (retryAttempts is null) return configuredMaxAttempts;
        if (retryAttempts < 0) throw new ArgumentOutOfRangeException(nameof(retryAttempts), "Retry attempts cannot be negative.");
        if (retryAttempts == int.MaxValue) throw new ArgumentOutOfRangeException(nameof(retryAttempts), "Retry attempts are too large.");
        return retryAttempts.Value + 1;
    }

    private static string ResolveBaseUrl(string? configured) =>
        (configured ?? throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider BaseUrl is required.", false)).TrimEnd('/') + "/";
}
