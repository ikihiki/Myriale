using Myriale.Api.Data;

namespace Myriale.Api.Services;

public static class SessionExecutionStateMachine
{
    private static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> Allowed =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.Ordinal)
        {
            [SessionExecutionStatuses.Queued] = Set(SessionExecutionStatuses.Running, SessionExecutionStatuses.CancelRequested, SessionExecutionStatuses.Cancelled, SessionExecutionStatuses.Superseded),
            [SessionExecutionStatuses.Running] = Set(SessionExecutionStatuses.Succeeded, SessionExecutionStatuses.Failed, SessionExecutionStatuses.RetryWait, SessionExecutionStatuses.CancelRequested, SessionExecutionStatuses.Cancelled, SessionExecutionStatuses.Superseded),
            [SessionExecutionStatuses.RetryWait] = Set(SessionExecutionStatuses.Queued, SessionExecutionStatuses.Running, SessionExecutionStatuses.CancelRequested, SessionExecutionStatuses.Cancelled, SessionExecutionStatuses.Superseded),
            [SessionExecutionStatuses.CancelRequested] = Set(SessionExecutionStatuses.Cancelled, SessionExecutionStatuses.Succeeded, SessionExecutionStatuses.Superseded),
            [SessionExecutionStatuses.Failed] = Set(SessionExecutionStatuses.Queued, SessionExecutionStatuses.Superseded),
            [SessionExecutionStatuses.Cancelled] = Set(SessionExecutionStatuses.Queued, SessionExecutionStatuses.Superseded),
            [SessionExecutionStatuses.Succeeded] = Set(),
            [SessionExecutionStatuses.Superseded] = Set(),
        };

    public static bool CanTransition(string from, string to) => from == to || (Allowed.TryGetValue(from, out var next) && next.Contains(to));

    public static void Transition(SessionExecution execution, string status)
    {
        if (!CanTransition(execution.Status, status))
            throw new InvalidOperationException($"Invalid SessionExecution transition: {execution.Status} -> {status}.");
        execution.Status = status;
        execution.Revision++;
    }

    private static IReadOnlySet<string> Set(params string[] values) => new HashSet<string>(values, StringComparer.Ordinal);
}
