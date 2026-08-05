using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.Api.Data;
using Myriale.Api.Features.ModuleExecutions.Infrastructure;
using Myriale.Api.Services;

namespace Myriale.Api.Features.Sessions.Application;

public sealed class ListSessionsQueryService(ApplicationDbContext db)
{
    public async Task<IReadOnlyList<PlaySessionSummaryDto>> ExecuteAsync(string ownerId, bool includeCompleted, CancellationToken ct) =>
        (await db.Sessions.AsNoTracking().Where(s => s.OwnerId == ownerId && (includeCompleted || s.Status != SessionStatus.Completed))
            .Select(s => new PlaySessionSummaryDto(s.Id, s.ScenarioId, s.Scenario.Title, s.SelectedHero, s.Status.ToWireValue(), s.HeadTurnId,
                s.HeadTurn == null ? null : s.HeadTurn.Position, s.Turns.Count,
                s.Summaries.OrderByDescending(x => x.ToPosition).ThenByDescending(x => x.Version).ThenByDescending(x => x.Id).Select(x => x.Body).FirstOrDefault(),
                s.CreatedAt, s.UpdatedAt)).ToListAsync(ct)).OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Id, StringComparer.Ordinal).ToList();
}

public sealed class GetSessionTurnQueryService(ApplicationDbContext db, IModuleExecutionProjection modules)
{
    public async Task<SessionTurnResponse?> ExecuteAsync(string ownerId, string sessionId, string turnId, CancellationToken ct)
    {
        var turn = await db.SessionTurns.AsNoTracking().Include(x => x.PlayerInput).Include(x => x.NarrativeSignals)
            .Include(x => x.ModuleExecution).SingleOrDefaultAsync(x => x.Id == turnId && x.SessionId == sessionId && x.Session.OwnerId == ownerId, ct);
        if (turn is null) return null;
        var handoff = await SessionQueryMapper.LoadHandoffAsync(db, turn.Id, ct);
        return SessionQueryMapper.ToTurn(turn, modules, handoff);
    }
}

