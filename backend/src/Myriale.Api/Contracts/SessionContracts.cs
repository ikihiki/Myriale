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
    string? RequestId = null,
    bool InterpretationEnabled = false,
    string? SelectedHero = null);

public sealed record CreateNarrativeTurnRequest(
    string RequestId,
    string Input,
    string InteractionType = NarrativeInteractionTypes.Dialogue);

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
    DateTimeOffset UpdatedAt);

public sealed record SessionErrorResponse(string Code, string Message, string? Details = null);
