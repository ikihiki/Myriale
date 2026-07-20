using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionTurn
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    public int Position { get; set; }

    [Required, MaxLength(32)]
    public string Kind { get; set; } = "module";

    public DateTimeOffset CreatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public ModuleExecution ModuleExecution { get; set; } = null!;
}