public sealed class GetSessionDetailQueryService(ApplicationDbContext db, IModuleExecutionProjection modules,
    IHostEnvironment environment, ScenarioRuleConfigurationResolver ruleResolver,
    GetSessionArtifactActivityQuery artifactActivityQuery)
{
    public async Task<SessionResponse?> ExecuteAsync(string ownerId, string sessionId, CancellationToken ct)
    {
        var session = await db.Sessions.AsNoTracking().Include(x => x.State).Include(x => x.Progress).ThenInclude(x => x!.CurrentNode)
            .Include(x => x.ProgressionTransitionReceipts).SingleOrDefaultAsync(x => x.Id == sessionId && x.OwnerId == ownerId, ct);
        if (session is null) return null;
        var turns = await db.SessionTurns.AsNoTracking().Include(x => x.PlayerInput).Include(x => x.NarrativeSignals).Include(x => x.ModuleExecution)
            .Where(x => x.SessionId == sessionId).OrderBy(x => x.Position).ToListAsync(ct);
        var handoffs = await db.SessionExecutions.AsNoTracking().Where(x => x.SessionId == sessionId && x.Kind == SessionExecutionKind.ModuleHandoff)
            .ToDictionaryAsync(x => x.TriggerId, ct);
        var turnResponses = turns.Select(x => SessionQueryMapper.ToTurn(x, modules, SessionQueryMapper.ToHandoff(handoffs.GetValueOrDefault(x.Id)))).OfType<SessionTurnResponse>().ToList();
        var storedExecutions = (await db.SessionExecutions.AsNoTracking().Include(x => x.Attempts).Where(x => x.SessionId == sessionId && x.DismissedAt == null).ToListAsync(ct)).OrderBy(x => x.CreatedAt).ToList();
        var visibleInputIds = storedExecutions.Where(x => x.TriggerType == SessionExecutionTriggerType.PlayerInput).Select(x => x.TriggerId).ToHashSet(StringComparer.Ordinal);
        visibleInputIds.UnionWith(turns.Select(x => x.PlayerInputId).OfType<string>());
        var inputs = (await db.SessionPlayerInputs.AsNoTracking().Where(x => x.SessionId == sessionId).ToListAsync(ct)).Where(x => visibleInputIds.Contains(x.Id)).OrderBy(x => x.CreatedAt).ToList();
        var pending = SessionQueryMapper.Pending(inputs, storedExecutions);
        var artifactProjection = await artifactActivityQuery.ExecuteAsync(ownerId, sessionId, ct);
        var proposals = (await db.SessionNoteProposals.AsNoTracking().Where(x => x.SessionId == sessionId).ToListAsync(ct)).OrderBy(x => x.CreatedAt).ToList();
        var ruleSteps = (await db.SessionRuleActionSteps.AsNoTracking().Where(x => x.SessionId == sessionId).ToListAsync(ct)).OrderBy(x => x.CreatedAt).ToList();
        var objectStates = await db.SessionObjectStates.AsNoTracking().Include(x => x.ScenarioObject).Where(x => x.SessionId == sessionId).OrderBy(x => x.ScenarioObject.Code).ToListAsync(ct);
        var definition = await db.ScenarioDefinitionVersions.AsNoTracking().Include(x => x.ObjectTypes).ThenInclude(x => x.Actions).Include(x => x.Objects)
            .SingleOrDefaultAsync(x => x.Id == session.ScenarioDefinitionVersionId, ct);
        var objectResponses = new List<SessionObjectStateResponse>();
        if (definition is not null)
        {
            var byId = definition.Objects.ToDictionary(x => x.Id);
            objectResponses.AddRange(objectStates.Select(x =>
            {
                var item = byId[x.ScenarioObjectId];
                var fields = ruleResolver.Resolve(definition, item).PublicFields;
                return new SessionObjectStateResponse(x.ScenarioObjectId, x.ScenarioObject.Code, x.ScenarioObject.Name,
                    x.LocationId, x.ScenarioObject.IsGlobal, x.Revision, ProjectPublicState(fields, x.StateJson));
            }));
        }
        var stepResponses = ruleSteps.Select(x => new SessionRuleActionStepResponse(x.Id, x.ExecutionId, x.Stage.ToWireValue(), ScenarioTurnSchemas.ActionStep,
            Parse<RuleActionSnapshot>(x.ActionSnapshotJson), Parse<RuleActionDecisionResult>(x.DecisionJson), Parse<RulePostState>(x.PublicPostStateJson),
            Parse<ScenarioExtensionResult>(x.ExtensionReceiptJson), x.AppliedAt, x.NarrativePublishedAt)).ToList();
        var stepsByExecution = ruleSteps.ToDictionary(x => x.ExecutionId, StringComparer.Ordinal);
        var executionResponses = storedExecutions.Select(x => SessionExecutionProjection.ToResponse(x, environment.IsDevelopment(), stepsByExecution.GetValueOrDefault(x.Id))).ToList();
        var transition = session.ProgressionTransitionReceipts.OrderByDescending(x => x.CreatedAt).FirstOrDefault();
        return new SessionResponse(session.Id, session.ScenarioId, session.Status.ToWireValue(), session.HeadTurnId, session.Revision, session.InterpretationEnabled,
            new SessionStateResponse(session.State.Revision, JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(session.State.FlagsJson) ?? new Dictionary<string, bool>()),
            session.Progress is null ? null : new SessionProgressionResponse(session.Progress.CurrentNode.Code, session.Progress.Revision, transition?.Status.ToWireValue(), transition?.ModuleTurnId, transition?.ErrorCode),
            turnResponses, pending, session.CreatedAt, session.UpdatedAt, inputs.Select(SessionExecutionProjection.ToResponse).ToList(), executionResponses,
            artifactProjection.Artifacts, SessionQueryMapper.Activity(turnResponses, inputs, storedExecutions, artifactProjection.ActivityItems),
            proposals.Select(x => new SessionNoteProposalResponse(x.ArtifactId, x.SourceTurnId, x.NoteId, x.ExpectedNoteRevision, x.ProposedTitle, x.BeforeBody, x.ProposedBody, x.Rationale, x.Status.ToWireValue(), x.CreatedAt)).ToList(),
            session.ScenarioDefinitionVersionId, session.CurrentLocationId, objectResponses, stepResponses);
    }
    private static JsonElement ProjectPublicState(IReadOnlySet<string> fields, string stateJson)
    {
        var state = System.Text.Json.Nodes.JsonNode.Parse(stateJson) as System.Text.Json.Nodes.JsonObject ?? [];
        var result = new System.Text.Json.Nodes.JsonObject();
        foreach (var field in fields)
            if (state[field] is { } value) result[field] = value.DeepClone();
        return JsonSerializer.SerializeToElement(result);
    }
    private static T? Parse<T>(string? json) { if (string.IsNullOrWhiteSpace(json)) return default; return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web)); }
}

