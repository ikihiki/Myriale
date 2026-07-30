namespace Myriale.Api.Contracts;

public sealed record SessionAiInteractionDto(
    string Id,
    string ExecutionId,
    int Sequence,
    string Stage,
    string AiProfileId,
    string? Provider,
    string? Model,
    string? ProviderRequestId,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    long? LatencyMilliseconds,
    int? InputTokens,
    int? OutputTokens,
    string? FinishReason,
    string Status,
    string? ErrorCode,
    string? SentPrompt,
    string? ReceivedResult,
    string? ValidationResult);
