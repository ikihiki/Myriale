using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class Session
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(450)]
    public string OwnerId { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string ScenarioId { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? CreationRequestId { get; set; }

    [Required, MaxLength(1000)]
    public string SelectedHero { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Status { get; set; } = "active";

    public bool InterpretationEnabled { get; set; }

    [MaxLength(40)]
    public string? HeadTurnId { get; set; }

    public long Revision { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Scenario Scenario { get; set; } = null!;
    public SessionTurn? HeadTurn { get; set; }
    public SessionState State { get; set; } = null!;
    public SessionProgressState? Progress { get; set; }
    public ICollection<SessionTurn> Turns { get; set; } = [];
    public ICollection<ModuleOutcomeApplication> OutcomeApplications { get; set; } = [];
    public ICollection<SessionPendingPlayerInput> PendingPlayerInputs { get; set; } = [];
    public ICollection<SessionPlayerInput> PlayerInputs { get; set; } = [];
    public ICollection<SessionExecution> Executions { get; set; } = [];
    public ICollection<SessionNote> Notes { get; set; } = [];
    public ICollection<SessionNarrativeSignal> NarrativeSignals { get; set; } = [];
    public ICollection<SessionProgressionTransitionReceipt> ProgressionTransitionReceipts { get; set; } = [];
    public ICollection<SessionProgressionModuleSnapshot> ProgressionModuleSnapshots { get; set; } = [];
}
