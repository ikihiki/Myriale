using System.Collections.Concurrent;
using System.IO.Compression;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Features.ModulePackages;

namespace Myriale.Api.Features.ModulePackages.Infrastructure;

internal sealed class FileModulePackageArtifactStore : IModulePackageArtifactStore, IModulePackageResourceService
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> PromotionLocks = new(StringComparer.Ordinal);
    private readonly ModulePackageOptions _options;
    private readonly ILogger<FileModulePackageArtifactStore> _logger;
    private readonly string _root;

    public FileModulePackageArtifactStore(IOptions<ModulePackageOptions> options, IWebHostEnvironment environment, ILogger<FileModulePackageArtifactStore> logger)
    {
        _options = options.Value; _logger = logger;
        _root = Path.GetFullPath(Path.IsPathRooted(_options.StoragePath) ? _options.StoragePath : Path.Combine(environment.ContentRootPath, _options.StoragePath));
        EnsureDirectories();
    }

    public async Task<StagedModulePackage> StageAsync(Stream input, CancellationToken cancellationToken)
    {
        EnsureDirectories();
        var token = Guid.NewGuid().ToString("N");
        var directory = StagedPath(token);
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, "package.input");
        try
        {
            await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous);
            using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
            var buffer = new byte[81920]; long total = 0;
            while (true)
            {
                var read = await input.ReadAsync(buffer, cancellationToken);
                if (read == 0) break;
                total += read;
                if (total > _options.MaxArchiveBytes) throw new ModulePackageValidationException("モジュールファイルのサイズが上限を超えています。");
                hash.AppendData(buffer, 0, read);
                await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }
            if (total == 0) throw new ModulePackageValidationException("空のモジュールファイルは登録できません。");
            return new(token, new(Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant()));
        }
        catch { DeleteDirectory(directory); throw; }
    }

    public Task<Stream> OpenStagedAsync(StagedModulePackage staged, CancellationToken cancellationToken) =>
        Task.FromResult<Stream>(new FileStream(StagedInput(staged), FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous));

    public async Task PromoteAsync(StagedModulePackage staged, ModulePackageInspection inspection, CancellationToken cancellationToken)
    {
        if (staged.Digest != inspection.Digest) throw new InvalidDataException("Staged digest and inspection digest differ.");
        var canonical = PackagePath(inspection.Digest, inspection.Format);
        var promotionLock = PromotionLocks.GetOrAdd(canonical, static _ => new SemaphoreSlim(1, 1));
        await promotionLock.WaitAsync(cancellationToken);
        try
        {
            if (!File.Exists(canonical)) File.Copy(StagedInput(staged), canonical, overwrite: false);
            else await RequireDigestAsync(canonical, inspection.Digest, cancellationToken);
            await ExpandCanonicalAsync(canonical, inspection, cancellationToken);
        }
        finally
        {
            promotionLock.Release();
        }
    }

    public async Task<ModulePackageArtifactVerification> VerifyAsync(ModulePackageSnapshot package, CancellationToken cancellationToken)
    {
        var canonical = PackagePath(package.Digest, package.Format);
        var expanded = ExpandedPath(package.Digest);
        if (!File.Exists(canonical) || !Directory.Exists(expanded)) return new(false, true, "モジュールファイルまたは展開済みリソースが見つかりません。");
        try
        {
            await RequireDigestAsync(canonical, package.Digest, cancellationToken);
            var allowed = AllowedFiles(package.Manifest);
            if (package.Format == ModulePackageFormat.Dll)
            {
                if (allowed.Count != 1) return new(false, false, "DLLパッケージがUIリソースを宣言しています。");
                return await FilesHaveSameHashAsync(canonical, Path.Combine(expanded, "module.dll"), cancellationToken)
                    ? new(true, false) : new(false, false, "展開済みmodule.dllのhashが一致しません。");
            }
            using var archive = ZipFile.OpenRead(canonical);
            var entries = archive.Entries.Where(entry => !string.IsNullOrEmpty(entry.Name))
                .ToDictionary(entry => ModulePackageInspector.NormalizeEntryPath(entry.FullName), StringComparer.OrdinalIgnoreCase);
            foreach (var relativePath in allowed)
            {
                if (!entries.TryGetValue(relativePath, out var entry)) return new(false, false, $"宣言されたリソースがありません: {relativePath}");
                var extracted = SafeExpandedPath(package.Digest, relativePath);
                if (!File.Exists(extracted)) return new(false, true, $"展開済みリソースがありません: {relativePath}");
                await using var left = entry.Open(); await using var right = File.OpenRead(extracted);
                if (entry.Length > _options.MaxEntryBytes || right.Length > _options.MaxEntryBytes) return new(false, false, "リソースサイズが上限を超えています。");
                var canonicalHash = await SHA256.HashDataAsync(left, cancellationToken);
                var expandedHash = await SHA256.HashDataAsync(right, cancellationToken);
                if (!canonicalHash.SequenceEqual(expandedHash))
                    return new(false, false, $"展開済みリソースのhashが一致しません: {relativePath}");
            }
            return new(true, false);
        }
        catch (Exception exception) when (exception is IOException or InvalidDataException or UnauthorizedAccessException or ModulePackageValidationException)
        {
            _logger.LogWarning(exception, "Module artifact verification failed for {Digest}", package.Digest.AsPrimitive());
            return new(false, false, exception.Message);
        }
    }

    public Task DeleteAsync(ModulePackageDigest digest, CancellationToken cancellationToken)
    {
        foreach (var format in Enum.GetValues<ModulePackageFormat>()) { var path = PackagePath(digest, format); if (File.Exists(path)) File.Delete(path); }
        DeleteDirectory(ExpandedPath(digest)); return Task.CompletedTask;
    }

    public async Task RepairAsync(ModulePackageSnapshot package, CancellationToken cancellationToken)
    {
        var canonical = PackagePath(package.Digest, package.Format);
        if (!File.Exists(canonical)) throw new FileNotFoundException("Canonical module package is missing.", canonical);
        await RequireDigestAsync(canonical, package.Digest, cancellationToken);
        var inspection = new ModulePackageInspection(package.Digest, package.ModuleId, package.Version, package.Manifest, package.Format, AllowedFiles(package.Manifest));
        await ExpandCanonicalAsync(canonical, inspection, cancellationToken);
    }

    public Task DeleteStagedAsync(StagedModulePackage staged, CancellationToken cancellationToken) { DeleteDirectory(StagedPath(staged.Token)); return Task.CompletedTask; }

    public async Task<byte[]> ReadAssemblyAsync(ModulePackageSnapshot package, CancellationToken cancellationToken) =>
        await ReadBoundedAsync(SafeExpandedPath(package.Digest, "module.dll"), _options.MaxEntryBytes, cancellationToken);

    public async Task<byte[]> ReadResourceAsync(ModulePackageSnapshot package, string relativePath, CancellationToken cancellationToken)
    {
        var normalized = ModulePackageInspector.NormalizeEntryPath(relativePath);
        if (!AllowedFiles(package.Manifest).Contains(normalized)) throw new InvalidDataException("Resource is not declared by the module manifest.");
        return await ReadBoundedAsync(SafeExpandedPath(package.Digest, normalized), _options.MaxEntryBytes, cancellationToken);
    }

    public async IAsyncEnumerable<ModulePackageInboxArtifact> EnumerateInboxAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        EnsureDirectories();
        foreach (var path in Directory.EnumerateFiles(InboxRoot, "*", SearchOption.TopDirectoryOnly).Where(IsPackageInput))
        { cancellationToken.ThrowIfCancellationRequested(); yield return new(Path.GetFileName(path), path); await Task.Yield(); }
    }

    public Task<Stream> OpenInboxAsync(ModulePackageInboxArtifact artifact, CancellationToken cancellationToken)
    {
        var path = Path.GetFullPath(artifact.Path); var prefix = InboxRoot + Path.DirectorySeparatorChar;
        if (!path.StartsWith(prefix, StringComparison.Ordinal) || Directory.Exists(path)) throw new InvalidDataException("Inbox artifact path is invalid.");
        return Task.FromResult<Stream>(new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous));
    }

    public Task DeleteInboxAsync(ModulePackageInboxArtifact artifact, CancellationToken cancellationToken)
    {
        var path = Path.GetFullPath(artifact.Path); var prefix = InboxRoot + Path.DirectorySeparatorChar;
        if (!path.StartsWith(prefix, StringComparison.Ordinal) || Directory.Exists(path)) throw new InvalidDataException("Inbox artifact path is invalid.");
        if (File.Exists(path)) File.Delete(path); return Task.CompletedTask;
    }

    private async Task ExpandCanonicalAsync(string canonical, ModulePackageInspection inspection, CancellationToken cancellationToken)
    {
        var staging = Path.Combine(StagingRoot, $"expanded-{Guid.NewGuid():N}"); Directory.CreateDirectory(staging);
        try
        {
            if (inspection.Format == ModulePackageFormat.Dll)
            {
                await using var input = File.OpenRead(canonical); await using var output = File.Create(Path.Combine(staging, "module.dll"));
                await ModulePackageInspector.CopyBoundedAsync(input, output, Math.Min(_options.MaxEntryBytes, _options.MaxExpandedBytes), cancellationToken);
            }
            else
            {
                using var archive = ZipFile.OpenRead(canonical); long total = 0;
                foreach (var entry in archive.Entries)
                {
                    if (string.IsNullOrEmpty(entry.Name)) continue;
                    var normalized = ModulePackageInspector.NormalizeEntryPath(entry.FullName);
                    if (!inspection.Files.Contains(normalized)) continue;
                    var outputPath = Path.GetFullPath(Path.Combine(staging, normalized.Replace('/', Path.DirectorySeparatorChar)));
                    if (!outputPath.StartsWith(staging + Path.DirectorySeparatorChar, StringComparison.Ordinal)) throw new InvalidDataException("Archive path escapes staging root.");
                    Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
                    await using var input = entry.Open(); await using var output = new FileStream(outputPath, FileMode.CreateNew, FileAccess.Write);
                    total += await ModulePackageInspector.CopyBoundedAsync(input, output, _options.MaxEntryBytes, cancellationToken);
                    if (total > _options.MaxExpandedBytes) throw new ModulePackageValidationException("展開後サイズが上限を超えています。");
                }
            }
            ReplaceDirectory(staging, ExpandedPath(inspection.Digest));
        }
        catch { DeleteDirectory(staging); throw; }
    }

    private static HashSet<string> AllowedFiles(Myriale.ModuleSdk.ModuleManifest manifest)
    {
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "module.dll" };
        ModulePackageInspector.AddUiResources(manifest.UserInterfaces.Runtime, allowed);
        ModulePackageInspector.AddUiResources(manifest.UserInterfaces.Authoring, allowed);
        ModulePackageInspector.AddUiResources(manifest.UserInterfaces.ResultSummary, allowed);
        return allowed;
    }

    private async Task RequireDigestAsync(string path, ModulePackageDigest expected, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(path);
        if (stream.Length > _options.MaxArchiveBytes) throw new InvalidDataException("Module package exceeds size limit.");
        var actual = Convert.ToHexString(await SHA256.HashDataAsync(stream, cancellationToken)).ToLowerInvariant();
        if (actual != expected.AsPrimitive()) throw new InvalidDataException("Module package digest does not match catalog identity.");
    }

    private static async Task<bool> FilesHaveSameHashAsync(string first, string second, CancellationToken cancellationToken)
    {
        if (!File.Exists(second)) return false;
        await using var a = File.OpenRead(first); await using var b = File.OpenRead(second);
        var firstHash = await SHA256.HashDataAsync(a, cancellationToken);
        var secondHash = await SHA256.HashDataAsync(b, cancellationToken);
        return firstHash.SequenceEqual(secondHash);
    }

    private static async Task<byte[]> ReadBoundedAsync(string path, long maximum, CancellationToken cancellationToken)
    {
        await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous);
        if (stream.Length > maximum) throw new InvalidDataException("Module artifact exceeds size limit.");
        using var output = new MemoryStream((int)stream.Length); await stream.CopyToAsync(output, cancellationToken); return output.ToArray();
    }

    private string SafeExpandedPath(ModulePackageDigest digest, string relative)
    {
        var root = ExpandedPath(digest); var path = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal)) throw new InvalidDataException("Module resource path escapes package root.");
        return path;
    }

    private string StagedInput(StagedModulePackage staged) => Path.Combine(StagedPath(staged.Token), "package.input");
    private string StagedPath(string token) => Path.Combine(StagingRoot, token);
    private string PackagePath(ModulePackageDigest digest, ModulePackageFormat format) => Path.Combine(PackagesRoot, digest.AsPrimitive() + (format == ModulePackageFormat.Dll ? ".dll" : ".myriale-module"));
    private string ExpandedPath(ModulePackageDigest digest) => Path.Combine(ExpandedRoot, digest.AsPrimitive());
    private string PackagesRoot => Path.Combine(_root, "packages");
    private string ExpandedRoot => Path.Combine(_root, "expanded");
    private string InboxRoot => Path.Combine(_root, "inbox");
    private string StagingRoot => Path.Combine(_root, "staging");
    private void EnsureDirectories() { Directory.CreateDirectory(PackagesRoot); Directory.CreateDirectory(ExpandedRoot); Directory.CreateDirectory(InboxRoot); Directory.CreateDirectory(StagingRoot); }
    private static bool IsPackageInput(string path) => Path.GetExtension(path).Equals(".dll", StringComparison.OrdinalIgnoreCase) || Path.GetExtension(path).Equals(".myriale-module", StringComparison.OrdinalIgnoreCase);
    private static void DeleteDirectory(string path) { if (Directory.Exists(path)) Directory.Delete(path, true); }
    private static void ReplaceDirectory(string source, string destination)
    {
        var backup = destination + ".backup-" + Guid.NewGuid().ToString("N"); if (Directory.Exists(destination)) Directory.Move(destination, backup);
        try { Directory.Move(source, destination); DeleteDirectory(backup); }
        catch { if (!Directory.Exists(destination) && Directory.Exists(backup)) Directory.Move(backup, destination); throw; }
    }
}
