using Myriale.Api.Architecture;
namespace Myriale.Api.Features.SessionExecutions.Contracts;

[CrossSliceContract]
public sealed record SessionExecutionCapabilities(bool CanRetry, bool CanCancel, bool CanDismiss);

[CrossSliceContract]
public sealed record SessionExecutionAttemptDiagnosticsResponse(
    SessionExecutionAttemptId Id,
    int AttemptNumber,
    string Status,
    string? WorkerId,
    string? Provider,
    string? Model,
    string? ProviderRequestId,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    long? LatencyMilliseconds,
    int? InputTokens,
    int? OutputTokens,
    string? FinishReason,
    string? ErrorCode,
    string? ErrorCategory,
    bool Retryable,
    string? CorrelationId,
    string? TraceId,
    string? SpanId,
    string? ExceptionChain,
    string? RedactedResponseExcerpt,
    string? SentPrompt,
    string? ReceivedResult,
    string? ValidationResult,
    string? PromptVersion,
    string? ContextHash,
    int? ContextSizeBytes);

[CrossSliceContract]
public sealed record SessionExecutionDiagnosticsResponse(
    SessionId SessionId,
    string TriggerType,
    SessionExecutionTriggerId TriggerId,
    long Revision,
    string? LeaseOwner,
    string? LeaseTokenHint,
    DateTimeOffset? LeaseExpiresAt,
    IReadOnlyList<SessionExecutionAttemptDiagnosticsResponse> Attempts);

[CrossSliceContract]
public sealed record SessionExecutionResponse(
    SessionExecutionId Id,
    SessionId SessionId,
    string Kind,
    string TriggerType,
    SessionExecutionTriggerId TriggerId,
    string Status,
    long Revision,
    bool IsRetryable,
    int AttemptCount,
    int MaxAttempts,
    DateTimeOffset? NextAttemptAt,
    string? ErrorCode,
    string? UserErrorMessage,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelRequestedAt,
    DateTimeOffset? DismissedAt,
    SessionExecutionCapabilities Capabilities,
    SessionExecutionDiagnosticsResponse? DevelopmentDiagnostics,
    string? Stage = null,
    int SchemaVersion = 1,
    SessionScenarioTurnProjectionResponse? ScenarioTurn = null,
    AiProviderProfileId? ActionDecisionAiProfileId = null,
    AiProviderProfileId? NarrativeAiProfileId = null);
