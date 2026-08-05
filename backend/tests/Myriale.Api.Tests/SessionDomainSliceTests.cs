using Microsoft.Extensions.Options;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Infrastructure.Composition.Sessions;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class SessionAggregateTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void AggregateOwnsEveryTurnKindAndAdvancesHeadPositionPreviousAndRevision()
    {
        var session = Create();
        var opening = session.AppendOpeningTurn(new SessionTurnId("TRN-1"), "opening.v1", "Opening", "Start", Now);
        Assert.Equal((1, 1L, (SessionTurnId?)null), (opening.Position, session.Revision, opening.PreviousTurnId));

        var input = session.AcceptInput(new SessionPlayerInputId("INP-1"), "req-1", "look", SessionInputInteractionType.Dialogue,
            new string('a', 64), new AccountId("USR-1"), null, Now.AddSeconds(1));
        Assert.Equal(1, input.AcceptedSessionRevision);
        Assert.Equal(opening.Id, input.AcceptedAfterTurnId);

        var narrative = session.AppendScenarioNarrative(new SessionTurnId("TRN-2"), input.Id, "action.v1", "context.v1", "prompt.v1",
            "Result", "Done", null, 2, SessionTurnAiMetadata.None, Now.AddSeconds(2));
        Assert.Equal((2, opening.Id, 3L), (narrative.Position, narrative.PreviousTurnId, session.Revision));
        Assert.Equal(SessionTurnType.ActionResult, narrative.DialogueTurnType);

        var module = session.AppendModuleTurn(new SessionTurnId("TRN-3"), Now.AddSeconds(3));
        Assert.Equal((3, narrative.Id, 4L), (module.Position, module.PreviousTurnId, session.Revision));
        Assert.Equal(SessionTurnKind.Module, module.Kind);

        var handoff = session.AppendModuleHandoffNarrative(new SessionTurnId("TRN-4"), module.Id, "handoff.v1", "Handoff", "Outcome", 4,
            SessionTurnAiMetadata.None, Now.AddSeconds(4));
        Assert.Equal((4, module.Id, 5L), (handoff.Position, handoff.PreviousTurnId, session.Revision));
        Assert.Equal(SessionTurnType.ModuleHandoff, handoff.DialogueTurnType);
        Assert.Equal(handoff.Id, session.HeadTurnId);
    }

    [Fact]
    public void FactoriesRejectInvalidCausalityAndCompletedSessionRejectsChanges()
    {
        Assert.Throws<InvalidOperationException>(() => SessionTurn.CreateScenarioNarrative(new SessionTurnId("TRN"), new SessionId("SES"), 2, null, new SessionPlayerInputId("INP"), "v1", null, null, null, "body", null, 1, SessionTurnAiMetadata.None, Now));
        Assert.Throws<InvalidOperationException>(() => SessionTurn.CreateModuleHandoff(new SessionTurnId("TRN"), new SessionId("SES"), 2, new SessionTurnId("TRN-A"), new SessionTurnId("TRN-B"), "v1", null, "body", 1, SessionTurnAiMetadata.None, Now));

        var session = Create();
        session.AppendOpeningTurn(new SessionTurnId("TRN-1"), "opening.v1", "Opening", "Start", Now);
        session.Complete(Now.AddSeconds(1));
        Assert.Throws<InvalidOperationException>(() => session.AcceptInput(new SessionPlayerInputId("INP"), "req", "text", SessionInputInteractionType.Dialogue, new string('a', 64), new AccountId("USR-1"), null, Now));
        Assert.Throws<InvalidOperationException>(() => session.AppendModuleTurn(new SessionTurnId("TRN-2"), Now));
    }

    private static Session Create() => Session.Create(new SessionId("SES-1"), new AccountId("USR-1"), new ScenarioId("SCN-1"), new ScenarioDefinitionVersionId("DEF-1"), new ScenarioLocationId("LOC-1"), "create-1", new string('b', 64),
        "Hero", false, new SessionState { SessionId = new SessionId("SES-1"), FlagsJson = "{}", UpdatedAt = Now }, Now);
}

