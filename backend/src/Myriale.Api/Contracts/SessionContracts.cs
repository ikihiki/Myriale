namespace Myriale.Api.Contracts;

public static class NarrativeInteractionTypes
{
    public const string Dialogue = "dialogue";
    public const string Clarification = "clarification";

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.Ordinal)
    {
        Dialogue,
        Clarification,
    };
}

public sealed record CreateSessionRequest(
    string ScenarioId,
    string RequestId,
    bool InterpretationEnabled = false,
    string? SelectedHero = null);

public sealed record NarrativeTurnResponse(
    string? SourceModuleTurnId,
    long? SourceSessionRevision,
    string Body,
    string? PlayerInputId = null,
    string? PlayerInput = null,
    string? AcceptedAfterTurnId = null,
    IReadOnlyList<string>? Signals = null,
    string? Interpretation = null,
    string? SchemaVersion = null,
    string? TurnType = null,
    string? Heading = null);

public sealed record NarrativeHandoffStatusResponse(
    string Status,
    string? ErrorCode,
    string? ErrorMessage,
    DateTimeOffset UpdatedAt);

public sealed record SessionTurnResponse(
    string Id,
    int Position,
    string? PreviousTurnId,
    string Kind,
    ModuleExecutionResponse? Execution,
    NarrativeTurnResponse? Narrative,
    NarrativeHandoffStatusResponse? NarrativeHandoff,
    DateTimeOffset CreatedAt);

public sealed record SessionStateResponse(
    long Revision,
    IReadOnlyDictionary<string, bool> Flags);

public sealed record SessionProgressionResponse(
    string CurrentNode,
    long Revision,
    string? TransitionStatus,
    string? ModuleTurnId,
    string? ErrorCode);

public sealed record SessionPendingPlayerInputResponse(
    string PlayerInputId,
    string RequestId,
    string Input,
    string InteractionType,
    string? AcceptedAfterTurnId,
    string Status,
    bool IsRetryable,
    string? ErrorCode,
    string? ErrorMessage,
    int AttemptCount,
    DateTimeOffset UpdatedAt);

public sealed record SessionResponse(
    string Id,
    string ScenarioId,
    string Status,
    string? HeadTurnId,
    long Revision,
    bool InterpretationEnabled,
    SessionStateResponse State,
    SessionProgressionResponse? Progression,
    IReadOnlyList<SessionTurnResponse> Turns,
    IReadOnlyList<SessionPendingPlayerInputResponse> PendingInputs,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<SessionPlayerInputResponse>? Inputs = null,
    IReadOnlyList<SessionExecutionResponse>? Executions = null,
    IReadOnlyList<SessionArtifactResponse>? Artifacts = null,
    IReadOnlyList<SessionActivityResponse>? Activity = null,
    IReadOnlyList<SessionNoteProposalResponse>? NoteProposals = null);

public sealed record CreateSessionInputRequest(
    string RequestId,
    string Text,
    string InteractionType = NarrativeInteractionTypes.Dialogue,
    IReadOnlyList<string>? RequestedOutputs = null,
    string? SupersedesInputId = null);

public sealed record SessionPlayerInputResponse(
    string Id,
    string RequestId,
    string Text,
    string InteractionType,
    string? AcceptedAfterTurnId,
    long AcceptedSessionRevision,
    string? SupersedesInputId,
    DateTimeOffset CreatedAt);

public sealed record SessionExecutionCapabilities(bool CanRetry, bool CanCancel, bool CanDismiss);

public sealed record SessionExecutionAttemptDiagnosticsResponse(
    string Id,
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
    string? PromptVersion,
    string? ContextHash,
    int? ContextSizeBytes);

public sealed record SessionExecutionDiagnosticsResponse(
    string SessionId,
    string TriggerType,
    string TriggerId,
    long Revision,
    string? LeaseOwner,
    string? LeaseTokenHint,
    DateTimeOffset? LeaseExpiresAt,
    IReadOnlyList<SessionExecutionAttemptDiagnosticsResponse> Attempts);

public sealed record SessionExecutionResponse(
    string Id,
    string SessionId,
    string Kind,
    string TriggerType,
    string TriggerId,
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
    SessionExecutionDiagnosticsResponse? DevelopmentDiagnostics);

public sealed record SessionArtifactResponse(
    string Id,
    string ExecutionId,
    string Kind,
    string Status,
    string ContentType,
    string? MediaUrl,
    string? MetadataJson,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CommittedAt);

public sealed record SessionActivityResponse(string Type, string Id, long Order, string? CausalId = null);

public sealed record SessionInputAcceptedResponse(SessionPlayerInputResponse Input, SessionExecutionResponse Execution);

public sealed record SessionNoteProposalResponse(
    string ArtifactId,
    string SourceTurnId,
    string? NoteId,
    long ExpectedNoteRevision,
    string ProposedTitle,
    string BeforeBody,
    string ProposedBody,
    string Rationale,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record ReviewSessionNoteProposalRequest(long ExpectedNoteRevision, string? Title = null, string? Body = null);

public sealed class AttachSessionImageRequest
{
    public required IFormFile File { get; init; }
    public required string SessionId { get; init; }
    public required string ExecutionId { get; init; }
    public required string AttemptId { get; init; }
    public required string Checksum { get; init; }
    public required string ModerationDecision { get; init; }
    public string? ModerationMetadataJson { get; init; }
    public string? SourceTurnId { get; init; }
    public string? SourceInputId { get; init; }
    public DateTimeOffset? RetainUntil { get; init; }
}

public sealed record SessionImageAttachmentResponse(
    string ImageId,
    string ArtifactId,
    string MediaUrl,
    string ContentType,
    long SizeBytes,
    int Width,
    int Height,
    string Checksum,
    string ModerationMetadataJson,
    DateTimeOffset CreatedAt,
    DateTimeOffset? RetainUntil);

public sealed record SessionErrorResponse(string Code, string Message, string? Details = null);
