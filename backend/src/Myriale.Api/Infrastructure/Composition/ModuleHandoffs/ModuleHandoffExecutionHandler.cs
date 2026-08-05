using Myriale.Api.Features.ModuleHandoffs.Application;

namespace Myriale.Api.Infrastructure.Composition.ModuleHandoffs;

public sealed class ModuleHandoffExecutionHandler(ModuleHandoffExecutionOrchestrator orchestrator) : ISessionExecutionService
{
    public string Kind => nameof(SessionExecutionKind.ModuleHandoff);

    public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        orchestrator.ExecuteAsync(context, cancellationToken);
}
