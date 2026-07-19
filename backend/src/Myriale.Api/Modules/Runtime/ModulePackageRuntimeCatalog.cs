using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

internal sealed class ModulePackageRuntimeCatalog(
    ApplicationDbContext db,
    IOptions<ModulePackageOptions> options,
    IWebHostEnvironment environment,
    ILogger<ModulePackageRuntimeCatalog> logger) : IModulePackageRuntimeCatalog
{
    private readonly ModulePackageOptions _options = options.Value;
    private readonly string _storageRoot = Path.GetFullPath(Path.IsPathRooted(options.Value.StoragePath)
        ? options.Value.StoragePath
        : Path.Combine(environment.ContentRootPath, options.Value.StoragePath));

    public async Task<ModulePackageRuntimeDescriptor> ResolveEnabledAsync(
        ModulePackageIdentity identity,
        CancellationToken cancellationToken)
    {
        identity = identity.Normalize();
        var package = await db.ModulePackages.AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Digest == identity.Digest, cancellationToken)
            ?? throw Error(ModuleRuntimeErrorCodes.PackageNotFound, "指定されたモジュールパッケージは登録されていません。");

        if (!string.Equals(package.ModuleId, identity.ModuleId, StringComparison.Ordinal)
            || !string.Equals(package.Version, identity.Version, StringComparison.Ordinal))
            throw Error(ModuleRuntimeErrorCodes.PackageNotFound, "指定されたモジュールパッケージの識別情報が一致しません。");
        if (!package.IsEnabled)
            throw Error(ModuleRuntimeErrorCodes.PackageDisabled, "指定されたモジュールパッケージは無効です。");
        if (!string.Equals(package.Status, "installed", StringComparison.Ordinal)
            || !string.Equals(package.ContractVersion, ModuleContractVersions.V1, StringComparison.Ordinal))
            throw Error(ModuleRuntimeErrorCodes.PackageUnavailable, "指定されたモジュールパッケージは実行できません。");

        try
        {
            var manifest = JsonSerializer.Deserialize<ModuleManifest>(package.ManifestJson, ModuleJsonSerializerOptions.Create())
                ?? throw new InvalidDataException("Stored manifest is empty.");
            if (manifest.Id != identity.ModuleId || manifest.Version != identity.Version || manifest.ContractVersion != package.ContractVersion)
                throw new InvalidDataException("Stored manifest identity does not match the catalog row.");

            var packagePath = GetStoragePath(package.PackageRelativePath);
            var expandedAssemblyPath = GetStoragePath(Path.Combine(package.ExpandedRelativePath, "module.dll"));
            var packageBytes = await ReadBoundedAsync(packagePath, _options.MaxArchiveBytes, cancellationToken);
            var packageDigest = Convert.ToHexString(SHA256.HashData(packageBytes)).ToLowerInvariant();
            if (!string.Equals(packageDigest, identity.Digest, StringComparison.Ordinal))
                throw new InvalidDataException("Package digest does not match.");

            var assemblyBytes = await ReadBoundedAsync(expandedAssemblyPath, _options.MaxEntryBytes, cancellationToken);
            var canonicalAssemblyBytes = Path.GetExtension(packagePath).Equals(".dll", StringComparison.OrdinalIgnoreCase)
                ? packageBytes
                : ReadAssemblyFromArchive(packageBytes);
            if (!SHA256.HashData(assemblyBytes).AsSpan().SequenceEqual(SHA256.HashData(canonicalAssemblyBytes)))
                throw new InvalidDataException("Expanded assembly does not match the canonical package.");

            return new ModulePackageRuntimeDescriptor(identity, manifest, assemblyBytes);
        }
        catch (Exception exception) when (exception is IOException or InvalidDataException or JsonException or UnauthorizedAccessException)
        {
            logger.LogWarning(exception, "Module package {ModuleId} {Version} {Digest} failed runtime integrity validation", identity.ModuleId, identity.Version, identity.Digest);
            throw Error(ModuleRuntimeErrorCodes.PackageUnavailable, "指定されたモジュールパッケージの整合性を確認できません。", exception);
        }
    }

    private string GetStoragePath(string relativePath)
    {
        if (Path.IsPathRooted(relativePath)) throw new InvalidDataException("Stored module path must be relative.");
        var path = Path.GetFullPath(Path.Combine(_storageRoot, relativePath.Replace('/', Path.DirectorySeparatorChar)));
        var rootPrefix = _storageRoot.EndsWith(Path.DirectorySeparatorChar)
            ? _storageRoot
            : _storageRoot + Path.DirectorySeparatorChar;
        if (!path.StartsWith(rootPrefix, StringComparison.Ordinal)) throw new InvalidDataException("Stored module path escapes the storage root.");
        return path;
    }

    private static async Task<byte[]> ReadBoundedAsync(string path, long maximumBytes, CancellationToken cancellationToken)
    {
        await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous);
        if (stream.Length > maximumBytes) throw new InvalidDataException("Module file exceeds the configured size limit.");
        using var memory = new MemoryStream((int)stream.Length);
        await stream.CopyToAsync(memory, cancellationToken);
        return memory.ToArray();
    }

    private byte[] ReadAssemblyFromArchive(byte[] packageBytes)
    {
        using var memory = new MemoryStream(packageBytes, writable: false);
        using var archive = new ZipArchive(memory, ZipArchiveMode.Read);
        var entries = archive.Entries.Where(entry => string.Equals(entry.FullName, "module.dll", StringComparison.OrdinalIgnoreCase)).ToArray();
        if (entries.Length != 1 || entries[0].Length > _options.MaxEntryBytes)
            throw new InvalidDataException("Package does not contain one valid module.dll.");
        using var input = entries[0].Open();
        using var output = new MemoryStream((int)entries[0].Length);
        input.CopyTo(output);
        if (output.Length != entries[0].Length) throw new InvalidDataException("Package assembly length is invalid.");
        return output.ToArray();
    }

    private static ModuleRuntimeException Error(string code, string message, Exception? exception = null) => new(code, message, exception);
}
