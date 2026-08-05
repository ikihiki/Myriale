using Myriale.Api.Features.ModuleExecutions.Application.Services;

namespace Myriale.Api.Features.ModuleExecutions.Application;

public sealed class ModuleExecutionInitializer(InitializeSessionTurnModuleExecutionCommand command)
    : IModuleExecutionInitializationService
{
    public async Task<ModuleExecutionInitializationResult> InitializeSessionTurnAsync(
        AccountId ownerId,
        SessionId sessionId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(
            ownerId,
            sessionId,
            request,
            SessionTurnInitializationPolicy.ScenarioProgression,
            cancellationToken);
        return new(
            Map(result.Outcome),
            result.Execution?.Id,
            result.SessionTurnId,
            result.Error?.Code,
            result.Error?.Message);
    }

    private static ModuleExecutionInitializationOutcome Map(ModuleExecutionOutcome outcome) => outcome switch
    {
        ModuleExecutionOutcome.Success or ModuleExecutionOutcome.Created => ModuleExecutionInitializationOutcome.Created,
        ModuleExecutionOutcome.InvalidRequest => ModuleExecutionInitializationOutcome.InvalidRequest,
        ModuleExecutionOutcome.Conflict => ModuleExecutionInitializationOutcome.Conflict,
        ModuleExecutionOutcome.Unprocessable => ModuleExecutionInitializationOutcome.Unprocessable,
        _ => ModuleExecutionInitializationOutcome.Unavailable,
    };
}
