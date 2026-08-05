using System.Text.Json;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ScenarioTurns.Infrastructure;

public sealed class ScenarioModuleExtensionAdapter(InitializeDetachedModuleExecutionCommand executions) : IScenarioExtensionAdapter
{
    public async Task<ScenarioExtensionResult> ExecuteAsync(
        ScenarioExtensionRequest request,
        CancellationToken cancellationToken)
    {
        var binding = new ModuleObjectActionContext(
            request.ObjectId.AsPrimitive(),
            request.ObjectTypeId is { } objectTypeId ? objectTypeId.AsPrimitive() : null!,
            request.ActionId.AsPrimitive(),
            request.Arguments,
            request.ObjectState);
        var result = await executions.ExecuteAsync(
            request.OwnerId,
            new InitializeModuleExecutionRequest(
                $"scenario-extension:{request.InvocationId}",
                request.ModuleId,
                new(request.Version),
                new(request.Digest),
                request.Configuration,
                JsonSerializer.SerializeToElement(binding, ModuleJsonSerializerOptions.Create()),
                0),
            cancellationToken);

        if (result.Execution is not { } execution)
            throw new ScenarioTurnValidationException(result.Error?.Code ?? "extension_initialization_failed");

        var outcome = execution.Outcome;
        return new ScenarioExtensionResult(
            new SessionExecutionId(execution.Id.AsPrimitive()),
            execution.Status.ToWireValue(),
            execution.Revision,
            execution.AvailableActions,
            [],
            outcome?.PublicFacts.Select(fact => fact.Text).ToList() ?? [],
            outcome?.EmittedEvents.Select(item => JsonSerializer.SerializeToElement(item, ModuleJsonSerializerOptions.Create())).ToList() ?? [],
            outcome?.NarrativeHints ?? [],
            outcome?.ForbiddenNarrativeFacts ?? [],
            execution.ViewState);
    }
}
