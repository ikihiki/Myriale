using Microsoft.Extensions.AI;
using Myriale.Api.Architecture;

namespace Myriale.Api.Features.AiProviders.Application.Services;

[CrossSliceContract]
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

[CrossSliceContract]
public sealed class AiProviderException(
    string code,
    string message,
    bool retryable,
    TimeSpan? retryAfter = null,
    Exception? inner = null,
    string? providerResponseExcerpt = null,
    string? sentPrompt = null,
    string? receivedResult = null,
    AiGenerationMetadata? metadata = null)
    : Exception(message, inner)
{
    public string Code { get; } = code;
    public bool Retryable { get; } = retryable;
    public TimeSpan? RetryAfter { get; } = retryAfter;
    public string? SentPrompt { get; } = sentPrompt;
    public string? ReceivedResult { get; } = receivedResult;
    public AiGenerationMetadata? Metadata { get; } = metadata;
    public string? ProviderResponseExcerpt { get; } = providerResponseExcerpt;
}

/// <summary>Optional per-request generation controls. <see cref="RetryAttempts"/> counts retries after the initial wire attempt, so zero disables retries.</summary>
[CrossSliceContract]
public sealed record AiGenerationOverrides(
    double? Temperature = null,
    double? TopP = null,
    double? RepetitionPenalty = null,
    long? Seed = null,
    int? MaxOutputTokens = null,
    bool? ThinkingEnabled = null,
    int? RetryAttempts = null);

[CrossSliceContract]
public sealed record AiTextRequest(
    IReadOnlyList<ChatMessage> Messages,
    ChatResponseFormatJson ResponseFormat,
    AiGenerationOverrides? GenerationOverrides = null);

[CrossSliceContract]
public sealed record AiGenerationMetadata(
    AiProviderProfileId Provider,
    string Model,
    string? ResponseId,
    int? InputTokens,
    int? OutputTokens,
    long LatencyMilliseconds,
    int AttemptCount,
    string? FinishReason,
    AiGenerationOverrides? GenerationOverrides = null);

[CrossSliceContract]
public sealed record AiTextResponse(string Text, AiGenerationMetadata Metadata);

[CrossSliceContract]
public interface IAiTextService
{
    Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken);
    Task<AiTextResponse> GenerateForProfileAsync(AiProviderProfileId profileId, AiTextRequest request, CancellationToken cancellationToken) => GenerateAsync(request, cancellationToken);
    Task<AiTextResponse> GenerateForProviderAsync(AiProviderProfileId provider, string credential, AiTextRequest request, CancellationToken cancellationToken);
    Task TestConnectionAsync(AiProviderProfileId provider, string credential, CancellationToken cancellationToken);
}
