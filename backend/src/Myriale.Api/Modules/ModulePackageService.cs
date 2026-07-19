using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Data;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules;

public sealed partial class ModulePackageService(
    ApplicationDbContext db,
    IOptions<ModulePackageOptions> options,
    IWebHostEnvironment environment,
    ILogger<ModulePackageService> logger) : IModulePackageService
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private readonly ModulePackageOptions _options = options.Value;
    private readonly string _storageRoot = Path.GetFullPath(Path.IsPathRooted(options.Value.StoragePath)
        ? options.Value.StoragePath
        : Path.Combine(environment.ContentRootPath, options.Value.StoragePath));

    public async Task<IReadOnlyList<ModulePackage>> ListAsync(CancellationToken cancellationToken)
    {
        return await db.ModulePackages
            .AsNoTracking()
            .OrderBy(package => package.ModuleId)
            .ThenBy(package => package.Version)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<ModulePackageInstallResult> InstallAsync(Stream archive, CancellationToken cancellationToken)
    {
        await Gate.WaitAsync(cancellationToken);
        try
        {
            EnsureDirectories();
            var tempArchive = Path.Combine(TempPath, $"{Guid.NewGuid():N}.myriale-module");
            var stagingPath = Path.Combine(TempPath, $"expanded-{Guid.NewGuid():N}");
            try
            {
                var digest = await CopyArchiveAndHashAsync(archive, tempArchive, cancellationToken);
                var inspected = await InspectAsync(tempArchive, cancellationToken);
                var existing = await db.ModulePackages.FindAsync([digest], cancellationToken);
                var conflicting = await db.ModulePackages.AnyAsync(
                    package => package.ModuleId == inspected.Manifest.Id
                        && package.Version == inspected.Manifest.Version
                        && package.Digest != digest,
                    cancellationToken);
                if (conflicting)
                    throw new ModulePackageValidationException("同じモジュールIDとバージョンの異なるパッケージは登録できません。");

                var packageRelativePath = Path.Combine("packages", $"{digest}.myriale-module");
                var expandedRelativePath = Path.Combine("expanded", digest);
                var packagePath = GetAbsolutePath(packageRelativePath);
                var expandedPath = GetAbsolutePath(expandedRelativePath);

                await ExtractAsync(tempArchive, stagingPath, inspected.AllowedFiles, cancellationToken);
                ReplaceDirectory(stagingPath, expandedPath);
                File.Move(tempArchive, packagePath, overwrite: true);

                var now = DateTimeOffset.UtcNow;
                var row = existing ?? new ModulePackage
                {
                    Digest = digest,
                    IsEnabled = false,
                    InstalledAt = now
                };
                row.ModuleId = inspected.Manifest.Id;
                row.Version = inspected.Manifest.Version;
                row.ContractVersion = inspected.Manifest.ContractVersion;
                row.DisplayName = inspected.Manifest.DisplayName;
                row.Description = inspected.Manifest.Description;
                row.ManifestJson = JsonSerializer.Serialize(inspected.Manifest, ModuleJsonSerializerOptions.Create());
                row.PackageRelativePath = packageRelativePath.Replace('\\', '/');
                row.ExpandedRelativePath = expandedRelativePath.Replace('\\', '/');
                row.Status = "installed";
                row.LastError = null;
                row.LastScannedAt = now;
                if (existing is null) db.ModulePackages.Add(row);
                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException exception) when (existing is null)
                {
                    logger.LogWarning(exception, "Module catalog update conflicted for {ModuleId} {Version}", row.ModuleId, row.Version);
                    throw new ModulePackageValidationException("同じモジュールIDとバージョンのパッケージが既に登録されています。");
                }
                return new ModulePackageInstallResult(row, existing is null);
            }
            finally
            {
                if (File.Exists(tempArchive)) File.Delete(tempArchive);
                if (Directory.Exists(stagingPath)) Directory.Delete(stagingPath, true);
            }
        }
        finally
        {
            Gate.Release();
        }
    }

    public async Task<ModulePackageScanResult> RescanAsync(CancellationToken cancellationToken)
    {
        EnsureDirectories();
        var installed = 0;
        var unchanged = 0;
        var missing = 0;
        var issues = new List<ModulePackageScanIssue>();

        foreach (var path in Directory.EnumerateFiles(InboxPath, "*.myriale-module", SearchOption.TopDirectoryOnly))
        {
            try
            {
                ModulePackageInstallResult result;
                await using (var stream = File.OpenRead(path))
                {
                    result = await InstallAsync(stream, cancellationToken);
                }
                if (result.Created) installed++; else unchanged++;
                File.Delete(path);
            }
            catch (Exception exception) when (exception is InvalidDataException or IOException or ModulePackageValidationException)
            {
                issues.Add(new ModulePackageScanIssue(Path.GetFileName(path), exception.Message));
            }
        }

        var known = await db.ModulePackages.AsNoTracking().ToDictionaryAsync(package => package.Digest, cancellationToken);
        foreach (var path in Directory.EnumerateFiles(PackagesPath, "*.myriale-module", SearchOption.TopDirectoryOnly))
        {
            var digest = Path.GetFileNameWithoutExtension(path).ToLowerInvariant();
            if (known.TryGetValue(digest, out var package) && await IsPackageUsableAsync(package, cancellationToken)) continue;
            try
            {
                if (new FileInfo(path).Length > _options.MaxArchiveBytes)
                    throw new ModulePackageValidationException("パッケージの圧縮サイズが上限を超えています。");
                var bytes = await File.ReadAllBytesAsync(path, cancellationToken);
                await using var stream = new MemoryStream(bytes, writable: false);
                var result = await InstallAsync(stream, cancellationToken);
                if (result.Created) installed++; else unchanged++;
                var canonicalPath = GetAbsolutePath(result.Package.PackageRelativePath);
                if (!string.Equals(path, canonicalPath, StringComparison.Ordinal) && File.Exists(path)) File.Delete(path);
            }
            catch (Exception exception) when (exception is InvalidDataException or IOException or ModulePackageValidationException)
            {
                issues.Add(new ModulePackageScanIssue(Path.GetFileName(path), exception.Message));
            }
        }

        var packages = await db.ModulePackages.ToArrayAsync(cancellationToken);
        foreach (var package in packages)
        {
            if (await IsPackageUsableAsync(package, cancellationToken)) continue;
            var archiveExists = File.Exists(GetAbsolutePath(package.PackageRelativePath));
            package.Status = archiveExists ? "invalid" : "missing";
            package.IsEnabled = false;
            package.LastError = archiveExists
                ? "パッケージの整合性を確認できません。"
                : "パッケージファイルが見つかりません。";
            package.LastScannedAt = DateTimeOffset.UtcNow;
            missing++;
        }
        if (missing > 0) await db.SaveChangesAsync(cancellationToken);

        return new ModulePackageScanResult(installed, unchanged, missing, issues);
    }

    public async Task<ModulePackage?> SetEnabledAsync(string digest, bool enabled, CancellationToken cancellationToken)
    {
        digest = digest.Trim().ToLowerInvariant();
        var package = await db.ModulePackages.FindAsync([digest], cancellationToken);
        if (package is null) return null;
        if (enabled)
        {
            if (package.Status != "installed" || !await IsPackageUsableAsync(package, cancellationToken))
            {
                throw new ModulePackageValidationException("パッケージまたは展開済みリソースの整合性を確認できません。");
            }

            var others = await db.ModulePackages
                .Where(candidate => candidate.ModuleId == package.ModuleId
                    && candidate.Version == package.Version
                    && candidate.Digest != package.Digest
                    && candidate.IsEnabled)
                .ToArrayAsync(cancellationToken);
            foreach (var other in others) other.IsEnabled = false;
        }

        package.IsEnabled = enabled;
        await db.SaveChangesAsync(cancellationToken);
        return package;
    }

    private async Task<string> CopyArchiveAndHashAsync(Stream source, string destination, CancellationToken cancellationToken)
    {
        await using var target = new FileStream(destination, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous);
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var buffer = new byte[81920];
        long total = 0;
        while (true)
        {
            var read = await source.ReadAsync(buffer, cancellationToken);
            if (read == 0) break;
            total += read;
            if (total > _options.MaxArchiveBytes) throw new ModulePackageValidationException("パッケージの圧縮サイズが上限を超えています。");
            hash.AppendData(buffer, 0, read);
            await target.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
        if (total == 0) throw new ModulePackageValidationException("空のパッケージは登録できません。");
        return Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant();
    }

    private async Task<InspectedPackage> InspectAsync(string archivePath, CancellationToken cancellationToken)
    {
        using var archive = ZipFile.OpenRead(archivePath);
        if (archive.Entries.Count == 0 || archive.Entries.Count > _options.MaxEntries)
            throw new ModulePackageValidationException("パッケージ内のファイル数が不正です。");

        var files = new Dictionary<string, ZipArchiveEntry>(StringComparer.OrdinalIgnoreCase);
        long expandedBytes = 0;
        foreach (var entry in archive.Entries)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (IsSymbolicLink(entry)) throw new ModulePackageValidationException($"シンボリックリンクは使用できません: {entry.FullName}");
            if (string.IsNullOrEmpty(entry.Name)) continue;
            var normalized = NormalizeEntryPath(entry.FullName);
            if (!files.TryAdd(normalized, entry)) throw new ModulePackageValidationException("大文字小文字を含めて重複するパスがあります。");
            if (entry.Length > _options.MaxEntryBytes) throw new ModulePackageValidationException($"ファイルサイズが上限を超えています: {normalized}");
            expandedBytes += entry.Length;
            if (expandedBytes > _options.MaxExpandedBytes) throw new ModulePackageValidationException("展開後サイズが上限を超えています。");
        }

        if (!files.TryGetValue("module.dll", out var moduleEntry)) throw new ModulePackageValidationException("ルートにmodule.dllが必要です。");
        if (files.Keys.Count(path => path.EndsWith(".dll", StringComparison.OrdinalIgnoreCase)) != 1)
            throw new ModulePackageValidationException("モジュール固有DLLはmodule.dllの1つだけにしてください。");

        await using var moduleStream = moduleEntry.Open();
        await using var memory = new MemoryStream();
        await CopyBoundedAsync(moduleStream, memory, _options.MaxEntryBytes, cancellationToken);
        memory.Position = 0;

        var loadContext = new ModuleAssemblyLoadContext();
        try
        {
            var assembly = loadContext.LoadFromStream(memory);
            var entryPoint = assembly.GetCustomAttributes<MyrialeModuleEntryPointAttribute>().SingleOrDefault()
                ?? throw new ModulePackageValidationException("MyrialeModuleEntryPoint属性が必要です。");
            var type = entryPoint.ModuleType;
            if (type.Assembly != assembly) throw new ModulePackageValidationException("エントリーポイントはmodule.dll内で定義してください。");
            if (!type.IsPublic || type.IsAbstract || !typeof(IMyrialeModule).IsAssignableFrom(type))
                throw new ModulePackageValidationException("エントリーポイントはpublicなIMyrialeModule実装である必要があります。");
            if (type.GetConstructor(Type.EmptyTypes) is null)
                throw new ModulePackageValidationException("モジュールにはpublicな引数なしコンストラクターが必要です。");
            var module = (IMyrialeModule?)Activator.CreateInstance(type)
                ?? throw new ModulePackageValidationException("モジュールを生成できませんでした。");
            var manifest = module.GetManifest();
            ValidateManifest(manifest);

            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "module.dll" };
            AddUiResources(manifest.UserInterfaces.Runtime, allowed);
            AddUiResources(manifest.UserInterfaces.Authoring, allowed);
            AddUiResources(manifest.UserInterfaces.ResultSummary, allowed);
            var extra = files.Keys.FirstOrDefault(path => !allowed.Contains(path));
            if (extra is not null) throw new ModulePackageValidationException($"マニフェストに宣言されていないファイルがあります: {extra}");
            var absent = allowed.FirstOrDefault(path => !files.ContainsKey(path));
            if (absent is not null) throw new ModulePackageValidationException($"宣言されたリソースがありません: {absent}");
            return new InspectedPackage(manifest, allowed);
        }
        catch (ModulePackageValidationException)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Module package inspection failed for {ArchivePath}", archivePath);
            throw new ModulePackageValidationException("module.dllを検査できませんでした。");
        }
        finally
        {
            loadContext.Unload();
        }
    }

    private async Task ExtractAsync(string archivePath, string destination, HashSet<string> allowedFiles, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(destination);
        try
        {
            using var archive = ZipFile.OpenRead(archivePath);
            long totalCopied = 0;
            foreach (var entry in archive.Entries)
            {
                if (string.IsNullOrEmpty(entry.Name)) continue;
                var normalized = NormalizeEntryPath(entry.FullName);
                if (!allowedFiles.Contains(normalized)) continue;
                var outputPath = Path.GetFullPath(Path.Combine(destination, normalized.Replace('/', Path.DirectorySeparatorChar)));
                if (!outputPath.StartsWith(destination + Path.DirectorySeparatorChar, StringComparison.Ordinal))
                    throw new ModulePackageValidationException("展開先の外側を参照するパスがあります。");
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
                await using var input = entry.Open();
                await using var output = new FileStream(outputPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous);
                totalCopied += await CopyBoundedAsync(input, output, _options.MaxEntryBytes, cancellationToken);
                if (totalCopied > _options.MaxExpandedBytes) throw new ModulePackageValidationException("展開後サイズが上限を超えています。");
            }
        }
        catch
        {
            if (Directory.Exists(destination)) Directory.Delete(destination, true);
            throw;
        }
    }

    private void ValidateManifest(ModuleManifest manifest)
    {
        if (!ModuleIdPattern().IsMatch(manifest.Id)) throw new ModulePackageValidationException("モジュールIDは逆ドメイン形式で指定してください。");
        if (!SemanticVersionPattern().IsMatch(manifest.Version)) throw new ModulePackageValidationException("モジュールバージョンはSemVerで指定してください。");
        if (manifest.ContractVersion != ModuleContractVersions.V1) throw new ModulePackageValidationException("未対応のモジュール契約バージョンです。");
        if (string.IsNullOrWhiteSpace(manifest.DisplayName) || manifest.DisplayName.Length > 200) throw new ModulePackageValidationException("表示名が不正です。");
        if (manifest.Description.Length > 2000) throw new ModulePackageValidationException("説明が長すぎます。");
        if (manifest.Configuration.SchemaVersion < 1 || manifest.Configuration.StateSchemaVersion < 1) throw new ModulePackageValidationException("設定と状態のスキーマバージョンは1以上にしてください。");
        if (manifest.Limits.MaxConfigurationBytes <= 0 || manifest.Limits.MaxStateBytes <= 0 || manifest.Limits.MaxActionBytes <= 0 || manifest.Limits.MaxEffects <= 0)
            throw new ModulePackageValidationException("モジュール制限値は正数で指定してください。");
    }

    private static void AddUiResources(ModuleUiEntry? entry, HashSet<string> allowed)
    {
        if (entry is null) return;
        AddResource(entry.ScriptPath, allowed, ".mjs");
        if (!entry.ElementName.Contains('-', StringComparison.Ordinal)) throw new ModulePackageValidationException("Custom Element名にはハイフンが必要です。");
        foreach (var stylePath in entry.StylePaths) AddResource(stylePath, allowed, ".css");
    }

    private static void AddResource(string path, HashSet<string> allowed, string extension)
    {
        var normalized = NormalizeEntryPath(path);
        if (!normalized.StartsWith("resources/", StringComparison.Ordinal) || !normalized.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
            throw new ModulePackageValidationException($"UIリソースのパスが不正です: {path}");
        if (!allowed.Add(normalized)) throw new ModulePackageValidationException($"UIリソースが重複しています: {path}");
    }

    private static string NormalizeEntryPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || path.Contains('\\') || path.Contains(':') || path.Contains('\0') || Path.IsPathRooted(path))
            throw new ModulePackageValidationException("パッケージ内のパスが不正です。");
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0 || segments.Any(segment => segment is "." or ".."))
            throw new ModulePackageValidationException("パッケージ内の相対パスが不正です。");
        return string.Join('/', segments);
    }

    private static bool IsSymbolicLink(ZipArchiveEntry entry)
    {
        var unixMode = (entry.ExternalAttributes >> 16) & 0xF000;
        return unixMode == 0xA000;
    }

    private async Task<bool> IsPackageUsableAsync(ModulePackage package, CancellationToken cancellationToken)
    {
        var archivePath = GetAbsolutePath(package.PackageRelativePath);
        var expandedPath = GetAbsolutePath(package.ExpandedRelativePath);
        if (!File.Exists(archivePath) || !Directory.Exists(expandedPath)) return false;
        try
        {
            await using (var archiveStream = File.OpenRead(archivePath))
            {
                if (archiveStream.Length > _options.MaxArchiveBytes) return false;
                var actualDigest = Convert.ToHexString(await SHA256.HashDataAsync(archiveStream, cancellationToken)).ToLowerInvariant();
                if (!string.Equals(actualDigest, package.Digest, StringComparison.Ordinal)) return false;
            }

            var manifest = JsonSerializer.Deserialize<ModuleManifest>(package.ManifestJson, ModuleJsonSerializerOptions.Create());
            if (manifest is null) return false;
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "module.dll" };
            AddUiResources(manifest.UserInterfaces.Runtime, allowed);
            AddUiResources(manifest.UserInterfaces.Authoring, allowed);
            AddUiResources(manifest.UserInterfaces.ResultSummary, allowed);

            using var archive = ZipFile.OpenRead(archivePath);
            var entries = archive.Entries
                .Where(entry => !string.IsNullOrEmpty(entry.Name))
                .ToDictionary(entry => NormalizeEntryPath(entry.FullName), StringComparer.OrdinalIgnoreCase);
            foreach (var relativePath in allowed)
            {
                if (!entries.TryGetValue(relativePath, out var entry)) return false;
                var extractedPath = Path.Combine(expandedPath, relativePath.Replace('/', Path.DirectorySeparatorChar));
                if (!File.Exists(extractedPath)) return false;
                await using var entryStream = entry.Open();
                await using var extractedStream = File.OpenRead(extractedPath);
                if (entry.Length > _options.MaxEntryBytes || extractedStream.Length > _options.MaxEntryBytes) return false;
                var entryHash = await SHA256.HashDataAsync(entryStream, cancellationToken);
                var extractedHash = await SHA256.HashDataAsync(extractedStream, cancellationToken);
                if (!entryHash.AsSpan().SequenceEqual(extractedHash)) return false;
            }
            return true;
        }
        catch (Exception exception) when (exception is IOException or InvalidDataException or JsonException or ModulePackageValidationException)
        {
            logger.LogWarning(exception, "Module package integrity check failed for {Digest}", package.Digest);
            return false;
        }
    }

    private static async Task<long> CopyBoundedAsync(
        Stream input,
        Stream output,
        long maximumBytes,
        CancellationToken cancellationToken)
    {
        var buffer = new byte[81920];
        long total = 0;
        while (true)
        {
            var read = await input.ReadAsync(buffer, cancellationToken);
            if (read == 0) return total;
            total += read;
            if (total > maximumBytes) throw new ModulePackageValidationException("展開したファイルサイズが上限を超えています。");
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
    }

    private static void ReplaceDirectory(string source, string destination)
    {
        var backup = $"{destination}.backup-{Guid.NewGuid():N}";
        if (Directory.Exists(destination)) Directory.Move(destination, backup);
        try
        {
            Directory.Move(source, destination);
            if (Directory.Exists(backup)) Directory.Delete(backup, true);
        }
        catch
        {
            if (!Directory.Exists(destination) && Directory.Exists(backup)) Directory.Move(backup, destination);
            throw;
        }
    }

    private void EnsureDirectories()
    {
        Directory.CreateDirectory(PackagesPath);
        Directory.CreateDirectory(ExpandedPath);
        Directory.CreateDirectory(InboxPath);
        Directory.CreateDirectory(TempPath);
    }

    private string GetAbsolutePath(string relativePath) => Path.GetFullPath(Path.Combine(_storageRoot, relativePath.Replace('/', Path.DirectorySeparatorChar)));
    private string PackagesPath => Path.Combine(_storageRoot, "packages");
    private string ExpandedPath => Path.Combine(_storageRoot, "expanded");
    private string InboxPath => Path.Combine(_storageRoot, "inbox");
    private string TempPath => Path.Combine(_storageRoot, "temp");

    private sealed record InspectedPackage(ModuleManifest Manifest, HashSet<string> AllowedFiles);

    [GeneratedRegex("^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$")]
    private static partial Regex ModuleIdPattern();

    [GeneratedRegex("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$")]
    private static partial Regex SemanticVersionPattern();
}
