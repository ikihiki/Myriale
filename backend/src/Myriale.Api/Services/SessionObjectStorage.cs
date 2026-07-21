namespace Myriale.Api.Services;

public sealed record StoredSessionObject(Stream Content, string ContentType, long Length);

public interface ISessionObjectStorage
{
    Task PutAsync(string key, Stream content, string contentType, CancellationToken cancellationToken);
    Task<StoredSessionObject?> OpenReadAsync(string key, CancellationToken cancellationToken);
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
        if (!path.StartsWith(Path.GetFullPath(root) + Path.DirectorySeparatorChar, StringComparison.Ordinal)) throw new InvalidOperationException("Invalid storage key.");
        return path;
    }
}

public sealed class SessionArtifactRetentionWorker(IServiceScopeFactory scopeFactory, ISessionObjectStorage storage) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Data.ApplicationDbContext>();
            var retained = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
                db.SessionImages.Where(image => image.RetainUntil != null), stoppingToken);
            var now = DateTimeOffset.UtcNow;
            var expired = retained.Where(image => image.RetainUntil < now).ToList();
            foreach (var image in expired) { await storage.DeleteAsync(image.StorageKey, stoppingToken); db.SessionImages.Remove(image); }
            if (expired.Count > 0) await db.SaveChangesAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
