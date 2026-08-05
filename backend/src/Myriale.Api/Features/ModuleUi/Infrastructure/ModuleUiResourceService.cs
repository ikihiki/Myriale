using System.Security.Cryptography;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModuleUi.Infrastructure;

public sealed class ModuleUiResourceService(
    IModuleExecutionUiBindingService executions,
    IModulePackageCatalogService catalog,
    IModulePackageResourceService artifacts,
    ILogger<ModuleUiResourceService> logger) : IModuleUiResourceService
{
    public async Task<ModuleUiDescriptorResult> GetRuntimeDescriptorAsync(string ownerId, string executionId, CancellationToken cancellationToken)
    {
        var resolved = await ResolveAsync(ownerId, executionId, cancellationToken);
        if (resolved.StatusCode != StatusCodes.Status200OK) return new(resolved.StatusCode, Error: resolved.Error);
        var runtime = resolved.Package!.Manifest.UserInterfaces.Runtime!;
        var resources = await LoadResourcesAsync(resolved.Package, runtime, cancellationToken);
        if (resources.Error is not null) return new(resources.StatusCode, Error: resources.Error);
        var script = ToResponse(executionId, "script", "text/javascript", resources.Resources![runtime.ScriptPath]);
        var styles = runtime.StylePaths.Select((path, index) => ToResponse(executionId, $"style-{index}", "text/css", resources.Resources[path])).ToArray();
        return new(StatusCodes.Status200OK, new ModuleRuntimeUiDescriptorResponse(
            "myriale.module-ui", 1, executionId,
            new(resolved.Package.ModuleId.AsPrimitive(), resolved.Package.Version.AsPrimitive(), resolved.Package.Digest.AsPrimitive()),
            runtime.ElementName, script, styles));
    }

    public async Task<ModuleUiResourceResult> GetRuntimeResourceAsync(string ownerId, string executionId, string resourceId, CancellationToken cancellationToken)
    {
        var resolved = await ResolveAsync(ownerId, executionId, cancellationToken);
        if (resolved.StatusCode != StatusCodes.Status200OK) return new(resolved.StatusCode, Error: resolved.Error);
        var runtime = resolved.Package!.Manifest.UserInterfaces.Runtime!;
        var path = resourceId == "script" ? runtime.ScriptPath : TryStylePath(resourceId, runtime.StylePaths);
        if (path is null) return ErrorResource(StatusCodes.Status404NotFound, "resource_not_declared", "指定されたruntime UIリソースは宣言されていません。");
        try
        {
            var bytes = await artifacts.ReadResourceAsync(resolved.Package, path, cancellationToken);
            return new(StatusCodes.Status200OK, bytes, resourceId == "script" ? "text/javascript" : "text/css", Hash(bytes));
        }
        catch (Exception exception) when (exception is IOException or InvalidDataException or UnauthorizedAccessException)
        {
            logger.LogWarning(exception, "Runtime UI resource integrity check failed for {Digest}", resolved.Package.Digest.AsPrimitive());
            return ErrorResource(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "runtime UIリソースの整合性を確認できません。");
        }
    }

    private async Task<ResolvedUi> ResolveAsync(string ownerId, string executionId, CancellationToken cancellationToken)
    {
        var execution = await executions.FindAsync(new AccountId(ownerId), new ModuleExecutionId(executionId), cancellationToken);
        if (execution is null) return new(StatusCodes.Status404NotFound);
        ModulePackageResolution resolution;
        try
        {
            resolution = await catalog.ResolveAsync(execution.ModuleId, execution.ModuleVersion, execution.ModuleDigest, cancellationToken);
        }
        catch (ArgumentException) { return Error(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "実行に固定されたモジュールパッケージ識別子が不正です。"); }
        if (resolution.Availability == ModulePackageAvailability.Disabled)
            return Error(StatusCodes.Status409Conflict, "package_disabled", "実行に固定されたモジュールパッケージは無効です。");
        if (resolution.Availability != ModulePackageAvailability.Available || resolution.Package is null)
            return Error(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "実行に固定されたモジュールパッケージを利用できません。");
        if (resolution.Package.ContractVersion != execution.ContractVersion)
            return Error(StatusCodes.Status503ServiceUnavailable, "package_unavailable", "runtime UIマニフェストを確認できません。");
        if (resolution.Package.Manifest.UserInterfaces.Runtime is null)
            return Error(StatusCodes.Status422UnprocessableEntity, "runtime_ui_not_declared", "このモジュールにはruntime UIがありません。");
        return new(StatusCodes.Status200OK, resolution.Package);
    }

    private async Task<LoadedResources> LoadResourcesAsync(ModulePackageSnapshot package, ModuleUiEntry runtime, CancellationToken cancellationToken)
    {
        try
        {
            var resources = new Dictionary<string, byte[]>(StringComparer.Ordinal);
            foreach (var path in new[] { runtime.ScriptPath }.Concat(runtime.StylePaths)) resources[path] = await artifacts.ReadResourceAsync(package, path, cancellationToken);
            return new(StatusCodes.Status200OK, resources);
        }
        catch (Exception exception) when (exception is IOException or InvalidDataException or UnauthorizedAccessException)
        {
            logger.LogWarning(exception, "Runtime UI resources failed for {Digest}", package.Digest.AsPrimitive());
            return new(StatusCodes.Status503ServiceUnavailable, Error: new("package_unavailable", "runtime UIリソースの整合性を確認できません。"));
        }
    }

    private static string? TryStylePath(string resourceId, IReadOnlyList<string> styles) =>
        resourceId.StartsWith("style-", StringComparison.Ordinal) && int.TryParse(resourceId.AsSpan(6), out var index) && index >= 0 && index < styles.Count ? styles[index] : null;
    private static ModuleUiResourceResponse ToResponse(string executionId, string id, string contentType, byte[] bytes) =>
        new(id, $"/api/module-executions/{Uri.EscapeDataString(executionId)}/ui/runtime/resources/{id}", contentType, Hash(bytes), bytes.LongLength);
    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    private static ResolvedUi Error(int status, string code, string message) => new(status, Error: new(code, message));
    private static ModuleUiResourceResult ErrorResource(int status, string code, string message) => new(status, Error: new(code, message));
    private sealed record ResolvedUi(int StatusCode, ModulePackageSnapshot? Package = null, ModuleUiErrorResponse? Error = null);
    private sealed record LoadedResources(int StatusCode, IReadOnlyDictionary<string, byte[]>? Resources = null, ModuleUiErrorResponse? Error = null);
}
