using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ModuleExecutionRequest
{
    public long Id { get; set; }

    [Required, MaxLength(450)]
    public string OwnerId { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string ExecutionId { get; set; } = string.Empty;

    [Required, MaxLength(128)]
    public string RequestId { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Operation { get; set; } = string.Empty;

    public long? ExpectedRevision { get; set; }

    public long? ExpectedSessionRevision { get; set; }

    [Required, MaxLength(64)]
    public string PayloadHash { get; set; } = string.Empty;

    public string? ActionJson { get; set; }

    [Required]
    public string RandomValuesJson { get; set; } = "[]";

    [Required, MaxLength(20)]
    public string Status { get; set; } = "pending";

    public string? ResponseJson { get; set; }
    public int? ResponseStatusCode { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public ModuleOutcomeApplication? OutcomeApplication { get; set; }
    public ModuleExecution Execution { get; set; } = null!;
}
