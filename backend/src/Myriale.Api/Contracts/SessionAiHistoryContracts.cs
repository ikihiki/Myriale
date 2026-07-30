namespace Myriale.Api.Contracts;

public sealed record SessionAiHistoryResponse(
    string SessionId,
    string ScenarioId,
    string ScenarioTitle,
    IReadOnlyList<SessionAiInteractionDto> Interactions);

public sealed record SessionAiInteractionDto(
    string Id,
    string ExecutionId,
    string ExecutionAttemptId,
    int AttemptNumber,
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
