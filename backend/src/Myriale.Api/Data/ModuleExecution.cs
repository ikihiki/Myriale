using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ModuleExecution
{
    [Key, MaxLength(40)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(450)]
    public string OwnerId { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string ModuleId { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string ModuleVersion { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string ModuleDigest { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string ContractVersion { get; set; } = string.Empty;

    [Required]
    public string CapabilitiesJson { get; set; } = "[]";

    public int ConfigurationSchemaVersion { get; set; }
    public int StateSchemaVersion { get; set; }

    [Required]
    public string ConfigurationJson { get; set; } = string.Empty;

    [Required]
    public string ContextJson { get; set; } = string.Empty;

    [Required]
    public string StateJson { get; set; } = "{}";

    [Required]
    public string ViewStateJson { get; set; } = "{}";

    [Required]
    public string AvailableActionsJson { get; set; } = "[]";

    [Required, MaxLength(32)]
    public string Status { get; set; } = "initializing";

    public long Revision { get; set; } = -1;
    public string? OutcomeJson { get; set; }
    public string? ErrorJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    [MaxLength(40)]
    public string? SessionTurnId { get; set; }

    public ModuleOutcomeApplication? OutcomeApplication { get; set; }
    public ICollection<ModuleExecutionRequest> Requests { get; set; } = [];
    public SessionTurn? SessionTurn { get; set; }
}
