using System.Security.Claims;
using Myriale.Api.Contracts;
using Myriale.Api.Modules.Execution;

namespace Myriale.Api.Endpoints;

public static class ModuleExecutionEndpoints
{
    public static RouteGroupBuilder MapModuleExecutionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/module-executions")
            .WithTags("Module Executions")
            .RequireAuthorization()
            .RequireCors("MyrialeFrontend");

        group.MapPost("/", InitializeAsync)
            .WithName("InitializeModuleExecution")
            .WithSummary("Creates and initializes a detached module execution.");
        group.MapGet("/{executionId}", GetAsync)
            .WithName("GetModuleExecution")
            .WithSummary("Returns the owner-visible durable module execution snapshot.");
        group.MapPost("/{executionId}/dispatch", DispatchAsync)
            .WithName("DispatchModuleExecution")
            .WithSummary("Applies one action to an active detached module execution.");
        return group;
    }

    private static async Task<IResult> InitializeAsync(
        InitializeModuleExecutionRequest request,
        ClaimsPrincipal principal,
        IModuleExecutionService service,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var result = await service.InitializeAsync(ownerId, request, cancellationToken);
        return ToResult(result);
    }

    private static async Task<IResult> GetAsync(
        string executionId,
        ClaimsPrincipal principal,
        IModuleExecutionService service,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        return ToResult(await service.GetAsync(ownerId, executionId, cancellationToken));
    }

    private static async Task<IResult> DispatchAsync(
        string executionId,
        DispatchModuleExecutionRequest request,
        ClaimsPrincipal principal,
        IModuleExecutionService service,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        return ToResult(await service.DispatchAsync(ownerId, executionId, request, cancellationToken));
    }

    private static IResult ToResult(ModuleExecutionServiceResult result)
    {
        if (result.StatusCode == StatusCodes.Status404NotFound && result.Response is null && result.Error is null)
            return Results.NotFound();
        if (result.Response is not null)
        {
            return result.StatusCode == StatusCodes.Status201Created
                ? Results.Created(result.Location!, result.Response)
                : Results.Json(result.Response, statusCode: result.StatusCode);
        }
        return Results.Json(result.Error, statusCode: result.StatusCode);
    }
}
