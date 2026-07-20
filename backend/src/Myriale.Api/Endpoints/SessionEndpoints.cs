using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules.Execution;

namespace Myriale.Api.Endpoints;

public static class SessionEndpoints
{
    public static RouteGroupBuilder MapSessionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/sessions")
            .WithTags("Sessions")
            .RequireAuthorization()
            .RequireCors("MyrialeFrontend");

        group.MapPost("/", CreateAsync)
            .WithName("CreateSession")
            .WithSummary("Creates an owner-scoped play session for an existing scenario.");
        group.MapGet("/{sessionId}", GetAsync)
            .WithName("GetSession")
            .WithSummary("Returns a session and its ordered turns.");
        group.MapPost("/{sessionId}/module-turns", CreateModuleTurnAsync)
            .WithName("CreateSessionModuleTurn")
            .WithSummary("Creates one session turn and its module execution atomically.");
        group.MapGet("/{sessionId}/turns/{turnId}", GetTurnAsync)
            .WithName("GetSessionTurn")
            .WithSummary("Returns one owner-visible session turn.");
        return group;
    }

    private static async Task<IResult> CreateAsync(
        CreateSessionRequest request,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        if (string.IsNullOrWhiteSpace(request.ScenarioId))
            return Results.BadRequest(new SessionErrorResponse("invalid_scenario_id", "ScenarioIdを指定してください。"));
        if (!await db.Scenarios.AsNoTracking().AnyAsync(item => item.Id == request.ScenarioId, cancellationToken))
            return Results.NotFound();

        var now = DateTimeOffset.UtcNow;
        var session = new Session
        {
            Id = NewSessionId(),
            OwnerId = ownerId,
            ScenarioId = request.ScenarioId,
            Status = "active",
            CreatedAt = now,
            UpdatedAt = now,
            State = new SessionState
            {
                Revision = 0,
                FlagsJson = "{}",
                UpdatedAt = now,
            },
        };
        db.Sessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/sessions/{session.Id}", ToResponse(session, []));
    }

    private static async Task<IResult> GetAsync(
        string sessionId,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var session = await db.Sessions.AsNoTracking()
            .Include(item => item.State)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);
        if (session is null) return Results.NotFound();

        var turns = await LoadTurnsAsync(ownerId, sessionId, db, executions, cancellationToken);
        try
        {
            return Results.Ok(ToResponse(session, turns));
        }
        catch (JsonException)
        {
            return Results.Json(
                new SessionErrorResponse("session_state_corrupt", "保存済みのSession stateを読み込めません。"),
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<IResult> CreateModuleTurnAsync(
        string sessionId,
        InitializeModuleExecutionRequest request,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var result = await executions.InitializeSessionTurnAsync(ownerId, sessionId, request, cancellationToken);
        if (result.StatusCode == StatusCodes.Status404NotFound && result.Response is null && result.Error is null)
            return Results.NotFound();
        if (result.Response is null || result.SessionTurnId is null)
            return Results.Json(result.Error, statusCode: result.StatusCode);

        var turn = await db.SessionTurns.AsNoTracking()
            .Include(item => item.NarrativeHandoff)
            .SingleAsync(item => item.Id == result.SessionTurnId && item.SessionId == sessionId, cancellationToken);
        var response = ToModuleTurnResponse(turn, result.Response);
        return Results.Created($"/api/sessions/{sessionId}/turns/{turn.Id}", response);
    }

    private static async Task<IResult> GetTurnAsync(
        string sessionId,
        string turnId,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var turn = await db.SessionTurns.AsNoTracking()
            .Include(item => item.NarrativeHandoff)
            .SingleOrDefaultAsync(item => item.Id == turnId && item.SessionId == sessionId && item.Session.OwnerId == ownerId, cancellationToken);
        if (turn is null) return Results.NotFound();
        var response = await ToTurnResponseAsync(turn, ownerId, db, executions, cancellationToken);
        return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static async Task<IReadOnlyList<SessionTurnResponse>> LoadTurnsAsync(
        string ownerId,
        string sessionId,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var stored = await db.SessionTurns.AsNoTracking()
            .Include(item => item.NarrativeHandoff)
            .Where(item => item.SessionId == sessionId)
            .OrderBy(item => item.Position)
            .ToListAsync(cancellationToken);
        var responses = new List<SessionTurnResponse>(stored.Count);
        foreach (var turn in stored)
        {
            var response = await ToTurnResponseAsync(turn, ownerId, db, executions, cancellationToken);
            if (response is not null) responses.Add(response);
        }
        return responses;
    }

    private static SessionResponse ToResponse(Session session, IReadOnlyList<SessionTurnResponse> turns) =>
        new(
            session.Id,
            session.ScenarioId,
            session.Status,
            new SessionStateResponse(
                session.State.Revision,
                JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(session.State.FlagsJson) ?? new Dictionary<string, bool>()),
            turns,
            session.CreatedAt,
            session.UpdatedAt);

    private static SessionTurnResponse ToModuleTurnResponse(SessionTurn turn, ModuleExecutionResponse execution) =>
        new(turn.Id, turn.Position, turn.Kind, execution, null, ToHandoffResponse(turn), turn.CreatedAt);

    private static async Task<SessionTurnResponse?> ToTurnResponseAsync(
        SessionTurn turn,
        string ownerId,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        if (turn.Kind == "narrative")
        {
            if (turn.SourceModuleTurnId is null || turn.SourceSessionRevision is null || turn.NarrativeBody is null) return null;
            return new SessionTurnResponse(
                turn.Id,
                turn.Position,
                turn.Kind,
                null,
                new NarrativeTurnResponse(turn.SourceModuleTurnId, turn.SourceSessionRevision.Value, turn.NarrativeBody),
                null,
                turn.CreatedAt);
        }

        var executionId = await db.ModuleExecutions.AsNoTracking()
            .Where(item => item.SessionTurnId == turn.Id)
            .Select(item => item.Id)
            .SingleOrDefaultAsync(cancellationToken);
        if (executionId is null) return null;
        var execution = await executions.GetAsync(ownerId, executionId, cancellationToken);
        return execution.Response is null ? null : ToModuleTurnResponse(turn, execution.Response);
    }

    private static NarrativeHandoffStatusResponse? ToHandoffResponse(SessionTurn turn) =>
        turn.NarrativeHandoff is null
            ? null
            : new NarrativeHandoffStatusResponse(
                turn.NarrativeHandoff.Status,
                turn.NarrativeHandoff.LastErrorCode,
                turn.NarrativeHandoff.LastErrorMessage,
                turn.NarrativeHandoff.UpdatedAt);

    private static string NewSessionId() => $"SES-{Guid.NewGuid():N}".ToUpperInvariant();
}
