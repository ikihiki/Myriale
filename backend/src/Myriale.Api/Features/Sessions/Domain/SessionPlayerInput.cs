using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Sessions.Domain;

public sealed class SessionPlayerInput
{
    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [Required, MaxLength(120)] public string RequestId { get; internal set; } = string.Empty;
    [Required, MaxLength(4000)] public string Text { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionInputInteractionType InteractionType { get; internal set; } = SessionInputInteractionType.Dialogue;
    [Required, MaxLength(64)] public string PayloadHash { get; internal set; } = string.Empty;
    [MaxLength(40)] public string? AcceptedAfterTurnId { get; internal set; }
    public long AcceptedSessionRevision { get; internal set; }
    [Required, MaxLength(450)] public string CreatedBy { get; internal set; } = string.Empty;
    [MaxLength(40)] public string? SupersedesInputId { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;
    public SessionTurn? AcceptedAfterTurn { get; internal set; }
    public SessionTurn? NarrativeTurn { get; internal set; }

    public static SessionPlayerInput Accept(string id, string sessionId, string requestId, string text,
        SessionInputInteractionType interactionType, string payloadHash, string? acceptedAfterTurnId,
        long acceptedSessionRevision, string createdBy, string? supersedesInputId, DateTimeOffset now)
    {
        var canonicalText = text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(requestId)
            || requestId.Length > 120 || canonicalText.Length is 0 or > 4000 || payloadHash.Length != 64 || string.IsNullOrWhiteSpace(createdBy))
            throw new ArgumentException("Canonical input data is invalid.");
        return new SessionPlayerInput { Id = id, SessionId = sessionId, RequestId = requestId, Text = canonicalText,
            InteractionType = interactionType, PayloadHash = payloadHash, AcceptedAfterTurnId = acceptedAfterTurnId,
            AcceptedSessionRevision = acceptedSessionRevision, CreatedBy = createdBy, SupersedesInputId = supersedesInputId, CreatedAt = now };
    }
}
