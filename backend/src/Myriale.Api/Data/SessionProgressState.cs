using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionProgressState
{
    [Key, MaxLength(40)]
    public string SessionId { get; internal set; } = string.Empty;

    [Required, MaxLength(80)]
    public string CurrentNodeId { get; internal set; } = string.Empty;

    public long Revision { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public Session Session { get; internal set; } = null!;
    public ScenarioProgressionNode CurrentNode { get; internal set; } = null!;

    public static SessionProgressState Start(string sessionId, string initialNodeId, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sessionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(initialNodeId);
        return new SessionProgressState { SessionId = sessionId, CurrentNodeId = initialNodeId, UpdatedAt = now };
    }

    public void MoveTo(string targetNodeId, long expectedRevision, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(targetNodeId);
        if (Revision != expectedRevision)
            throw new InvalidOperationException($"Progress revision conflict. Expected {expectedRevision}, actual {Revision}.");
        CurrentNodeId = targetNodeId;
        Revision++;
        UpdatedAt = now;
    }
}
