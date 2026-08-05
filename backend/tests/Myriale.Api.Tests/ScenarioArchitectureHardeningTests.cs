using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Myriale.Api.Features.Scenarios.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.Scenarios.Domain;
using Myriale.Api.Features.Scenarios.Infrastructure;

namespace Myriale.Api.Tests;

public sealed class ScenarioArchitectureHardeningTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task DefinitionCommandUseCases_RejectNonOwnerWhenCalledDirectly()
    {
        await using var db = await CreateDbAsync();
        db.Scenarios.Add(Scenario.Create("scenario", "owner", new ScenarioTitle("Title"), DateTimeOffset.UtcNow));
        await db.SaveChangesAsync();
        var codec = new ScenarioRuleJsonCodec();
        var repository = new EfScenarioDefinitionRepository(db);
        var mapper = new ScenarioDefinitionMapper(codec);
        var writer = new ScenarioDefinitionWriter(db, codec);
        var drafts = new ScenarioDefinitionDraftService(db, repository, mapper, writer);
        var validator = new ScenarioDefinitionValidator(mapper, codec);
        var request = new ScenarioRuleDataRequest(2, [], [], [], string.Empty);

        var create = await new CreateScenarioDefinitionDraftUseCase(db, repository, drafts, mapper)
            .ExecuteAsync(new("scenario", "intruder"), default);
        var save = await new SaveScenarioDefinitionUseCase(db, repository, drafts, validator, writer, mapper)
            .ExecuteAsync(new("scenario", "intruder", request), default);
        var publish = await new PublishScenarioDefinitionUseCase(db, repository, new ScenarioDefinitionReadinessPolicy(validator, mapper), mapper, new NoopDispatcher())
            .ExecuteAsync(new("scenario", "intruder"), default);

        Assert.Equal(ScenarioDefinitionCommandOutcome.NotFound, create.Outcome);
        Assert.Equal(ScenarioDefinitionCommandOutcome.NotFound, save.Outcome);
        Assert.Equal(ScenarioDefinitionCommandOutcome.NotFound, publish.Outcome);
        Assert.Empty(await db.ScenarioDefinitionVersions.ToListAsync());
    }

    [Fact]
    public void RuleJson_RoundTripsDiscriminatedConditionsEffectsAndOrder()
    {
        const string conditionJson = """
            {"and":[{"op":"eq","path":"state.open","value":false},{"or":[{"op":"exists","path":"session.flags.override"},{"not":{"op":"in","path":"arguments.key","value":["red","blue"]}}]}]}
            """;
        const string effectsJson = """
            [
              {"type":"set-state","objectCode":"door","path":"state.open","value":true},
              {"type":"move-session","locationCode":"outside"},
              {"type":"emit-event","event":"session-moved","locationCode":"outside","detail":{"source":"door"}},
              {"type":"emit-fact","text":"The door opened."},
              {"type":"complete-session"}
            ]
            """;
        var codec = new ScenarioRuleJsonCodec();

        var condition = codec.DecodeCondition(conditionJson);
        var effects = codec.DecodeEffects(effectsJson);
        var conditionRoundTrip = codec.DecodeCondition(codec.Encode(condition));
        var effectsRoundTrip = codec.DecodeEffects(codec.Encode(effects));

        var all = Assert.IsType<AllCondition>(conditionRoundTrip);
        Assert.IsType<PredicateCondition>(all.Conditions[0]);
        Assert.IsType<AnyCondition>(all.Conditions[1]);
        Assert.Equal(new[] { "set-state", "move-session", "emit-event", "emit-fact", "complete-session" },
            effectsRoundTrip.Effects.Select(effect => effect.Type).ToArray());
        var emitted = Assert.IsType<EmitEventEffect>(effectsRoundTrip.Effects[2]);
        Assert.Equal("door", emitted.Payload["detail"].GetProperty("source").GetString());
    }

    [Fact]
    public void ActionRuleAndModuleBinding_RoundTripAsTypedModels()
    {
        const string json = """
            {"code":"open-default","actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":100,
             "authoringNote":"default door behavior","effects":[{"type":"set-state","path":"state.open","value":true}],
             "moduleBinding":{"moduleId":"door.module","version":"1.2.3","digest":"sha256:test","configuration":{"difficulty":2}}}
            """;

        var rule = JsonSerializer.Deserialize<ScenarioActionRule>(json, Json)!;
        var roundTrip = JsonSerializer.Deserialize<ScenarioActionRule>(JsonSerializer.Serialize(rule, Json), Json)!;

        Assert.IsType<PredicateCondition>(roundTrip.Condition);
        Assert.IsType<StateEffect>(Assert.Single(roundTrip.Effects.Effects));
        Assert.Equal(("door.module", "1.2.3", "sha256:test"),
            (roundTrip.ModuleBinding!.ModuleId, roundTrip.ModuleBinding.Version, roundTrip.ModuleBinding.Digest));
        Assert.Equal(2, roundTrip.ModuleBinding.Configuration.GetProperty("difficulty").GetInt32());
    }

    [Theory]
    [InlineData("{\"xor\":[]}")]
    [InlineData("{\"op\":\"contains\",\"path\":\"state.name\",\"value\":\"x\"}")]
    public void RuleJson_RejectsUnsupportedConditionVariants(string json)
    {
        Assert.Throws<JsonException>(() => new ScenarioRuleJsonCodec().DecodeCondition(json));
    }

    [Fact]
    public void RuleJson_RejectsUnsupportedEffectVariant()
    {
        Assert.Throws<JsonException>(() => new ScenarioRuleJsonCodec().DecodeEffects("[{\"type\":\"teleport\"}]"));
    }

    [Fact]
    public void MutationRoundTrip_PreservesAdjustOmittedNullAndValueSemantics()
    {
        var omitted = JsonSerializer.Deserialize<ScenarioObjectRuleMutationInput>(
            "{\"operation\":\"adjust\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open\"}", Json)!;
        var cleared = JsonSerializer.Deserialize<ScenarioObjectRuleMutationInput>(
            "{\"operation\":\"adjust\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open\",\"authoringNote\":null,\"moduleBinding\":null,\"condition\":null,\"priority\":null,\"effects\":null}", Json)!;
        var valued = JsonSerializer.Deserialize<ScenarioObjectRuleMutationInput>(
            "{\"operation\":\"adjust\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open\",\"condition\":{},\"priority\":25,\"effects\":[{\"type\":\"emit-fact\",\"text\":\"changed\"}],\"authoringNote\":\"note\"}", Json)!;

        Assert.False(omitted.ConditionSpecified);
        Assert.False(omitted.PrioritySpecified);
        Assert.False(omitted.EffectsSpecified);
        Assert.False(omitted.AuthoringNoteSpecified);
        Assert.False(omitted.ModuleBindingSpecified);

        Assert.True(cleared.ConditionSpecified);
        Assert.True(cleared.PrioritySpecified);
        Assert.True(cleared.EffectsSpecified);
        Assert.True(cleared.AuthoringNoteSpecified);
        Assert.True(cleared.ModuleBindingSpecified);
        using var clearedJson = JsonDocument.Parse(JsonSerializer.Serialize(cleared, Json));
        Assert.Equal(JsonValueKind.Null, clearedJson.RootElement.GetProperty("condition").ValueKind);
        Assert.Equal(JsonValueKind.Null, clearedJson.RootElement.GetProperty("priority").ValueKind);
        Assert.Equal(JsonValueKind.Null, clearedJson.RootElement.GetProperty("effects").ValueKind);

        Assert.IsType<AlwaysCondition>(valued.Condition);
        Assert.Equal(25, valued.Priority);
        Assert.IsType<TextEffect>(Assert.Single(valued.Effects!.Effects));
    }

    [Fact]
    public async Task Dispatcher_InvokesStructuredLoggingAndAuditHandlersSynchronously()
    {
        var logger = new RecordingLogger<ScenarioDefinitionPublishedLoggingHandler>();
        var services = new ServiceCollection();
        services.AddSingleton<ILogger<ScenarioDefinitionPublishedLoggingHandler>>(logger);
        services.AddSingleton<PublicationRecorder>();
        services.AddSingleton<IDomainEventHandler<ScenarioDefinitionPublished>, ScenarioDefinitionPublishedLoggingHandler>();
        services.AddSingleton<IDomainEventHandler<ScenarioDefinitionPublished>, RecordingPublicationHandler>();
        await using var provider = services.BuildServiceProvider();
        var published = new ScenarioDefinitionPublished("scenario", "definition", 4, DateTimeOffset.UtcNow);

        await new DomainEventDispatcher(provider).DispatchAsync([published], default);

        Assert.Same(published, Assert.Single(provider.GetRequiredService<PublicationRecorder>().Published));
        var log = Assert.Single(logger.Entries);
        Assert.Equal(LogLevel.Information, log.Level);
        Assert.Contains("ScenarioId=scenario", log.Message, StringComparison.Ordinal);
        Assert.Contains("DefinitionVersionId=definition", log.Message, StringComparison.Ordinal);
    }

    private static async Task<ApplicationDbContext> CreateDbAsync()
    {
        var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite($"Data Source=file:{Guid.NewGuid():N}?mode=memory&cache=shared").Options);
        await db.Database.OpenConnectionAsync();
        await db.Database.EnsureCreatedAsync();
        return db;
    }

    private sealed class NoopDispatcher : IDomainEventDispatcher
    {
        public Task DispatchAsync(IEnumerable<IDomainEvent> events, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class PublicationRecorder
    {
        public List<ScenarioDefinitionPublished> Published { get; } = [];
    }

    private sealed class RecordingPublicationHandler(PublicationRecorder recorder)
        : IDomainEventHandler<ScenarioDefinitionPublished>
    {
        public Task HandleAsync(ScenarioDefinitionPublished domainEvent, CancellationToken cancellationToken)
        {
            recorder.Published.Add(domainEvent);
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<(LogLevel Level, string Message)> Entries { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter) => Entries.Add((logLevel, formatter(state, exception)));
    }
}
