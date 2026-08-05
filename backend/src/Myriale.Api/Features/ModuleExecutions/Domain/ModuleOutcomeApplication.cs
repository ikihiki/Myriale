using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.ModuleExecutions.Domain;

public sealed class ModuleOutcomeApplication
{
    public ModuleOutcomeApplicationId Id { get; internal set; }
    [Required, MaxLength(40)] public ModuleExecutionId ExecutionId { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    public ModuleExecutionRequestId ModuleExecutionRequestId { get; internal set; }
    public long ExpectedSessionRevision { get; internal set; }
    public long AppliedSessionRevision { get; internal set; }
    public int EffectCount { get; internal set; }
    public DateTimeOffset AppliedAt { get; internal set; }
    public ModuleExecution Execution { get; internal set; } = null!;
    public ModuleExecutionRequest Request { get; internal set; } = null!;

    public static ModuleOutcomeApplication Create(ModuleExecutionId executionId, SessionId sessionId, ModuleExecutionRequestId requestId,
        long expectedSessionRevision, long appliedSessionRevision, int effectCount, DateTimeOffset appliedAt) => new()
    {
        ExecutionId = executionId, SessionId = sessionId, ModuleExecutionRequestId = requestId,
        ExpectedSessionRevision = expectedSessionRevision, AppliedSessionRevision = appliedSessionRevision,
        EffectCount = effectCount, AppliedAt = appliedAt,
    };
}
