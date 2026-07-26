using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class ScenarioRuleDebugService(
    ApplicationDbContext db,
    ScenarioRuleConfigurationResolver resolver,
    ScenarioRuleEvaluator evaluator,
    ScenarioActionEnumerator enumerator,
    ScenarioEffectApplier effectApplier,
    IScenarioTurnAi ai)
{
    public async Task<ScenarioRuleDebugResponse?> ExecuteAsync(
        string scenarioId,
        ScenarioRuleDebugRequest request,
        CancellationToken cancellationToken)
    {
        var definition = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Include(version => version.Locations)
            .Include(version => version.ObjectTypes).ThenInclude(type => type.Actions)
            .Include(version => version.Objects)
            .Where(version => version.ScenarioId == scenarioId)
            .OrderByDescending(version => version.Status == "draft")
            .ThenByDescending(version => version.Version)
            .FirstOrDefaultAsync(cancellationToken);
        if (definition is null) return null;

        var location = definition.Locations.SingleOrDefault(item => item.Code == request.CurrentLocationCode)
            ?? throw new ScenarioTurnValidationException("invalid_debug_location");
        var now = DateTimeOffset.UtcNow;
        var session = new Session
        {
            Id = "DEBUG", OwnerId = "DEBUG", ScenarioId = scenarioId,
            ScenarioDefinitionVersionId = definition.Id, CurrentLocationId = location.Id,
            Status = "debug", CreatedAt = now, UpdatedAt = now,
            State = new SessionState { SessionId = "DEBUG", FlagsJson = JsonSerializer.Serialize(request.Flags ?? new Dictionary<string, bool>()), UpdatedAt = now },
        };

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
            states.Add(new SessionObjectState
            {
                Id = $"DEBUG-{item.Id}", SessionId = session.Id, Session = session,
                ScenarioObjectId = item.Id, ScenarioObject = item,
                LocationId = objectLocation.Id, Location = objectLocation,
                StateJson = stateJson, UpdatedAt = now,
            });
        }

        var world = new ScenarioRuleWorld(session, definition, states);
        var snapshot = enumerator.Enumerate(world, $"DEBUG-{Guid.NewGuid():N}");
        if (request.Trigger == "enumerate") return Empty(snapshot);

        RuleActionDecisionResult decision;
        if (request.Trigger == "player-input")
        {
            if (string.IsNullOrWhiteSpace(request.PlayerInput)) throw new ScenarioTurnValidationException("debug_player_input_required");
            var generated = await ai.DecideActionAsync(new(ScenarioTurnSchemas.ActionDecision, request.PlayerInput.Trim(), snapshot), cancellationToken);
            decision = generated.Value;
            var selected = snapshot.Actions.SingleOrDefault(action => action.ObjectId == decision.ObjectId && action.ActionId == decision.ActionId)
                ?? throw new ScenarioTurnValidationException("unknown_action");
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
            var state = states.Single(candidate => candidate.ScenarioObjectId == item.Id);
            var stateObject = System.Text.Json.Nodes.JsonNode.Parse(state.StateJson) as System.Text.Json.Nodes.JsonObject ?? [];
            var flags = request.Flags ?? new Dictionary<string, bool>();
            var arguments = request.Arguments.ValueKind == JsonValueKind.Object ? request.Arguments : JsonSerializer.SerializeToElement(new { });
            if (!evaluator.Evaluate(action.AvailabilityConditionJson, stateObject, flags, arguments))
                throw new ScenarioTurnValidationException("disabled_action");
            decision = new(ScenarioTurnSchemas.ActionDecision, item.Id, action.Id, arguments.Clone());
        }
        else throw new ScenarioTurnValidationException("invalid_debug_trigger");

        var resolution = effectApplier.ResolveAndApply(world, decision);
        session.Revision++;
        var postState = effectApplier.ProjectPostState(world);
        return new(snapshot, decision, resolution.Rule?.RuleCode, resolution.Effects, postState,
            resolution.Facts, resolution.Events, resolution.Hints, resolution.ForbiddenFacts);
    }

    private static ScenarioRuleDebugResponse Empty(RuleActionSnapshot snapshot) =>
        new(snapshot, null, null, [], null, [], [], [], []);
}
