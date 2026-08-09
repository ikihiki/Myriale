using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Myriale.Api.Features.Scenarios.Http;

public static class ScenarioAiEvaluationEndpoints
{
    public static IEndpointRouteBuilder MapScenarioAiEvaluationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/scenarios/{scenarioId}/ai-evaluations")
            .WithTags("Scenario AI Evaluations").RequireCors("MyrialeFrontend").RequireAuthorization();
        group.MapGet("/corpus", GetCorpusAsync).WithName("GetScenarioAiEvaluationCorpus");
        group.MapPost("/runs", CreateRunAsync).WithName("CreateScenarioAiEvaluationRun");
        group.MapGet("/runs", ListRunsAsync).WithName("ListScenarioAiEvaluationRuns");
        group.MapGet("/runs/{runId}", GetRunAsync).WithName("GetScenarioAiEvaluationRun");
        group.MapGet("/runs/{runId}/export", ExportRunAsync).WithName("ExportScenarioAiEvaluationRun");
        return routes;
    }

    private static async Task<IResult> GetCorpusAsync(ScenarioId scenarioId, ClaimsPrincipal principal,
        IAuthorizationService authorization, ScenarioAiEvaluationService service, CancellationToken ct)
    {
        var userId = UserId(principal); if (userId is null) return TypedResults.Unauthorized();
        var response = await service.GetCorpusManifestAsync(userId.Value,
            (await authorization.AuthorizeAsync(principal, "Administration")).Succeeded, scenarioId, ct);
        return response is null ? TypedResults.NotFound() : TypedResults.Ok(response);
    }

    private static async Task<IResult> CreateRunAsync(ScenarioId scenarioId, CreateScenarioAiEvaluationRunRequest request,
        ClaimsPrincipal principal, IAuthorizationService authorization, ScenarioAiEvaluationService service, CancellationToken ct)
    {
        var userId = UserId(principal); if (userId is null) return TypedResults.Unauthorized();
        var isAdmin = (await authorization.AuthorizeAsync(principal, "Administration")).Succeeded;
        try
        {
            var response = await service.CreateAsync(userId.Value, isAdmin, scenarioId, request, ct);
            return response is null ? TypedResults.NotFound() : TypedResults.Created($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{response.Summary.Id}", response);
        }
        catch (ScenarioAiEvaluationValidationException exception)
        {
            return TypedResults.BadRequest(new ScenarioErrorResponse("AI evaluation request is invalid.",
                new Dictionary<string, string[]> { ["evaluation"] = [exception.Code] }));
        }
        catch (AiProviderException exception)
        {
            return TypedResults.BadRequest(new ScenarioErrorResponse("AI evaluation profile is unavailable.",
                new Dictionary<string, string[]> { ["profile"] = [exception.Code] }));
        }
    }

    private static async Task<IResult> ListRunsAsync(ScenarioId scenarioId, ClaimsPrincipal principal,
        IAuthorizationService authorization, ScenarioAiEvaluationService service, CancellationToken ct)
    {
        var userId = UserId(principal); if (userId is null) return TypedResults.Unauthorized();
        var response = await service.ListAsync(userId.Value, (await authorization.AuthorizeAsync(principal, "Administration")).Succeeded, scenarioId, ct);
        return response is null ? TypedResults.NotFound() : TypedResults.Ok(response);
    }

    private static async Task<IResult> GetRunAsync(ScenarioId scenarioId, ScenarioAiEvaluationRunId runId, ClaimsPrincipal principal,
        IAuthorizationService authorization, ScenarioAiEvaluationService service, CancellationToken ct)
    {
        var userId = UserId(principal); if (userId is null) return TypedResults.Unauthorized();
        var response = await service.GetAsync(userId.Value, (await authorization.AuthorizeAsync(principal, "Administration")).Succeeded, scenarioId, runId, ct);
        return response is null ? TypedResults.NotFound() : TypedResults.Ok(response);
    }

    private static async Task<IResult> ExportRunAsync(ScenarioId scenarioId, ScenarioAiEvaluationRunId runId, string? format,
        ClaimsPrincipal principal, IAuthorizationService authorization, ScenarioAiEvaluationService service, CancellationToken ct)
    {
        var userId = UserId(principal); if (userId is null) return TypedResults.Unauthorized();
        try
        {
            var response = await service.ExportAsync(userId.Value, (await authorization.AuthorizeAsync(principal, "Administration")).Succeeded,
                scenarioId, runId, format ?? "json", ct);
            return response is null ? TypedResults.NotFound() : Results.File(response.Value.Content, response.Value.ContentType, response.Value.FileName);
        }
        catch (ScenarioAiEvaluationValidationException exception)
        {
            return TypedResults.BadRequest(new ScenarioErrorResponse("AI evaluation export format is invalid.",
                new Dictionary<string, string[]> { ["format"] = [exception.Code] }));
        }
    }

    private static AccountId? UserId(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier) is { } value ? new AccountId(value) : null;
}
