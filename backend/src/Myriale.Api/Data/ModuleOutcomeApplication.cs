using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ModuleOutcomeApplication
{
    public long Id { get; internal set; }
    [Required, MaxLength(40)] public string ExecutionId { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    public long ModuleExecutionRequestId { get; internal set; }
    public long ExpectedSessionRevision { get; internal set; }
    public long AppliedSessionRevision { get; internal set; }
    public int EffectCount { get; internal set; }
    public DateTimeOffset AppliedAt { get; internal set; }
    public ModuleExecution Execution { get; internal set; } = null!;
    public Session Session { get; internal set; } = null!;
    public ModuleExecutionRequest Request { get; internal set; } = null!;

    public static ModuleOutcomeApplication Create(string executionId, string sessionId, long requestId,
        long expectedSessionRevision, long appliedSessionRevision, int effectCount, DateTimeOffset appliedAt) => new()
    {
        ExecutionId = executionId, SessionId = sessionId, ModuleExecutionRequestId = requestId,
        ExpectedSessionRevision = expectedSessionRevision, AppliedSessionRevision = appliedSessionRevision,
        EffectCount = effectCount, AppliedAt = appliedAt,
    };
}
