using System.IO.Compression;
using System.Reflection;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Data;
using Myriale.Api.Features.ModulePackages;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModulePackages.Infrastructure;

internal sealed class ModulePackageInspector(IOptions<ModulePackageOptions> options, ILogger<ModulePackageInspector> logger) : IModulePackageInspector
{
    private readonly ModulePackageOptions _options = options.Value;

    public async Task<ModulePackageInspection> InspectAsync(ModulePackageDigest digest, Stream input, CancellationToken cancellationToken)
    {
        await using var memory = new MemoryStream();
        await CopyBoundedAsync(input, memory, _options.MaxArchiveBytes, cancellationToken);
        if (memory.Length == 0) throw new ModulePackageValidationException("空のモジュールファイルは登録できません。");
        memory.Position = 0;
        var format = await DetectFormatAsync(memory, cancellationToken);
        memory.Position = 0;
        if (format == ModulePackageFormat.Dll)
        {
            var manifest = await InspectAssemblyAsync(memory, cancellationToken);
            if (manifest.UserInterfaces.Runtime is not null || manifest.UserInterfaces.Authoring is not null || manifest.UserInterfaces.ResultSummary is not null)
                throw new ModulePackageValidationException("UIリソースを宣言するモジュールはZIPパッケージとして登録してください。");
            return Create(digest, manifest, format, new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "module.dll" });
        }

        using var archive = new ZipArchive(memory, ZipArchiveMode.Read, leaveOpen: true);
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
        var archiveManifest = await InspectAssemblyAsync(moduleStream, cancellationToken);
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "module.dll" };
        AddUiResources(archiveManifest.UserInterfaces.Runtime, allowed);
        AddUiResources(archiveManifest.UserInterfaces.Authoring, allowed);
        AddUiResources(archiveManifest.UserInterfaces.ResultSummary, allowed);
        var extra = files.Keys.FirstOrDefault(path => !allowed.Contains(path));
        if (extra is not null) throw new ModulePackageValidationException($"マニフェストに宣言されていないファイルがあります: {extra}");
        var absent = allowed.FirstOrDefault(path => !files.ContainsKey(path));
        if (absent is not null) throw new ModulePackageValidationException($"宣言されたリソースがありません: {absent}");
        return Create(digest, archiveManifest, format, allowed);
    }

    private static ModulePackageInspection Create(ModulePackageDigest digest, ModuleManifest manifest, ModulePackageFormat format, IReadOnlySet<string> files)
    {
        ModulePackageModuleId moduleId;
        ModulePackageVersion version;
        try { moduleId = new(manifest.Id); version = new(manifest.Version); }
        catch (ArgumentException exception) { throw new ModulePackageValidationException(exception.Message); }
        return new(digest, moduleId, version, manifest, format, files);
    }

    private async Task<ModuleManifest> InspectAssemblyAsync(Stream assemblyStream, CancellationToken cancellationToken)
    {
        await using var memory = new MemoryStream();
        await CopyBoundedAsync(assemblyStream, memory, _options.MaxEntryBytes, cancellationToken);
        memory.Position = 0;
        var loadContext = new ModuleAssemblyLoadContext();
        try
        {
            var assembly = loadContext.LoadFromStream(memory);
            var entryPoint = assembly.GetCustomAttributes<MyrialeModuleEntryPointAttribute>().SingleOrDefault()
                ?? throw new ModulePackageValidationException("MyrialeModuleEntryPoint属性が必要です。");
            var type = entryPoint.ModuleType;
            if (type.Assembly != assembly || !type.IsPublic || type.IsAbstract || !typeof(IMyrialeModule).IsAssignableFrom(type))
                throw new ModulePackageValidationException("エントリーポイントはmodule.dll内のpublicなIMyrialeModule実装である必要があります。");
            if (type.GetConstructor(Type.EmptyTypes) is null) throw new ModulePackageValidationException("モジュールにはpublicな引数なしコンストラクターが必要です。");
            var module = (IMyrialeModule?)Activator.CreateInstance(type) ?? throw new ModulePackageValidationException("モジュールを生成できませんでした。");
            var manifest = module.GetManifest();
            ValidateManifest(manifest);
            return manifest;
        }
        catch (ModulePackageValidationException) { throw; }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Module assembly inspection failed");
            throw new ModulePackageValidationException("module.dllを検査できませんでした。");
        }
        finally { loadContext.Unload(); }
    }

    private static async Task<ModulePackageFormat> DetectFormatAsync(Stream stream, CancellationToken cancellationToken)
    {
        var signature = new byte[4];
        var read = await stream.ReadAsync(signature, cancellationToken);
        if (read >= 2 && signature[0] == (byte)'M' && signature[1] == (byte)'Z') return ModulePackageFormat.Dll;
        if (read == 4 && signature[0] == (byte)'P' && signature[1] == (byte)'K' && signature[2] is 3 or 5 or 7 && signature[3] is 4 or 6 or 8)
            return ModulePackageFormat.Archive;
        throw new ModulePackageValidationException("有効な.NET DLLまたはZIPパッケージではありません。");
    }

    private static void ValidateManifest(ModuleManifest manifest)
    {
        if (manifest.ContractVersion != ModuleContractVersions.V1) throw new ModulePackageValidationException("未対応のモジュール契約バージョンです。");
        if (string.IsNullOrWhiteSpace(manifest.DisplayName) || manifest.DisplayName.Length > 200) throw new ModulePackageValidationException("表示名が不正です。");
        if (manifest.Description.Length > 2000) throw new ModulePackageValidationException("説明が長すぎます。");
        if (manifest.Configuration.SchemaVersion < 1 || manifest.Configuration.StateSchemaVersion < 1) throw new ModulePackageValidationException("設定と状態のスキーマバージョンは1以上にしてください。");
        if (manifest.Capabilities is null || manifest.Capabilities.Count != 0) throw new ModulePackageValidationException("Object action extensionはホスト権限を要求できません。");
        if (manifest.Limits.MaxConfigurationBytes <= 0 || manifest.Limits.MaxStateBytes <= 0 || manifest.Limits.MaxActionBytes <= 0 || manifest.Limits.MaxEffects != 0)
            throw new ModulePackageValidationException("モジュール制限値がObject action extension契約と一致しません。");
    }

    internal static void AddUiResources(ModuleUiEntry? entry, HashSet<string> allowed)
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

    internal static string NormalizeEntryPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || path.Contains('\\') || path.Contains(':') || path.Contains('\0') || Path.IsPathRooted(path))
            throw new ModulePackageValidationException("パッケージ内のパスが不正です。");
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0 || segments.Any(segment => segment is "." or "..")) throw new ModulePackageValidationException("パッケージ内の相対パスが不正です。");
        return string.Join('/', segments);
    }

    private static bool IsSymbolicLink(ZipArchiveEntry entry) => ((entry.ExternalAttributes >> 16) & 0xF000) == 0xA000;

    internal static async Task<long> CopyBoundedAsync(Stream input, Stream output, long maximumBytes, CancellationToken cancellationToken)
    {
        var buffer = new byte[81920]; long total = 0;
        while (true)
        {
            var read = await input.ReadAsync(buffer, cancellationToken);
            if (read == 0) return total;
            total += read;
            if (total > maximumBytes) throw new ModulePackageValidationException("ファイルサイズが上限を超えています。");
            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
    }
}
