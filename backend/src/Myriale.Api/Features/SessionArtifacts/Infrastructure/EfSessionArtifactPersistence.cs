using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Infrastructure.Persistence;
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
        AccountId ownerId, SessionId sessionId, SessionExecutionId executionId, SessionExecutionAttemptId attemptId, CancellationToken cancellationToken)
    {
        var target = await (
            from execution in db.SessionExecutions.AsNoTracking()
            join session in db.Sessions.AsNoTracking() on execution.SessionId equals session.Id
            where execution.Id == executionId && execution.SessionId == sessionId && session.OwnerId == ownerId
            select new
            {
                execution.SessionId,
                execution.Id,
                execution.Kind,
                AttemptExists = db.SessionExecutionAttempts.Any(attempt => attempt.ExecutionId == execution.Id && attempt.Id == attemptId),
                AlreadyAttached = db.SessionArtifacts.Any(artifact => artifact.ExecutionId == execution.Id && artifact.Kind == SessionArtifactKind.Image),
            }).SingleOrDefaultAsync(cancellationToken);
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
        AccountId ownerId, SessionImageId imageId, CancellationToken cancellationToken) =>
        (from image in db.SessionImages.AsNoTracking()
         join artifact in db.SessionArtifacts.AsNoTracking() on image.ArtifactId equals artifact.Id
         join execution in db.SessionExecutions.AsNoTracking() on artifact.ExecutionId equals execution.Id
         join session in db.Sessions.AsNoTracking() on execution.SessionId equals session.Id
         where image.Id == imageId && artifact.Status == SessionArtifactStatus.Committed && session.OwnerId == ownerId
         select new SessionImageMediaDescriptor(image.StorageKey, image.ContentType))
        .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<SessionImageRetentionItem>> ListImagesAsync(CancellationToken cancellationToken) =>
        await db.SessionImages.AsNoTracking()
            .Select(image => new SessionImageRetentionItem(image.Id, image.ArtifactId, image.StorageKey, image.RetainUntil))
            .ToListAsync(cancellationToken);

    public async Task<bool> DeleteExpiredAsync(SessionImageId imageId, DateTimeOffset now, CancellationToken cancellationToken)
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
