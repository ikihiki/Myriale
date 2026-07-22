using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class SessionNote
{
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Kind { get; set; } = "person";
    [Required, MaxLength(160)] public string Title { get; set; } = string.Empty;
    [Required] public string AliasesJson { get; set; } = "[]";
    [Required] public string Body { get; set; } = string.Empty;
    [Required, MaxLength(24)] public string CanonStatus { get; set; } = "unconfirmed";
    [MaxLength(40)] public string? FirstTurnId { get; set; }
    [MaxLength(40)] public string? UpdatedFromTurnId { get; set; }
    [Required, MaxLength(24)] public string UpdateSource { get; set; } = "user";
    public long Revision { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Session Session { get; set; } = null!;
    public ICollection<SessionNoteRevision> Revisions { get; set; } = [];
    public ICollection<SessionTurnLorebookReference> TurnReferences { get; set; } = [];
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
    [Key, MaxLength(40)] public string ArtifactId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SourceTurnId { get; set; } = string.Empty;
    [MaxLength(40)] public string? NoteId { get; set; }
    public long ExpectedNoteRevision { get; set; }
    [Required, MaxLength(160)] public string ProposedTitle { get; set; } = string.Empty;
    [Required] public string BeforeBody { get; set; } = string.Empty;
    [Required] public string ProposedBody { get; set; } = string.Empty;
    [Required, MaxLength(1000)] public string Rationale { get; set; } = string.Empty;
    [Required, MaxLength(32)] public string Status { get; set; } = "pending";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public SessionArtifact Artifact { get; set; } = null!;
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
    [Key, MaxLength(40)] public string Id { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; set; } = string.Empty;
    [MaxLength(40)] public string? SourceTurnId { get; set; }
    [MaxLength(40)] public string? SourceInputId { get; set; }
    [Required, MaxLength(40)] public string ArtifactId { get; set; } = string.Empty;
    [Required, MaxLength(500)] public string StorageKey { get; set; } = string.Empty;
    [Required, MaxLength(160)] public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    [Required, MaxLength(64)] public string Checksum { get; set; } = string.Empty;
    public string? ModerationMetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RetainUntil { get; set; }
    public SessionArtifact Artifact { get; set; } = null!;
}
