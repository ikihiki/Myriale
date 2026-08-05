using Myriale.Api.Application.ScenarioTurns;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class ScenarioTurnExecutionHandler(ScenarioTurnExecutionOrchestrator orchestrator) : ISessionExecutionHandler
{
    public SessionExecutionKind Kind => SessionExecutionKind.ScenarioTurn;

    public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        orchestrator.ExecuteAsync(context, cancellationToken);
}
