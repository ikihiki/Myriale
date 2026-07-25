using System.Text.Json;
using Myriale.Api.Contracts;
using Myriale.Api.Modules.Execution;
using Myriale.ModuleSdk;

namespace Myriale.Api.Services;

public sealed class ScenarioModuleExtensionAdapter(IModuleExecutionService executions) : IScenarioExtensionAdapter
{
    public async Task<ScenarioExtensionResult> ExecuteAsync(
        ScenarioExtensionRequest request,
        CancellationToken cancellationToken)
    {
        var binding = new ModuleObjectActionContext(
            request.ObjectId,
            request.ObjectTypeId,
            request.ActionId,
            request.Arguments,
            request.ObjectState);
        var result = await executions.InitializeAsync(
            request.OwnerId,
            new InitializeModuleExecutionRequest(
                $"scenario-extension:{request.InvocationId}",
                request.ModuleId,
                request.Version,
                request.Digest,
                request.Configuration,
                JsonSerializer.SerializeToElement(binding, ModuleJsonSerializerOptions.Create()),
                0),
            cancellationToken);

        if (result.Response is not { } execution)
            throw new ScenarioTurnValidationException(result.Error?.Code ?? "extension_initialization_failed");

        var outcome = execution.Outcome;
        return new ScenarioExtensionResult(
            execution.Id,
            execution.Status,
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
