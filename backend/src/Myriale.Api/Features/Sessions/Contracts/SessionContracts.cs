using Myriale.Api.Architecture;

namespace Myriale.Api.Features.Sessions.Contracts;

[CrossSliceContract]
public sealed class SessionRevisionConflictException(SessionId targetId, long expected, long actual)
    : Exception($"Session revision conflict for '{targetId.AsPrimitive()}'. Expected {expected}, actual {actual}.")
{
    public SessionId TargetId { get; } = targetId;
    public long ExpectedRevision { get; } = expected;
    public long ActualRevision { get; } = actual;
}

public sealed record CreateSessionRequest(
    ScenarioId ScenarioId,
    string RequestId,
    bool InterpretationEnabled = false,
    string? SelectedHero = null);

public sealed record NarrativeTurnResponse(
    SessionTurnId? SourceModuleTurnId,
    long? SourceSessionRevision,
    string Body,
    SessionPlayerInputId? PlayerInputId = null,
    string? PlayerInput = null,
    SessionTurnId? AcceptedAfterTurnId = null,
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
    SessionTurnId Id,
    int Position,
    SessionTurnId? PreviousTurnId,
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
    SessionTurnId? ModuleTurnId,
    string? ErrorCode);

public sealed record SessionPendingPlayerInputResponse(
    SessionPlayerInputId PlayerInputId,
    string RequestId,
    string Input,
    string InteractionType,
    SessionTurnId? AcceptedAfterTurnId,
    string Status,
    bool IsRetryable,
    string? ErrorCode,
    string? ErrorMessage,
    int AttemptCount,
    DateTimeOffset UpdatedAt);

public sealed record SessionResponse(
    SessionId Id,
    ScenarioId ScenarioId,
    string Status,
    SessionTurnId? HeadTurnId,
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
    ScenarioDefinitionVersionId? ScenarioDefinitionVersionId = null,
    ScenarioLocationId? CurrentLocationId = null,
    IReadOnlyList<SessionObjectStateResponse>? ObjectStates = null,
    IReadOnlyList<SessionRuleActionStepResponse>? RuleActionSteps = null);

public sealed record CreateSessionInputRequest(
    string RequestId,
    string Text,
    string InteractionType = "dialogue",
    SessionPlayerInputId? SupersedesInputId = null,
    AiProviderProfileId? ActionDecisionAiProfileId = null,
    AiProviderProfileId? NarrativeAiProfileId = null);

public sealed record SessionPlayerInputResponse(
    SessionPlayerInputId Id,
    string RequestId,
    string Text,
    string InteractionType,
    SessionTurnId? AcceptedAfterTurnId,
    long AcceptedSessionRevision,
    SessionPlayerInputId? SupersedesInputId,
    DateTimeOffset CreatedAt);

public sealed record SessionInputAcceptedResponse(SessionPlayerInputResponse Input, SessionExecutionResponse Execution);

[CrossSliceContract]
public sealed record SessionErrorResponse(string Code, string Message, string? Details = null);
