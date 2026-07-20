namespace Myriale.Api.Contracts;

public sealed record CreateSessionRequest(string ScenarioId);

public sealed record SessionTurnResponse(
    string Id,
    int Position,
    string Kind,
    ModuleExecutionResponse Execution,
    DateTimeOffset CreatedAt);

public sealed record SessionResponse(
    string Id,
    string ScenarioId,
    string Status,
    IReadOnlyList<SessionTurnResponse> Turns,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SessionErrorResponse(string Code, string Message);
