using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.SessionArtifacts.Domain;

public sealed class SessionImage
{
    internal SessionImage() { }

    [Key, MaxLength(40)] public SessionImageId Id { get; internal set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; internal set; }
    [MaxLength(40)] public SessionTurnId? SourceTurnId { get; internal set; }
    [MaxLength(40)] public SessionPlayerInputId? SourceInputId { get; internal set; }
    [Required, MaxLength(40)] public SessionArtifactId ArtifactId { get; internal set; }
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
        SessionImageId id,
        SessionArtifact artifact,
        SessionTurnId? sourceTurnId,
        SessionPlayerInputId? sourceInputId,
        long sizeBytes,
        int width,
        int height,
        DateTimeOffset? retainUntil)
    {
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
