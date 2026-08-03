using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Myriale.Api.Application.Scenarios;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Endpoints;

public static class ScenarioEndpoints
{
    public static RouteGroupBuilder MapScenarioEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/scenarios").WithTags("Scenarios").RequireCors("MyrialeFrontend");
        group.MapGet("/", ListScenariosAsync).WithName("ListScenarios").WithSummary("Returns scenarios available for starting a new play session.");
        group.MapGet("/{scenarioId}", GetScenarioAsync).WithName("GetScenario").WithSummary("Returns a scenario used to prepare a new play session.");
        group.MapPut("/{scenarioId}", UpdateScenarioAsync).RequireAuthorization().WithName("UpdateScenario");
        group.MapPost("/{scenarioId}/hero-recommendation", RecommendHeroAsync).WithName("RecommendScenarioHero");
        group.MapPost("/", CreateScenarioAsync).RequireAuthorization().WithName("CreateScenario");
        group.MapGet("/{scenarioId}/rule-data", GetRuleDataAsync).RequireAuthorization().WithName("GetScenarioRuleData");
        group.MapPost("/{scenarioId}/rule-data/drafts", CreateRuleDataDraftAsync).RequireAuthorization().WithName("CreateScenarioRuleDataDraft");
        group.MapPut("/{scenarioId}/rule-data", SaveRuleDataAsync).RequireAuthorization().WithName("SaveScenarioRuleData");
        group.MapGet("/{scenarioId}/rule-data/readiness", GetRuleDataReadinessAsync).RequireAuthorization().WithName("GetScenarioRuleDataReadiness");
        group.MapPost("/{scenarioId}/rule-data/publish", PublishRuleDataAsync).RequireAuthorization().WithName("PublishScenarioRuleData");
        group.MapPost("/{scenarioId}/rule-data/debug", DebugRuleDataAsync).RequireAuthorization().WithName("DebugScenarioRuleData");
        return group;
    }

    private static async Task<Ok<IReadOnlyList<ScenarioDraftResponse>>> ListScenariosAsync(ClaimsPrincipal principal, ScenarioQueryService queries, CancellationToken ct) =>
        TypedResults.Ok(await queries.ListAsync(UserId(principal), ct));

    private static async Task<Results<Ok<ScenarioDraftResponse>, NotFound>> GetScenarioAsync(string scenarioId, ClaimsPrincipal principal, ScenarioQueryService queries, CancellationToken ct)
    {
        var value = await queries.GetAsync(scenarioId, UserId(principal), ct);
        return value is null ? TypedResults.NotFound() : TypedResults.Ok(value);
    }

    private static async Task<IResult> CreateScenarioAsync(CreateScenarioRequest request, ClaimsPrincipal principal, CreateScenarioUseCase useCase, CancellationToken ct)
    {
        var authorId = UserId(principal); if (authorId is null) return TypedResults.Unauthorized();
        var result = await useCase.ExecuteAsync(new(authorId, request), ct);
        return result.Outcome == ScenarioCommandOutcome.Invalid
            ? TypedResults.BadRequest(new ScenarioErrorResponse("入力内容を確認してください。", result.Errors!))
            : TypedResults.Created($"/api/scenarios/{result.Scenario!.Id}", result.Scenario);
    }

    private static async Task<IResult> UpdateScenarioAsync(string scenarioId, CreateScenarioRequest request, ClaimsPrincipal principal, UpdateScenarioUseCase useCase, CancellationToken ct)
    {
        var authorId = UserId(principal); if (authorId is null) return TypedResults.Unauthorized();
        var result = await useCase.ExecuteAsync(new(scenarioId, authorId, request), ct);
        return result.Outcome switch
        {
            ScenarioCommandOutcome.Invalid => TypedResults.BadRequest(new ScenarioErrorResponse("入力内容を確認してください。", result.Errors!)),
            ScenarioCommandOutcome.NotFound => TypedResults.NotFound(),
            ScenarioCommandOutcome.Conflict => TypedResults.Conflict(),
            _ => TypedResults.Ok(result.Scenario),
        };
    }

    private static async Task<IResult> RecommendHeroAsync(string scenarioId, RecommendScenarioHeroRequest request, ScenarioQueryService queries, IHttpClientFactory clients, CancellationToken ct)
    {
        var scenario = await queries.GetRecommendationContextAsync(scenarioId, ct); if (scenario is null) return TypedResults.NotFound();
        try
        {
            using var response = await clients.CreateClient("MockAi").PostAsJsonAsync("/mock-ai/hero-recommendation", new
            { scenario.Id, scenario.Title, scenario.Genre, scenario.Tone, scenario.Lore, scenario.Opening, request.CurrentName, request.CurrentProfile }, ct);
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<ScenarioHeroRecommendationResponse>(cancellationToken: ct);
            if (body is not null) return TypedResults.Ok(body);
        }
        catch { }
        return TypedResults.Ok(new ScenarioHeroRecommendationResponse("ノクト", $"{scenario.Title}の導入と世界観を手掛かりに、物語の謎を追う旅人。", "AIがシナリオ設定から主人公案を推薦しました。内容を確認・修正してから確定してください。"));
    }

    private static async Task<IResult> GetRuleDataAsync(string scenarioId, ClaimsPrincipal principal, ScenarioQueryService scenarios, ScenarioDefinitionQueryService definitions, CancellationToken ct)
    {
        if (!await scenarios.IsOwnerAsync(scenarioId, UserId(principal), ct)) return TypedResults.NotFound();
        var value = await definitions.GetEditableAsync(scenarioId, ct); return value is null ? TypedResults.NotFound() : TypedResults.Ok(value);
    }

    private static async Task<IResult> CreateRuleDataDraftAsync(string scenarioId, ClaimsPrincipal principal,
        CreateScenarioDefinitionDraftUseCase useCase, CancellationToken ct)
    {
        var authorId = UserId(principal); if (authorId is null) return TypedResults.Unauthorized();
        var result = await useCase.ExecuteAsync(new(scenarioId, authorId), ct);
        if (result.Outcome == ScenarioDefinitionCommandOutcome.NotFound) return TypedResults.NotFound();
        if (result.Outcome == ScenarioDefinitionCommandOutcome.Conflict) return TypedResults.Conflict();
        return result.Created ? TypedResults.Created($"/api/scenarios/{scenarioId}/rule-data", result.Definition) : TypedResults.Ok(result.Definition);
    }

    private static async Task<IResult> SaveRuleDataAsync(string scenarioId, ScenarioRuleDataRequest request, ClaimsPrincipal principal, SaveScenarioDefinitionUseCase useCase, CancellationToken ct)
    {
        var authorId = UserId(principal); if (authorId is null) return TypedResults.Unauthorized();
        var result = await useCase.ExecuteAsync(new(scenarioId, authorId, request), ct);
        return result.Outcome switch
        {
            ScenarioDefinitionCommandOutcome.Invalid => TypedResults.BadRequest(new ScenarioErrorResponse("Rule data is malformed.", result.Errors!)),
            ScenarioDefinitionCommandOutcome.NotFound => TypedResults.NotFound(),
            ScenarioDefinitionCommandOutcome.Conflict => TypedResults.Conflict(),
            _ => TypedResults.Ok(result.Definition),
        };
    }

    private static async Task<IResult> GetRuleDataReadinessAsync(string scenarioId, ClaimsPrincipal principal, ScenarioQueryService scenarios, IScenarioDefinitionRepository repository, ScenarioDefinitionReadinessPolicy readiness, CancellationToken ct)
    {
        if (!await scenarios.IsOwnerAsync(scenarioId, UserId(principal), ct)) return TypedResults.NotFound();
        var definition = await repository.GetDraftAsync(scenarioId, ct) ?? await repository.GetLatestPublishedAsync(scenarioId, ct);
        if (definition is null) return TypedResults.NotFound();
        var result = readiness.Evaluate(definition);
        return TypedResults.Ok(new ScenarioDefinitionReadinessResponse(definition.Id, result.IsReady, result.Errors));
    }

    private static async Task<IResult> PublishRuleDataAsync(string scenarioId, ClaimsPrincipal principal, PublishScenarioDefinitionUseCase useCase, CancellationToken ct)
    {
        var authorId = UserId(principal); if (authorId is null) return TypedResults.Unauthorized();
        var result = await useCase.ExecuteAsync(new(scenarioId, authorId), ct);
        return result.Outcome switch
        {
            ScenarioDefinitionCommandOutcome.NotFound => TypedResults.NotFound(),
            ScenarioDefinitionCommandOutcome.Conflict => TypedResults.Conflict(),
            ScenarioDefinitionCommandOutcome.NotReady => TypedResults.BadRequest(new ScenarioErrorResponse("Rule data is not ready to publish.", result.Errors!)),
            _ => TypedResults.Ok(result.Definition),
        };
    }

    private static async Task<IResult> DebugRuleDataAsync(string scenarioId, ScenarioRuleDebugRequest request, ClaimsPrincipal principal, ScenarioQueryService scenarios, ScenarioRuleDebugService debug, CancellationToken ct)
    {
        if (!await scenarios.IsOwnerAsync(scenarioId, UserId(principal), ct)) return TypedResults.NotFound();
        try { var response = await debug.ExecuteAsync(scenarioId, request, ct); return response is null ? TypedResults.NotFound() : TypedResults.Ok(response); }
        catch (ScenarioTurnValidationException ex) { return TypedResults.BadRequest(new ScenarioErrorResponse("Debug execution failed.", new Dictionary<string, string[]> { ["debug"] = [ex.Code] })); }
        catch (JsonException) { return TypedResults.BadRequest(new ScenarioErrorResponse("Debug state contains invalid JSON.", new Dictionary<string, string[]> { ["debug"] = ["invalid_debug_json"] })); }
    }

    private static string? UserId(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier);
}
