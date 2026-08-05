using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.SessionArtifacts.Application;

public interface ISessionArtifactWriter
{
    void Add(SessionArtifact artifact);
}

public sealed record SessionImageAttachmentTarget(
    string SessionId,
    string ExecutionId,
    string AttemptId,
    SessionExecutionKind ExecutionKind,
    bool AttemptExists,
    bool AlreadyAttached);
public sealed record SessionImageMediaDescriptor(string StorageKey, string ContentType);
public sealed record SessionImageRetentionItem(string ImageId, string ArtifactId, string StorageKey, DateTimeOffset? RetainUntil);

public enum SessionImagePersistenceOutcome
{
    Created,
    Conflict,
}

public interface ISessionArtifactRepository
{
    Task<SessionImageAttachmentTarget?> FindImageAttachmentTargetAsync(string ownerId, string sessionId, string executionId, string attemptId, CancellationToken cancellationToken);
    Task<SessionImagePersistenceOutcome> TryAddImageAsync(SessionArtifact artifact, SessionImage image, CancellationToken cancellationToken);
    Task<SessionImageMediaDescriptor?> FindImageMediaAsync(string ownerId, string imageId, CancellationToken cancellationToken);
}

public interface ISessionArtifactRetentionRepository
{
    Task<IReadOnlyList<SessionImageRetentionItem>> ListImagesAsync(CancellationToken cancellationToken);
    Task<bool> DeleteExpiredAsync(string imageId, DateTimeOffset now, CancellationToken cancellationToken);
}

public enum AttachSessionImageOutcome
{
    Created,
    NotFound,
    Invalid,
    Conflict,
}

public sealed record AttachSessionImageCommand(
    string OwnerId,
    string SessionId,
    string ExecutionId,
    string AttemptId,
    IFormFile File,
    string Checksum,
    string ModerationDecision,
    string? ModerationMetadataJson,
    string? SourceTurnId,
    string? SourceInputId,
    DateTimeOffset? RetainUntil);

public sealed record AttachedSessionImage(
    string ImageId,
    string ArtifactId,
    string ContentType,
    long SizeBytes,
    int Width,
    int Height,
    string Checksum,
    string ModerationMetadataJson,
    DateTimeOffset CreatedAt,
    DateTimeOffset? RetainUntil);

public sealed record AttachSessionImageResult(
    AttachSessionImageOutcome Outcome,
    AttachedSessionImage? Image = null,
    string? ErrorCode = null,
    string? ErrorMessage = null);

public sealed class AttachSessionImageUseCase(
    ISessionArtifactRepository repository,
    ISessionObjectStorage storage,
    SessionImageValidator validator,
    TimeProvider timeProvider)
{
    public async Task<AttachSessionImageResult> ExecuteAsync(AttachSessionImageCommand command, CancellationToken cancellationToken)
    {
        var target = await repository.FindImageAttachmentTargetAsync(
            command.OwnerId, command.SessionId, command.ExecutionId, command.AttemptId, cancellationToken);
        if (target is null) return new(AttachSessionImageOutcome.NotFound);
        if (!target.AttemptExists)
            return new(AttachSessionImageOutcome.Invalid, ErrorCode: "image_attempt_invalid", ErrorMessage: "Executionに属するAttemptを指定してください。");
        if (target.ExecutionKind != SessionExecutionKind.Image)
            return new(AttachSessionImageOutcome.Invalid, ErrorCode: "image_execution_required", ErrorMessage: "画像Executionを指定してください。");
        if (target.AlreadyAttached)
            return new(AttachSessionImageOutcome.Conflict, ErrorCode: "image_already_attached", ErrorMessage: "このExecutionには画像が添付済みです。");

        ValidatedSessionImage validated;
        try
        {
            validated = await validator.ValidateAsync(command.File, command.Checksum, command.ModerationDecision, command.ModerationMetadataJson, cancellationToken);
        }
        catch (SessionImageValidationException exception)
        {
            return new(AttachSessionImageOutcome.Invalid, ErrorCode: exception.Code, ErrorMessage: exception.Message);
        }

        var now = timeProvider.GetUtcNow();
        var artifactId = $"ART-{Guid.NewGuid():N}".ToUpperInvariant();
        var imageId = $"IMG-{Guid.NewGuid():N}".ToUpperInvariant();
        var storageKey = $"sessions/{command.SessionId}/images/{artifactId}.png";
        await using var content = new MemoryStream(validated.Content, writable: false);
        await storage.PutAsync(storageKey, content, validated.ContentType, cancellationToken);
        try
        {
            var artifact = SessionArtifact.CreateCommittedImage(
                artifactId, command.SessionId, command.ExecutionId, command.AttemptId, storageKey,
                validated.ContentType, validated.Checksum, validated.ModerationMetadataJson, now);
            var image = SessionImage.Create(
                imageId, artifact, command.SourceTurnId, command.SourceInputId, validated.SizeBytes,
                validated.Width, validated.Height, command.RetainUntil);
            var outcome = await repository.TryAddImageAsync(artifact, image, cancellationToken);
            if (outcome == SessionImagePersistenceOutcome.Conflict)
            {
                await storage.DeleteAsync(storageKey, CancellationToken.None);
                return new(AttachSessionImageOutcome.Conflict, ErrorCode: "image_already_attached", ErrorMessage: "このExecutionには画像が添付済みです。");
            }
            return new(AttachSessionImageOutcome.Created, new(
                image.Id, artifact.Id, image.ContentType, image.SizeBytes, image.Width, image.Height,
                image.Checksum, image.ModerationMetadataJson!, image.CreatedAt, image.RetainUntil));
        }
        catch
        {
            await storage.DeleteAsync(storageKey, CancellationToken.None);
            throw;
        }
    }
}

