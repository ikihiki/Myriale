using Myriale.Api.Features.ScenarioTurns.Application;

namespace Myriale.Api.Features.ScenarioTurns.Infrastructure;

public sealed class ScenarioTurnExecutionHandler(ScenarioTurnExecutionOrchestrator orchestrator) : ISessionExecutionHandler
{
    public string Kind => nameof(SessionExecutionKind.ScenarioTurn);

    public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        orchestrator.ExecuteAsync(context, cancellationToken);
}
