using System.Text.Json;
using Myriale.Api.Infrastructure.Composition.ScenarioTurns;

namespace Myriale.Api.Tests;

public sealed class ScenarioEntityStateTransitionServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 5, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Generate_FirstInteractionMergesOnlyAiFieldsAndPreservesAuthoredMovement()
    {
        var ai = new TestAi(new(ScenarioTurnSchemas.EntityStateTransition, "entity", 0,
            Element("{\"mood\":\"curious\"}"), ["noticed"], ["respond carefully"], ["secret"], "private"));
        var service = new ScenarioEntityStateTransitionService(ai, new NoopRecorder(), new ScenarioPublicProjector());
        var world = World(0, "{\"locked\":false}");
        var plan = Plan(world, new ScenarioLocationId("LOC-B"), "{\"locked\":true}");

        var generated = await service.GenerateAsync(Execution(), Context(), world, Decision(), plan, default);

        Assert.Equal(1, ai.Calls);
        Assert.Equal("{}", ai.Requests.Single().CurrentAiState.GetRawText());
        Assert.Equal("oracle", ai.Requests.Single().StructuredProfile.GetProperty("role").GetString());
        var patch = Assert.Single(generated.Plan.Objects);
        Assert.Equal("LOC-B", patch.LocationId.AsPrimitive());
        Assert.True(patch.State.GetProperty("locked").GetBoolean());
        Assert.Equal("curious", patch.State.GetProperty("mood").GetString());
        Assert.Equal(["rule fact", "noticed"], generated.Plan.Facts);
    }

    [Fact]
    public async Task Generate_NextTurnReadsPersistedAiState()
    {
        var ai = new TestAi(new(ScenarioTurnSchemas.EntityStateTransition, "entity", 1,
            Element("{\"mood\":\"trusting\"}"), [], [], [], null));
        var service = new ScenarioEntityStateTransitionService(ai, new NoopRecorder(), new ScenarioPublicProjector());
        var world = World(1, "{\"locked\":true,\"mood\":\"curious\"}");

        _ = await service.GenerateAsync(Execution(), Context(), world, Decision(), EmptyPlan(world), default);

        Assert.Equal("curious", ai.Requests.Single().CurrentAiState.GetProperty("mood").GetString());
        Assert.Equal(1, ai.Requests.Single().ExpectedRevision);
    }

    [Fact]
    public async Task Generate_RetryReusesRecordedTransitionWithoutCallingProvider()
    {
        var transition = new EntityStateTransitionResult(ScenarioTurnSchemas.EntityStateTransition, "entity", 0,
            Element("{\"mood\":\"curious\"}"), [], [], [], null);
        var ai = new TestAi(transition);
        var service = new ScenarioEntityStateTransitionService(ai, new NoopRecorder(transition), new ScenarioPublicProjector());
        var world = World(0, "{\"locked\":false}");

        var generated = await service.GenerateAsync(Execution(), Context(), world, Decision(), EmptyPlan(world), default);

        Assert.Equal(0, ai.Calls);
        Assert.Equal("curious", generated.Plan.Objects.Single().State.GetProperty("mood").GetString());
    }

    [Theory]
    [InlineData("other", 0, "{\"mood\":\"curious\"}", "wrong_entity_state_transition")]
    [InlineData("entity", 9, "{\"mood\":\"curious\"}", "stale_object_revision")]
    [InlineData("entity", 0, "{\"mood\":\"curious\",\"locked\":true}", "invalid_ai_state_fields")]
    [InlineData("entity", 0, "{}", "invalid_ai_state_fields")]
    [InlineData("entity", 0, "{\"mood\":42}", "invalid_ai_state_schema")]
    public void Validate_RejectsForeignStaleAndInvalidMutations(string code, long revision, string state, string expected)
    {
        var result = new EntityStateTransitionResult(ScenarioTurnSchemas.EntityStateTransition, code, revision,
            Element(state), [], [], [], null);

        var error = Assert.Throws<ScenarioTurnValidationException>(() =>
            ScenarioEntityStateTransitionService.Validate(World(0, "{\"locked\":false}").Objects.Single(), result));

        Assert.Equal(expected, error.Code);
    }

    [Fact]
    public void ActionStep_CheckpointMakesTransitionRetryIdempotent()
    {
        var step = SessionRuleActionStep.CreateSnapshot(new("STEP"), new("SES"), new("EXE"), new("INP"), new("DEF"), 1, "{}", "{}", Now);
        step.RecordDecision("{}", Now);
        step.RecordResolution(null, "{}", false, Now);

        Assert.True(step.RecordStateTransition("{\"entityCode\":\"entity\"}", "{\"objects\":[]}", false, Now));
        Assert.False(step.RecordStateTransition("{\"entityCode\":\"other\"}", "{\"objects\":[1]}", false, Now));
        Assert.Contains("entity", step.EntityStateTransitionJson);
        Assert.DoesNotContain("other", step.EntityStateTransitionJson);
    }

    private static ScenarioRuleWorldSnapshot World(long revision, string state)
    {
        var entity = new ScenarioRuleObjectSnapshot(
            new("OBJ"), "entity", "Entity", "profile", false, new("LOC-A"), revision, Element(state),
            Element("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"locked\":{\"type\":\"boolean\"},\"mood\":{\"type\":\"string\",\"enum\":[\"curious\",\"trusting\"],\"updateAuthority\":\"ai\"}}}"),
            Element("{\"role\":\"oracle\"}"), new HashSet<string>(["locked"]), new HashSet<string>(["mood"]), [], []);
        return new(new("SES"), new("OWNER"), new("DEF"), new("LOC-A"), 3, SessionStatus.Active, 0,
            new Dictionary<string, bool>(), [new(new("LOC-A"), "a", "A", "A"), new(new("LOC-B"), "b", "B", "B")],
            [entity], new("Title", "Summary", "Genre", "Tone", "Lore", "Freedom", "Hero", "Opening", []));
    }

    private static ScenarioEffectPlan Plan(ScenarioRuleWorldSnapshot world, ScenarioLocationId location, string state) => new(
        new(world.SessionRevision, world.CurrentLocationId, false), null,
        [new(world.Objects.Single().Id, world.Objects.Single().Revision, location, Element(state))],
        [new(world.Objects.Single().Id.AsPrimitive(), location, false)], [], ["rule fact"], [], [], [], false, null);

    private static ScenarioEffectPlan EmptyPlan(ScenarioRuleWorldSnapshot world) => new(
        new(world.SessionRevision, world.CurrentLocationId, false), null, [], [], [], [], [], [], [], false, null);

    private static RuleActionDecisionResult Decision() => new(
        ScenarioTurnSchemas.ActionDecision, new("OBJ"), new("ACT"), Element("{}"));

    private static ScenarioExecutionCheckpoint Execution() => new(
        new("EXE"), new("SES"), new("INP"), "hello", null, 2, new("action"), new("narrative"));

    private static SessionExecutionContext Context() => new(new("EXE"), "lease", 0, new("ATT"), 1);

    private static JsonElement Element(string json) => JsonDocument.Parse(json).RootElement.Clone();

    private sealed class TestAi(EntityStateTransitionResult result) : IScenarioTurnAiService
    {
        public int Calls { get; private set; }
        public List<EntityStateTransitionRequest> Requests { get; } = [];
        public Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionForProfileAsync(
            AiProviderProfileId profileId, EntityStateTransitionRequest request, CancellationToken cancellationToken)
        {
            Calls++; Requests.Add(request);
            return Task.FromResult(new NarrativeGeneration<EntityStateTransitionResult>(result,
                new(new("test"), "model", null, null, null, 1, 1, "stop"), "prompt", "result"));
        }
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class NoopRecorder(EntityStateTransitionResult? recorded = null) : IScenarioAiInteractionRecorder
    {
        public Task<EntityStateTransitionResult?> FindRecordedStateTransitionAsync(SessionExecutionId executionId, CancellationToken cancellationToken) => Task.FromResult(recorded);
        public Task<RuleActionDecisionResult?> FindRecordedDecisionAsync(SessionExecutionId executionId, CancellationToken cancellationToken) => Task.FromResult<RuleActionDecisionResult?>(null);
        public Task RecordSuccessAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence, SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation, string canonicalResultJson, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task RecordValidationFailureAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence, SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation, ScenarioTurnValidationException exception, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task TryRecordProviderFailureAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence, SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, AiProviderException exception, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
