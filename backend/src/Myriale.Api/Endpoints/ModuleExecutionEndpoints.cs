using System.Security.Claims;
using Myriale.Api.Application.ModuleExecutions;
using Myriale.Api.Contracts;

namespace Myriale.Api.Endpoints;

public static class ModuleExecutionEndpoints
{
    public static RouteGroupBuilder MapModuleExecutionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/module-executions").WithTags("Module Executions").RequireAuthorization().RequireCors("MyrialeFrontend");
        group.MapPost("/", InitializeAsync).WithName("InitializeModuleExecution");
        group.MapGet("/{executionId}", GetAsync).WithName("GetModuleExecution");
        group.MapPost("/{executionId}/dispatch", DispatchAsync).WithName("DispatchModuleExecution");
        return group;
    }

    private static async Task<IResult> InitializeAsync(InitializeModuleExecutionRequest request, ClaimsPrincipal principal,
        InitializeDetachedModuleExecutionCommand command, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(ownerId) ? Results.Unauthorized() : ToResult(await command.ExecuteAsync(ownerId, request, cancellationToken));
    }

    private static async Task<IResult> GetAsync(string executionId, ClaimsPrincipal principal, GetModuleExecutionQuery query, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(ownerId) ? Results.Unauthorized() : ToResult(await query.ExecuteAsync(ownerId, executionId, cancellationToken));
    }

    private static async Task<IResult> DispatchAsync(string executionId, DispatchModuleExecutionRequest request, ClaimsPrincipal principal,
        DispatchModuleExecutionCommand command, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(ownerId) ? Results.Unauthorized() : ToResult(await command.ExecuteAsync(ownerId, executionId, request, cancellationToken));
    }

    internal static IResult ToResult(ModuleExecutionResult result) => result.Outcome switch
    {
        ModuleExecutionOutcome.Created when result.Execution is not null => Results.Created($"/api/module-executions/{result.Execution.Id}", result.Execution),
        ModuleExecutionOutcome.Success when result.Execution is not null => Results.Ok(result.Execution),
        ModuleExecutionOutcome.NotFound => Results.NotFound(),
        ModuleExecutionOutcome.InvalidRequest => Results.BadRequest(result.Error),
        ModuleExecutionOutcome.Conflict => Results.Conflict(result.Error),
        ModuleExecutionOutcome.Unprocessable => Results.UnprocessableEntity(result.Error),
        _ => Results.Json(result.Error, statusCode: StatusCodes.Status503ServiceUnavailable),
    };
}
