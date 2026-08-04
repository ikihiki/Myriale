using Myriale.Api.Contracts;

namespace Myriale.Api.Application.ModuleExecutions;

public enum ModuleExecutionOutcome
{
    Success, Created, NotFound, InvalidRequest, Conflict, Unprocessable, Unavailable
}

public sealed record ModuleExecutionResult(
    ModuleExecutionOutcome Outcome,
    ModuleExecutionResponse? Execution = null,
    ModuleExecutionErrorResponse? Error = null,
    bool Replayed = false,
    string? SessionTurnId = null);

public enum SessionTurnInitializationPolicy { UserRequested, ScenarioProgression }

public interface IModuleExecutionWorkflow
{
    Task<ModuleExecutionResult> InitializeDetachedAsync(string ownerId, InitializeModuleExecutionRequest request, CancellationToken cancellationToken);
    Task<ModuleExecutionResult> InitializeSessionTurnAsync(string ownerId, string sessionId, InitializeModuleExecutionRequest request, SessionTurnInitializationPolicy policy, CancellationToken cancellationToken);
    Task<ModuleExecutionResult> DispatchAsync(string ownerId, string executionId, DispatchModuleExecutionRequest request, CancellationToken cancellationToken);
}

public sealed class InitializeDetachedModuleExecutionCommand(IModuleExecutionWorkflow workflow)
{
    public Task<ModuleExecutionResult> ExecuteAsync(string ownerId, InitializeModuleExecutionRequest request, CancellationToken cancellationToken) =>
        workflow.InitializeDetachedAsync(ownerId, request, cancellationToken);
}

public sealed class InitializeSessionTurnModuleExecutionCommand(IModuleExecutionWorkflow workflow)
{
    public Task<ModuleExecutionResult> ExecuteAsync(string ownerId, string sessionId, InitializeModuleExecutionRequest request,
        SessionTurnInitializationPolicy policy, CancellationToken cancellationToken) =>
        workflow.InitializeSessionTurnAsync(ownerId, sessionId, request, policy, cancellationToken);
}

public sealed class DispatchModuleExecutionCommand(IModuleExecutionWorkflow workflow)
{
    public Task<ModuleExecutionResult> ExecuteAsync(string ownerId, string executionId, DispatchModuleExecutionRequest request, CancellationToken cancellationToken) =>
        workflow.DispatchAsync(ownerId, executionId, request, cancellationToken);
}

public sealed class GetModuleExecutionQuery(IModuleExecutionRepository repository, IModuleExecutionProjection projection)
{
    public async Task<ModuleExecutionResult> ExecuteAsync(string ownerId, string executionId, CancellationToken cancellationToken)
    {
        var execution = await repository.GetOwnedAsync(executionId, ownerId, tracking: false, cancellationToken);
        return execution is null ? new(ModuleExecutionOutcome.NotFound) : new(ModuleExecutionOutcome.Success, projection.ToResponse(execution));
    }
}