public sealed record SessionImageMedia(Stream Content, string ContentType, long Length);

public sealed class GetSessionImageMediaQuery(ISessionArtifactRepository repository, ISessionObjectStorage storage)
{
    public async Task<SessionImageMedia?> ExecuteAsync(string ownerId, string imageId, CancellationToken cancellationToken)
    {
        var descriptor = await repository.FindImageMediaAsync(ownerId, imageId, cancellationToken);
        if (descriptor is null) return null;
        var stored = await storage.OpenReadAsync(descriptor.StorageKey, cancellationToken);
        return stored is null ? null : new(stored.Content, stored.ContentType, stored.Length);
    }
}

public sealed record SessionArtifactActivityItem(string Id, string ExecutionId, DateTimeOffset CreatedAt);
public sealed record SessionArtifactActivityProjection(
    IReadOnlyList<SessionArtifactResponse> Artifacts,
    IReadOnlyList<SessionArtifactActivityItem> ActivityItems);

public sealed class GetSessionArtifactActivityQuery(ApplicationDbContext db)
{
    public async Task<SessionArtifactActivityProjection> ExecuteAsync(string ownerId, string sessionId, CancellationToken cancellationToken)
    {
        var rows = await (
            from artifact in db.SessionArtifacts.AsNoTracking()
            where artifact.SessionId == sessionId && artifact.Status == SessionArtifactStatus.Committed
                && artifact.Execution.Session.OwnerId == ownerId
            join image in db.SessionImages.AsNoTracking() on artifact.Id equals image.ArtifactId into imageRows
            from image in imageRows.DefaultIfEmpty()
            select new
            {
                artifact.Id,
                artifact.ExecutionId,
                artifact.Kind,
                artifact.Status,
                artifact.Schema,
                artifact.ContentType,
                ImageId = image == null ? null : image.Id,
                artifact.MetadataJson,
                artifact.CreatedAt,
                artifact.CommittedAt,
            }).ToListAsync(cancellationToken);
        var ordered = rows.OrderBy(row => row.CreatedAt).ThenBy(row => row.Id, StringComparer.Ordinal).ToList();
        return new(
            ordered.Select(row => new SessionArtifactResponse(
                row.Id, row.ExecutionId, row.Kind.ToWireValue(), row.Status.ToWireValue(), row.Schema.ToWireValue(), row.ContentType,
                row.ImageId is null ? null : $"/api/session-artifacts/media/{row.ImageId}", row.MetadataJson, row.CreatedAt, row.CommittedAt)).ToList(),
            ordered.Select(row => new SessionArtifactActivityItem(row.Id, row.ExecutionId, row.CreatedAt)).ToList());
    }
}
