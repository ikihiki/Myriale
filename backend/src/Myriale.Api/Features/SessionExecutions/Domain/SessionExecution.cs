using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public enum SessionExecutionKind { ScenarioTurn, Narrative, ModuleHandoff, NoteProposal, Image }
public enum SessionExecutionStatus { Queued, Running, RetryWait, CancelRequested, Succeeded, Failed, Cancelled, Superseded }
public enum SessionExecutionTriggerType { PlayerInput, ModuleOutcome, Manual }
public enum SessionExecutionPublishPolicy { Required, Optional }

internal static class SessionExecutionValues
{
    public static bool IsActive(this SessionExecutionStatus status) => status is SessionExecutionStatus.Queued or SessionExecutionStatus.Running or SessionExecutionStatus.RetryWait or SessionExecutionStatus.CancelRequested;
    public static bool IsTerminal(this SessionExecutionStatus status) => status is SessionExecutionStatus.Succeeded or SessionExecutionStatus.Failed or SessionExecutionStatus.Cancelled or SessionExecutionStatus.Superseded;

    public static string ToContractValue(this SessionExecutionKind value) => value switch
    {
        SessionExecutionKind.ScenarioTurn => "scenario-turn", SessionExecutionKind.Narrative => "narrative",
        SessionExecutionKind.ModuleHandoff => "module-handoff", SessionExecutionKind.NoteProposal => "note-proposal",
        SessionExecutionKind.Image => "image", _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };
    public static string ToContractValue(this SessionExecutionStatus value) => value switch
    {
        SessionExecutionStatus.Queued => "queued", SessionExecutionStatus.Running => "running", SessionExecutionStatus.RetryWait => "retry-wait",
        SessionExecutionStatus.CancelRequested => "cancel-requested", SessionExecutionStatus.Succeeded => "succeeded", SessionExecutionStatus.Failed => "failed",
        SessionExecutionStatus.Cancelled => "cancelled", SessionExecutionStatus.Superseded => "superseded", _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };
    public static string ToContractValue(this SessionExecutionAttemptStatus value) => value switch
    {
        SessionExecutionAttemptStatus.Running => "running", SessionExecutionAttemptStatus.Expired => "expired",
        SessionExecutionAttemptStatus.Succeeded => "succeeded", SessionExecutionAttemptStatus.Failed => "failed",
        SessionExecutionAttemptStatus.Cancelled => "cancelled", SessionExecutionAttemptStatus.Superseded => "superseded",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };
    public static string ToContractValue(this SessionExecutionTriggerType value) => value switch
    {
        SessionExecutionTriggerType.PlayerInput => "player-input", SessionExecutionTriggerType.ModuleOutcome => "module-outcome",
        SessionExecutionTriggerType.Manual => "manual", _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };
    public static string ToContractValue(this SessionExecutionPublishPolicy value) => value switch
    {
        SessionExecutionPublishPolicy.Required => "required", SessionExecutionPublishPolicy.Optional => "optional",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };
}

internal static class SessionExecutionStorageValues
{
    public static SessionExecutionKind Kind(string value) => value switch
    {
        "scenario-turn" => SessionExecutionKind.ScenarioTurn,
        "narrative" => SessionExecutionKind.Narrative,
        "module-handoff" => SessionExecutionKind.ModuleHandoff,
        "note-proposal" => SessionExecutionKind.NoteProposal,
        "image" => SessionExecutionKind.Image,
        _ => throw new InvalidOperationException($"Unknown SessionExecution kind '{value}'."),
    };

    public static SessionExecutionStatus Status(string value) => value switch
    {
        "queued" => SessionExecutionStatus.Queued,
        "running" => SessionExecutionStatus.Running,
        "retry-wait" => SessionExecutionStatus.RetryWait,
        "cancel-requested" => SessionExecutionStatus.CancelRequested,
        "succeeded" => SessionExecutionStatus.Succeeded,
        "failed" => SessionExecutionStatus.Failed,
        "cancelled" => SessionExecutionStatus.Cancelled,
        "superseded" => SessionExecutionStatus.Superseded,
        _ => throw new InvalidOperationException($"Unknown SessionExecution status '{value}'."),
    };

