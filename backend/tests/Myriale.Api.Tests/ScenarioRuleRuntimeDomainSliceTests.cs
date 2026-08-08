using System.Reflection;
using System.Text.Json;
using Myriale.Api.Features.Scenarios.Domain;

namespace Myriale.Api.Tests;

public sealed class ScenarioRuleRuntimeDomainSliceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ResolvedActions_KeepVisibilityAndExecutionModeTyped()
    {
        var action = Action();
        Assert.IsType<ActionVisibility>(action.Visibility);
        Assert.IsType<ActionExecutionMode>(action.ExecutionMode);
        Assert.Equal(ActionVisibility.AiChoice, action.Visibility);
        Assert.Equal(ActionExecutionMode.Rule, action.ExecutionMode);
    }

    [Fact]
    public void Evaluator_ExposesOnlyTypedConditionEntryPoint()
    {
        var evaluate = typeof(ScenarioRuleEvaluator).GetMethods(BindingFlags.Instance | BindingFlags.Public)
            .Where(method => method.Name == nameof(ScenarioRuleEvaluator.Evaluate)).ToArray();
        var method = Assert.Single(evaluate);
        Assert.Equal(typeof(ConditionExpression), method.GetParameters()[0].ParameterType);
    }

    [Fact]
    public void Resolution_ProducesValidatedMultiObjectPlanWithoutMutatingSnapshot()
    {
        var effects = new EffectSet([
            new StateEffect("set-state", "state.open", Element("true"), null, null),
            new StateEffect("increment-state", "state.count", Element("2"), null, null),
            new StateEffect("append-set", "state.tags", Element("\"new\""), null, null),
            new StateEffect("remove-set", "state.tags", Element("\"old\""), null, null),
            new StateEffect("set-state", "state.open", Element("true"), "other", null),
            new MoveObjectEffect("other", null, "vault", null),
            new MoveSessionEffect("vault", null),
            new SetSessionFlagEffect("opened", true),
            new TextEffect("emit-fact", "The door opened."),
            new TextEffect("add-narrative-hint", "Mention the echo."),
            new TextEffect("forbid-narrative-fact", "The door stayed shut."),
            new EmitEventEffect("door-opened", "vault", null, new Dictionary<string, JsonElement> { ["loud"] = Element("true") }),
            new CompleteSessionEffect(),
        ]);
        var world = World(effects);
        var before = world.Objects.ToDictionary(item => item.Id, item => item.State.GetRawText());

        var result = Service().Resolve(world, Decision(), "INV-1");

        Assert.Equal(2, result.Plan.Objects.Count);
        Assert.Equal("LOC-VAULT", result.Plan.Session.CurrentLocationId.AsPrimitive());
        Assert.True(result.Plan.CompletionIntent);
        Assert.True(result.Plan.SessionState!.Flags["opened"]);
        Assert.Contains(result.Plan.Placements, item => item.TargetId == "OBJ-OTHER" && item.LocationId == new ScenarioLocationId("LOC-VAULT") && !item.IsSession);
        Assert.Contains(result.Plan.Placements, item => item.TargetId == "SES-1" && item.LocationId == new ScenarioLocationId("LOC-VAULT") && item.IsSession);
        Assert.Single(result.Plan.Facts);
        Assert.Single(result.Plan.Events);
        Assert.Single(result.Plan.NarrativeHints);
        Assert.Single(result.Plan.ForbiddenNarrativeFacts);
        Assert.All(world.Objects, item => Assert.Equal(before[item.Id], item.State.GetRawText()));

        var sourcePatch = result.Plan.Objects.Single(item => item.ObjectId == new ScenarioObjectId("OBJ-DOOR"));
        Assert.True(sourcePatch.State.GetProperty("open").GetBoolean());
        Assert.Equal(3, sourcePatch.State.GetProperty("count").GetInt32());
        Assert.Equal(["new"], sourcePatch.State.GetProperty("tags").EnumerateArray().Select(item => item.GetString()));
        var post = Service().ProjectPostState(world, result.Plan);
        Assert.Equal("vault", post.CurrentLocation.Code);
        Assert.Equal(world.SessionStateRevision + 1, post.SessionStateRevision);
    }

    [Theory]
    [InlineData("[{\"type\":\"set-state\",\"path\":\"open\",\"value\":true}]", "invalid_effect_path")]
    [InlineData("[{\"type\":\"set-state\",\"path\":\"state.missing\",\"value\":true}]", "invalid_effect_path")]
    [InlineData("[{\"type\":\"set-state\",\"path\":\"state.open\",\"value\":\"yes\"}]", "invalid_effect_value")]
    [InlineData("[{\"type\":\"increment-state\",\"path\":\"state.open\",\"value\":1}]", "invalid_effect_value")]
    [InlineData("[{\"type\":\"append-set\",\"path\":\"state.open\",\"value\":1}]", "invalid_effect_value")]
    public void InvalidPlan_ThrowsBeforeAnyInputMutation(string json, string code)
    {
        var world = World(EffectSet.FromJson(json));
        var before = world.Objects.Select(item => item.State.GetRawText()).ToArray();
        var exception = Assert.Throws<ScenarioTurnValidationException>(() => Service().Resolve(world, Decision(), "INV-1"));
        Assert.Equal(code, exception.Code);
        Assert.Equal(before, world.Objects.Select(item => item.State.GetRawText()));
        Assert.Equal("LOC-HALL", world.CurrentLocationId.AsPrimitive());
        Assert.False(world.SessionFlags.ContainsKey("opened"));
    }

    [Fact]
    public void RulesCannotMutateAiManagedFields()
    {
        var world = World(new EffectSet([new StateEffect("set-state", "state.mood", Element("\"curious\""), null, null)]));
        var source = world.Objects[0] with
        {
            State = Element("{\"open\":false,\"count\":1,\"tags\":[\"old\"],\"mood\":\"calm\"}"),
            AiManagedFields = new HashSet<string>(["mood"]),
        };
        world = world with { Objects = [source, world.Objects[1]] };

        var error = Assert.Throws<ScenarioTurnValidationException>(() => Service().Resolve(world, Decision(), "INV"));

        Assert.Equal("ai_managed_state_rule_mutation", error.Code);
    }

    [Fact]
    public void ExtensionBinding_IsReturnedAsRequestInsteadOfExecutedDuringResolution()
    {
        var world = World(new EffectSet([new TextEffect("emit-fact", "ready")]), module: true);
        var result = Service().Resolve(world, Decision(), "INV-1");
        var request = Assert.IsType<ScenarioExtensionRequest>(result.Plan.ExtensionRequest);
        Assert.Equal("INV-1", request.InvocationId);
        Assert.Equal("example.module", request.ModuleId.AsPrimitive());
        Assert.Equal("OBJ-DOOR", request.ObjectId.AsPrimitive());
    }

    [Fact]
    public void ActionStep_EnforcesTransitionMatrixAndApplyPublishOnce()
    {
        var step = SessionRuleActionStep.CreateSnapshot(new SessionRuleActionStepId("STEP"), new SessionId("SES"), new SessionExecutionId("EXE"), new SessionPlayerInputId("INP"), new ScenarioDefinitionVersionId("DEF"), 3, "{}", "{}", Now);
        Assert.Equal(ScenarioTurnStage.Decision, step.Stage);
        Assert.Throws<InvalidOperationException>(() => step.RecordResolution(null, "{}", false, Now));
        Assert.True(step.RecordDecision("{}", Now));
        Assert.False(step.RecordDecision("{}", Now));
        Assert.Equal(ScenarioTurnStage.Resolution, step.Stage);
        Assert.True(step.RecordResolution("RULE", "{}", true, Now));
        Assert.Equal(ScenarioTurnStage.StateTransition, step.Stage);
        Assert.True(step.RecordStateTransition("{}", "{}", true, Now));
        Assert.False(step.RecordStateTransition("{}", "{}", true, Now));
        Assert.Equal(ScenarioTurnStage.Extension, step.Stage);
        Assert.True(step.CompleteExtension("{}", Now));
        Assert.False(step.CompleteExtension("{}", Now));
        Assert.Equal(ScenarioTurnStage.EffectCommit, step.Stage);
        Assert.True(step.CommitEffects(3, 4, "[]", "{}", "[]", "[]", "[]", "[]", Now));
        Assert.False(step.CommitEffects(3, 4, "[]", "{}", "[]", "[]", "[]", "[]", Now));
        Assert.Equal(ScenarioTurnStage.NarrativePublish, step.Stage);
        Assert.True(step.PublishNarrative(Now));
        Assert.False(step.PublishNarrative(Now));
        Assert.Equal(ScenarioTurnStage.Completed, step.Stage);
    }

    [Fact]
    public void RuntimeEntities_RejectStaleExpectedRevisions()
    {
        var state = SessionObjectState.Create(new SessionObjectStateId("STATE"), new SessionId("SES"), new ScenarioObjectId("OBJ"), new ScenarioLocationId("LOC"), "{\"open\":false}", Now);
        state.Apply("{\"open\":true}", new ScenarioLocationId("LOC"), 0, Now);
        Assert.Throws<ScenarioRuntimeRevisionConflictException>(() => state.Apply("{\"open\":false}", new ScenarioLocationId("LOC"), 0, Now));

        var sessionState = SessionState.Create(new SessionId("SES"), new Dictionary<string, bool>(), Now);
        var session = Session.Create(new SessionId("SES"), new AccountId("OWNER"), new ScenarioId("SCN"), new ScenarioDefinitionVersionId("DEF"), new ScenarioLocationId("LOC"), null, null, "Hero", false, sessionState, Now);
        session.ApplyScenarioEffects(0, new ScenarioLocationId("LOC"), false, Now);
        Assert.Throws<SessionRevisionConflictException>(() => session.ApplyScenarioEffects(0, new ScenarioLocationId("LOC"), false, Now));
    }

    [Fact]
    public void CompletionIntent_AllowsOnlyItsFinalNarrativeToPublish()
    {
        var state = SessionState.Create(new SessionId("SES"), new Dictionary<string, bool>(), Now);
        var session = Session.Create(new SessionId("SES"), new AccountId("OWNER"), new ScenarioId("SCN"), new ScenarioDefinitionVersionId("DEF"), new ScenarioLocationId("LOC"), null, null, "Hero", false, state, Now);
        session.AppendOpeningTurn(new SessionTurnId("OPEN"), "opening.v1", "Opening", "Body", Now);
        var input = session.AcceptInput(new SessionPlayerInputId("INP"), "REQ", "finish", SessionInputInteractionType.Dialogue, new string('a', 64), new AccountId("OWNER"), null, Now);
        session.ApplyScenarioEffects(session.Revision, new ScenarioLocationId("LOC"), true, Now);
        var metadata = new SessionTurnAiMetadata("mock", "model", "response", 1, 1, 1, 1, "stop");

        Assert.Throws<InvalidOperationException>(() => session.AppendScenarioNarrative(
            new SessionTurnId("TURN-BAD"), input.Id, ScenarioTurnSchemas.PostStateNarrative, null, null, "Done", "Done", null,
            session.Revision, metadata, Now));
        var turn = session.AppendScenarioCompletionNarrative(
            new SessionTurnId("TURN"), input.Id, ScenarioTurnSchemas.PostStateNarrative, null, null, "Done", "Done", null,
            session.Revision, metadata, Now);

        Assert.Equal("TURN", turn.Id.AsPrimitive());
        Assert.Equal(SessionStatus.Completed, session.Status);
    }

    [Fact]
    public void LifecycleSetters_AreNotPublic()
    {
        foreach (var property in typeof(SessionRuleActionStep).GetProperties().Where(item => item.Name is nameof(SessionRuleActionStep.Stage)
                     or nameof(SessionRuleActionStep.DecisionJson) or nameof(SessionRuleActionStep.AppliedAt)
                     or nameof(SessionRuleActionStep.NarrativePublishedAt)))
            Assert.False(property.SetMethod?.IsPublic ?? false, property.Name);
        foreach (var property in typeof(SessionObjectState).GetProperties().Where(item => item.Name is nameof(SessionObjectState.StateJson)
                     or nameof(SessionObjectState.LocationId) or nameof(SessionObjectState.Revision)))
            Assert.False(property.SetMethod?.IsPublic ?? false, property.Name);
    }

    private static IScenarioRuleResolutionService Service() =>
        new ScenarioRuleResolutionService(new ScenarioRuleEvaluator(), new ScenarioPublicProjector(), new ScenarioRuleJsonCodec());

    private static ScenarioRuleWorldSnapshot World(EffectSet effects, bool module = false)
    {
        var action = Action();
        var rule = new ResolvedScenarioRule(
            "RULE-1", "open-rule", "open", ConditionExpression.Empty, 10, 0, "door", null, effects,
            module ? new ModulePackageModuleId("example.module") : null, module ? "1.0.0" : null, module ? new string('a', 64) : null,
            module ? Element("{}") : null);
        var source = new ScenarioRuleObjectSnapshot(
            new ScenarioObjectId("OBJ-DOOR"), "door", "Door", "A door", false, new ScenarioLocationId("LOC-HALL"), 4,
            Element("{\"open\":false,\"count\":1,\"tags\":[\"old\"]}"), Element("{}"), Element("{}"),
            new HashSet<string>(["open", "count", "tags"]), new HashSet<string>(), [action], [rule]);
        var otherAction = action with { Id = new ScenarioObjectTypeActionId("ACT-OTHER"), ObjectTypeId = new ScenarioObjectTypeId("TYPE-OTHER") };
        var other = new ScenarioRuleObjectSnapshot(
            new ScenarioObjectId("OBJ-OTHER"), "other", "Other", "Other object", false, new ScenarioLocationId("LOC-HALL"), 7,
            Element("{\"open\":false,\"count\":0,\"tags\":[]}"), Element("{}"), Element("{}"),
            new HashSet<string>(["open"]), new HashSet<string>(), [otherAction], []);
        return new ScenarioRuleWorldSnapshot(
            new SessionId("SES-1"), new AccountId("OWNER-1"), new ScenarioDefinitionVersionId("DEF-1"), new ScenarioLocationId("LOC-HALL"), 12, SessionStatus.Active, 5,
            new Dictionary<string, bool>(),
            [new(new ScenarioLocationId("LOC-HALL"), "hall", "Hall", "Hall"), new(new ScenarioLocationId("LOC-VAULT"), "vault", "Vault", "Vault")],
            [source, other],
            new("Title", "Summary", "Genre", "Tone", "Lore", "Freedom", "Hero", "Opening", []));
    }

    private static ResolvedScenarioAction Action() => new(
        new ScenarioObjectTypeActionId("ACT-OPEN"), "open", "Open", "Open it", Element("{\"type\":\"object\"}"),
        ConditionExpression.Empty, ActionVisibility.AiChoice, ActionExecutionMode.Rule, 0, "door", new ScenarioObjectTypeId("TYPE-DOOR"));

    private static RuleActionDecisionResult Decision() =>
        new(ScenarioTurnSchemas.ActionDecision, new ScenarioObjectId("OBJ-DOOR"), new ScenarioObjectTypeActionId("ACT-OPEN"), Element("{}"));

    private static JsonElement Element(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
