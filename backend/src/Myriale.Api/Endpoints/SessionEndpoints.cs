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

        group.MapGet("/", ListAsync)
            .WithName("ListSessions")
            .WithSummary("Returns the current user's non-completed sessions for direct re-entry.");
        group.MapPost("/", CreateAsync)
            .WithName("CreateSession")
            .WithSummary("Creates an owner-scoped play session for an existing scenario.");
        group.MapGet("/{sessionId}", GetAsync)
            .WithName("GetSession")
            .WithSummary("Returns a session and its ordered turns.");
        group.MapPost("/{sessionId}/action-recommendation", RecommendActionAsync)
            .WithName("RecommendSessionAction")
            .WithSummary("Returns an AI-generated suggestion for the next player action without advancing the session.");
        group.MapPost("/{sessionId}/inputs", AcceptInputAsync)
            .WithName("AcceptSessionInput")
            .WithSummary("Durably accepts player input and queues narrative generation.");
        if (routes.ServiceProvider.GetRequiredService<IConfiguration>().GetValue<bool>("Modules:EnableClientSessionTurnCreation"))
        {
            group.MapPost("/{sessionId}/module-turns", CreateModuleTurnAsync)
                .WithName("CreateSessionModuleTurn")
                .WithSummary("Development-only seam for creating a session module turn.");
        }
        group.MapGet("/{sessionId}/turns/{turnId}", GetTurnAsync)
            .WithName("GetSessionTurn")
            .WithSummary("Returns one owner-visible session turn.");
        return group;
    }

    private static async Task<IResult> ListAsync(
        ClaimsPrincipal principal,
        IPlaySessionListingService sessions,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();

        return Results.Ok(await sessions.ListRejoinableAsync(ownerId, cancellationToken));
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
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 120)
            return Results.BadRequest(new SessionErrorResponse("invalid_request_id", "RequestIdを120文字以内で指定してください。"));
        var canDebugDialogue = await db.Users.AsNoTracking()
            .Where(user => user.Id == ownerId)
            .Select(user => user.CanDebugDialogue)
            .SingleOrDefaultAsync(cancellationToken);
        if (request.InterpretationEnabled && !canDebugDialogue)
            return Results.Json(
                new SessionErrorResponse("dialogue_debug_forbidden", "解釈説明を有効にする権限がありません。"),
                statusCode: StatusCodes.Status403Forbidden);

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
        IHostEnvironment environment,
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
        var storedExecutions = (await db.SessionExecutions.AsNoTracking().Include(item => item.Attempts)
            .Where(item => item.SessionId == sessionId && item.DismissedAt == null)
            .ToListAsync(cancellationToken)).OrderBy(item => item.CreatedAt).ToList();
        var visibleInputIds = storedExecutions.Where(item => item.TriggerType == "player-input").Select(item => item.TriggerId).ToHashSet(StringComparer.Ordinal);
        visibleInputIds.UnionWith(turns.Select(item => item.Narrative?.PlayerInputId).OfType<string>());
        var inputs = (await db.SessionPlayerInputs.AsNoTracking()
            .Where(item => item.SessionId == sessionId)
            .ToListAsync(cancellationToken))
            .Where(item => visibleInputIds.Contains(item.Id))
            .OrderBy(item => item.CreatedAt)
            .ToList();
        var artifacts = (await db.SessionArtifacts.AsNoTracking().Where(item => item.SessionId == sessionId && item.Status == "committed").ToListAsync(cancellationToken)).OrderBy(item => item.CreatedAt).ToList();
        var images = await db.SessionImages.AsNoTracking().Where(item => item.SessionId == sessionId).ToDictionaryAsync(item => item.ArtifactId, cancellationToken);
        var proposals = (await db.SessionNoteProposals.AsNoTracking().Where(item => item.SessionId == sessionId).ToListAsync(cancellationToken)).OrderBy(item => item.CreatedAt).ToList();
        var inputResponses = inputs.Select(SessionExecutionProjection.ToResponse).ToList();
        var executionResponses = storedExecutions.Select(item => SessionExecutionProjection.ToResponse(item, environment.IsDevelopment())).ToList();
        var artifactResponses = artifacts.Select(item => new SessionArtifactResponse(
            item.Id, item.ExecutionId, item.Kind, item.Status, item.ContentType,
            images.TryGetValue(item.Id, out var image) ? $"/api/session-artifacts/media/{image.Id}" : null,
            item.MetadataJson, item.CreatedAt, item.CommittedAt)).ToList();
        var activity = BuildActivity(turns, inputs, storedExecutions, artifacts);
        var proposalResponses = proposals.Select(item => new SessionNoteProposalResponse(item.ArtifactId, item.SourceTurnId, item.NoteId, item.ExpectedNoteRevision, item.ProposedTitle, item.BeforeBody, item.ProposedBody, item.Rationale, item.Status, item.CreatedAt)).ToList();
        try
        {
            return Results.Ok(ToResponse(session, turns, pendingInputs) with
            {
                Inputs = inputResponses,
                Executions = executionResponses,
                Artifacts = artifactResponses,
                Activity = activity,
                NoteProposals = proposalResponses,
            });
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

    private static async Task<IResult> AcceptInputAsync(
        string sessionId,
        CreateSessionInputRequest request,
        ClaimsPrincipal principal,
        SessionInputService inputs,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();
        return await AcceptInputCoreAsync(ownerId, sessionId, request, inputs, environment, cancellationToken);
    }

    private static async Task<IResult> AcceptInputCoreAsync(
        string ownerId,
        string sessionId,
        CreateSessionInputRequest request,
        SessionInputService inputs,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        using var activity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.input.accept");
        var result = await inputs.AcceptAsync(ownerId, sessionId, request, cancellationToken);
        if (result.Input is null || result.Execution is null)
            return Results.Json(new SessionErrorResponse(result.Code!, result.Message!), statusCode: result.StatusCode);
        activity?.SetTag("myriale.session.id", sessionId);
        activity?.SetTag("myriale.input.id", result.Input.Id);
        activity?.SetTag("myriale.execution.id", result.Execution.Id);
        var response = new SessionInputAcceptedResponse(
            SessionExecutionProjection.ToResponse(result.Input),
            SessionExecutionProjection.ToResponse(result.Execution, environment.IsDevelopment()));
        return Results.Accepted($"/api/session-executions/{result.Execution.Id}", response);
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
            .SingleAsync(item => item.Id == result.SessionTurnId && item.SessionId == sessionId, cancellationToken);
        var response = ToModuleTurnResponse(
            turn,
            result.Response,
            await ToHandoffResponseAsync(turn, db, cancellationToken));
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
            .Include(item => item.PlayerInput)
            .Include(item => item.NarrativeSignals)
            .SingleOrDefaultAsync(item => item.Id == turnId && item.SessionId == sessionId && item.Session.OwnerId == ownerId, cancellationToken);
        if (turn is null) return Results.NotFound();
        var response = await ToTurnResponseAsync(turn, ownerId, db, executions, cancellationToken);
        return response is null ? Results.NotFound() : Results.Ok(response);
    }

    private static async Task<List<SessionPendingPlayerInputResponse>> LoadPendingInputsAsync(
        string sessionId,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var inputs = (await db.SessionPlayerInputs.AsNoTracking()
                .Where(input => input.SessionId == sessionId && input.NarrativeTurn == null)
                .ToListAsync(cancellationToken))
            .OrderBy(input => input.CreatedAt)
            .ThenBy(input => input.Id, StringComparer.Ordinal)
            .ToList();
        if (inputs.Count == 0) return [];
        var inputIds = inputs.Select(input => input.Id).ToArray();
        var executions = await db.SessionExecutions.AsNoTracking()
            .Where(execution => execution.SessionId == sessionId && execution.DismissedAt == null && inputIds.Contains(execution.TriggerId))
            .ToDictionaryAsync(execution => execution.TriggerId, cancellationToken);
        return inputs
            .Where(input => executions.ContainsKey(input.Id))
            .Select(input =>
            {
                var execution = executions[input.Id];
                return new SessionPendingPlayerInputResponse(
                    input.Id,
                    input.RequestId,
                    input.Text,
                    input.InteractionType,
                    input.AcceptedAfterTurnId,
                    execution.Status,
                    execution.IsRetryable,
                    execution.ErrorCode,
                    execution.UserErrorMessage,
                    execution.AttemptCount,
                    execution.CompletedAt ?? execution.NextAttemptAt ?? execution.StartedAt ?? execution.QueuedAt);
            })
            .ToList();
    }

    private static async Task<IReadOnlyList<SessionTurnResponse>> LoadTurnsAsync(
        string ownerId,
        string sessionId,
        ApplicationDbContext db,
        IModuleExecutionService executions,
        CancellationToken cancellationToken)
    {
        var stored = await db.SessionTurns.AsNoTracking()
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

    private static IReadOnlyList<SessionActivityResponse> BuildActivity(
        IReadOnlyList<SessionTurnResponse> turns,
        IReadOnlyList<SessionPlayerInput> inputs,
        IReadOnlyList<SessionExecution> executions,
        IReadOnlyList<SessionArtifact> artifacts)
    {
        var rows = new List<(DateTimeOffset At, int Rank, string Type, string Id, string? CausalId)>();
        rows.AddRange(turns.Select(turn => (turn.CreatedAt, 4, "turn", turn.Id, turn.Narrative?.PlayerInputId ?? turn.Narrative?.SourceModuleTurnId)));
        rows.AddRange(inputs.Select(input => (input.CreatedAt, 1, "input", input.Id, input.AcceptedAfterTurnId)));
        rows.AddRange(executions.Select(execution => (execution.CreatedAt, 2, "execution", execution.Id, (string?)execution.TriggerId)));
        rows.AddRange(artifacts.Select(artifact => (artifact.CreatedAt, 3, "artifact", artifact.Id, (string?)artifact.ExecutionId)));
        return rows.OrderBy(row => row.At).ThenBy(row => row.Rank).ThenBy(row => row.Id, StringComparer.Ordinal)
            .Select((row, index) => new SessionActivityResponse(row.Type, row.Id, index + 1, row.CausalId)).ToList();
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

    private static SessionTurnResponse ToModuleTurnResponse(
        SessionTurn turn,
        ModuleExecutionResponse execution,
        NarrativeHandoffStatusResponse? handoff) =>
        new(turn.Id, turn.Position, turn.PreviousTurnId, turn.Kind, execution, null, handoff, turn.CreatedAt);

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
        return execution.Response is null
            ? null
            : ToModuleTurnResponse(turn, execution.Response, await ToHandoffResponseAsync(turn, db, cancellationToken));
    }

    private static async Task<NarrativeHandoffStatusResponse?> ToHandoffResponseAsync(
        SessionTurn turn,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.AsNoTracking()
            .Where(item => item.Kind == SessionExecutionKinds.ModuleHandoff && item.TriggerId == turn.Id)
            .Select(item => new { item.Status, item.ErrorCode, item.UserErrorMessage, item.CreatedAt, item.CompletedAt, item.NextAttemptAt })
            .SingleOrDefaultAsync(cancellationToken);
        if (execution is null) return null;
        var status = execution.Status switch
        {
            SessionExecutionStatuses.Succeeded => "completed",
            SessionExecutionStatuses.Failed or SessionExecutionStatuses.Superseded or SessionExecutionStatuses.Cancelled => "failed",
            _ => "pending",
        };
        return new NarrativeHandoffStatusResponse(
            status,
            execution.ErrorCode,
            execution.UserErrorMessage,
            execution.CompletedAt ?? execution.NextAttemptAt ?? execution.CreatedAt);
    }

    private static string NewSessionId() => $"SES-{Guid.NewGuid():N}".ToUpperInvariant();
}
