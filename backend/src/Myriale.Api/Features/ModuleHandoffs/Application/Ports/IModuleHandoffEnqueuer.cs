using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModuleHandoffs.Application.Ports;

[CrossSliceContract]
public enum ModuleHandoffEnqueueOutcome { Enqueued, Existing }

[CrossSliceContract]
public sealed record ModuleHandoffEnqueueRequest(
    ModuleExecutionId ExecutionId,
    SessionTurnId SessionTurnId,
    string OutcomeJson);

[CrossSliceContract]
public interface IModuleHandoffEnqueuer
{
    Task<ModuleHandoffEnqueueOutcome> EnqueueAsync(
        ModuleHandoffEnqueueRequest request,
        CancellationToken cancellationToken);
}
