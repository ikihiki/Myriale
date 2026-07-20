using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ModuleOutcomeApplication
{
    public long Id { get; set; }

    [Required, MaxLength(40)]
    public string ExecutionId { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    public string SessionId { get; set; } = string.Empty;

    public long ModuleExecutionRequestId { get; set; }
    public long ExpectedSessionRevision { get; set; }
    public long AppliedSessionRevision { get; set; }
    public int EffectCount { get; set; }
    public DateTimeOffset AppliedAt { get; set; }

    public ModuleExecution Execution { get; set; } = null!;
    public Session Session { get; set; } = null!;
    public ModuleExecutionRequest Request { get; set; } = null!;
}
