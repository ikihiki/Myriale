using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Sessions.Domain;

public sealed record SessionTurnAiMetadata(string? Provider = null, string? Model = null, string? ResponseId = null,
    int? InputTokens = null, int? OutputTokens = null, long? LatencyMilliseconds = null, int? AttemptCount = null, string? FinishReason = null)
{
    public static SessionTurnAiMetadata None { get; } = new();
}

public sealed class SessionTurn
{
    [Key, MaxLength(40)] public SessionTurnId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    public int Position { get; internal set; }
    [MaxLength(40)] public SessionTurnId? PreviousTurnId { get; internal set; }
    [Required, MaxLength(32)] public SessionTurnKind Kind { get; internal set; } = SessionTurnKind.Module;
    [MaxLength(40)] public string? DialogueSchemaVersion { get; internal set; }
    [MaxLength(40)] public string? ContextSchemaVersion { get; internal set; }
    public string? ContextComponentIdsJson { get; internal set; }
    public int? ContextSizeBytes { get; internal set; }
    [MaxLength(64)] public string? ContextHash { get; internal set; }
    [MaxLength(40)] public string? PromptVersion { get; internal set; }
    [MaxLength(32)] public SessionTurnType? DialogueTurnType { get; internal set; }
    [MaxLength(120)] public string? Heading { get; internal set; }
    public string? NarrativeBody { get; internal set; }
    [MaxLength(500)] public string? Interpretation { get; internal set; }
    [MaxLength(40)] public SessionTurnId? SourceModuleTurnId { get; internal set; }
    [MaxLength(40)] public SessionPlayerInputId? PlayerInputId { get; internal set; }
    [MaxLength(40)] public string? AiProvider { get; internal set; }
    [MaxLength(160)] public string? AiModel { get; internal set; }
    [MaxLength(160)] public string? AiResponseId { get; internal set; }
    public int? AiInputTokens { get; internal set; }
    public int? AiOutputTokens { get; internal set; }
    public long? AiLatencyMilliseconds { get; internal set; }
    public int? AiAttemptCount { get; internal set; }
    [MaxLength(80)] public string? AiFinishReason { get; internal set; }
    public long? SourceSessionRevision { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }

    public Session Session { get; internal set; } = null!;
    public SessionTurn? PreviousTurn { get; internal set; }
    public SessionTurn? NextTurn { get; internal set; }
    public ModuleExecution? ModuleExecution { get; internal set; }
    public SessionTurn? SourceModuleTurn { get; internal set; }
    public SessionTurn? NarrativeTurn { get; internal set; }
    public SessionPlayerInput? PlayerInput { get; internal set; }
    public ICollection<SessionTurnLorebookReference> LorebookReferences { get; internal set; } = [];
    public ICollection<SessionNarrativeSignal> NarrativeSignals { get; internal set; } = [];

    public static SessionTurn CreateOpening(SessionTurnId id, SessionId sessionId, string schemaVersion, string heading, string body, long sourceRevision, DateTimeOffset now) =>
        Narrative(id, sessionId, 1, null, SessionTurnType.Opening, schemaVersion, heading, body, null, null, null, sourceRevision, SessionTurnAiMetadata.None, now);

    public static SessionTurn CreateScenarioNarrative(SessionTurnId id, SessionId sessionId, int position, SessionTurnId? previousTurnId, SessionPlayerInputId playerInputId,
        string schemaVersion, string? contextSchemaVersion, string? promptVersion, string? heading, string body, string? interpretation,
        long sourceRevision, SessionTurnAiMetadata ai, DateTimeOffset now)
    {
        if (previousTurnId is null) throw new InvalidOperationException("Action result requires predecessor and player input.");
        var turn = Narrative(id, sessionId, position, previousTurnId, SessionTurnType.ActionResult, schemaVersion, heading, body,
            playerInputId, null, interpretation, sourceRevision, ai, now);
        turn.ContextSchemaVersion = contextSchemaVersion; turn.PromptVersion = promptVersion; return turn;
    }

    public static SessionTurn CreateModule(SessionTurnId id, SessionId sessionId, int position, SessionTurnId? previousTurnId, ModuleExecution execution, DateTimeOffset now)
    {
        if (execution is null) throw new ArgumentNullException(nameof(execution));
        if (position > 1 && previousTurnId is null) throw new InvalidOperationException("Non-root module turn requires predecessor.");
        return new SessionTurn { Id = id, SessionId = sessionId, Position = position, PreviousTurnId = previousTurnId,
            Kind = SessionTurnKind.Module, ModuleExecution = execution, CreatedAt = now };
    }

    public static SessionTurn CreateModuleHandoff(SessionTurnId id, SessionId sessionId, int position, SessionTurnId? previousTurnId, SessionTurnId sourceModuleTurnId,
        string schemaVersion, string? heading, string body, long sourceRevision, SessionTurnAiMetadata ai, DateTimeOffset now)
    {
        if (previousTurnId != sourceModuleTurnId)
            throw new InvalidOperationException("Module handoff requires its source module as predecessor.");
        return Narrative(id, sessionId, position, previousTurnId, SessionTurnType.ModuleHandoff, schemaVersion, heading, body,
            null, sourceModuleTurnId, null, sourceRevision, ai, now);
    }

    private static SessionTurn Narrative(SessionTurnId id, SessionId sessionId, int position, SessionTurnId? previousTurnId, SessionTurnType type,
        string schemaVersion, string? heading, string body, SessionPlayerInputId? playerInputId, SessionTurnId? sourceModuleTurnId, string? interpretation,
        long sourceRevision, SessionTurnAiMetadata ai, DateTimeOffset now)
    {
        if (position < 1 || string.IsNullOrWhiteSpace(schemaVersion))
            throw new ArgumentException("Canonical narrative turn data is required.");
        if (type == SessionTurnType.Opening && (previousTurnId is not null || playerInputId is not null || sourceModuleTurnId is not null))
            throw new InvalidOperationException("Opening turn cannot have causal sources.");
        return new SessionTurn { Id = id, SessionId = sessionId, Position = position, PreviousTurnId = previousTurnId,
            Kind = SessionTurnKind.Narrative, DialogueSchemaVersion = schemaVersion, DialogueTurnType = type, Heading = heading,
            NarrativeBody = body, Interpretation = interpretation, PlayerInputId = playerInputId, SourceModuleTurnId = sourceModuleTurnId,
            SourceSessionRevision = sourceRevision, AiProvider = ai.Provider, AiModel = ai.Model, AiResponseId = ai.ResponseId,
            AiInputTokens = ai.InputTokens, AiOutputTokens = ai.OutputTokens, AiLatencyMilliseconds = ai.LatencyMilliseconds,
            AiAttemptCount = ai.AttemptCount, AiFinishReason = ai.FinishReason, CreatedAt = now };
    }
}
