using Myriale.Api.Features.ScenarioTurns.Application;

namespace Myriale.Api.Infrastructure.Composition.ScenarioTurns;

public sealed class ScenarioTurnExecutionHandler(ScenarioTurnExecutionOrchestrator orchestrator) : ISessionExecutionService
{
    public string Kind => nameof(SessionExecutionKind.ScenarioTurn);

    public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken) =>
        orchestrator.ExecuteAsync(context, cancellationToken);
}
