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

    [Required, MaxLength(32)]
    public string Status { get; set; } = "active";

    public int NextTurnPosition { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Scenario Scenario { get; set; } = null!;
    public ICollection<SessionTurn> Turns { get; set; } = [];
}
