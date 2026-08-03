using Myriale.Api.Data;

namespace Myriale.Api.Services;

// Compatibility adapter for queue/worker/finalizer call sites. Lifecycle rules live on the aggregate.
public static class SessionExecutionStateMachine
{
    public static bool CanTransition(SessionExecutionStatus from, SessionExecutionStatus to) => SessionExecution.CanTransition(from, to);
    public static void Transition(SessionExecution execution, SessionExecutionStatus status) => execution.TransitionTo(status);
}