public sealed class GetSessionTurnInspectionQueryService(ApplicationDbContext db)
{
    public async Task<SessionTurnInspectionResponse?> ExecuteAsync(string userId, bool isAdministrator, string sessionId, string turnId, CancellationToken ct)
    {
        var turn = await db.SessionTurns.AsNoTracking().Include(x => x.PlayerInput).Include(x => x.Session).ThenInclude(x => x.Scenario)
            .SingleOrDefaultAsync(x => x.Id == turnId && x.SessionId == sessionId, ct);
        if (turn is null || (!isAdministrator && turn.Session.Scenario.AuthorId != userId) || turn.PlayerInput is null) return null;
        var execution = await db.SessionExecutions.AsNoTracking().SingleOrDefaultAsync(x => x.SessionId == sessionId && x.Kind == SessionExecutionKind.ScenarioTurn
            && x.TriggerType == SessionExecutionTriggerType.PlayerInput && x.TriggerId == turn.PlayerInputId, ct);
        if (execution is null) return null;
        var interactions = (await db.SessionAiInteractions.AsNoTracking().Where(x => x.SessionId == sessionId && x.ExecutionId == execution.Id)
            .Select(x => new { Interaction = x, x.Attempt.AttemptNumber }).ToListAsync(ct))
            .OrderBy(x => x.Interaction.StartedAt).ThenBy(x => x.AttemptNumber).ThenBy(x => x.Interaction.Sequence).ThenBy(x => x.Interaction.Id, StringComparer.Ordinal)
            .Select(x => new SessionAiInteractionInspection(x.Interaction.Id, x.AttemptNumber, x.Interaction.Sequence, x.Interaction.Stage.ToWireValue(), x.Interaction.AiProfileId,
                x.Interaction.Provider, x.Interaction.Model, x.Interaction.ProviderRequestId, x.Interaction.StartedAt, x.Interaction.CompletedAt,
                Math.Max(0, (long)(x.Interaction.CompletedAt - x.Interaction.StartedAt).TotalMilliseconds), x.Interaction.LatencyMilliseconds, x.Interaction.InputTokens, x.Interaction.OutputTokens,
                x.Interaction.FinishReason, x.Interaction.Status.ToWireValue(), x.Interaction.ErrorCode, x.Interaction.SentPrompt, x.Interaction.ReceivedResult, x.Interaction.ValidationResult)).ToList();
        var step = await db.SessionRuleActionSteps.AsNoTracking().SingleOrDefaultAsync(x => x.ExecutionId == execution.Id, ct);
        RuleEngineInspection? rule = null;
        if (step is not null)
        {
            var snapshot = Parse<RuleActionSnapshot>(step.ActionSnapshotJson); var decision = Parse<RuleActionDecisionResult>(step.DecisionJson); var post = Parse<RulePostState>(step.PublicPostStateJson);
            var selectedObject = decision is null ? null : snapshot?.Objects.SingleOrDefault(x => x.Id == decision.ObjectId);
            var selectedAction = decision is null ? null : snapshot?.Actions.SingleOrDefault(x => x.ObjectId == decision.ObjectId && x.ActionId == decision.ActionId);
            var selected = decision is null ? null : new SessionScenarioTurnSelectedActionResponse(decision.ObjectId, decision.ActionId, selectedObject?.Code, selectedObject?.Name, selectedAction?.Code, selectedAction?.Label, decision.Arguments);
            rule = new RuleEngineInspection(step.Id, step.Stage.ToWireValue(), ScenarioTurnSchemas.ActionStep, step.PreSessionRevision, step.PostSessionRevision,
                snapshot, selected, step.SelectedRuleId, ParseList<RuleAppliedEffect>(step.AppliedEffectsJson), post, ParseList<string>(step.FactsJson),
                ParseList<JsonElement>(step.EventsJson), ParseList<string>(step.NarrativeHintsJson), DeriveChanges(snapshot, post, step.PreSessionRevision, step.PostSessionRevision),
                new RuleProcessingTimingInspection(step.CreatedAt, step.EnumeratedAt, step.SelectedAt, step.AppliedAt, step.NarrativePublishedAt,
                    Elapsed(step.CreatedAt, step.EnumeratedAt), Elapsed(step.EnumeratedAt, step.SelectedAt), Elapsed(step.SelectedAt, step.AppliedAt),
                    Elapsed(step.AppliedAt, step.NarrativePublishedAt), Elapsed(step.CreatedAt, step.NarrativePublishedAt ?? step.AppliedAt ?? step.SelectedAt ?? step.EnumeratedAt)));
        }
        var session = turn.Session;
        return new(new SessionInspectionMetadata(session.Id, session.Status.ToWireValue(), session.Revision, session.CreatedAt, session.UpdatedAt),
            new ScenarioInspectionMetadata(session.ScenarioId, session.Scenario.Title, session.ScenarioDefinitionVersionId),
            new TurnInspectionMetadata(turn.Id, turn.Position, turn.Kind.ToWireValue(), turn.Heading, turn.NarrativeBody, turn.CreatedAt),
            new PlayerInputInspection(turn.PlayerInput.Id, turn.PlayerInput.Text, turn.PlayerInput.InteractionType.ToWireValue(), turn.PlayerInput.CreatedAt),
            new ExecutionInspection(execution.Id, execution.Kind.ToContractValue(), execution.Status.ToContractValue(), execution.Stage, execution.AttemptCount,
                execution.CreatedAt, execution.QueuedAt, execution.StartedAt, execution.CompletedAt, Elapsed(execution.StartedAt ?? execution.QueuedAt, execution.CompletedAt)), interactions, rule);
    }
    private static IReadOnlyList<RuleStateChangeInspection> DeriveChanges(RuleActionSnapshot? snapshot, RulePostState? postState, long preRevision, long? postRevision)
    {
        if (snapshot is null || postState is null) return [];
        var changes = new List<RuleStateChangeInspection>();
        if (snapshot.CurrentLocation.Id != postState.CurrentLocation.Id)
            changes.Add(new("location", null, "currentLocationId", JsonSerializer.SerializeToElement(snapshot.CurrentLocation.Id), JsonSerializer.SerializeToElement(postState.CurrentLocation.Id)));
        if (postRevision is not null && preRevision != postRevision)
            changes.Add(new("session-state", null, "revision", JsonSerializer.SerializeToElement(preRevision), JsonSerializer.SerializeToElement(postRevision.Value)));
        var beforeObjects = snapshot.Objects.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var afterObjects = postState.Objects.ToDictionary(x => x.Id, StringComparer.Ordinal);
        foreach (var id in beforeObjects.Keys.Union(afterObjects.Keys, StringComparer.Ordinal).Order(StringComparer.Ordinal))
        {
            if (!beforeObjects.TryGetValue(id, out var before))
            {
                changes.Add(new("object", id, "object", null, JsonSerializer.SerializeToElement(afterObjects[id])));
                continue;
            }
            if (!afterObjects.TryGetValue(id, out var after))
            {
                changes.Add(new("object", id, "object", JsonSerializer.SerializeToElement(before), null));
                continue;
            }
            if (before.LocationId != after.LocationId) changes.Add(new("object", id, "locationId", JsonSerializer.SerializeToElement(before.LocationId), JsonSerializer.SerializeToElement(after.LocationId)));
            if (before.Revision != after.Revision) changes.Add(new("object", id, "revision", JsonSerializer.SerializeToElement(before.Revision), JsonSerializer.SerializeToElement(after.Revision)));
            AddJsonChanges(changes, id, "state", before.State, after.State);
        }
        return changes;
    }
    private static void AddJsonChanges(ICollection<RuleStateChangeInspection> changes, string objectId, string path, JsonElement before, JsonElement after)
    {
        if (JsonElement.DeepEquals(before, after)) return;
        if (before.ValueKind != JsonValueKind.Object || after.ValueKind != JsonValueKind.Object) { changes.Add(new("object", objectId, path, before.Clone(), after.Clone())); return; }
        var beforeProperties = before.EnumerateObject().ToDictionary(x => x.Name, x => x.Value, StringComparer.Ordinal);
        var afterProperties = after.EnumerateObject().ToDictionary(x => x.Name, x => x.Value, StringComparer.Ordinal);
        foreach (var name in beforeProperties.Keys.Union(afterProperties.Keys, StringComparer.Ordinal).Order(StringComparer.Ordinal))
        {
            var hasBefore = beforeProperties.TryGetValue(name, out var beforeValue); var hasAfter = afterProperties.TryGetValue(name, out var afterValue);
            var propertyPath = $"{path}.{name}";
            if (!hasBefore || !hasAfter) { changes.Add(new("object", objectId, propertyPath, hasBefore ? beforeValue.Clone() : null, hasAfter ? afterValue.Clone() : null)); continue; }
            AddJsonChanges(changes, objectId, propertyPath, beforeValue, afterValue);
        }
    }
    private static long? Elapsed(DateTimeOffset? start, DateTimeOffset? end) => start is null || end is null ? null : Math.Max(0, (long)(end.Value - start.Value).TotalMilliseconds);
    private static T? Parse<T>(string? json) => string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    private static IReadOnlyList<T> ParseList<T>(string? json) => string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<IReadOnlyList<T>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
}

