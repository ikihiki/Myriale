namespace Myriale.Api.Contracts;

public sealed record CreateSessionRequest(
    string ScenarioId,
    string? RequestId = null,
    bool InterpretationEnabled = false);

public sealed record CreateNarrativeTurnRequest(string RequestId, string Input);

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

public sealed record SessionPlayerInputWorkResponse(
    string PlayerInputId,
    string RequestId,
    string Input,
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
    IReadOnlyList<SessionPlayerInputWorkResponse> PendingInputs,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SessionErrorResponse(string Code, string Message);
