using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionNote
{
    internal SessionNote() { }

    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionNoteKind Kind { get; internal set; }
    [Required, MaxLength(160)] public string Title { get; internal set; } = string.Empty;
    [Required] public string AliasesJson { get; internal set; } = "[]";
    [Required] public string Body { get; internal set; } = string.Empty;
    [Required, MaxLength(24)] public SessionNoteCanonStatus CanonStatus { get; internal set; }
    [MaxLength(40)] public string? FirstTurnId { get; internal set; }
    [MaxLength(40)] public string? UpdatedFromTurnId { get; internal set; }
    [Required, MaxLength(24)] public SessionNoteUpdateSource UpdateSource { get; internal set; }
    public long Revision { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public Session Session { get; internal set; } = null!;
    public ICollection<SessionNoteRevision> Revisions { get; internal set; } = [];
    public ICollection<SessionTurnLorebookReference> TurnReferences { get; internal set; } = [];

    public static SessionNote Create(
        string id, string sessionId, SessionNoteKind kind, string title, string aliasesJson, string body,
        SessionNoteCanonStatus canonStatus, string? firstTurnId, string? updatedFromTurnId, DateTimeOffset now) => new()
    {
        Id = id,
        SessionId = sessionId,
        Kind = kind,
        Title = title,
        AliasesJson = aliasesJson,
        Body = body,
        CanonStatus = canonStatus,
        FirstTurnId = firstTurnId,
        UpdatedFromTurnId = updatedFromTurnId,
        UpdateSource = SessionNoteUpdateSource.User,
        Revision = 1,
        CreatedAt = now,
        UpdatedAt = now,
    };

    public static SessionNote CreateFromProposal(string id, SessionNoteProposal proposal, string title, string body, DateTimeOffset now) => new()
    {
        Id = id,
        SessionId = proposal.SessionId,
        Kind = SessionNoteKind.Rule,
        Title = title,
        AliasesJson = "[]",
        Body = body,
        CanonStatus = SessionNoteCanonStatus.Canon,
        FirstTurnId = proposal.SourceTurnId,
        UpdatedFromTurnId = proposal.SourceTurnId,
        UpdateSource = SessionNoteUpdateSource.AiApproved,
        Revision = 1,
        CreatedAt = now,
        UpdatedAt = now,
    };

    public void Edit(SessionNoteKind kind, string title, string aliasesJson, string body, SessionNoteCanonStatus canonStatus,
        string? firstTurnId, string? updatedFromTurnId, DateTimeOffset now)
    {
        Kind = kind;
        Title = title;
        AliasesJson = aliasesJson;
        Body = body;
        CanonStatus = canonStatus;
        FirstTurnId = firstTurnId;
        UpdatedFromTurnId = updatedFromTurnId;
        UpdateSource = SessionNoteUpdateSource.User;
        Revision++;
        UpdatedAt = now;
    }

    public void ApplyProposal(string title, string body, DateTimeOffset now)
    {
        Title = title;
        Body = body;
        Revision++;
        UpdatedAt = now;
    }

    public SessionNoteRevision CaptureRevision(string id, DateTimeOffset now, string? sourceArtifactId = null) => new()
    {
        Id = id,
        Note = this,
        NoteId = Id,
        Revision = Revision,
        Title = Title,
        Body = Body,
        SourceArtifactId = sourceArtifactId,
        CreatedAt = now,
    };
}

public sealed class SessionNoteRevision
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string NoteId { get; set; } = string.Empty;
    public long Revision { get; set; }
    [Required, MaxLength(160)] public string Title { get; set; } = string.Empty;
    [Required] public string Body { get; set; } = string.Empty;
    [MaxLength(40)] public string? SourceArtifactId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public SessionNote Note { get; set; } = null!;
}

public sealed class SessionNoteProposal
{
    internal SessionNoteProposal() { }

