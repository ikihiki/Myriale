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

    public string? NarrativeBody { get; set; }

    [MaxLength(40)]
    public string? SourceModuleTurnId { get; set; }

    public long? SourceSessionRevision { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Session Session { get; set; } = null!;
    public ModuleExecution? ModuleExecution { get; set; }
    public SessionTurn? SourceModuleTurn { get; set; }
    public SessionTurn? NarrativeTurn { get; set; }
    public SessionNarrativeHandoff? NarrativeHandoff { get; set; }
}
