using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Sessions.Domain;

public sealed class SessionPlayerInput
{
    [Key, MaxLength(40)] public SessionPlayerInputId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    [Required, MaxLength(120)] public string RequestId { get; internal set; } = string.Empty;
    [Required, MaxLength(4000)] public string Text { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionInputInteractionType InteractionType { get; internal set; } = SessionInputInteractionType.Dialogue;
    [Required, MaxLength(64)] public string PayloadHash { get; internal set; } = string.Empty;
    [MaxLength(40)] public SessionTurnId? AcceptedAfterTurnId { get; internal set; }
    public long AcceptedSessionRevision { get; internal set; }
    [Required, MaxLength(450)] public AccountId CreatedBy { get; internal set; }
    [MaxLength(40)] public SessionPlayerInputId? SupersedesInputId { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;
    public SessionTurn? AcceptedAfterTurn { get; internal set; }
    public SessionTurn? NarrativeTurn { get; internal set; }

    public static SessionPlayerInput Accept(SessionPlayerInputId id, SessionId sessionId, string requestId, string text,
        SessionInputInteractionType interactionType, string payloadHash, SessionTurnId? acceptedAfterTurnId,
        long acceptedSessionRevision, AccountId createdBy, SessionPlayerInputId? supersedesInputId, DateTimeOffset now)
    {
        var canonicalText = text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(requestId)
            || requestId.Length > 120 || canonicalText.Length is 0 or > 4000 || payloadHash.Length != 64)
            throw new ArgumentException("Canonical input data is invalid.");
        return new SessionPlayerInput { Id = id, SessionId = sessionId, RequestId = requestId, Text = canonicalText,
            InteractionType = interactionType, PayloadHash = payloadHash, AcceptedAfterTurnId = acceptedAfterTurnId,
            AcceptedSessionRevision = acceptedSessionRevision, CreatedBy = createdBy, SupersedesInputId = supersedesInputId, CreatedAt = now };
    }
}
