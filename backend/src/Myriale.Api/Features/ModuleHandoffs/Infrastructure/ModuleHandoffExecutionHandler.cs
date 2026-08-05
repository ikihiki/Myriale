using Myriale.Api.Features.ModuleHandoffs.Application;

namespace Myriale.Api.Features.ModuleHandoffs.Infrastructure;

public sealed class ModuleHandoffExecutionHandler(ModuleHandoffExecutionOrchestrator orchestrator) : ISessionExecutionHandler
{
    public string Kind => nameof(SessionExecutionKind.ModuleHandoff);

    public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        orchestrator.ExecuteAsync(context, cancellationToken);
}
