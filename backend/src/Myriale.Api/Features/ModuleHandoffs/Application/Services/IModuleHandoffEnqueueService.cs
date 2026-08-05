using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModuleHandoffs.Application.Services;

[CrossSliceContract]
public enum ModuleHandoffEnqueueOutcome { Enqueued, Existing }

[CrossSliceContract]
public sealed record ModuleHandoffEnqueueRequest(
    ModuleExecutionId ExecutionId,
    SessionTurnId SessionTurnId,
    string OutcomeJson);

[CrossSliceContract]
public interface IModuleHandoffEnqueueService
{
    Task<ModuleHandoffEnqueueOutcome> EnqueueAsync(
        ModuleHandoffEnqueueRequest request,
        CancellationToken cancellationToken);
}
