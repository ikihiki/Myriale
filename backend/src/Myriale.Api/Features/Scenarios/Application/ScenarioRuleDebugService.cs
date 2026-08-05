using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed class ScenarioRuleDebugService(
    ApplicationDbContext db,
    ScenarioRuleConfigurationResolver resolver,
    ScenarioRuleEvaluator evaluator,
    ScenarioRuleWorldSnapshotFactory snapshotFactory,
    ScenarioActionEnumerator enumerator,
    IScenarioRuleResolutionService resolutionService,
    IScenarioActionDecisionModelMapper actionDecisionMapper,
    IScenarioTurnAi ai)
{
    public async Task<ScenarioRuleDebugResponse?> ExecuteAsync(
        ScenarioId scenarioId,
        ScenarioRuleDebugRequest request,
        CancellationToken cancellationToken)
    {
        var definition = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Include(version => version.Locations)
            .Include(version => version.ObjectTypes).ThenInclude(type => type.Actions)
            .Include(version => version.Objects)
            .Where(version => version.ScenarioId == scenarioId)
            .OrderByDescending(version => version.Status == DefinitionStatus.Draft)
            .ThenByDescending(version => version.Version)
            .FirstOrDefaultAsync(cancellationToken);
        if (definition is null) return null;

        var location = definition.Locations.SingleOrDefault(item => item.Code == request.CurrentLocationCode)
            ?? throw new ScenarioTurnValidationException("invalid_debug_location");
        var now = DateTimeOffset.UtcNow;
        var session = Session.Create(
            new SessionId("DEBUG"), new AccountId("DEBUG"), scenarioId, definition.Id, location.Id, null, null, "DEBUG", false,
            SessionState.Create(new SessionId("DEBUG"), request.Flags ?? new Dictionary<string, bool>(), now),
            now, SessionStatus.Debug);

        var overrides = (request.Objects ?? []).ToDictionary(item => item.ObjectCode, StringComparer.Ordinal);
        var states = new List<SessionObjectState>();
        foreach (var item in definition.Objects)
        {
            overrides.TryGetValue(item.Code, out var stateOverride);
            var objectLocation = stateOverride is null
                ? definition.Locations.Single(candidate => candidate.Id == item.LocationId)
                : definition.Locations.SingleOrDefault(candidate => candidate.Code == stateOverride.LocationCode)
                    ?? throw new ScenarioTurnValidationException("invalid_debug_object_location");
            var stateJson = stateOverride is null
                ? resolver.InitialState(definition, item).ToJsonString()
                : stateOverride.State.ValueKind == JsonValueKind.Object
                    ? stateOverride.State.GetRawText()
                    : throw new ScenarioTurnValidationException("invalid_debug_object_state");
            states.Add(SessionObjectState.Create(
                new SessionObjectStateId($"DEBUG-{item.Id}"), session.Id, item.Id, objectLocation.Id, stateJson, now));
        }

        var world = snapshotFactory.Create(session, definition, states);
        var snapshot = enumerator.Enumerate(world, $"DEBUG-{Guid.NewGuid():N}");
        if (request.Trigger == "enumerate") return Empty(snapshot);

        RuleActionDecisionResult decision;
        if (request.Trigger == "player-input")
        {
            if (string.IsNullOrWhiteSpace(request.PlayerInput)) throw new ScenarioTurnValidationException("debug_player_input_required");
            var modelRequest = actionDecisionMapper.CreateRequest(request.PlayerInput.Trim(), snapshot);
            var generated = await ai.DecideActionAsync(modelRequest, cancellationToken);
            decision = actionDecisionMapper.MapResult(snapshot, generated.Value);
            var selected = snapshot.Actions.SingleOrDefault(action => action.ObjectId == decision.ObjectId && action.ActionId == decision.ActionId)
                ?? throw new ScenarioTurnValidationException("unknown_action");
            ScenarioActionArgumentValidator.Validate(selected.ArgumentSchema, decision.Arguments);
            if (!selected.Enabled) throw new ScenarioTurnValidationException("disabled_action");
        }
        else if (request.Trigger == "direct-action")
        {
            var item = definition.Objects.SingleOrDefault(candidate => candidate.Code == request.ObjectCode)
                ?? throw new ScenarioTurnValidationException("invalid_debug_object");
            var configuration = resolver.Resolve(definition, item);
            if (configuration.Conflicts.Count > 0) throw new ScenarioTurnValidationException("invalid_rule_configuration");
            var action = configuration.Actions.SingleOrDefault(candidate => candidate.Code == request.ActionCode)
                ?? throw new ScenarioTurnValidationException("invalid_debug_action");
            var state = world.Objects.Single(candidate => candidate.Id == item.Id);
            var stateObject = System.Text.Json.Nodes.JsonNode.Parse(state.State.GetRawText()) as System.Text.Json.Nodes.JsonObject ?? [];
            var flags = request.Flags ?? new Dictionary<string, bool>();
            var arguments = request.Arguments.ValueKind == JsonValueKind.Object ? request.Arguments : JsonSerializer.SerializeToElement(new { });
            if (!evaluator.Evaluate(action.AvailabilityCondition, stateObject, flags, arguments))
                throw new ScenarioTurnValidationException("disabled_action");
            decision = new(ScenarioTurnSchemas.ActionDecision, item.Id, action.Id, arguments.Clone());
        }
        else throw new ScenarioTurnValidationException("invalid_debug_trigger");

        var resolution = resolutionService.Resolve(world, decision, $"DEBUG-{Guid.NewGuid():N}");
        var postState = resolutionService.ProjectPostState(world, resolution.Plan);
        return new(snapshot, decision, resolution.Rule?.RuleCode, resolution.Plan.AppliedEffects, postState,
            resolution.Plan.Facts, resolution.Plan.Events, resolution.Plan.NarrativeHints, resolution.Plan.ForbiddenNarrativeFacts);
    }

    private static ScenarioRuleDebugResponse Empty(RuleActionSnapshot snapshot) =>
        new(snapshot, null, null, [], null, [], [], [], []);
}
