using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.Api.Features.Sessions.Application;
using Myriale.Api.Features.ModuleExecutions.Infrastructure;
using Myriale.Api.Infrastructure.Hosting;

namespace Myriale.Api.Features.Sessions.Http;

public static class SessionEndpoints
{
    public static RouteGroupBuilder MapSessionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/sessions").WithTags("Sessions").RequireAuthorization().RequireCors("MyrialeFrontend");
        group.MapGet("/", ListAsync).WithName("ListSessions");
        group.MapPost("/", CreateAsync).WithName("CreateSession");
        group.MapGet("/{sessionId}", GetAsync).WithName("GetSession");
        group.MapGet("/{sessionId}/turns/{turnId}/inspection", GetTurnInspectionAsync).WithName("GetSessionTurnInspection");
        group.MapPost("/{sessionId}/action-recommendation", RecommendActionAsync).WithName("RecommendSessionAction");
        group.MapPost("/{sessionId}/inputs", AcceptInputAsync).WithName("AcceptSessionInput");
        if (routes.ServiceProvider.GetRequiredService<IConfiguration>().GetValue<bool>("Modules:EnableClientSessionTurnCreation"))
            group.MapPost("/{sessionId}/module-turns", CreateModuleTurnAsync).WithName("CreateSessionModuleTurn");
        group.MapGet("/{sessionId}/turns/{turnId}", GetTurnAsync).WithName("GetSessionTurn");
        return group;
    }

    private static async Task<IResult> ListAsync(ClaimsPrincipal principal, ListSessionsQueryService query, CancellationToken ct, bool includeCompleted = false)
    {
        var ownerId = Owner(principal); return ownerId is null ? Results.Unauthorized() : Results.Ok(await query.ExecuteAsync(ownerId.Value, includeCompleted, ct));
    }

    private static async Task<IResult> CreateAsync(CreateSessionRequest request, ClaimsPrincipal principal, CreateSessionUseCase useCase,
        GetSessionDetailQueryService detail, CancellationToken ct)
    {
        var ownerId = Owner(principal); if (ownerId is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(ownerId.Value, request.ScenarioId, request.RequestId, request.InterpretationEnabled, request.SelectedHero), ct);
        if (result.SessionId is null) return ToError(result);
        var response = await detail.ExecuteAsync(ownerId.Value, result.SessionId.Value, ct);
        return result.Outcome == SessionCommandOutcome.Created
            ? Results.Created($"/api/sessions/{result.SessionId}", response)
            : Results.Ok(response);
    }

    private static async Task<IResult> GetAsync(SessionId sessionId, ClaimsPrincipal principal, GetSessionDetailQueryService query, CancellationToken ct)
    {
        var ownerId = Owner(principal); if (ownerId is null) return Results.Unauthorized();
        var response = await query.ExecuteAsync(ownerId.Value, sessionId, ct); return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static async Task<IResult> GetTurnAsync(SessionId sessionId, SessionTurnId turnId, ClaimsPrincipal principal, GetSessionTurnQueryService query, CancellationToken ct)
    {
        var ownerId = Owner(principal); if (ownerId is null) return Results.Unauthorized();
        var response = await query.ExecuteAsync(ownerId.Value, sessionId, turnId, ct); return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static async Task<IResult> GetTurnInspectionAsync(SessionId sessionId, SessionTurnId turnId, ClaimsPrincipal principal,
        IAuthorizationService authorization, GetSessionTurnInspectionQueryService query, CancellationToken ct)
    {
        var userId = Owner(principal); if (userId is null) return Results.Unauthorized();
        var isAdmin = (await authorization.AuthorizeAsync(principal, "Administration")).Succeeded;
        var response = await query.ExecuteAsync(userId.Value, isAdmin, sessionId, turnId, ct); return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static async Task<IResult> RecommendActionAsync(SessionId sessionId, ClaimsPrincipal principal,
        GetSessionActionRecommendationContextQuery query, IActionRecommendationGenerator recommendations, IHostEnvironment environment, CancellationToken ct)
    {
        var ownerId = Owner(principal); if (ownerId is null) return Results.Unauthorized();
        SessionActionRecommendationContext? context;
        try { context = await query.ExecuteAsync(ownerId.Value, sessionId, ct); }
        catch (JsonException) { return Results.Json(new SessionErrorResponse("session_state_corrupt", "保存済みのSession stateを読み込めません。"), statusCode: 500); }
        if (context is null) return Results.NotFound();
        try { return Results.Ok(await recommendations.RecommendActionAsync(context.Request, ct)); }
        catch (Exception ex) when (ex is NarrativeGenerationException or AiProviderException or JsonException or HttpRequestException or OperationCanceledException)
        { return Results.Json(new SessionErrorResponse("action_recommendation_failed", "次の行動案を生成できませんでした。", DevelopmentErrorDetails.From(environment, ex)), statusCode: 503); }
    }

    private static async Task<IResult> AcceptInputAsync(SessionId sessionId, CreateSessionInputRequest request, ClaimsPrincipal principal,
        AcceptSessionInputUseCase useCase, IHostEnvironment environment, CancellationToken ct)
    {
        var ownerId = Owner(principal); if (ownerId is null) return Results.Unauthorized();
        using var activity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.input.accept");
        var result = await useCase.ExecuteAsync(new(ownerId.Value, sessionId, request.RequestId, request.Text, request.InteractionType,
            request.SupersedesInputId, request.ActionDecisionAiProfileId, request.NarrativeAiProfileId), ct);
        if (result.Input is null || result.Execution is null) return ToError(result);
        activity?.SetTag("myriale.session.id", sessionId); activity?.SetTag("myriale.input.id", result.Input.Id); activity?.SetTag("myriale.execution.id", result.Execution.Id);
        return Results.Accepted($"/api/session-executions/{result.Execution.Id}", new SessionInputAcceptedResponse(
            SessionExecutionProjection.ToResponse(result.Input), SessionExecutionProjection.ToResponse(result.Execution, environment.IsDevelopment())));
    }

    private static async Task<IResult> CreateModuleTurnAsync(SessionId sessionId, InitializeModuleExecutionRequest request, ClaimsPrincipal principal,
        InitializeSessionTurnModuleExecutionCommand executions, GetSessionTurnQueryService turns, CancellationToken ct)
    {
        var ownerId = Owner(principal); if (ownerId is null) return Results.Unauthorized();
        var result = await executions.ExecuteAsync(ownerId.Value, sessionId, request, SessionTurnInitializationPolicy.UserRequested, ct);
        if (result.Outcome == ModuleExecutionOutcome.NotFound) return Results.NotFound();
        if (result.Execution is null || result.SessionTurnId is null) return ModuleExecutionEndpoints.ToResult(result);
        var response = await turns.ExecuteAsync(ownerId.Value, sessionId, result.SessionTurnId.Value, ct);
        return response is null ? Results.NotFound() : Results.Created($"/api/sessions/{sessionId}/turns/{result.SessionTurnId}", response);
    }

    private static IResult ToError(SessionCommandResult result)
    {
        var body = new SessionErrorResponse(result.ErrorCode ?? "session_command_failed", result.ErrorMessage ?? "Session操作に失敗しました。");
        return result.Outcome switch
        {
            SessionCommandOutcome.Invalid => Results.BadRequest(body), SessionCommandOutcome.Forbidden => Results.Json(body, statusCode: 403),
            SessionCommandOutcome.NotFound => Results.NotFound(body), SessionCommandOutcome.RateLimited => Results.Json(body, statusCode: 429),
            SessionCommandOutcome.Conflict or SessionCommandOutcome.RetryableConflict => Results.Conflict(body), _ => Results.Json(body, statusCode: 500),
        };
    }
    private static AccountId? Owner(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier) is { } value ? new AccountId(value) : null;
}
