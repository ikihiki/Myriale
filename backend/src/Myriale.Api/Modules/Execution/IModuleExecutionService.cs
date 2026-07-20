using Myriale.Api.Contracts;

namespace Myriale.Api.Modules.Execution;

public interface IModuleExecutionService
{
    Task<ModuleExecutionServiceResult> InitializeAsync(string ownerId, InitializeModuleExecutionRequest request, CancellationToken cancellationToken);
    Task<ModuleExecutionServiceResult> InitializeSessionTurnAsync(string ownerId, string sessionId, InitializeModuleExecutionRequest request, CancellationToken cancellationToken);
    Task<ModuleExecutionServiceResult> InitializeScenarioSessionTurnAsync(string ownerId, string sessionId, InitializeModuleExecutionRequest request, CancellationToken cancellationToken);
    Task<ModuleExecutionServiceResult> GetAsync(string ownerId, string executionId, CancellationToken cancellationToken);
    Task<ModuleExecutionServiceResult> DispatchAsync(string ownerId, string executionId, DispatchModuleExecutionRequest request, CancellationToken cancellationToken);
}

public sealed record ModuleExecutionServiceResult(
    int StatusCode,
    ModuleExecutionResponse? Response = null,
    ModuleExecutionErrorResponse? Error = null,
    bool Replayed = false,
    string? Location = null,
    string? SessionTurnId = null);