public sealed record SessionActionRecommendationContext(NarrativeActionRecommendationRequest Request);
public sealed class GetSessionActionRecommendationContextQuery(ApplicationDbContext db, INarrativeRecentTurnSelector recentTurnSelector)
{
    public async Task<SessionActionRecommendationContext?> ExecuteAsync(string ownerId, string sessionId, CancellationToken ct)
    {
        var session = await db.Sessions.AsNoTracking().Include(x => x.ScenarioDefinitionVersion).Include(x => x.State)
            .SingleOrDefaultAsync(x => x.Id == sessionId && x.OwnerId == ownerId, ct);
        if (session?.ScenarioDefinitionVersion is null) return null;
        var entities = await db.ScenarioObjects.AsNoTracking().Where(x => x.DefinitionVersionId == session.ScenarioDefinitionVersionId).OrderBy(x => x.Code)
            .Select(x => new NarrativeEntityInput(x.Code, x.Name, x.ProfileMarkdown)).ToListAsync(ct);
        var newest = await db.SessionTurns.AsNoTracking().Where(x => x.SessionId == sessionId).Include(x => x.PlayerInput).OrderByDescending(x => x.Position)
            .Select(x => new NarrativeRecentTurnInput(x.PlayerInput == null ? null : x.PlayerInput.Text, x.NarrativeBody)).ToListAsync(ct);
        var recent = recentTurnSelector.Select(newest).ToList(); if (recent.Count == 0) recent.Add(new(null, session.ScenarioDefinitionVersion.ScenarioOpening));
        var flags = JsonSerializer.Deserialize<Dictionary<string, bool>>(session.State.FlagsJson) ?? [];
        var d = session.ScenarioDefinitionVersion;
        return new(new(new NarrativeScenarioInput(d.ScenarioTitle.Value, d.ScenarioSummary, d.ScenarioGenre, d.ScenarioTone, d.ScenarioLore,
            d.ScenarioAiFreedom, session.SelectedHero, entities, d.ScenarioOpening), recent, new NarrativeSessionStateInput(session.State.Revision, flags)));
    }
}