public sealed class SessionCommandTests
{
    [Fact]
    public async Task InputAcceptanceIsAtomicReplaySafeAndNormalizesConcurrency()
    {
        var repository = new FakeInputRepository(CreateSession());
        var useCase = new AcceptSessionInputUseCase(repository, Options.Create(new AiProviderOptions { SessionRequestsPerMinute = 10, MaxAttempts = 2 }), new FakeProfiles(), TimeProvider.System);
        var command = new AcceptSessionInputCommand(new AccountId("USR-1"), new SessionId("SES-1"), "request-1", "  open door  ", "dialogue", null, null, null);

        var accepted = await useCase.ExecuteAsync(command, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.Accepted, accepted.Outcome);
        Assert.True(repository.AtomicCommitObserved);
        Assert.Equal(accepted.Input!.Id.AsPrimitive(), accepted.Execution!.TriggerId.AsPrimitive());

        var replay = await useCase.ExecuteAsync(command, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.Replay, replay.Outcome);
        Assert.Equal(accepted.Execution.Id, replay.Execution!.Id);

        var changed = await useCase.ExecuteAsync(command with { Text = "different" }, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.Conflict, changed.Outcome);
        Assert.Equal("idempotency_key_reused", changed.ErrorCode);

        repository.CommitOutcome = SessionRepositoryCommitOutcome.ConcurrencyConflict;
        var concurrent = await useCase.ExecuteAsync(command with { RequestId = "request-2" }, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.RetryableConflict, concurrent.Outcome);
        Assert.Equal("session_revision_conflict", concurrent.ErrorCode);
    }

    [Fact]
    public async Task CreationReplaysCanonicalRequestAndConflictsOnChangedPayload()
    {
        var now = DateTimeOffset.UtcNow;
        var definition = ScenarioDefinitionVersion.CreateDraft(new ScenarioDefinitionVersionId("DEF-1"), new ScenarioId("SCN-1"), 1, now);
        definition.ScenarioTitle = new("Title"); definition.ScenarioHero = "Hero"; definition.ScenarioOpening = "Opening"; definition.StartLocationCode = "start";
        var location = new ScenarioLocation { Id = new ScenarioLocationId("LOC-1"), DefinitionVersionId = definition.Id, Code = "start" };
        definition.Locations.Add(location);
        var repository = new FakeCreationRepository(new SessionCreationSource(false, definition, location, null, []));
        var useCase = new CreateSessionUseCase(repository, new EmptyModulePackageCatalog(), new ScenarioRuleConfigurationResolver(), TimeProvider.System);
        var command = new CreateSessionCommand(new AccountId("USR-1"), new ScenarioId("SCN-1"), "create-request", false, null);

        var created = await useCase.ExecuteAsync(command, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.Created, created.Outcome);
        var replay = await useCase.ExecuteAsync(command, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.Replay, replay.Outcome);
        Assert.Equal(created.SessionId, replay.SessionId);
        var conflict = await useCase.ExecuteAsync(command with { SelectedHero = "Other" }, CancellationToken.None);
        Assert.Equal(SessionCommandOutcome.Conflict, conflict.Outcome);
    }

    private static Session CreateSession() => Session.Create(new SessionId("SES-1"), new AccountId("USR-1"), new ScenarioId("SCN-1"), new ScenarioDefinitionVersionId("DEF-1"), new ScenarioLocationId("LOC-1"), null, null, "Hero", false,
        new SessionState { SessionId = new SessionId("SES-1"), FlagsJson = "{}", UpdatedAt = DateTimeOffset.UtcNow }, DateTimeOffset.UtcNow);

    private sealed class FakeInputRepository(Session session) : ISessionInputAcceptanceRepository
    {
        private readonly Dictionary<string, (SessionPlayerInput, SessionExecution)> replays = [];
        public SessionRepositoryCommitOutcome CommitOutcome { get; set; } = SessionRepositoryCommitOutcome.Committed;
        public bool AtomicCommitObserved { get; private set; }
        public Task<Session?> LoadOwnedAsync(AccountId ownerId, SessionId sessionId, CancellationToken ct) => Task.FromResult<Session?>(session.OwnerId == ownerId && session.Id == sessionId ? session : null);
        public Task<(SessionPlayerInput Input, SessionExecution Execution)?> FindReplayAsync(SessionId sessionId, string requestId, CancellationToken ct) =>
            Task.FromResult(replays.TryGetValue(requestId, out var value) ? ((SessionPlayerInput, SessionExecution)?)value : null);
        public Task<bool> HasBlockingModuleHeadAsync(SessionId sessionId, SessionTurnId? headTurnId, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> IsModuleHandoffPendingAsync(SessionId sessionId, SessionTurnId? headTurnId, CancellationToken ct) => Task.FromResult(false);
        public Task<int> CountRecentInputsAsync(SessionId sessionId, DateTimeOffset cutoff, CancellationToken ct) => Task.FromResult(0);
        public Task<SessionRepositoryCommitOutcome> CommitInputAsync(Session aggregate, SessionExecution execution, CancellationToken ct)
        {
            var input = aggregate.PlayerInputs.Single(x => x.Id.AsPrimitive() == execution.TriggerId.AsPrimitive());
            AtomicCommitObserved = input.SessionId == execution.SessionId;
            if (CommitOutcome == SessionRepositoryCommitOutcome.Committed) replays[input.RequestId] = (input, execution);
            return Task.FromResult(CommitOutcome);
        }
        public void ClearTracking() { }
    }

