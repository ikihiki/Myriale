using Microsoft.AspNetCore.Http.HttpResults;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules;

namespace Myriale.Api.Endpoints;

public static class ModuleAdminEndpoints
{
    public static RouteGroupBuilder MapModuleAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/modules")
            .WithTags("Admin Modules")
            .RequireCors("MyrialeFrontend")
            .RequireAuthorization("ModuleAdministration");

        group.MapGet("/", ListAsync).WithName("ListModulePackages");
        group.MapGet("/{digest}", GetAsync).WithName("GetModulePackage");
        group.MapPost("/install", InstallAsync).WithName("InstallModulePackage");
        group.MapPost("/rescan", RescanAsync).WithName("RescanModulePackages");
        group.MapPost("/{digest}/enable", EnableAsync).WithName("EnableModulePackage");
        group.MapPost("/{digest}/disable", DisableAsync).WithName("DisableModulePackage");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<ModulePackageResponse>>> ListAsync(
        IModulePackageService packages,
        CancellationToken cancellationToken)
    {
        var rows = await packages.ListAsync(cancellationToken);
        return TypedResults.Ok<IReadOnlyList<ModulePackageResponse>>(rows.Select(ToResponse).ToArray());
    }

    private static async Task<Results<Ok<ModulePackageResponse>, NotFound>> GetAsync(
        string digest,
        IModulePackageService packages,
        CancellationToken cancellationToken)
    {
        var package = (await packages.ListAsync(cancellationToken))
            .FirstOrDefault(candidate => string.Equals(candidate.Digest, digest, StringComparison.OrdinalIgnoreCase));
        return package is null ? TypedResults.NotFound() : TypedResults.Ok(ToResponse(package));
    }

    private static async Task<Results<Created<ModulePackageInstallResponse>, Ok<ModulePackageInstallResponse>, BadRequest<ModulePackageErrorResponse>>> InstallAsync(
        HttpRequest request,
        IModulePackageService packages,
        CancellationToken cancellationToken)
    {
        if (request.ContentLength == 0)
            return TypedResults.BadRequest(new ModulePackageErrorResponse("モジュールパッケージをリクエスト本文に指定してください。"));
        try
        {
            var result = await packages.InstallAsync(request.Body, cancellationToken);
            var response = new ModulePackageInstallResponse(ToResponse(result.Package), result.Created);
            return result.Created
                ? TypedResults.Created($"/api/admin/modules/{result.Package.Digest}", response)
                : TypedResults.Ok(response);
        }
        catch (ModulePackageValidationException exception)
        {
            return TypedResults.BadRequest(new ModulePackageErrorResponse(exception.Message));
        }
        catch (InvalidDataException)
        {
            return TypedResults.BadRequest(new ModulePackageErrorResponse("有効なZIPパッケージではありません。"));
        }
    }

    private static async Task<Ok<ModulePackageScanResponse>> RescanAsync(
        IModulePackageService packages,
        CancellationToken cancellationToken)
    {
        var result = await packages.RescanAsync(cancellationToken);
        return TypedResults.Ok(new ModulePackageScanResponse(
            result.Installed,
            result.Unchanged,
            result.Missing,
            result.Issues.Select(issue => new ModulePackageScanIssueResponse(issue.FileName, issue.Message)).ToArray()));
    }

    private static Task<Results<Ok<ModulePackageResponse>, NotFound, BadRequest<ModulePackageErrorResponse>>> EnableAsync(
        string digest,
        IModulePackageService packages,
        CancellationToken cancellationToken) => SetEnabledAsync(digest, true, packages, cancellationToken);

    private static Task<Results<Ok<ModulePackageResponse>, NotFound, BadRequest<ModulePackageErrorResponse>>> DisableAsync(
        string digest,
        IModulePackageService packages,
        CancellationToken cancellationToken) => SetEnabledAsync(digest, false, packages, cancellationToken);

    private static async Task<Results<Ok<ModulePackageResponse>, NotFound, BadRequest<ModulePackageErrorResponse>>> SetEnabledAsync(
        string digest,
        bool enabled,
        IModulePackageService packages,
        CancellationToken cancellationToken)
    {
        try
        {
            var package = await packages.SetEnabledAsync(digest, enabled, cancellationToken);
            return package is null ? TypedResults.NotFound() : TypedResults.Ok(ToResponse(package));
        }
        catch (ModulePackageValidationException exception)
        {
            return TypedResults.BadRequest(new ModulePackageErrorResponse(exception.Message));
        }
    }

    private static ModulePackageResponse ToResponse(ModulePackage package) => new(
        package.Digest,
        package.ModuleId,
        package.Version,
        package.ContractVersion,
        package.DisplayName,
        package.Description,
        package.Status,
        package.IsEnabled,
        package.InstalledAt,
        package.LastScannedAt,
        package.LastError);
}
