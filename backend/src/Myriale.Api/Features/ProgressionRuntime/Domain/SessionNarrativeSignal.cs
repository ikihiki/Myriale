using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.ProgressionRuntime.Domain;

public sealed class SessionNarrativeSignal
{
    [Key, MaxLength(40)]
    public SessionNarrativeSignalId Id { get; set; }

    [Required, MaxLength(40)]
    public SessionId SessionId { get; set; }

    [Required, MaxLength(40)]
    public SessionTurnId NarrativeTurnId { get; set; }

    [Required, MaxLength(80)]
    public string Code { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Evidence { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public SessionTurn NarrativeTurn { get; set; } = null!;
    public SessionProgressionTransitionReceipt? TransitionReceipt { get; set; }
}
