using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Data;
using Npgsql;

namespace Myriale.Api.Features.SessionArtifacts.Infrastructure;

public sealed class EfSessionArtifactWriter(ApplicationDbContext db) : ISessionArtifactWriter
{
    public void Add(SessionArtifact artifact) => db.SessionArtifacts.Add(artifact);
}

public sealed class EfSessionArtifactRepository(ApplicationDbContext db)
    : ISessionArtifactRepository, ISessionArtifactRetentionRepository
{
    public async Task<SessionImageAttachmentTarget?> FindImageAttachmentTargetAsync(
        string ownerId, string sessionId, string executionId, string attemptId, CancellationToken cancellationToken)
    {
        var target = await db.SessionExecutions.AsNoTracking()
            .Where(execution => execution.Id == executionId && execution.SessionId == sessionId && execution.Session.OwnerId == ownerId)
            .Select(execution => new
            {
                execution.SessionId,
                execution.Id,
                execution.Kind,
                AttemptExists = execution.Attempts.Any(attempt => attempt.Id == attemptId),
                AlreadyAttached = execution.Artifacts.Any(artifact => artifact.Kind == SessionArtifactKind.Image),
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (target is null) return null;
        return new(target.SessionId, target.Id, attemptId, target.Kind, target.AttemptExists, target.AlreadyAttached);
    }

    public async Task<SessionImagePersistenceOutcome> TryAddImageAsync(
        SessionArtifact artifact, SessionImage image, CancellationToken cancellationToken)
    {
        db.SessionArtifacts.Add(artifact);
        db.SessionImages.Add(image);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return SessionImagePersistenceOutcome.Created;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            db.ChangeTracker.Clear();
            return SessionImagePersistenceOutcome.Conflict;
        }
    }

    public Task<SessionImageMediaDescriptor?> FindImageMediaAsync(
        string ownerId, string imageId, CancellationToken cancellationToken) =>
        db.SessionImages.AsNoTracking()
            .Where(image => image.Id == imageId && image.Artifact.Status == SessionArtifactStatus.Committed
                && image.Artifact.Execution.Session.OwnerId == ownerId)
            .Select(image => new SessionImageMediaDescriptor(image.StorageKey, image.ContentType))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<SessionImageRetentionItem>> ListImagesAsync(CancellationToken cancellationToken) =>
        await db.SessionImages.AsNoTracking()
            .Select(image => new SessionImageRetentionItem(image.Id, image.ArtifactId, image.StorageKey, image.RetainUntil))
            .ToListAsync(cancellationToken);

    public async Task<bool> DeleteExpiredAsync(string imageId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var image = await db.SessionImages.Include(item => item.Artifact)
            .SingleOrDefaultAsync(item => item.Id == imageId, cancellationToken);
        if (image is null || image.RetainUntil is null || image.RetainUntil >= now) return false;
        db.SessionArtifacts.Remove(image.Artifact);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is SqliteException { SqliteErrorCode: 19 }
        || exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
