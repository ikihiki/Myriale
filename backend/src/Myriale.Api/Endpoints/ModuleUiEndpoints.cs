using System.Security.Claims;
using Myriale.Api.Modules.UI;

namespace Myriale.Api.Endpoints;

public static class ModuleUiEndpoints
{
    public static RouteGroupBuilder MapModuleUiEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/module-executions/{executionId}/ui/runtime")
            .WithTags("Module Runtime UI")
            .RequireAuthorization()
            .RequireCors("MyrialeFrontend");
        group.MapGet("/", DescriptorAsync).WithName("GetModuleRuntimeUi");
        group.MapGet("/resources/{resourceId}", ResourceAsync).WithName("GetModuleRuntimeUiResource");
        return group;
    }

    private static async Task<IResult> DescriptorAsync(
        string executionId,
        ClaimsPrincipal principal,
        IModuleUiResourceService service,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var result = await service.GetRuntimeDescriptorAsync(ownerId, executionId, cancellationToken);
        if (result.StatusCode == StatusCodes.Status404NotFound && result.Error is null) return Results.NotFound();
        return Results.Json(result.Descriptor ?? (object?)result.Error, statusCode: result.StatusCode);
    }

    private static async Task<IResult> ResourceAsync(
        string executionId,
        string resourceId,
        ClaimsPrincipal principal,
        IModuleUiResourceService service,
        HttpResponse response,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var result = await service.GetRuntimeResourceAsync(ownerId, executionId, resourceId, cancellationToken);
        if (result.Bytes is null)
        {
            if (result.StatusCode == StatusCodes.Status404NotFound && result.Error is null) return Results.NotFound();
            return Results.Json(result.Error, statusCode: result.StatusCode);
        }
        response.Headers.CacheControl = "no-store";
        response.Headers.ContentSecurityPolicy = "default-src 'none'";
        response.Headers.XContentTypeOptions = "nosniff";
        response.Headers.ETag = $"\"sha256-{result.Sha256}\"";
        return Results.Bytes(result.Bytes, result.ContentType);
    }
}
