using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Myriale.Api.Data;

public sealed class SessionState
{
    [Key, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    public long Revision { get; internal set; }
    [Required] public string FlagsJson { get; internal set; } = "{}";
    public DateTimeOffset UpdatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;

    public static SessionState Create(string sessionId, IReadOnlyDictionary<string, bool> flags, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sessionId);
        return new SessionState { SessionId = sessionId, FlagsJson = JsonSerializer.Serialize(flags), UpdatedAt = now };
    }

    public void ApplyFlags(IReadOnlyDictionary<string, bool> flags, long expectedRevision, DateTimeOffset now)
    {
        if (Revision != expectedRevision) throw new ScenarioRuntimeRevisionConflictException(SessionId, expectedRevision, Revision);
        FlagsJson = JsonSerializer.Serialize(flags);
        Revision++;
        UpdatedAt = now;
    }
}
