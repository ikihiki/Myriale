using System.Text.Json;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModuleExecutions.Infrastructure;

public sealed class ModuleExecutionProjection : IModuleExecutionProjection
{
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();
    public ModuleExecutionResponse ToResponse(ModuleExecution execution, ModuleError? transientError = null, IReadOnlyList<ModuleEvent>? uiEvents = null) => new(
        execution.Id,
        new ModuleExecutionPackageResponse(execution.ModuleId, execution.ModuleVersion, execution.ModuleDigest, execution.ContractVersion,
            execution.ConfigurationSchemaVersion, execution.StateSchemaVersion),
        execution.Status.ToWireValue(),
        execution.Revision,
        Parse(execution.ViewStateJson),
        JsonSerializer.Deserialize<IReadOnlyList<ModuleAvailableAction>>(execution.AvailableActionsJson, _json) ?? [],
        execution.OutcomeJson is null ? null : JsonSerializer.Deserialize<ModuleOutcome>(execution.OutcomeJson, _json),
        transientError ?? (execution.ErrorJson is null ? null : JsonSerializer.Deserialize<ModuleError>(execution.ErrorJson, _json)),
        uiEvents ?? [], execution.CreatedAt, execution.UpdatedAt, execution.CompletedAt);

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
}
