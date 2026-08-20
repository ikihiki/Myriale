using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace Myriale.Api.Features.AiProviders.Application.Services;

public sealed record AiPlaygroundToolCall(string Id, string Name, string ArgumentsJson);
public sealed record AiPlaygroundChatMessage(string Role, string? Content, string? ToolCallId = null, IReadOnlyList<AiPlaygroundToolCall>? ToolCalls = null);
public sealed record AiPlaygroundChatRequest(IReadOnlyList<AiPlaygroundChatMessage> Messages, JsonElement Tool, AiGenerationOverrides? GenerationOverrides);
public sealed record AiPlaygroundChatResponse(AiPlaygroundChatMessage Message, AiGenerationMetadata Metadata);

public interface IAiPlaygroundChatTransport
{
    Task<AiPlaygroundChatResponse> SendAsync(AiProfileDescriptor profile, string credential, AiPlaygroundChatRequest request, CancellationToken cancellationToken);
}

public sealed class OpenAiCompatiblePlaygroundChatTransport(
    IHttpClientFactory clients,
    IOptions<AiProviderOptions> configuredOptions,
    ILogger<OpenAiCompatiblePlaygroundChatTransport> logger) : IAiPlaygroundChatTransport
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public async Task<AiPlaygroundChatResponse> SendAsync(
        AiProfileDescriptor profile,
        string credential,
        AiPlaygroundChatRequest input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(credential))
            throw new AiProviderException(AiProviderErrorCodes.InvalidCredential, "AI Provider credential is not configured.", false);
        var options = configuredOptions.Value;
        var endpoint = new Uri(new Uri(profile.BaseUrl.TrimEnd('/') + "/"), "chat/completions");
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credential);
        var payload = new Dictionary<string, object?>
        {
            ["model"] = profile.Model,
            ["messages"] = input.Messages.Select(ToWireMessage).ToArray(),
            ["tools"] = new[] { input.Tool },
            ["tool_choice"] = "auto",
            ["temperature"] = input.GenerationOverrides?.Temperature ?? options.Temperature,
            ["max_tokens"] = input.GenerationOverrides?.MaxOutputTokens ?? options.MaxOutputTokens,
        };
        if (input.GenerationOverrides?.TopP is { } topP) payload["top_p"] = topP;
        if (input.GenerationOverrides?.Seed is { } seed) payload["seed"] = seed;
        request.Content = new StringContent(JsonSerializer.Serialize(payload, Json), Encoding.UTF8, "application/json");

        var stopwatch = Stopwatch.StartNew();
        string? responseBody = null;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds)));
            using var response = await clients.CreateClient("OpenAiCompatible")
                .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            var providerRequestId = ProviderRequestId(response);
            if (!response.IsSuccessStatusCode)
            {
                responseBody = await response.Content.ReadAsStringAsync(timeout.Token);
                throw Classify(response.StatusCode, response.Headers.RetryAfter?.Delta, responseBody);
            }
            responseBody = await response.Content.ReadAsStringAsync(timeout.Token);
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;
            var choice = root.GetProperty("choices")[0];
            var finishReason = choice.TryGetProperty("finish_reason", out var finish) ? finish.GetString() : null;
            var wireMessage = choice.GetProperty("message");
            var content = wireMessage.TryGetProperty("content", out var contentElement) && contentElement.ValueKind != JsonValueKind.Null
                ? contentElement.GetString() : null;
            var toolCalls = ParseToolCalls(wireMessage);
            if (finishReason == "content_filter")
                throw new AiProviderException(AiProviderErrorCodes.ContentRejected, "AI Provider rejected the content.", false);
            if (string.IsNullOrWhiteSpace(content) && toolCalls.Count == 0)
                throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned an empty assistant message.", false);
            int? inputTokens = null, outputTokens = null;
            if (root.TryGetProperty("usage", out var usage))
            {
                if (usage.TryGetProperty("prompt_tokens", out var prompt)) inputTokens = prompt.GetInt32();
                if (usage.TryGetProperty("completion_tokens", out var completion)) outputTokens = completion.GetInt32();
            }
            stopwatch.Stop();
            var responseId = root.TryGetProperty("id", out var id) ? id.GetString() : providerRequestId;
            return new(new("assistant", content, ToolCalls: toolCalls),
                new(profile.Id, profile.Model, responseId, inputTokens, outputTokens, stopwatch.ElapsedMilliseconds, 1, finishReason, input.GenerationOverrides));
        }
        catch (AiProviderException exception)
        {
            logger.LogWarning("Playground AI request failed. Provider={Provider} Model={Model} Code={Code}", profile.Id, profile.Model, exception.Code);
            throw;
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw new AiProviderException(AiProviderErrorCodes.Timeout, "AI Provider request timed out.", true, inner: exception);
        }
        catch (HttpRequestException exception)
        {
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AI Provider is unavailable.", true, inner: exception);
        }
        catch (Exception exception) when (exception is JsonException or KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException)
        {
            throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "AI Provider returned an invalid response envelope.", false, inner: exception);
        }
    }

    private static object ToWireMessage(AiPlaygroundChatMessage message)
    {
        if (message.Role == "tool") return new { role = message.Role, content = message.Content, tool_call_id = message.ToolCallId };
        if (message.Role == "assistant" && message.ToolCalls is { Count: > 0 })
            return new
            {
                role = message.Role,
                content = message.Content,
                tool_calls = message.ToolCalls.Select(call => new
                {
                    id = call.Id,
                    type = "function",
                    function = new { name = call.Name, arguments = call.ArgumentsJson },
                }).ToArray(),
            };
        return new { role = message.Role, content = message.Content };
    }

    private static IReadOnlyList<AiPlaygroundToolCall> ParseToolCalls(JsonElement message)
    {
        if (!message.TryGetProperty("tool_calls", out var calls) || calls.ValueKind != JsonValueKind.Array) return [];
        return calls.EnumerateArray().Select(call =>
        {
            var function = call.GetProperty("function");
            return new AiPlaygroundToolCall(call.GetProperty("id").GetString() ?? throw new JsonException(),
                function.GetProperty("name").GetString() ?? throw new JsonException(),
                function.GetProperty("arguments").GetString() ?? throw new JsonException());
        }).ToArray();
    }

    private static AiProviderException Classify(HttpStatusCode status, TimeSpan? retryAfter, string body)
    {
        var lower = body.ToLowerInvariant();
        return status switch
        {
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => new(AiProviderErrorCodes.InvalidCredential, "AI Provider rejected the credential.", false),
            HttpStatusCode.NotFound when lower.Contains("model") => new(AiProviderErrorCodes.ModelNotFound, "AI model was not found.", false),
            HttpStatusCode.TooManyRequests => new(AiProviderErrorCodes.RateLimited, "AI Provider rate limit exceeded.", true, retryAfter),
            HttpStatusCode.BadRequest when lower.Contains("content") || lower.Contains("safety") => new(AiProviderErrorCodes.ContentRejected, "AI Provider rejected the content.", false),
            HttpStatusCode.BadRequest => new(AiProviderErrorCodes.SchemaFailure, "AI Provider rejected the tool request.", false),
            >= HttpStatusCode.InternalServerError => new(AiProviderErrorCodes.ProviderUnavailable, "AI Provider is unavailable.", true, retryAfter),
            _ => new(AiProviderErrorCodes.ProviderUnavailable, "AI Provider request failed.", false),
        };
    }

    private static string? ProviderRequestId(HttpResponseMessage response)
    {
        foreach (var name in new[] { "x-request-id", "request-id", "cf-ray" })
            if (response.Headers.TryGetValues(name, out var values)) return values.FirstOrDefault();
        return null;
    }
}