    private sealed class FakeCreationRepository(SessionCreationSource source) : ISessionCreationRepository
    {
        private Session? replay;
        public Task<Session?> FindReplayAsync(AccountId ownerId, string requestId, CancellationToken ct) => Task.FromResult(replay?.OwnerId == ownerId && replay.CreationRequestId == requestId ? replay : null);
        public Task<SessionCreationSourceResult> LoadSourceAsync(AccountId ownerId, ScenarioId scenarioId, CancellationToken ct) => Task.FromResult(new SessionCreationSourceResult(SessionCreationSourceOutcome.Found, source));
        public Task<SessionRepositoryCommitOutcome> CommitCreationAsync(Session session, CancellationToken ct) { replay = session; return Task.FromResult(SessionRepositoryCommitOutcome.Committed); }
        public void ClearTracking() { }
    }

    private sealed class EmptyModulePackageCatalog : IModulePackageCatalog
    {
        public Task<IReadOnlyList<ModulePackageSnapshot>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<ModulePackageSnapshot>>([]);
        public Task<ModulePackageSnapshot?> GetAsync(ModulePackageDigest digest, CancellationToken ct) => Task.FromResult<ModulePackageSnapshot?>(null);
        public Task<ModulePackageResolution> ResolveAsync(ModulePackageModuleId moduleId, ModulePackageVersion version, ModulePackageDigest digest, CancellationToken ct) =>
            Task.FromResult(new ModulePackageResolution(ModulePackageAvailability.NotFound));
    }

    private sealed class FakeProfiles : IAiProfileCatalog
    {
        public Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) =>
            Task.FromResult(requested ?? new AiProviderProfileId("action"));
        public Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) =>
            Task.FromResult(requested ?? new AiProviderProfileId("narrative"));
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId profileId, CancellationToken ct) => throw new NotSupportedException();
    }
}

public sealed class SessionArchitectureTests
{
    [Fact]
    public void EndpointsHaveNoDbContextAndLegacyTypesAreAbsent()
    {
        var handlers = typeof(SessionEndpoints).GetMethods(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.All(handlers, method => Assert.DoesNotContain(method.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext)));
        var assembly = typeof(Session).Assembly;
        Assert.Null(assembly.GetType("Myriale.Api.Services.SessionInputService"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.SessionInputAcceptanceResult"));
        Assert.Null(assembly.GetType("Myriale.Api.Contracts.NarrativeInteractionTypes"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.PlaySessionListingService"));
        Assert.Null(typeof(CreateSessionInputRequest).GetProperty("RequestedOutputs"));
    }

    [Theory]
    [InlineData(typeof(Session), nameof(Session.Status))]
    [InlineData(typeof(Session), nameof(Session.HeadTurnId))]
    [InlineData(typeof(Session), nameof(Session.Revision))]
    [InlineData(typeof(SessionTurn), nameof(SessionTurn.Kind))]
    [InlineData(typeof(SessionTurn), nameof(SessionTurn.Position))]
    [InlineData(typeof(SessionPlayerInput), nameof(SessionPlayerInput.Text))]
    [InlineData(typeof(SessionPlayerInput), nameof(SessionPlayerInput.InteractionType))]
    public void LifecycleAndFactsHaveNoPublicSetter(Type type, string propertyName)
    {
        Assert.False(type.GetProperty(propertyName)!.SetMethod?.IsPublic ?? false);
    }
}
