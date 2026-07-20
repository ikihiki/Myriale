using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionPlayerInput
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string RequestId { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Text { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string InteractionType { get; set; } = "dialogue";

    [Required, MaxLength(64)]
    public string PayloadHash { get; set; } = string.Empty;

    [MaxLength(40)]
    public string? AcceptedAfterTurnId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public SessionTurn? AcceptedAfterTurn { get; set; }
    public SessionTurn? NarrativeTurn { get; set; }
    public SessionPlayerInputWork Work { get; set; } = null!;
}
