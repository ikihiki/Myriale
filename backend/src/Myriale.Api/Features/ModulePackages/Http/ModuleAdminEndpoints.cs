using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Data;
using Myriale.Api.Features.ModulePackages;

namespace Myriale.Api.Features.ModulePackages.Http;

public static class ModuleAdminEndpoints
{
    public static RouteGroupBuilder MapModuleAdminEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/modules").WithTags("Admin Modules").RequireCors("MyrialeFrontend").RequireAuthorization("ModuleAdministration");
        group.MapGet("/", ListAsync).WithName("ListModulePackages");
        group.MapGet("/{digest}", GetAsync).WithName("GetModulePackage");
        group.MapPost("/install", InstallAsync).WithName("InstallModulePackage");
        group.MapPost("/rescan", RescanAsync).WithName("RescanModulePackages");
        group.MapPost("/{digest}/enable", EnableAsync).WithName("EnableModulePackage");
        group.MapPost("/{digest}/disable", DisableAsync).WithName("DisableModulePackage");
        return group;
    }

    private static async Task<IResult> ListAsync(IModulePackageCatalog catalog, CancellationToken cancellationToken) =>
        Results.Ok((await catalog.ListAsync(cancellationToken)).Select(ToResponse).ToArray());

    private static async Task<IResult> GetAsync(string digest, IModulePackageCatalog catalog, CancellationToken cancellationToken)
    {
        if (!TryDigest(digest, out var value)) return Results.BadRequest(new ModulePackageErrorResponse("Digest must be a SHA-256 value."));
        var package = await catalog.GetAsync(value, cancellationToken);
        return package is null ? Results.NotFound() : Results.Ok(ToResponse(package));
    }

    private static async Task<IResult> InstallAsync(HttpRequest request, InstallModulePackageCommand command, CancellationToken cancellationToken)
    {
        if (request.ContentLength == 0) return Results.BadRequest(new ModulePackageErrorResponse("モジュールパッケージをリクエスト本文に指定してください。"));
        try
        {
            var result = await command.ExecuteAsync(request.Body, cancellationToken);
            var response = new ModulePackageInstallResponse(ToResponse(result.Package), result.Created);
            return result.Created ? Results.Created($"/api/admin/modules/{result.Package.Digest.AsPrimitive()}", response) : Results.Ok(response);
        }
        catch (Exception exception) when (exception is ModulePackageValidationException or InvalidDataException)
        { return Results.BadRequest(new ModulePackageErrorResponse(exception.Message)); }
        catch (ModulePackageConcurrencyException exception)
        { return Results.Conflict(new ModulePackageErrorResponse(exception.Message)); }
    }

    private static async Task<IResult> RescanAsync(RescanModulePackagesCommand command, CancellationToken cancellationToken)
    {
        var result = await command.ExecuteAsync(cancellationToken);
        return Results.Ok(new ModulePackageScanResponse(result.Installed, result.Unchanged, result.Missing,
            result.Issues.Select(x => new ModulePackageScanIssueResponse(x.FileName, x.Message)).ToArray()));
    }

    private static async Task<IResult> EnableAsync(string digest, ModulePackageRevisionRequest request, EnableModulePackageCommand command, CancellationToken cancellationToken)
    {
        if (!TryDigest(digest, out var value)) return Results.BadRequest(new ModulePackageErrorResponse("Digest must be a SHA-256 value."));
        try
        {
            var package = await command.ExecuteAsync(value, request.ExpectedRevision, cancellationToken);
            return package is null ? Results.NotFound() : Results.Ok(ToResponse(package));
        }
        catch (ModulePackageRevisionConflictException exception) { return Results.Conflict(new ModulePackageErrorResponse(exception.Message, exception.ActualRevision)); }
        catch (ModulePackageConcurrencyException exception) { return Results.Conflict(new ModulePackageErrorResponse(exception.Message)); }
        catch (ModulePackageUnavailableException exception) { return Results.Conflict(new ModulePackageErrorResponse(exception.Message)); }
    }

    private static async Task<IResult> DisableAsync(string digest, ModulePackageRevisionRequest request, DisableModulePackageCommand command, CancellationToken cancellationToken)
    {
        if (!TryDigest(digest, out var value)) return Results.BadRequest(new ModulePackageErrorResponse("Digest must be a SHA-256 value."));
        try
        {
            var package = await command.ExecuteAsync(value, request.ExpectedRevision, cancellationToken);
            return package is null ? Results.NotFound() : Results.Ok(ToResponse(package));
        }
        catch (ModulePackageRevisionConflictException exception) { return Results.Conflict(new ModulePackageErrorResponse(exception.Message, exception.ActualRevision)); }
        catch (ModulePackageConcurrencyException exception) { return Results.Conflict(new ModulePackageErrorResponse(exception.Message)); }
    }

    private static bool TryDigest(string input, out ModulePackageDigest digest)
    {
        try { digest = new(input); return true; } catch (ArgumentException) { digest = default; return false; }
    }

    private static ModulePackageResponse ToResponse(ModulePackageSnapshot package) => new(
        package.Digest.AsPrimitive(), package.ModuleId.AsPrimitive(), package.Version.AsPrimitive(), package.ContractVersion,
        package.DisplayName, package.Description, package.Status.ToString().ToLowerInvariant(), package.IsEnabled,
        package.Revision, package.InstalledAt, package.LastScannedAt, package.LastError);
}
