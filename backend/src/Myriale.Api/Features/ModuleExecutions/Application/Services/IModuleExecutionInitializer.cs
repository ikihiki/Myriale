using Myriale.Api.Architecture;
using Myriale.Api.Features.ModuleExecutions.Contracts;

namespace Myriale.Api.Features.ModuleExecutions.Application.Services;

[CrossSliceContract]
public enum ModuleExecutionInitializationOutcome
{
    Created,
    InvalidRequest,
    Conflict,
    Unprocessable,
    Unavailable,
}

[CrossSliceContract]
public sealed record ModuleExecutionInitializationResult(
    ModuleExecutionInitializationOutcome Outcome,
    ModuleExecutionId? ExecutionId = null,
    SessionTurnId? SessionTurnId = null,
    string? ErrorCode = null,
    string? ErrorMessage = null);

[CrossSliceContract]
public interface IModuleExecutionInitializer
{
    Task<ModuleExecutionInitializationResult> InitializeSessionTurnAsync(
        AccountId ownerId,
        SessionId sessionId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken);
}
