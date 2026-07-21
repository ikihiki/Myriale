using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;
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
        group.MapPost("/{sessionId}/action-recommendation", RecommendActionAsync)
            .WithName("RecommendSessionAction")
            .WithSummary("Returns an AI-generated suggestion for the next player action without advancing the session.");
        group.MapPost("/{sessionId}/narrative-turns", CreateNarrativeTurnAsync)
            .WithName("CreateSessionNarrativeTurn")
            .WithSummary("Persists one player input and generated narrative turn atomically.");
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
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        if (string.IsNullOrWhiteSpace(request.ScenarioId))
            return Results.BadRequest(new SessionErrorResponse("invalid_scenario_id", "ScenarioIdを指定してください。"));
        var requestId = request.RequestId?.Trim();
        if (requestId is { Length: > 120 })
            return Results.BadRequest(new SessionErrorResponse("invalid_request_id", "RequestIdは120文字以内で指定してください。"));
        if (string.IsNullOrEmpty(requestId)) requestId = null;
        var canDebugDialogue = await db.Users.AsNoTracking()
            .Where(user => user.Id == ownerId)
            .Select(user => user.CanDebugDialogue)
            .SingleOrDefaultAsync(cancellationToken);
        if (request.InterpretationEnabled && !canDebugDialogue)
            return Results.Json(
                new SessionErrorResponse("dialogue_debug_forbidden", "解釈説明を有効にする権限がありません。"),
                statusCode: StatusCodes.Status403Forbidden);

        if (requestId is not null)
        {
            var replay = await db.Sessions.AsNoTracking()
                .Include(item => item.State)
                .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
                .Include(item => item.ProgressionTransitionReceipts)
                .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.CreationRequestId == requestId, cancellationToken);
            if (replay is not null)
            {
                if (!string.Equals(replay.ScenarioId, request.ScenarioId, StringComparison.Ordinal)
                    || replay.InterpretationEnabled != request.InterpretationEnabled
                    || (request.SelectedHero is not null
                        && !string.Equals(replay.SelectedHero, request.SelectedHero.Trim(), StringComparison.Ordinal)))
                    return Results.Conflict(new SessionErrorResponse("idempotency_key_reused", "同じRequestIdに別のSession設定は指定できません。"));
                var replayTurns = await LoadTurnsAsync(ownerId, replay.Id, db, executions, cancellationToken);
                var replayPending = await LoadPendingInputsAsync(replay.Id, db, cancellationToken);
                return Results.Ok(ToResponse(replay, replayTurns, replayPending));
            }
        }

        var scenario = await db.Scenarios.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.ScenarioId, cancellationToken);
        if (scenario is null) return Results.NotFound();

        var selectedHero = string.IsNullOrWhiteSpace(request.SelectedHero)
            ? scenario.Hero
            : request.SelectedHero.Trim();
        if (selectedHero.Length > 1000)
            return Results.BadRequest(new SessionErrorResponse("invalid_selected_hero", "選択した主人公は1000文字以内で指定してください。"));

        var now = DateTimeOffset.UtcNow;
        var initialNode = await db.ScenarioProgressionNodes
            .SingleOrDefaultAsync(node => node.ScenarioId == request.ScenarioId && node.IsInitial, cancellationToken);
        var configuredTransitions = await db.ScenarioProgressionTransitions.AsNoTracking()
            .Where(transition => transition.SourceNode.ScenarioId == request.ScenarioId && transition.ModuleId != null)
            .ToListAsync(cancellationToken);
        foreach (var transition in configuredTransitions)
        {
            if (string.IsNullOrWhiteSpace(transition.ModuleVersion)
                || transition.ModuleDigest?.Length != 64
                || string.IsNullOrWhiteSpace(transition.ModuleConfigurationJson)
                || string.IsNullOrWhiteSpace(transition.ModuleContextJson)
                || transition.ModuleRandomValueCount < 0)
                return Results.Conflict(new SessionErrorResponse(
                    "scenario_module_snapshot_invalid",
                    "ScenarioのModule設定が不完全です。"));
            var packageAvailable = await db.ModulePackages.AsNoTracking().AnyAsync(package =>
                package.ModuleId == transition.ModuleId
                && package.Version == transition.ModuleVersion
                && package.Digest == transition.ModuleDigest
                && package.Status == "installed"
                && package.IsEnabled,
                cancellationToken);
            if (!packageAvailable)
                return Results.Conflict(new SessionErrorResponse(
                    "scenario_module_unavailable",
                    "Scenarioが使用するModule packageは承認済みかつ有効である必要があります。"));
        }

        var session = new Session
        {
            Id = NewSessionId(),
            OwnerId = ownerId,
            ScenarioId = request.ScenarioId,
            CreationRequestId = requestId,
            SelectedHero = selectedHero,
            Status = "active",
            InterpretationEnabled = request.InterpretationEnabled,
            CreatedAt = now,
            UpdatedAt = now,
            State = new SessionState
            {
                Revision = 0,
                FlagsJson = "{}",
                UpdatedAt = now,
            },
        };
        if (initialNode is not null)
        {
            session.Progress = new SessionProgressState
            {
                CurrentNodeId = initialNode.Id,
                CurrentNode = initialNode,
                Revision = 0,
                UpdatedAt = now,
            };
        }
        foreach (var transition in configuredTransitions)
        {
            session.ProgressionModuleSnapshots.Add(new SessionProgressionModuleSnapshot
            {
                Id = $"PMS-{Guid.NewGuid():N}".ToUpperInvariant(),
                TransitionId = transition.Id,
                ModuleId = transition.ModuleId!,
                ModuleVersion = transition.ModuleVersion!,
                ModuleDigest = transition.ModuleDigest!,
                ConfigurationJson = transition.ModuleConfigurationJson!,
                ContextJson = transition.ModuleContextJson!,
                RandomValueCount = transition.ModuleRandomValueCount,
                CreatedAt = now,
            });
        }

        // Legacy callers that do not provide an idempotency key retain the pre-opening behavior.
        // The production Session-start flow always supplies RequestId and receives a durable root Opening Turn.
        if (requestId is null)
        {
            db.Sessions.Add(session);
            await db.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/sessions/{session.Id}", ToResponse(session, [], []));
        }

        var opening = new SessionTurn
        {
            Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = session.Id,
            Position = 1,
            Kind = "narrative",
            DialogueSchemaVersion = NarrativeDialogueSchema.Version,
            DialogueTurnType = "opening",
            Heading = scenario.Title,
            NarrativeBody = scenario.Opening,
            SourceSessionRevision = 0,
            CreatedAt = now,
        };

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            db.Sessions.Add(session);
            await db.SaveChangesAsync(cancellationToken);
            db.SessionTurns.Add(opening);
            session.HeadTurnId = opening.Id;
            session.HeadTurn = opening;
            session.Revision = 1;
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException) when (requestId is not null)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            var winner = await db.Sessions.AsNoTracking()
                .Include(item => item.State)
                .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
                .Include(item => item.ProgressionTransitionReceipts)
                .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.CreationRequestId == requestId, cancellationToken);
            if (winner is null) throw;
            if (!string.Equals(winner.ScenarioId, request.ScenarioId, StringComparison.Ordinal)
                || winner.InterpretationEnabled != request.InterpretationEnabled)
                return Results.Conflict(new SessionErrorResponse("idempotency_key_reused", "同じRequestIdに別のSession設定は指定できません。"));
            var winnerTurns = await LoadTurnsAsync(ownerId, winner.Id, db, executions, cancellationToken);
            var winnerPending = await LoadPendingInputsAsync(winner.Id, db, cancellationToken);
            return Results.Ok(ToResponse(winner, winnerTurns, winnerPending));
        }

        return Results.Created(
            $"/api/sessions/{session.Id}",
            ToResponse(session, [ToOpeningTurnResponse(opening)], []));
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
            .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
            .Include(item => item.ProgressionTransitionReceipts)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);
        if (session is null) return Results.NotFound();

        var turns = await LoadTurnsAsync(ownerId, sessionId, db, executions, cancellationToken);
        var pendingInputs = await LoadPendingInputsAsync(sessionId, db, cancellationToken);
        try
        {
            return Results.Ok(ToResponse(session, turns, pendingInputs));
        }
        catch (JsonException)
        {
            return Results.Json(
                new SessionErrorResponse("session_state_corrupt", "保存済みのSession stateを読み込めません。"),
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task<IResult> RecommendActionAsync(
        string sessionId,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        INarrativeRecentTurnSelector recentTurnSelector,
        IActionRecommendationGenerator recommendations,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var session = await db.Sessions.AsNoTracking()
            .Include(item => item.Scenario)
            .Include(item => item.State)
            .SingleOrDefaultAsync(item => item.Id == sessionId && item.OwnerId == ownerId, cancellationToken);
        if (session is null) return Results.NotFound();

        var newestTurns = await db.SessionTurns.AsNoTracking()
            .Where(turn => turn.SessionId == sessionId)
            .Include(turn => turn.PlayerInput)
            .OrderByDescending(turn => turn.Position)
            .Select(turn => new NarrativeDialogueTurnInput(
                turn.PlayerInput == null ? null : turn.PlayerInput.Text,
                turn.NarrativeBody))
            .ToListAsync(cancellationToken);
        var recentTurns = recentTurnSelector.Select(newestTurns).ToList();
        if (recentTurns.Count == 0)
            recentTurns.Add(new NarrativeDialogueTurnInput(null, session.Scenario.Opening));
        IReadOnlyDictionary<string, bool> flags;
        try
        {
            flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(session.State.FlagsJson) ?? new Dictionary<string, bool>();
        }
        catch (JsonException)
        {
            return Results.Json(
                new SessionErrorResponse("session_state_corrupt", "保存済みのSession stateを読み込めません。"),
                statusCode: StatusCodes.Status500InternalServerError);
        }

        try
        {
            var result = await recommendations.RecommendActionAsync(
                new NarrativeActionRecommendationRequest(
                    new NarrativeScenarioInput(
                        session.Scenario.Title,
                        session.Scenario.Summary,
                        session.Scenario.Genre,
                        session.Scenario.Tone,
                        session.Scenario.Lore,
                        session.Scenario.AiFreedom,
                        session.SelectedHero,
                        session.Scenario.Opening),
                    recentTurns,
                    new NarrativeSessionStateInput(session.State.Revision, flags)),
                cancellationToken);
            return Results.Ok(result);
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or JsonException or HttpRequestException or OperationCanceledException)
        {
            return Results.Json(
                new SessionErrorResponse(
                    "action_recommendation_failed",
                    "次の行動案を生成できませんでした。",
                    DevelopmentErrorDetails.From(environment, exception)),
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task<IResult> CreateNarrativeTurnAsync(
        string sessionId,
        CreateNarrativeTurnRequest request,
        ClaimsPrincipal principal,
        SessionNarrativeTurnService narratives,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        var result = await narratives.CreateAsync(ownerId, sessionId, request, cancellationToken);
        if (result.Turn is null)
            return Results.Json(new SessionErrorResponse(result.Code!, result.Message!, result.Details), statusCode: result.StatusCode);
        var playerInput = result.Turn.PlayerInputId is null
            ? null
            : await db.SessionPlayerInputs.AsNoTracking()
                .Where(item => item.Id == result.Turn.PlayerInputId)
                .Select(item => new { item.Text, item.AcceptedAfterTurnId })
                .SingleOrDefaultAsync(cancellationToken);
        var signals = await db.SessionNarrativeSignals.AsNoTracking()
            .Where(item => item.NarrativeTurnId == result.Turn.Id)
            .OrderBy(item => item.Code)
            .Select(item => item.Code)
            .ToListAsync(cancellationToken);
        return Results.Ok(new SessionTurnResponse(
            result.Turn.Id,
            result.Turn.Position,
            result.Turn.PreviousTurnId,
            result.Turn.Kind,
            null,
            new NarrativeTurnResponse(
                null,
                result.Turn.SourceSessionRevision,
                result.Turn.NarrativeBody!,
                result.Turn.PlayerInputId,
                playerInput?.Text,
                playerInput?.AcceptedAfterTurnId,
                signals,
                result.Turn.Interpretation,
                result.Turn.DialogueSchemaVersion,
                result.Turn.DialogueTurnType,
                result.Turn.Heading),
            null,
            result.Turn.CreatedAt));
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
            .Include(item => item.PlayerInput)
            .Include(item => item.NarrativeSignals)
            .SingleOrDefaultAsync(item => item.Id == turnId && item.SessionId == sessionId && item.Session.OwnerId == ownerId, cancellationToken);
        if (turn is null) return Results.NotFound();
        var response = await ToTurnResponseAsync(turn, ownerId, db, executions, cancellationToken);
        return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static Task<List<SessionPendingPlayerInputResponse>> LoadPendingInputsAsync(
        string sessionId,
        ApplicationDbContext db,
        CancellationToken cancellationToken) =>
        db.SessionPendingPlayerInputs.AsNoTracking()
            .Where(input => input.SessionId == sessionId)
            .OrderBy(input => input.Id)
            .Select(input => new SessionPendingPlayerInputResponse(
                input.Id,
                input.RequestId,
                input.Text,
                input.InteractionType,
                input.AcceptedAfterTurnId,
                input.Status,
                input.IsRetryable,
                input.ErrorCode,
                input.ErrorMessage,
                input.AttemptCount,
                input.UpdatedAt))
            .ToListAsync(cancellationToken);

    private static async Task<IReadOnlyList<SessionTurnResponse>> LoadTurnsAsync(
        string ownerId,
        string sessionId,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var stored = await db.SessionTurns.AsNoTracking()
            .Include(item => item.NarrativeHandoff)
            .Include(item => item.PlayerInput)
            .Include(item => item.NarrativeSignals)
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

    private static SessionResponse ToResponse(
        Session session,
        IReadOnlyList<SessionTurnResponse> turns,
        IReadOnlyList<SessionPendingPlayerInputResponse> pendingInputs)
    {
        var transition = session.ProgressionTransitionReceipts
            .OrderByDescending(receipt => receipt.CreatedAt)
            .FirstOrDefault();
        return new SessionResponse(
            session.Id,
            session.ScenarioId,
            session.Status,
            session.HeadTurnId,
            session.Revision,
            session.InterpretationEnabled,
            new SessionStateResponse(
                session.State.Revision,
                JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(session.State.FlagsJson) ?? new Dictionary<string, bool>()),
            session.Progress is null
                ? null
                : new SessionProgressionResponse(
                    session.Progress.CurrentNode.Code,
                    session.Progress.Revision,
                    transition?.Status,
                    transition?.ModuleTurnId,
                    transition?.ErrorCode),
            turns,
            pendingInputs,
            session.CreatedAt,
            session.UpdatedAt);
    }

    private static SessionTurnResponse ToOpeningTurnResponse(SessionTurn turn) =>
        new(
            turn.Id,
            turn.Position,
            turn.PreviousTurnId,
            turn.Kind,
            null,
            new NarrativeTurnResponse(
                null,
                turn.SourceSessionRevision,
                turn.NarrativeBody!,
                SchemaVersion: turn.DialogueSchemaVersion,
                TurnType: turn.DialogueTurnType,
                Heading: turn.Heading),
            null,
            turn.CreatedAt);

    private static SessionTurnResponse ToModuleTurnResponse(SessionTurn turn, ModuleExecutionResponse execution) =>
        new(turn.Id, turn.Position, turn.PreviousTurnId, turn.Kind, execution, null, ToHandoffResponse(turn), turn.CreatedAt);

    private static async Task<SessionTurnResponse?> ToTurnResponseAsync(
        SessionTurn turn,
        string ownerId,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        if (turn.Kind == "narrative")
        {
            var isOpening = turn.PreviousTurnId is null && turn.SourceModuleTurnId is null && turn.PlayerInputId is null;
            if ((!isOpening && turn.SourceModuleTurnId is null && turn.PlayerInputId is null)
                || turn.SourceSessionRevision is null
                || turn.NarrativeBody is null) return null;
            return new SessionTurnResponse(
                turn.Id,
                turn.Position,
                turn.PreviousTurnId,
                turn.Kind,
                null,
                new NarrativeTurnResponse(
                    turn.SourceModuleTurnId,
                    turn.SourceSessionRevision,
                    turn.NarrativeBody,
                    turn.PlayerInputId,
                    turn.PlayerInput?.Text,
                    turn.PlayerInput?.AcceptedAfterTurnId,
                    turn.NarrativeSignals.OrderBy(signal => signal.Code).Select(signal => signal.Code).ToArray(),
                    turn.Interpretation,
                    turn.DialogueSchemaVersion,
                    turn.DialogueTurnType,
                    turn.Heading),
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
