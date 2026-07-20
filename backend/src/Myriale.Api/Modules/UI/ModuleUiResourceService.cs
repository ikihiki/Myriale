using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.UI;

public sealed class ModuleUiResourceService(
    ApplicationDbContext db,
    IOptions<ModulePackageOptions> options,
    IWebHostEnvironment environment,
    ILogger<ModuleUiResourceService> logger) : IModuleUiResourceService
{
    private readonly ModulePackageOptions _options = options.Value;
    private readonly string _storageRoot = Path.GetFullPath(Path.IsPathRooted(options.Value.StoragePath)
        ? options.Value.StoragePath
        : Path.Combine(environment.ContentRootPath, options.Value.StoragePath));

    public async Task<ModuleUiDescriptorResult> GetRuntimeDescriptorAsync(
        string ownerId,
        string executionId,
        CancellationToken cancellationToken)
    {
        var resolved = await ResolveAsync(ownerId, executionId, cancellationToken);
        if (resolved.StatusCode != StatusCodes.Status200OK)
            return new ModuleUiDescriptorResult(resolved.StatusCode, Error: resolved.Error);
        var package = resolved.Package!;
        var runtime = resolved.Manifest!.UserInterfaces.Runtime!;
        var resources = await LoadResourcesAsync(package, runtime, cancellationToken);
        if (resources.Error is not null) return new ModuleUiDescriptorResult(resources.StatusCode, Error: resources.Error);

        var script = ToResponse(executionId, "script", runtime.ScriptPath, "text/javascript", resources.Resources![runtime.ScriptPath]);
        var styles = runtime.StylePaths.Select((path, index) =>
            ToResponse(executionId, $"style-{index}", path, "text/css", resources.Resources[path])).ToArray();
        return new ModuleUiDescriptorResult(
            StatusCodes.Status200OK,
            new ModuleRuntimeUiDescriptorResponse(
                "myriale.module-ui",
                1,
                executionId,
                new ModuleRuntimeUiPackageResponse(package.ModuleId, package.Version, package.Digest),
                runtime.ElementName,
                script,
                styles));
    }

    public async Task<ModuleUiResourceResult> GetRuntimeResourceAsync(
        string ownerId,
        string executionId,
        string resourceId,
        CancellationToken cancellationToken)
    {
        var resolved = await ResolveAsync(ownerId, executionId, cancellationToken);
        if (resolved.StatusCode != StatusCodes.Status200OK)
            return new ModuleUiResourceResult(resolved.StatusCode, Error: resolved.Error);
        var runtime = resolved.Manifest!.UserInterfaces.Runtime!;
        var path = resourceId == "script"
            ? runtime.ScriptPath
            : TryStylePath(resourceId, runtime.StylePaths);
        if (path is null)
            return ErrorResource(StatusCodes.Status404NotFound, "resource_not_declared", "指定されたruntime UIリソースは宣言されていません。");

        var resources = await LoadResourcesAsync(resolved.Package!, runtime, cancellationToken);
        if (resources.Error is not null) return new ModuleUiResourceResult(resources.StatusCode, Error: resources.Error);
        var bytes = resources.Resources![path];
        return new ModuleUiResourceResult(
            StatusCodes.Status200OK,
            bytes,
            resourceId == "script" ? "text/javascript" : "text/css",
            Hash(bytes));
    }

    private async Task<ResolvedUi> ResolveAsync(string ownerId, string executionId, CancellationToken cancellationToken)
    {
        var execution = await db.ModuleExecutions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == executionId && item.OwnerId == ownerId, cancellationToken);
        if (execution is null) return new ResolvedUi(StatusCodes.Status404NotFound);
        var package = await db.ModulePackages.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Digest == execution.ModuleDigest
                && item.ModuleId == execution.ModuleId
                && item.Version == execution.ModuleVersion, cancellationToken);
        if (package is null)
            return Error(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "実行に固定されたモジュールパッケージが見つかりません。");
        if (!package.IsEnabled)
            return Error(StatusCodes.Status409Conflict, "package_disabled", "実行に固定されたモジュールパッケージは無効です。");
        if (package.Status != "installed")
            return Error(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "実行に固定されたモジュールパッケージを利用できません。");
        try
        {
            var manifest = JsonSerializer.Deserialize<ModuleManifest>(package.ManifestJson, ModuleJsonSerializerOptions.Create())
                ?? throw new JsonException("Manifest is empty.");
            if (manifest.Id != execution.ModuleId || manifest.Version != execution.ModuleVersion
                || manifest.ContractVersion != execution.ContractVersion)
                throw new InvalidDataException("Pinned manifest identity does not match the execution.");
            if (manifest.UserInterfaces.Runtime is null)
                return Error(StatusCodes.Status422UnprocessableEntity, "runtime_ui_not_declared", "このモジュールにはruntime UIがありません。");
            return new ResolvedUi(StatusCodes.Status200OK, package, manifest);
        }
        catch (Exception exception) when (exception is JsonException or InvalidDataException)
        {
            logger.LogWarning(exception, "Runtime UI manifest resolution failed for {ExecutionId}", executionId);
            return Error(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "runtime UIマニフェストを確認できません。");
        }
    }

    private async Task<LoadedResources> LoadResourcesAsync(
        ModulePackage package,
        ModuleUiEntry runtime,
        CancellationToken cancellationToken)
    {
        try
        {
            var packagePath = GetStoragePath(package.PackageRelativePath);
            if (Path.GetExtension(packagePath).Equals(".dll", StringComparison.OrdinalIgnoreCase))
                return ResourceError(StatusCodes.Status422UnprocessableEntity, "runtime_ui_not_declared", "DLL単体パッケージにはruntime UIを含められません。");
            var archiveBytes = await ReadBoundedAsync(packagePath, _options.MaxArchiveBytes, cancellationToken);
            if (Hash(archiveBytes) != package.Digest)
                return ResourceError(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "モジュールパッケージのdigestが一致しません。");

            var paths = new[] { runtime.ScriptPath }.Concat(runtime.StylePaths).ToArray();
            var resources = new Dictionary<string, byte[]>(StringComparer.Ordinal);
            using var memory = new MemoryStream(archiveBytes, writable: false);
            using var archive = new ZipArchive(memory, ZipArchiveMode.Read);
            foreach (var path in paths)
            {
                var entry = archive.Entries.SingleOrDefault(candidate => string.Equals(candidate.FullName, path, StringComparison.Ordinal));
                if (entry is null || entry.Length > _options.MaxEntryBytes)
                    return ResourceError(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "宣言されたruntime UIリソースを確認できません。");
                await using var entryStream = entry.Open();
                var canonical = await ReadBoundedAsync(entryStream, _options.MaxEntryBytes, cancellationToken);
                var expandedPath = GetStoragePath(Path.Combine(package.ExpandedRelativePath, path));
                var expanded = await ReadBoundedAsync(expandedPath, _options.MaxEntryBytes, cancellationToken);
                if (!SHA256.HashData(canonical).AsSpan().SequenceEqual(SHA256.HashData(expanded)))
                    return ResourceError(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "展開済みruntime UIリソースの整合性を確認できません。");
                resources[path] = canonical;
            }
            return new LoadedResources(StatusCodes.Status200OK, resources);
        }
        catch (Exception exception) when (exception is IOException or InvalidDataException or UnauthorizedAccessException)
        {
            logger.LogWarning(exception, "Runtime UI resource integrity check failed for {Digest}", package.Digest);
            return ResourceError(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "runtime UIリソースの整合性を確認できません。");
        }
    }

    private string GetStoragePath(string relativePath)
    {
        if (Path.IsPathRooted(relativePath)) throw new InvalidDataException("Stored module path must be relative.");
        var path = Path.GetFullPath(Path.Combine(_storageRoot, relativePath.Replace('/', Path.DirectorySeparatorChar)));
        var root = _storageRoot.EndsWith(Path.DirectorySeparatorChar) ? _storageRoot : _storageRoot + Path.DirectorySeparatorChar;
        if (!path.StartsWith(root, StringComparison.Ordinal)) throw new InvalidDataException("Stored module path escapes the storage root.");
        return path;
    }

    private static async Task<byte[]> ReadBoundedAsync(string path, long maximum, CancellationToken cancellationToken)
    {
        await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous);
        return await ReadBoundedAsync(stream, maximum, cancellationToken);
    }

    private static async Task<byte[]> ReadBoundedAsync(Stream stream, long maximum, CancellationToken cancellationToken)
    {
        using var output = new MemoryStream();
        var buffer = new byte[81920];
        while (true)
        {
            var read = await stream.ReadAsync(buffer, cancellationToken);
            if (read == 0) return output.ToArray();
            if (output.Length + read > maximum) throw new InvalidDataException("Resource exceeds configured size limit.");
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
    }

    private static string? TryStylePath(string resourceId, IReadOnlyList<string> styles)
    {
        if (!resourceId.StartsWith("style-", StringComparison.Ordinal)
            || !int.TryParse(resourceId.AsSpan(6), out var index)
            || index < 0 || index >= styles.Count) return null;
        return styles[index];
    }

    private static ModuleUiResourceResponse ToResponse(string executionId, string id, string path, string contentType, byte[] bytes) =>
        new(id, $"/api/module-executions/{Uri.EscapeDataString(executionId)}/ui/runtime/resources/{id}", contentType, Hash(bytes), bytes.LongLength);

    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    private static ResolvedUi Error(int status, string code, string message) => new(status, Error: new ModuleUiErrorResponse(code, message));
    private static ModuleUiResourceResult ErrorResource(int status, string code, string message) => new(status, Error: new ModuleUiErrorResponse(code, message));
    private static LoadedResources ResourceError(int status, string code, string message) => new(status, Error: new ModuleUiErrorResponse(code, message));

    private sealed record ResolvedUi(int StatusCode, ModulePackage? Package = null, ModuleManifest? Manifest = null, ModuleUiErrorResponse? Error = null);
    private sealed record LoadedResources(int StatusCode, IReadOnlyDictionary<string, byte[]>? Resources = null, ModuleUiErrorResponse? Error = null);
}