    public static SessionExecutionAttemptStatus AttemptStatus(string value) => value switch
    {
        "running" => SessionExecutionAttemptStatus.Running,
        "expired" => SessionExecutionAttemptStatus.Expired,
        "succeeded" => SessionExecutionAttemptStatus.Succeeded,
        "failed" => SessionExecutionAttemptStatus.Failed,
        "cancelled" => SessionExecutionAttemptStatus.Cancelled,
        "superseded" => SessionExecutionAttemptStatus.Superseded,
        _ => throw new InvalidOperationException($"Unknown SessionExecution attempt status '{value}'."),
    };

    public static SessionExecutionTriggerType TriggerType(string value) => value switch
    {
        "player-input" => SessionExecutionTriggerType.PlayerInput,
        "module-outcome" => SessionExecutionTriggerType.ModuleOutcome,
        "manual" => SessionExecutionTriggerType.Manual,
        _ => throw new InvalidOperationException($"Unknown SessionExecution trigger type '{value}'."),
    };

    public static SessionExecutionPublishPolicy PublishPolicy(string value) => value switch
    {
        "required" => SessionExecutionPublishPolicy.Required,
        "optional" => SessionExecutionPublishPolicy.Optional,
        _ => throw new InvalidOperationException($"Unknown SessionExecution publish policy '{value}'."),
    };
}

public sealed class SessionExecutionRevisionConflictException(long expected, long actual) : Exception($"SessionExecution revision conflict. Expected {expected}, actual {actual}.")
{
    public long ExpectedRevision { get; } = expected;
    public long ActualRevision { get; } = actual;
}