internal static class SessionQueryMapper
{
    internal static SessionTurnResponse? ToTurn(SessionTurn turn, IModuleExecutionProjection modules, NarrativeHandoffStatusResponse? handoff)
    {
        if (turn.Kind == SessionTurnKind.Narrative)
        {
            if (turn.NarrativeBody is null || turn.SourceSessionRevision is null) return null;
            return new(turn.Id, turn.Position, turn.PreviousTurnId, turn.Kind.ToWireValue(), null,
                new(turn.SourceModuleTurnId, turn.SourceSessionRevision, turn.NarrativeBody, turn.PlayerInputId, turn.PlayerInput?.Text,
                    turn.PlayerInput?.AcceptedAfterTurnId, turn.NarrativeSignals.OrderBy(x => x.Code).Select(x => x.Code).ToArray(), turn.Interpretation,
                    turn.DialogueSchemaVersion, turn.DialogueTurnType?.ToWireValue(), turn.Heading), null, turn.CreatedAt);
        }
        return turn.ModuleExecution is null ? null : new(turn.Id, turn.Position, turn.PreviousTurnId, turn.Kind.ToWireValue(), modules.ToResponse(turn.ModuleExecution), null, handoff, turn.CreatedAt);
    }
    internal static async Task<NarrativeHandoffStatusResponse?> LoadHandoffAsync(ApplicationDbContext db, string turnId, CancellationToken ct) =>
        ToHandoff(await db.SessionExecutions.AsNoTracking().SingleOrDefaultAsync(x => x.Kind == SessionExecutionKind.ModuleHandoff && x.TriggerId == turnId, ct));
    internal static NarrativeHandoffStatusResponse? ToHandoff(SessionExecution? execution) => execution is null ? null : new(
        execution.Status == SessionExecutionStatus.Succeeded ? "completed" : execution.Status is SessionExecutionStatus.Failed or SessionExecutionStatus.Superseded or SessionExecutionStatus.Cancelled ? "failed" : "pending",
        execution.ErrorCode, execution.UserErrorMessage, execution.CompletedAt ?? execution.NextAttemptAt ?? execution.CreatedAt);
    internal static List<SessionPendingPlayerInputResponse> Pending(IReadOnlyList<SessionPlayerInput> inputs, IReadOnlyList<SessionExecution> executions)
    {
        var byInput = executions.Where(x => x.DismissedAt == null && x.TriggerType == SessionExecutionTriggerType.PlayerInput).ToDictionary(x => x.TriggerId);
        return inputs.Where(x => x.NarrativeTurn is null && byInput.ContainsKey(x.Id)).OrderBy(x => x.CreatedAt).ThenBy(x => x.Id, StringComparer.Ordinal).Select(x => { var e = byInput[x.Id];
            return new SessionPendingPlayerInputResponse(x.Id, x.RequestId, x.Text, x.InteractionType.ToWireValue(), x.AcceptedAfterTurnId, e.Status.ToContractValue(),
                e.IsRetryable, e.ErrorCode, e.UserErrorMessage, e.AttemptCount, e.CompletedAt ?? e.NextAttemptAt ?? e.StartedAt ?? e.QueuedAt); }).ToList();
    }
    internal static IReadOnlyList<SessionActivityResponse> Activity(IReadOnlyList<SessionTurnResponse> turns, IReadOnlyList<SessionPlayerInput> inputs,
        IReadOnlyList<SessionExecution> executions, IReadOnlyList<SessionArtifactActivityItem> artifacts)
    {
        var rows = new List<(DateTimeOffset At,int Rank,string Type,string Id,string? Causal)>();
        rows.AddRange(turns.Select(x => (x.CreatedAt,4,"turn",x.Id,x.Narrative?.PlayerInputId ?? x.Narrative?.SourceModuleTurnId)));
        rows.AddRange(inputs.Select(x => (x.CreatedAt,1,"input",x.Id,x.AcceptedAfterTurnId))); rows.AddRange(executions.Select(x => (x.CreatedAt,2,"execution",x.Id,(string?)x.TriggerId)));
        rows.AddRange(artifacts.Select(x => (x.CreatedAt,3,"artifact",x.Id,(string?)x.ExecutionId)));
        return rows.OrderBy(x => x.At).ThenBy(x => x.Rank).ThenBy(x => x.Id, StringComparer.Ordinal).Select((x,i) => new SessionActivityResponse(x.Type,x.Id,i+1,x.Causal)).ToList();
    }
}
