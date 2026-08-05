using Myriale.Api.Data;

namespace Myriale.Api.Features.ModuleExecutions.Application;

public interface IModuleExecutionProjection
{
    ModuleExecutionResponse ToResponse(ModuleExecution execution, Myriale.ModuleSdk.ModuleError? transientError = null,
        IReadOnlyList<Myriale.ModuleSdk.ModuleEvent>? uiEvents = null);
}