public sealed class SessionExecution
{
    private static readonly IReadOnlyDictionary<SessionExecutionStatus, IReadOnlySet<SessionExecutionStatus>> AllowedTransitions =
        new Dictionary<SessionExecutionStatus, IReadOnlySet<SessionExecutionStatus>>
        {
            [SessionExecutionStatus.Queued] = Set(SessionExecutionStatus.Running, SessionExecutionStatus.CancelRequested, SessionExecutionStatus.Cancelled, SessionExecutionStatus.Superseded),
            [SessionExecutionStatus.Running] = Set(SessionExecutionStatus.Succeeded, SessionExecutionStatus.Failed, SessionExecutionStatus.RetryWait, SessionExecutionStatus.CancelRequested, SessionExecutionStatus.Cancelled, SessionExecutionStatus.Superseded),
            [SessionExecutionStatus.RetryWait] = Set(SessionExecutionStatus.Queued, SessionExecutionStatus.Running, SessionExecutionStatus.CancelRequested, SessionExecutionStatus.Cancelled, SessionExecutionStatus.Superseded),
            [SessionExecutionStatus.CancelRequested] = Set(SessionExecutionStatus.Cancelled, SessionExecutionStatus.Succeeded, SessionExecutionStatus.Superseded),
            [SessionExecutionStatus.Failed] = Set(SessionExecutionStatus.Queued, SessionExecutionStatus.Superseded),
            [SessionExecutionStatus.Cancelled] = Set(SessionExecutionStatus.Queued, SessionExecutionStatus.Superseded),
            [SessionExecutionStatus.Succeeded] = Set(), [SessionExecutionStatus.Superseded] = Set(),
        };

    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionExecutionKind Kind { get; internal set; } = SessionExecutionKind.Narrative;
    [Required, MaxLength(32)] public SessionExecutionTriggerType TriggerType { get; internal set; } = SessionExecutionTriggerType.PlayerInput;
    [Required, MaxLength(40)] public string TriggerId { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionExecutionStatus Status { get; internal set; } = SessionExecutionStatus.Queued;
    [MaxLength(40)] public string? Stage { get; internal set; }
    public int SchemaVersion { get; internal set; } = 1;
    public long Revision { get; internal set; }
    [Required, MaxLength(160)] public string IdempotencyKey { get; internal set; } = string.Empty;
    [Required, MaxLength(64)] public string PayloadHash { get; internal set; } = string.Empty;
    [MaxLength(80)] public string? ActionDecisionAiProfileId { get; internal set; }
    [MaxLength(80)] public string? NarrativeAiProfileId { get; internal set; }
    [MaxLength(40)] public string? AcceptedHeadTurnId { get; internal set; }
    public long AcceptedSessionRevision { get; internal set; }
    [Required, MaxLength(32)] public SessionExecutionPublishPolicy PublishPolicy { get; internal set; } = SessionExecutionPublishPolicy.Required;
    public int Priority { get; internal set; }
    public bool IsRetryable { get; internal set; } = true;
    public int AttemptCount { get; internal set; }
    public int MaxAttempts { get; internal set; } = 3;
    public DateTimeOffset? NextAttemptAt { get; internal set; }
    [MaxLength(120)] public string? LeaseOwner { get; internal set; }
    [MaxLength(80)] public string? LeaseToken { get; internal set; }
    public DateTimeOffset? LeaseExpiresAt { get; internal set; }
    [MaxLength(80)] public string? ErrorCode { get; internal set; }
    [MaxLength(500)] public string? UserErrorMessage { get; internal set; }
    [MaxLength(512)] public string? TraceParent { get; internal set; }
    [MaxLength(40)] public string? SupersededByExecutionId { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset QueuedAt { get; internal set; }
    public DateTimeOffset? StartedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    public DateTimeOffset? CancelRequestedAt { get; private set; }
    public DateTimeOffset? DismissedAt { get; private set; }

    public Session Session { get; internal set; } = null!;
    public ICollection<SessionExecutionAttempt> Attempts { get; internal set; } = [];
    public ICollection<SessionAiInteraction> AiInteractions { get; internal set; } = [];
    public ICollection<SessionArtifact> Artifacts { get; internal set; } = [];

    public static bool CanTransition(SessionExecutionStatus from, SessionExecutionStatus to) => from == to || AllowedTransitions.TryGetValue(from, out var next) && next.Contains(to);

    public void Retry(DateTimeOffset now)
    {
        if (Status == SessionExecutionStatus.Queued) return;
        if (Status is not (SessionExecutionStatus.Failed or SessionExecutionStatus.Cancelled) || !IsRetryable)
            throw new InvalidOperationException("This execution cannot be retried.");
        TransitionTo(SessionExecutionStatus.Queued);
        QueuedAt = now; CompletedAt = null; NextAttemptAt = null; DismissedAt = null;
    }

    public void RequestCancellation(DateTimeOffset now)
    {
        if (Status.IsTerminal()) return;
        if (Status is SessionExecutionStatus.Queued or SessionExecutionStatus.RetryWait)
        {
            TransitionTo(SessionExecutionStatus.CancelRequested); CancelRequestedAt = now;
            TransitionTo(SessionExecutionStatus.Cancelled); CompletedAt = now; ClearLease();
        }
        else if (Status == SessionExecutionStatus.Running)
        {
            TransitionTo(SessionExecutionStatus.CancelRequested); CancelRequestedAt = now;
        }
    }

    public void Dismiss(DateTimeOffset now)
    {
        if (!Status.IsTerminal() || DismissedAt is not null) return;
        DismissedAt = now;
        Revision++;
    }

    internal void TransitionTo(SessionExecutionStatus status)
    {
        if (!CanTransition(Status, status)) throw new InvalidOperationException($"Invalid SessionExecution transition: {Status.ToContractValue()} -> {status.ToContractValue()}.");
        Status = status;
        // A same-status Running -> Running transition is a new lease generation and must advance
        // the fence revision even though the lifecycle label does not change.
        Revision++;
    }

    internal void ClearLease() { LeaseOwner = null; LeaseToken = null; LeaseExpiresAt = null; }
    internal void RestoreRevision(long revision) => Revision = revision;
    private static IReadOnlySet<SessionExecutionStatus> Set(params SessionExecutionStatus[] values) => new HashSet<SessionExecutionStatus>(values);
}
