namespace Myriale.Api.Contracts;

public sealed record CreateSessionRequest(string ScenarioId);

public sealed record NarrativeTurnResponse(
    string SourceModuleTurnId,
    long SourceSessionRevision,
    string Body);

public sealed record SessionTurnResponse(
    string Id,
    int Position,
    string Kind,
    ModuleExecutionResponse? Execution,
    NarrativeTurnResponse? Narrative,
    DateTimeOffset CreatedAt);

public sealed record SessionStateResponse(
    long Revision,
    IReadOnlyDictionary<string, bool> Flags);

public sealed record SessionResponse(
    string Id,
    string ScenarioId,
    string Status,
    SessionStateResponse State,
    IReadOnlyList<SessionTurnResponse> Turns,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SessionErrorResponse(string Code, string Message);
