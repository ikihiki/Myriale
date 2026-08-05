using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.ProgressionRuntime.Domain;

public sealed class SessionProgressState
{
    [Key, MaxLength(40)]
    public SessionId SessionId { get; internal set; }

    [Required, MaxLength(80)]
    public ScenarioProgressionNodeId CurrentNodeId { get; internal set; }

    public long Revision { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }

    public static SessionProgressState Start(SessionId sessionId, ScenarioProgressionNodeId initialNodeId, DateTimeOffset now)
    {
        return new SessionProgressState { SessionId = sessionId, CurrentNodeId = initialNodeId, UpdatedAt = now };
    }

    public void MoveTo(ScenarioProgressionNodeId targetNodeId, long expectedRevision, DateTimeOffset now)
    {
        if (Revision != expectedRevision)
            throw new InvalidOperationException($"Progress revision conflict. Expected {expectedRevision}, actual {Revision}.");
        CurrentNodeId = targetNodeId;
        Revision++;
        UpdatedAt = now;
    }
}
