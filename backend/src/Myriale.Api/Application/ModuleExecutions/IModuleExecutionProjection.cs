using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Application.ModuleExecutions;

public interface IModuleExecutionProjection
{
    ModuleExecutionResponse ToResponse(ModuleExecution execution, Myriale.ModuleSdk.ModuleError? transientError = null,
        IReadOnlyList<Myriale.ModuleSdk.ModuleEvent>? uiEvents = null);
}
