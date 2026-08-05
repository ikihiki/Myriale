using Microsoft.Extensions.Options;
using Myriale.Api.Features.SessionArtifacts.Application;

namespace Myriale.Api.Features.SessionArtifacts.Infrastructure;

public sealed record StoredSessionObject(Stream Content, string ContentType, long Length);
public sealed record SessionObjectInfo(string Key, long Length, DateTimeOffset LastModifiedAt);

public interface ISessionObjectStorage
{
    Task PutAsync(string key, Stream content, string contentType, CancellationToken cancellationToken);
    Task<StoredSessionObject?> OpenReadAsync(string key, CancellationToken cancellationToken);
    Task<IReadOnlyList<SessionObjectInfo>> ListAsync(CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}

public sealed class FileSessionObjectStorage(IHostEnvironment environment) : ISessionObjectStorage
{
    private readonly string root = Path.Combine(environment.ContentRootPath, ".session-artifacts");

    public async Task PutAsync(string key, Stream content, string contentType, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(root);
        var path = Resolve(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var output = File.Create(path);
        await content.CopyToAsync(output, cancellationToken);
        await File.WriteAllTextAsync(path + ".content-type", contentType, cancellationToken);
    }

    public Task<StoredSessionObject?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        var path = Resolve(key);
        if (!File.Exists(path)) return Task.FromResult<StoredSessionObject?>(null);
        var contentType = File.Exists(path + ".content-type") ? File.ReadAllText(path + ".content-type") : "application/octet-stream";
        var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<StoredSessionObject?>(new(stream, contentType, stream.Length));
    }

    public Task<IReadOnlyList<SessionObjectInfo>> ListAsync(CancellationToken cancellationToken)
    {
        if (!Directory.Exists(root)) return Task.FromResult<IReadOnlyList<SessionObjectInfo>>([]);
        var objects = Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)
            .Where(path => !path.EndsWith(".content-type", StringComparison.Ordinal))
            .Select(path =>
            {
                cancellationToken.ThrowIfCancellationRequested();
                var info = new FileInfo(path);
                return new SessionObjectInfo(
                    Path.GetRelativePath(root, path).Replace(Path.DirectorySeparatorChar, '/'),
                    info.Length,
                    info.LastWriteTimeUtc);
            })
            .OrderBy(item => item.Key, StringComparer.Ordinal)
            .ToArray();
        return Task.FromResult<IReadOnlyList<SessionObjectInfo>>(objects);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        var path = Resolve(key);
        if (File.Exists(path)) File.Delete(path);
        if (File.Exists(path + ".content-type")) File.Delete(path + ".content-type");
        return Task.CompletedTask;
    }

    private string Resolve(string key)
    {
        var path = Path.GetFullPath(Path.Combine(root, key.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(Path.GetFullPath(root) + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid storage key.");
        return path;
    }
}

public sealed record SessionArtifactReconciliationResult(int ExpiredDeleted, int OrphansDeleted, int MissingObjects);

public sealed class SessionArtifactReconciler(
    ISessionArtifactRetentionRepository repository,
    ISessionObjectStorage storage,
    IOptions<SessionImageOptions> options,
    TimeProvider timeProvider,
    ILogger<SessionArtifactReconciler> logger)
{
    public async Task<SessionArtifactReconciliationResult> ReconcileAsync(CancellationToken cancellationToken = default)
    {
        using var activity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.artifact.reconcile");
        var now = timeProvider.GetUtcNow();
        var images = await repository.ListImagesAsync(cancellationToken);
        var expiredDeleted = 0;
        var expiredKeys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var image in images.Where(image => image.RetainUntil is not null && image.RetainUntil < now))
        {
            if (!await repository.DeleteExpiredAsync(image.ImageId, now, cancellationToken)) continue;
            expiredDeleted++;
            expiredKeys.Add(image.StorageKey);
            await storage.DeleteAsync(image.StorageKey, cancellationToken);
        }

        var objects = await storage.ListAsync(cancellationToken);
        var objectKeys = objects.Select(item => item.Key).ToHashSet(StringComparer.Ordinal);
        var referencedKeys = images.Where(image => !expiredKeys.Contains(image.StorageKey))
            .Select(image => image.StorageKey).ToHashSet(StringComparer.Ordinal);
        var orphanCutoff = now.AddMinutes(-options.Value.OrphanGraceMinutes);
        var orphans = objects.Where(item => !referencedKeys.Contains(item.Key) && item.LastModifiedAt < orphanCutoff).ToArray();
        foreach (var orphan in orphans) await storage.DeleteAsync(orphan.Key, cancellationToken);

        var missing = referencedKeys.Count(key => !objectKeys.Contains(key));
        if (missing > 0) logger.LogWarning("Session artifact reconciliation found missing objects. MissingObjects={MissingObjects}", missing);
        logger.LogInformation(
            "Session artifact reconciliation completed. ExpiredDeleted={ExpiredDeleted} OrphansDeleted={OrphansDeleted} MissingObjects={MissingObjects}",
            expiredDeleted, orphans.Length, missing);
        activity?.SetTag("myriale.artifact.expired_deleted", expiredDeleted);
        activity?.SetTag("myriale.artifact.orphans_deleted", orphans.Length);
        activity?.SetTag("myriale.artifact.missing_objects", missing);
        return new(expiredDeleted, orphans.Length, missing);
    }
}

public sealed class SessionArtifactRetentionWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<SessionImageOptions> options,
    TimeProvider timeProvider,
    ILogger<SessionArtifactRetentionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromMinutes(options.Value.ReconciliationIntervalMinutes);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<SessionArtifactReconciler>().ReconcileAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogWarning(exception, "Session artifact reconciliation failed."); }
            await Task.Delay(interval, timeProvider, stoppingToken);
        }
    }
}
