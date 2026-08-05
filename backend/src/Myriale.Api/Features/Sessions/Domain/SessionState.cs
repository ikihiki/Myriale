using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Myriale.Api.Features.Sessions.Domain;

public sealed class SessionState
{
    [Key, MaxLength(40)] public SessionId SessionId { get; internal set; }
    public long Revision { get; internal set; }
    [Required] public string FlagsJson { get; internal set; } = "{}";
    public DateTimeOffset UpdatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;

    public static SessionState Create(SessionId sessionId, IReadOnlyDictionary<string, bool> flags, DateTimeOffset now)
    {
        return new SessionState { SessionId = sessionId, FlagsJson = JsonSerializer.Serialize(flags), UpdatedAt = now };
    }

    public void ApplyFlags(IReadOnlyDictionary<string, bool> flags, long expectedRevision, DateTimeOffset now)
    {
        if (Revision != expectedRevision) throw new SessionRevisionConflictException(SessionId, expectedRevision, Revision);
        FlagsJson = JsonSerializer.Serialize(flags);
        Revision++;
        UpdatedAt = now;
    }
}
