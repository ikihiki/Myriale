using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Sessions.Domain;

public sealed class Session
{
    [Key, MaxLength(40)] public SessionId Id { get; internal set; }
    [Required, MaxLength(450)] public AccountId OwnerId { get; internal set; }
    [Required, MaxLength(40)] public ScenarioId ScenarioId { get; internal set; }
    public ScenarioDefinitionVersionId? ScenarioDefinitionVersionId { get; internal set; }
    public ScenarioLocationId? CurrentLocationId { get; internal set; }
    [MaxLength(120)] public string? CreationRequestId { get; internal set; }
    [MaxLength(64)] public string? CreationPayloadHash { get; internal set; }
    [Required, MaxLength(1000)] public string SelectedHero { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionStatus Status { get; internal set; } = SessionStatus.Active;
    public bool InterpretationEnabled { get; internal set; }
    [MaxLength(40)] public SessionTurnId? HeadTurnId { get; internal set; }
    public long Revision { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public SessionTurn? HeadTurn { get; internal set; }
    public SessionState State { get; internal set; } = null!;
    public ICollection<SessionTurn> Turns { get; internal set; } = [];
    public ICollection<SessionPlayerInput> PlayerInputs { get; internal set; } = [];

    public static Session Create(SessionId id, AccountId ownerId, ScenarioId scenarioId, ScenarioDefinitionVersionId? definitionVersionId,
        ScenarioLocationId? currentLocationId, string? creationRequestId, string? creationPayloadHash, string selectedHero, bool interpretationEnabled,
        SessionState state, DateTimeOffset now, SessionStatus status = SessionStatus.Active)
    {
        if (selectedHero.Length > 1000) throw new ArgumentException("Selected hero is too long.", nameof(selectedHero));
        return new Session { Id = id, OwnerId = ownerId, ScenarioId = scenarioId, ScenarioDefinitionVersionId = definitionVersionId,
            CurrentLocationId = currentLocationId, CreationRequestId = creationRequestId, CreationPayloadHash = creationPayloadHash, SelectedHero = selectedHero,
            InterpretationEnabled = interpretationEnabled, Status = status, State = state, CreatedAt = now, UpdatedAt = now };
    }

    public SessionPlayerInput AcceptInput(SessionPlayerInputId id, string requestId, string text, SessionInputInteractionType interactionType,
        string payloadHash, AccountId createdBy, SessionPlayerInputId? supersedesInputId, DateTimeOffset now)
    {
        EnsureActive();
        var input = SessionPlayerInput.Accept(id, Id, requestId, text, interactionType, payloadHash, HeadTurnId, Revision, createdBy, supersedesInputId, now);
        PlayerInputs.Add(input); Advance(now); return input;
    }

    public SessionTurn AppendOpeningTurn(SessionTurnId id, string schemaVersion, string heading, string body, DateTimeOffset now)
    {
        EnsureActive();
        if (HeadTurnId is not null || Revision != 0 || Turns.Count != 0) throw new InvalidOperationException("Opening turn must be the root turn.");
        var turn = SessionTurn.CreateOpening(id, Id, schemaVersion, heading, body, Revision, now); Append(turn, now); return turn;
    }

    public SessionTurn AppendScenarioNarrative(SessionTurnId id, SessionPlayerInputId playerInputId, string schemaVersion, string? contextSchemaVersion,
        string? promptVersion, string? heading, string body, string? interpretation, long sourceSessionRevision,
        SessionTurnAiMetadata ai, DateTimeOffset now)
    {
        EnsureActive();
        var turn = SessionTurn.CreateScenarioNarrative(id, Id, NextPosition(), HeadTurnId, playerInputId, schemaVersion,
            contextSchemaVersion, promptVersion, heading, body, interpretation, sourceSessionRevision, ai, now); Append(turn, now); return turn;
    }

    internal SessionTurn AppendScenarioCompletionNarrative(SessionTurnId id, SessionPlayerInputId playerInputId, string schemaVersion, string? contextSchemaVersion,
        string? promptVersion, string? heading, string body, string? interpretation, long sourceSessionRevision,
        SessionTurnAiMetadata ai, DateTimeOffset now)
    {
        if (Status != SessionStatus.Completed || sourceSessionRevision != Revision)
            throw new InvalidOperationException("Only the narrative for the committed completion revision may be appended.");
        var turn = SessionTurn.CreateScenarioNarrative(id, Id, NextPosition(), HeadTurnId, playerInputId, schemaVersion,
            contextSchemaVersion, promptVersion, heading, body, interpretation, sourceSessionRevision, ai, now);
        Append(turn, now);
        return turn;
    }

    public SessionTurn AppendModuleTurn(SessionTurnId id, DateTimeOffset now)
    {
        EnsureActive();
        var turn = SessionTurn.CreateModule(id, Id, NextPosition(), HeadTurnId, now); Append(turn, now); return turn;
    }

    public SessionTurn AppendModuleHandoffNarrative(SessionTurnId id, SessionTurnId sourceModuleTurnId, string schemaVersion,
        string? heading, string body, long sourceSessionRevision, SessionTurnAiMetadata ai, DateTimeOffset now)
    {
        EnsureActive();
        if (HeadTurnId != sourceModuleTurnId) throw new InvalidOperationException("Module handoff must append to the source module turn.");
        var turn = SessionTurn.CreateModuleHandoff(id, Id, NextPosition(), HeadTurnId, sourceModuleTurnId, schemaVersion,
            heading, body, sourceSessionRevision, ai, now); Append(turn, now); return turn;
    }

    public void MoveTo(ScenarioLocationId locationId, DateTimeOffset now) { EnsureActive(); CurrentLocationId = locationId; UpdatedAt = now; }
    public void Complete(DateTimeOffset now) { EnsureActive(); Status = SessionStatus.Completed; UpdatedAt = now; }
    public void ApplyScenarioEffects(long expectedRevision, ScenarioLocationId locationId, bool complete, DateTimeOffset now)
    {
        EnsureActive();
        if (Revision != expectedRevision) throw new SessionRevisionConflictException(Id, expectedRevision, Revision);
        CurrentLocationId = locationId;
        if (complete) Status = SessionStatus.Completed;
        Advance(now);
    }
    public void AdvanceRuntime(DateTimeOffset now) { EnsureActive(); Advance(now); }
    public void Touch(DateTimeOffset now) => UpdatedAt = now;

    internal SessionTurn DetachHeadForPersistence()
    {
        var turn = HeadTurn ?? throw new InvalidOperationException("Session head is required.");
        Turns.Remove(turn); HeadTurn = null; HeadTurnId = null; return turn;
    }
    internal void RestoreHeadForPersistence(SessionTurn turn)
    {
        Turns.Add(turn); HeadTurn = turn; HeadTurnId = turn.Id;
    }

    private int NextPosition() => (HeadTurn?.Position ?? Turns.Where(x => x.Id == HeadTurnId).Select(x => x.Position).SingleOrDefault()) + 1;
    private void Append(SessionTurn turn, DateTimeOffset now) { Turns.Add(turn); HeadTurnId = turn.Id; HeadTurn = turn; Advance(now); }
    private void Advance(DateTimeOffset now) { Revision++; UpdatedAt = now; }
    private void EnsureActive() { if (Status != SessionStatus.Active && Status != SessionStatus.Debug) throw new InvalidOperationException("Completed session cannot be changed."); }
}
