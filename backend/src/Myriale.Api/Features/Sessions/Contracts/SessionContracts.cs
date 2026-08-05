namespace Myriale.Api.Features.Sessions.Contracts;

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
    IReadOnlyList<SessionNoteProposalResponse>? NoteProposals = null,
    string? ScenarioDefinitionVersionId = null,
    string? CurrentLocationId = null,
    IReadOnlyList<SessionObjectStateResponse>? ObjectStates = null,
    IReadOnlyList<SessionRuleActionStepResponse>? RuleActionSteps = null);

public sealed record CreateSessionInputRequest(
    string RequestId,
    string Text,
    string InteractionType = "dialogue",
    string? SupersedesInputId = null,
    string? ActionDecisionAiProfileId = null,
    string? NarrativeAiProfileId = null);

public sealed record SessionPlayerInputResponse(
    string Id,
    string RequestId,
    string Text,
    string InteractionType,
    string? AcceptedAfterTurnId,
    long AcceptedSessionRevision,
    string? SupersedesInputId,
    DateTimeOffset CreatedAt);

public sealed record SessionInputAcceptedResponse(SessionPlayerInputResponse Input, SessionExecutionResponse Execution);

public sealed record SessionErrorResponse(string Code, string Message, string? Details = null);