    [Key, MaxLength(40)] public string ArtifactId { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SourceTurnId { get; internal set; } = string.Empty;
    [MaxLength(40)] public string? NoteId { get; internal set; }
    public long ExpectedNoteRevision { get; internal set; }
    [Required, MaxLength(160)] public string ProposedTitle { get; internal set; } = string.Empty;
    [Required] public string BeforeBody { get; internal set; } = string.Empty;
    [Required] public string ProposedBody { get; internal set; } = string.Empty;
    [Required, MaxLength(1000)] public string Rationale { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public SessionNoteProposalStatus Status { get; internal set; }
    public long Revision { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? ReviewedAt { get; internal set; }
    public SessionArtifact Artifact { get; internal set; } = null!;

    public static SessionNoteProposal Create(string artifactId, string sessionId, string sourceTurnId, string? noteId,
        long expectedNoteRevision, string proposedTitle, string beforeBody, string proposedBody, string rationale, DateTimeOffset now) => new()
    {
        ArtifactId = artifactId,
        SessionId = sessionId,
        SourceTurnId = sourceTurnId,
        NoteId = noteId,
        ExpectedNoteRevision = expectedNoteRevision,
        ProposedTitle = proposedTitle,
        BeforeBody = beforeBody,
        ProposedBody = proposedBody,
        Rationale = rationale,
        Status = SessionNoteProposalStatus.Pending,
        Revision = 1,
        CreatedAt = now,
    };

    public bool Review(SessionNoteProposalStatus status, string? noteId, DateTimeOffset now)
    {
        if (Status is SessionNoteProposalStatus.Applied or SessionNoteProposalStatus.Rejected || Status == status) return false;
        if (status is SessionNoteProposalStatus.Pending) throw new ArgumentOutOfRangeException(nameof(status));
        NoteId = noteId ?? NoteId;
        Status = status;
        ReviewedAt = now;
        Revision++;
        return true;
    }
}

public sealed class SessionSummary
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string FromTurnId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string ToTurnId { get; set; } = string.Empty;
    public int FromPosition { get; set; }
    public int ToPosition { get; set; }
    public int Version { get; set; }
    [Required, MaxLength(24)] public string Confidence { get; set; } = "confirmed";
    [Required] public string CurrentLocation { get; set; } = string.Empty;
    [Required] public string CharactersJson { get; set; } = "[]";
    [Required] public string ObjectivesJson { get; set; } = "[]";
    [Required] public string CluesJson { get; set; } = "[]";
    [Required] public string InventoryJson { get; set; } = "[]";
    [Required] public string ModuleResultsJson { get; set; } = "[]";
    [Required] public string Body { get; set; } = string.Empty;
    public DateTimeOffset GeneratedAt { get; set; }
    public Session Session { get; set; } = null!;
}

public sealed class SessionTurnLorebookReference
{
    [Required, MaxLength(40)] public string TurnId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string NoteId { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Reason { get; set; } = "relevant";
    public SessionTurn Turn { get; set; } = null!;
    public SessionNote Note { get; set; } = null!;
}

public sealed class SessionImage
{
    internal SessionImage() { }

    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; internal set; } = string.Empty;
    [MaxLength(40)] public string? SourceTurnId { get; internal set; }
    [MaxLength(40)] public string? SourceInputId { get; internal set; }
    [Required, MaxLength(40)] public string ArtifactId { get; internal set; } = string.Empty;
    [Required, MaxLength(500)] public string StorageKey { get; internal set; } = string.Empty;
    [Required, MaxLength(160)] public string ContentType { get; internal set; } = string.Empty;
    public long SizeBytes { get; internal set; }
    public int Width { get; internal set; }
    public int Height { get; internal set; }
    [Required, MaxLength(64)] public string Checksum { get; internal set; } = string.Empty;
    public string? ModerationMetadataJson { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? RetainUntil { get; internal set; }
    public SessionArtifact Artifact { get; internal set; } = null!;

    public static SessionImage Create(
        string id,
        SessionArtifact artifact,
        string? sourceTurnId,
        string? sourceInputId,
        long sizeBytes,
        int width,
        int height,
        DateTimeOffset? retainUntil)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        ArgumentNullException.ThrowIfNull(artifact);
        if (artifact.Kind != SessionArtifactKind.Image || artifact.Schema != SessionArtifactSchema.ImageV1
            || artifact.Status != SessionArtifactStatus.Committed || string.IsNullOrWhiteSpace(artifact.StorageKey)
            || artifact.PayloadJson is not null)
            throw new ArgumentException("Session images require a committed image.v1 storage artifact.", nameof(artifact));
        if (sizeBytes <= 0 || width <= 0 || height <= 0) throw new ArgumentOutOfRangeException(nameof(sizeBytes));
        return new SessionImage
        {
            Id = id,
            SessionId = artifact.SessionId,
            SourceTurnId = sourceTurnId,
            SourceInputId = sourceInputId,
            Artifact = artifact,
            ArtifactId = artifact.Id,
            StorageKey = artifact.StorageKey,
            ContentType = artifact.ContentType,
            SizeBytes = sizeBytes,
            Width = width,
            Height = height,
            Checksum = artifact.Checksum,
            ModerationMetadataJson = artifact.MetadataJson,
            CreatedAt = artifact.CommittedAt!.Value,
            RetainUntil = retainUntil,
        };
    }
}
