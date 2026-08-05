using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging.Abstractions;
using Myriale.Api.Application.ModuleHandoffs;
using Myriale.Api.Application.ProgressionRuntime;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Infrastructure.ModuleHandoffs;
using Myriale.Api.Features.SessionArtifacts.Infrastructure;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class ModuleHandoffDomainSliceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);
    private static readonly JsonSerializerOptions Json = ModuleJsonSerializerOptions.Create();

    [Fact]
    public async Task EnqueueRejectsNonCompletedExecutionAndUsesResolvedNarrativeProfile()
    {
        var port = new FakeEnqueuePort();
        var command = new EnqueueModuleHandoffCommand(port, new FakeProfiles());
        var execution = NewModuleExecution();
        execution.AttachSessionTurn("TRN-MODULE");
        var outcome = Outcome();

        var rejected = await Assert.ThrowsAsync<ModuleHandoffValidationException>(
            () => command.ExecuteAsync(execution, outcome, default));
        Assert.Equal("module_turn_not_completed", rejected.Code);

        execution.CompleteInitialization(new(ModuleExecutionStatuses.Completed, Parse("{}"), Parse("{\"public\":true}"), [], Outcome: outcome), Json, Now);
        var result = await command.ExecuteAsync(execution, outcome, default);
        Assert.Equal(EnqueueModuleHandoffOutcome.Enqueued, result);
        Assert.Equal("narrative-default", port.ProfileId);
    }

    [Fact]
    public void DatabaseOwnsEnqueuePublicationArtifactAndProgressionIdempotency()
    {
        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite("Data Source=:memory:").Options);
        var model = db.Model;
        AssertUnique(model.FindEntityType(typeof(SessionExecution))!, nameof(SessionExecution.SessionId), nameof(SessionExecution.IdempotencyKey));
        AssertUnique(model.FindEntityType(typeof(SessionTurn))!, nameof(SessionTurn.SourceModuleTurnId));
        AssertUnique(model.FindEntityType(typeof(SessionArtifact))!, nameof(SessionArtifact.ExecutionId), nameof(SessionArtifact.Kind));
        AssertUnique(model.FindEntityType(typeof(SessionNarrativeSignal))!, nameof(SessionNarrativeSignal.NarrativeTurnId), nameof(SessionNarrativeSignal.Code));
        AssertUnique(model.FindEntityType(typeof(SessionProgressionTransitionReceipt))!, nameof(SessionProgressionTransitionReceipt.SourceSignalId));
    }

    [Fact]
    public void CausalityValidatorRejectsTriggerHeadAndRevisionMismatches()
    {
        var validator = new ModuleHandoffCausalityValidator();
        Assert.Equal("invalid_trigger", validator.Validate(Source() with { TriggerType = SessionExecutionTriggerType.Manual })!.Code);
        Assert.Equal("module_execution_missing", validator.Validate(Source() with { TriggerId = "TRN-OTHER" })!.Code);
        var head = validator.Validate(Source() with { SessionHeadTurnId = "TRN-OTHER" });
        Assert.Equal("session_advanced", head!.Code);
        Assert.True(head.Superseded);
        Assert.Equal("session_advanced", validator.Validate(Source() with { SessionRevision = 5 })!.Code);
    }

    [Fact]
    public void ExistingTurnReplayRemainsCausallyValidAfterSessionAdvances()
    {
        var source = Source() with { ExistingNarrativeTurnId = "TRN-NARRATIVE", SessionHeadTurnId = "TRN-NARRATIVE", SessionRevision = 5 };
        Assert.Null(new ModuleHandoffCausalityValidator().Validate(source));
    }

    [Fact]
    public void RequestBuilderRejectsInvalidOutcomeAndUnappliedEffects()
    {
        var builder = new ModuleHandoffNarrativeRequestBuilder();
        Assert.Equal("narrative_source_invalid", Assert.Throws<ModuleHandoffValidationException>(
            () => builder.Build(Source() with { OutcomeJson = "{" })).Code);
        var withEffects = AddEffects(JsonSerializer.Serialize(Outcome(), Json));
        Assert.Equal("effects_not_applied", Assert.Throws<ModuleHandoffValidationException>(
            () => builder.Build(Source() with { OutcomeJson = withEffects })).Code);
        Assert.NotNull(builder.Build(Source() with
        {
            OutcomeJson = withEffects,
            OutcomeApplicationSessionId = "SES-1",
            OutcomeAppliedSessionRevision = 3,
        }));
    }

    [Fact]
    public void AiRequestContainsOnlyPublicModuleState()
    {
        var source = Source() with
        {
            ViewStateJson = "{\"publicValue\":\"visible\"}",
            OutcomeJson = JsonSerializer.Serialize(Outcome() with { Summary = "PUBLIC-SUMMARY" }, Json),
        };
        var request = new ModuleHandoffNarrativeRequestBuilder().Build(source);
        var serialized = JsonSerializer.Serialize(request, Json);
        Assert.Contains("visible", serialized);
        Assert.Contains("PUBLIC-SUMMARY", serialized);
        Assert.DoesNotContain("configurationJson", serialized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stateJson", serialized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("contextJson", serialized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("capabilities", serialized, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("random", serialized, StringComparison.OrdinalIgnoreCase);
        var sourceProperties = typeof(ModuleHandoffSourceSnapshot).GetProperties().Select(property => property.Name).ToArray();
        Assert.DoesNotContain("ConfigurationJson", sourceProperties);
        Assert.DoesNotContain("StateJson", sourceProperties);
        Assert.DoesNotContain("ContextJson", sourceProperties);
    }

    [Fact]
    public async Task LeaseLossBeforeAiDoesNotGenerate()
    {
        var narrative = new FakeNarrativeService();
        var orchestrator = Orchestrator(new FakeSourceQuery(null), narrative, new FakePublisher(), new FakeProgression());
        var result = await orchestrator.ExecuteAsync(Context(), default);
        Assert.Equal("lease_lost", result.ErrorCode);
        Assert.Equal(0, narrative.Calls);
    }

    [Fact]
    public async Task LeaseLossAfterAiDoesNotReportSuccess()
    {
        var narrative = new FakeNarrativeService();
        var publisher = new FakePublisher(new(ModuleHandoffPublishOutcome.LeaseLost));
        var orchestrator = Orchestrator(new FakeSourceQuery(Source()), narrative, publisher, new FakeProgression());
        var result = await orchestrator.ExecuteAsync(Context(), default);
        Assert.Equal(1, narrative.Calls);
        Assert.Equal(1, publisher.Calls);
        Assert.Equal("lease_lost", result.ErrorCode);
    }

    [Fact]
    public async Task SessionAdvanceSupersedesWithoutAi()
    {
        var narrative = new FakeNarrativeService();
        var orchestrator = Orchestrator(new FakeSourceQuery(Source() with { SessionRevision = 2 }), narrative, new FakePublisher(), new FakeProgression());
        var result = await orchestrator.ExecuteAsync(Context(), default);
        Assert.Equal(SessionExecutionStatus.Superseded, result.TerminalStatus);
        Assert.Equal("session_advanced", result.ErrorCode);
        Assert.Equal(0, narrative.Calls);
    }

    [Fact]
    public async Task ExistingTurnReplaySkipsAiAndRunsProgressionCommandOnce()
    {
        var narrative = new FakeNarrativeService();
        var progression = new FakeProgression();
        var source = Source() with { ExistingNarrativeTurnId = "TRN-NARRATIVE", SessionHeadTurnId = "TRN-NARRATIVE", SessionRevision = 2 };
        var orchestrator = Orchestrator(new FakeSourceQuery(source), narrative, new FakePublisher(), progression);
        var result = await orchestrator.ExecuteAsync(Context(), default);
        Assert.True(result.Succeeded);
        Assert.Equal(0, narrative.Calls);
        Assert.Equal(1, progression.ForTurnCalls);
        Assert.Equal("TRN-NARRATIVE", progression.LastTurnId);
    }

    [Fact]
    public async Task EnqueueIdempotencyRaceHasOneDatabaseWinner()
    {
        var path = Path.Combine(Path.GetTempPath(), $"myriale-handoff-enqueue-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite($"Data Source={path};Default Timeout=30").Options;
            await SeedPublishAsync(options);
            await using (var cleanup = new ApplicationDbContext(options))
            {
                cleanup.SessionExecutionAttempts.RemoveRange(cleanup.SessionExecutionAttempts);
                cleanup.SessionExecutions.RemoveRange(cleanup.SessionExecutions);
                await cleanup.SaveChangesAsync();
            }
            await using var firstDb = new ApplicationDbContext(options);
            await using var secondDb = new ApplicationDbContext(options);
            var firstExecution = await firstDb.ModuleExecutions.SingleAsync(item => item.Id == "MEX-1");
            var secondExecution = await secondDb.ModuleExecutions.SingleAsync(item => item.Id == "MEX-1");
            Assert.Equal(EnqueueModuleHandoffOutcome.Enqueued,
                await new EfModuleHandoffEnqueuePort(firstDb, new FixedTimeProvider(Now)).EnqueueAsync(firstExecution, "narrative-default", default));
            Assert.Equal(EnqueueModuleHandoffOutcome.Enqueued,
                await new EfModuleHandoffEnqueuePort(secondDb, new FixedTimeProvider(Now)).EnqueueAsync(secondExecution, "narrative-default", default));

            var saves = await Task.WhenAll(TrySaveAsync(firstDb), TrySaveAsync(secondDb));
            Assert.Single(saves, saved => saved);
            await using var verify = new ApplicationDbContext(options);
            var winner = Assert.Single(await verify.SessionExecutions.AsNoTracking().ToListAsync());
            Assert.Equal("module-handoff:MEX-1", winner.IdempotencyKey);
            Assert.Equal("TRN-MODULE", winner.TriggerId);
            Assert.Equal("TRN-MODULE", winner.AcceptedHeadTurnId);
            Assert.Equal(1, winner.AcceptedSessionRevision);
        }
        finally { if (File.Exists(path)) File.Delete(path); }
    }

    [Fact]
    public async Task ConcurrentPublishHasOneTurnAndArtifactAndExistingReplay()
    {
        var path = Path.Combine(Path.GetTempPath(), $"myriale-handoff-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite($"Data Source={path};Default Timeout=30").Options;
            await SeedPublishAsync(options);
            var request = new ModuleHandoffNarrativeRequestBuilder().Build(Source());
            var generation = new ModuleHandoffGenerationResult(request,
                new NarrativeGeneration<string>("canonical body", new AiGenerationMetadata("mock", "model", "response", 1, 2, 3, 1, "stop")));
            var context = Context();

            await using var firstDb = new ApplicationDbContext(options);
            await using var secondDb = new ApplicationDbContext(options);
            var first = Publisher(firstDb);
            var second = Publisher(secondDb);
            var results = await Task.WhenAll(
                first.PublishAsync(context, generation, default),
                second.PublishAsync(context, generation, default));

            Assert.Contains(results, result => result.Outcome == ModuleHandoffPublishOutcome.Published);
            Assert.All(results, result => Assert.Contains(result.Outcome,
                new[] { ModuleHandoffPublishOutcome.Published, ModuleHandoffPublishOutcome.Existing }));
            await using var verify = new ApplicationDbContext(options);
            Assert.Single(await verify.SessionTurns.Where(turn => turn.SourceModuleTurnId == "TRN-MODULE").ToListAsync());
            Assert.Single(await verify.SessionArtifacts.Where(artifact => artifact.ExecutionId == "EXE-1"
                && artifact.Kind == SessionArtifactKind.NarrativeText).ToListAsync());
            Assert.Single(await verify.SessionNarrativeSignals.Where(signal => signal.Code == "ok").ToListAsync());
            Assert.Single(await verify.SessionProgressionTransitionReceipts.ToListAsync());
            var progress = await verify.SessionProgressStates.SingleAsync();
            Assert.Equal("NODE-2", progress.CurrentNodeId);
            Assert.Equal(1, progress.Revision);

            await using var replayDb = new ApplicationDbContext(options);
            var replay = await Publisher(replayDb).PublishAsync(context, generation, default);
            Assert.Equal(ModuleHandoffPublishOutcome.Existing, replay.Outcome);
            Assert.Single(await replayDb.SessionTurns.Where(turn => turn.SourceModuleTurnId == "TRN-MODULE").ToListAsync());
            Assert.Single(await replayDb.SessionArtifacts.Where(artifact => artifact.ExecutionId == "EXE-1"
                && artifact.Kind == SessionArtifactKind.NarrativeText).ToListAsync());
        }
        finally { if (File.Exists(path)) File.Delete(path); }
    }

    [Fact]
    public void HandlerIsThinDbContextFreeAndLegacyTypesAreAbsent()
    {
        var constructor = Assert.Single(typeof(ModuleHandoffExecutionHandler).GetConstructors());
        Assert.Equal([typeof(ModuleHandoffExecutionOrchestrator)], constructor.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.DoesNotContain(constructor.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
        var assembly = typeof(ModuleHandoffExecutionHandler).Assembly;
        Assert.Null(assembly.GetType("Myriale.Api.Features.ModuleExecutions.Infrastructure.ModuleHandoffPreparer"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.SessionScenarioProgressionService"));
        Assert.All(new[]
        {
            typeof(IModuleHandoffEnqueuePort), typeof(IModuleHandoffSourceSnapshotQuery),
            typeof(IModuleHandoffAiInteractionRecorder), typeof(IModuleHandoffNarrativeService),
            typeof(IModuleHandoffPublishUnitOfWork), typeof(IModuleHandoffArtifactWriter),
            typeof(IModuleHandoffSessionTurnAppender), typeof(IProgressionReceiptCommand),
        }, type => Assert.True(type.IsInterface, type.Name));
    }

    private static async Task<bool> TrySaveAsync(ApplicationDbContext db)
    {
        try { await db.SaveChangesAsync(); return true; }
        catch (DbUpdateException) { db.ChangeTracker.Clear(); return false; }
    }

    private static EfModuleHandoffPublishUnitOfWork Publisher(ApplicationDbContext db) => new(
        db,
        new ModuleHandoffSessionTurnAppender(),
        new ModuleHandoffArtifactWriter(new EfSessionArtifactWriter(db)),
        new EnsureProgressionSignalCommand(db),
        new FixedTimeProvider(Now.AddMinutes(1)));

    private static async Task SeedPublishAsync(DbContextOptions<ApplicationDbContext> options)
    {
        await using var db = new ApplicationDbContext(options);
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
        var scenario = new Scenario
        {
            Id = "SCN-1", Title = "Handoff", AuthorId = "owner", CreatedAt = Now, UpdatedAt = Now,
        };
        var definition = ScenarioDefinitionVersion.CreateDraft("DEF-1", scenario.Id, 1, Now);
        var sourceNode = new ScenarioProgressionNode
        {
            Id = "NODE-1", DefinitionVersionId = definition.Id, Code = "start", IsInitial = true,
            AllowedNarrativeSignalsJson = "[\"ok\"]",
        };
        var targetNode = new ScenarioProgressionNode
        {
            Id = "NODE-2", DefinitionVersionId = definition.Id, Code = "next", AllowedNarrativeSignalsJson = "[]",
        };
        var transition = new ScenarioProgressionTransition
        {
            Id = "TRA-1", DefinitionVersionId = definition.Id, SourceNodeId = sourceNode.Id,
            SignalCode = "ok", TriggerDescription = "Outcome ok", TargetNodeId = targetNode.Id,
        };
        db.AddRange(scenario, definition, sourceNode, targetNode, transition);
        await db.SaveChangesAsync();
        var session = Session.Create("SES-1", "owner", scenario.Id, definition.Id, null, null, null, "Hero", false,
            new SessionState { SessionId = "SES-1", FlagsJson = "{}", UpdatedAt = Now }, Now);
        session.Progress = SessionProgressState.Start(session.Id, sourceNode.Id, Now);
        session.Progress.CurrentNode = sourceNode;
        db.Sessions.Add(session);
        db.SessionProgressionModuleSnapshots.Add(new SessionProgressionModuleSnapshot
        {
            Id = "PMS-1", SessionId = session.Id, TransitionId = transition.Id,
            ModuleId = "next-module", ModuleVersion = "1", ModuleDigest = new string('c', 64),
            ConfigurationJson = "{}", ContextJson = "{}", RandomValueCount = 0, CreatedAt = Now,
        });
        await db.SaveChangesAsync();

        var module = NewModuleExecution();
        module.CompleteInitialization(new(ModuleExecutionStatuses.Completed, Parse("{}"), Parse("{\"public\":true}"), [], Outcome: Outcome()), Json, Now);
        db.ModuleExecutions.Add(module);
        await db.SaveChangesAsync();

        var source = session.AppendModuleTurn("TRN-MODULE", module, Now.AddSeconds(1));
        module.AttachSessionTurn(source.Id);
        await db.SaveChangesAsync();
        db.SessionExecutions.Add(new SessionExecution
        {
            Id = "EXE-1", SessionId = session.Id, Kind = SessionExecutionKind.ModuleHandoff,
            TriggerType = SessionExecutionTriggerType.ModuleOutcome, TriggerId = source.Id,
            Status = SessionExecutionStatus.Running, Revision = 1, IdempotencyKey = "module-handoff:MEX-1",
            PayloadHash = new string('b', 64), NarrativeAiProfileId = "narrative-default",
            AcceptedHeadTurnId = source.Id, AcceptedSessionRevision = session.Revision,
            LeaseToken = "lease", LeaseOwner = "worker", LeaseExpiresAt = Now.AddMinutes(5),
            CreatedAt = Now, QueuedAt = Now, StartedAt = Now,
        });
        db.SessionExecutionAttempts.Add(SessionExecutionAttempt.Start("ATT-1", "EXE-1", 1, "worker", Now));
        await db.SaveChangesAsync();
    }

    private static ModuleHandoffExecutionOrchestrator Orchestrator(IModuleHandoffSourceSnapshotQuery source,
        IModuleHandoffNarrativeService narrative, IModuleHandoffPublishUnitOfWork publisher, IProgressionReceiptCommand progression) =>
        new(source, new ModuleHandoffCausalityValidator(), new ModuleHandoffNarrativeRequestBuilder(), narrative,
            publisher, progression, NullLogger<ModuleHandoffExecutionOrchestrator>.Instance);

    private static SessionExecutionContext Context() => new("EXE-1", "lease", 1, "ATT-1", 1);

    private static ModuleHandoffSourceSnapshot Source() => new(
        "EXE-1", "SES-1", "owner", SessionExecutionTriggerType.ModuleOutcome, "TRN-MODULE",
        "module-handoff:MEX-1", "TRN-MODULE", 1, "narrative-default", "TRN-MODULE", "SES-1",
        SessionTurnKind.Module, "MEX-1", ModuleExecutionStatus.Completed,
        JsonSerializer.Serialize(Outcome(), Json), "{\"public\":true}", null, null,
        "TRN-MODULE", 1, 3, "{\"flag\":true}", "DEF-1", "Title", "Summary",
        "Genre", "Tone", "Lore", "Freedom", "Hero", "Opening",
        [new NarrativeEntityInput("hero", "Hero", "Public appearance")], null);

    private static ModuleExecution NewModuleExecution() => new()
    {
        Id = "MEX-1", OwnerId = "owner", ModuleId = "module", ModuleVersion = "1",
        ModuleDigest = new string('a', 64), ContractVersion = "1", ConfigurationJson = "{}",
        ContextJson = "{}", CreatedAt = Now, UpdatedAt = Now,
    };

    private static ModuleOutcome Outcome() => new("result", "ok", "Done", "Done", [], [], [], []);
    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
    private static string AddEffects(string json) => json.TrimEnd('}') + ",\"effects\":[{\"type\":\"flag\",\"payload\":{}}]}";

    private static void AssertUnique(Microsoft.EntityFrameworkCore.Metadata.IEntityType type, params string[] properties) =>
        Assert.Contains(type.GetIndexes(), index => index.IsUnique && index.Properties.Select(property => property.Name).SequenceEqual(properties));

    private sealed class FakeEnqueuePort : IModuleHandoffEnqueuePort
    {
        public string? ProfileId { get; private set; }
        public Task<EnqueueModuleHandoffOutcome> EnqueueAsync(ModuleExecution execution, string narrativeAiProfileId, CancellationToken cancellationToken)
        { ProfileId = narrativeAiProfileId; return Task.FromResult(EnqueueModuleHandoffOutcome.Enqueued); }
    }

    private sealed class FakeProfiles : IAiProfileCatalog
    {
        public Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken cancellationToken) => Task.FromResult("narrative-default");
        public Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<AiProfileDescriptor> ResolveAsync(string profileId, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class FakeSourceQuery(ModuleHandoffSourceSnapshot? source) : IModuleHandoffSourceSnapshotQuery
    {
        public Task<ModuleHandoffSourceSnapshot?> LoadAsync(SessionExecutionContext context, CancellationToken cancellationToken) => Task.FromResult(source);
    }

    private sealed class FakeNarrativeService : IModuleHandoffNarrativeService
    {
        public int Calls { get; private set; }
        public Task<ModuleHandoffGenerationResult> GenerateAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context,
            NarrativeHandoffRequest request, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(new ModuleHandoffGenerationResult(request,
                new NarrativeGeneration<string>("body", new AiGenerationMetadata("mock", "model", "response", 1, 2, 3, 1, "stop"))));
        }
    }

    private sealed class FakePublisher(ModuleHandoffPublishResult? result = null) : IModuleHandoffPublishUnitOfWork
    {
        public int Calls { get; private set; }
        public Task<ModuleHandoffPublishResult> PublishAsync(SessionExecutionContext context, ModuleHandoffGenerationResult narrative,
            CancellationToken cancellationToken)
        { Calls++; return Task.FromResult(result ?? new(ModuleHandoffPublishOutcome.Published, "owner", "TRN-NARRATIVE")); }
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class FakeProgression : IProgressionReceiptCommand
    {
        public int ForTurnCalls { get; private set; }
        public string? LastTurnId { get; private set; }
        public Task ExecuteForNarrativeTurnAsync(string ownerId, string narrativeTurnId, CancellationToken cancellationToken)
        { ForTurnCalls++; LastTurnId = narrativeTurnId; return Task.CompletedTask; }
        public Task ExecuteAsync(string ownerId, string receiptId, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
