using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionTurn
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    public int Position { get; set; }

    [MaxLength(40)]
    public string? PreviousTurnId { get; set; }

    [Required, MaxLength(32)]
    public string Kind { get; set; } = "module";

    [MaxLength(40)]
    public string? DialogueSchemaVersion { get; set; }

    [MaxLength(40)]
    public string? ContextSchemaVersion { get; set; }

    public string? ContextComponentIdsJson { get; set; }
    public int? ContextSizeBytes { get; set; }

    [MaxLength(64)]
    public string? ContextHash { get; set; }

    [MaxLength(40)]
    public string? PromptVersion { get; set; }

    [MaxLength(32)]
    public string? DialogueTurnType { get; set; }

    [MaxLength(120)]
    public string? Heading { get; set; }

    public string? NarrativeBody { get; set; }

    [MaxLength(500)]
    public string? Interpretation { get; set; }

    [MaxLength(40)]
    public string? SourceModuleTurnId { get; set; }

    [MaxLength(40)]
    public string? PlayerInputId { get; set; }

    [MaxLength(40)] public string? AiProvider { get; set; }
    [MaxLength(160)] public string? AiModel { get; set; }
    [MaxLength(160)] public string? AiResponseId { get; set; }
    public int? AiInputTokens { get; set; }
    public int? AiOutputTokens { get; set; }
    public long? AiLatencyMilliseconds { get; set; }
    public int? AiAttemptCount { get; set; }
    [MaxLength(80)] public string? AiFinishReason { get; set; }

    public long? SourceSessionRevision { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public SessionTurn? PreviousTurn { get; set; }
    public SessionTurn? NextTurn { get; set; }
    public ModuleExecution? ModuleExecution { get; set; }
    public SessionTurn? SourceModuleTurn { get; set; }
    public SessionTurn? NarrativeTurn { get; set; }
    public SessionPlayerInput? PlayerInput { get; set; }
    public ICollection<SessionTurnLorebookReference> LorebookReferences { get; set; } = [];
    public ICollection<SessionNarrativeSignal> NarrativeSignals { get; set; } = [];
}
