using Myriale.Api.Application.ModuleHandoffs;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class ModuleHandoffExecutionHandler(ModuleHandoffExecutionOrchestrator orchestrator) : ISessionExecutionHandler
{
    public SessionExecutionKind Kind => SessionExecutionKind.ModuleHandoff;

    public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        orchestrator.ExecuteAsync(context, cancellationToken);
}
