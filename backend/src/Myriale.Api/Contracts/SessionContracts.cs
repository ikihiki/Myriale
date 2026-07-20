namespace Myriale.Api.Contracts;

public sealed record CreateSessionRequest(string ScenarioId);

public sealed record CreateNarrativeTurnRequest(string RequestId, string Input);

public sealed record NarrativeTurnResponse(
    string? SourceModuleTurnId,
    long? SourceSessionRevision,
    string Body,
    string? PlayerInputId = null,
    string? PlayerInput = null,
    string? AcceptedAfterTurnId = null,
    IReadOnlyList<string>? Signals = null);

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

public sealed record SessionResponse(
    string Id,
    string ScenarioId,
    string Status,
    string? HeadTurnId,
    long Revision,
    SessionStateResponse State,
    SessionProgressionResponse? Progression,
    IReadOnlyList<SessionTurnResponse> Turns,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SessionErrorResponse(string Code, string Message);
