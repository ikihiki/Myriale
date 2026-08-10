using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Myriale.Api.Features.Evaluations.Infrastructure.Hosting;
using Myriale.Api.Infrastructure.Composition.Evaluations;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class EvaluationExecutionReliabilityTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task HeartbeatExtendsLeaseAndPreventsEarlyReclaim()
    {
        await using var fixture = await EvaluationFixture.CreateAsync(attemptCount: 1);
        var time = new MutableTimeProvider(fixture.Now);
        EvaluationClaim first;
        await using (var db = fixture.CreateContext())
        {
            first = (await Service(db, time).ClaimAsync("worker-a", TimeSpan.FromMinutes(2), default))!;
            Assert.NotNull(first);
        }

        time.Advance(TimeSpan.FromMinutes(1));
        await using (var db = fixture.CreateContext())
        {
            Assert.True(await Service(db, time).HeartbeatAsync(first, TimeSpan.FromMinutes(2), default));
        }

        time.Advance(TimeSpan.FromSeconds(90));
        await using (var db = fixture.CreateContext())
        {
            Assert.Null(await Service(db, time).ClaimAsync("worker-b", TimeSpan.FromMinutes(2), default));
        }

        time.Advance(TimeSpan.FromSeconds(31));
        await using var reclaimDb = fixture.CreateContext();
        var reclaimed = await Service(reclaimDb, time).ClaimAsync("worker-b", TimeSpan.FromMinutes(2), default);
        Assert.NotNull(reclaimed);
        Assert.NotEqual(first.LeaseToken, reclaimed.LeaseToken);
        var expired = await reclaimDb.EvaluationModelInvocations.SingleAsync(x => x.Id == first.InvocationId);
        Assert.Equal(EvaluationInvocationStatus.UnknownOutcome, expired.Status);
        Assert.Equal("lease_expired", expired.ErrorCode);
        Assert.NotNull(expired.ExpiredAt);
    }

    [Fact]
    public async Task ClaimBatchesGiveWorkersDistinctAttemptsAndPersistInvocationsBeforeCalls()
    {
        await using var fixture = await EvaluationFixture.CreateAsync(attemptCount: 4);
        var time = new MutableTimeProvider(fixture.Now);
        IReadOnlyList<EvaluationClaim> first;
        IReadOnlyList<EvaluationClaim> second;
        await using (var db = fixture.CreateContext())
        {
            first = await Service(db, time).ClaimBatchAsync("worker-a", 2, TimeSpan.FromMinutes(2), default);
        }
        await using (var db = fixture.CreateContext())
        {
            second = await Service(db, time).ClaimBatchAsync("worker-b", 2, TimeSpan.FromMinutes(2), default);
        }

        Assert.Equal(2, first.Count);
        Assert.Equal(2, second.Count);
        Assert.Empty(first.Select(x => x.AttemptId).Intersect(second.Select(x => x.AttemptId)));
        await using var verification = fixture.CreateContext();
        var invocations = await verification.EvaluationModelInvocations.AsNoTracking().ToListAsync();
        Assert.Equal(4, invocations.Count);
        Assert.All(invocations, invocation => Assert.Equal(EvaluationInvocationStatus.Started, invocation.Status));
    }

    [Fact]
    public async Task StaleSuccessFinalizerOnlyAuditsUnknownOutcomeAndCannotWinFence()
    {
        await using var fixture = await EvaluationFixture.CreateAsync(attemptCount: 1);
        var time = new MutableTimeProvider(fixture.Now);
        EvaluationClaim first;
        await using (var db = fixture.CreateContext())
        {
            first = (await Service(db, time).ClaimAsync("worker-a", TimeSpan.FromMinutes(1), default))!;
            Assert.NotNull(first);
        }
        time.Advance(TimeSpan.FromSeconds(61));
        EvaluationClaim second;
        await using (var db = fixture.CreateContext())
        {
            second = (await Service(db, time).ClaimAsync("worker-b", TimeSpan.FromMinutes(1), default))!;
            Assert.NotNull(second);
        }

        await using (var staleDb = fixture.CreateContext())
        {
            Assert.False(await Service(staleDb, time).CompleteSuccessAsync(first, Generation("old-response"), new PassingJudge(), default));
        }

        await using (var verification = fixture.CreateContext())
        {
            var attempt = await verification.EvaluationAttempts.AsNoTracking().SingleAsync();
            Assert.Equal(EvaluationAttemptStatus.Running, attempt.Status);
            Assert.Equal(second.LeaseToken, attempt.LeaseToken);
            var oldInvocation = await verification.EvaluationModelInvocations.AsNoTracking().SingleAsync(x => x.Id == first.InvocationId);
            Assert.Equal(EvaluationInvocationStatus.UnknownOutcome, oldInvocation.Status);
            Assert.Equal("old-response", oldInvocation.ProviderRequestId);
            Assert.NotNull(oldInvocation.RawResponse);
            Assert.Empty(await verification.EvaluationMachineJudgments.AsNoTracking().ToListAsync());
        }

        await using (var winnerDb = fixture.CreateContext())
        {
            Assert.True(await Service(winnerDb, time).CompleteSuccessAsync(second, Generation("winner-response"), new PassingJudge(), default));
        }
        await using var finalVerification = fixture.CreateContext();
        Assert.Equal(EvaluationAttemptStatus.Succeeded, (await finalVerification.EvaluationAttempts.AsNoTracking().SingleAsync()).Status);
        Assert.Single(await finalVerification.EvaluationMachineJudgments.AsNoTracking().ToListAsync());
        Assert.Single(await finalVerification.EvaluationModelInvocations.AsNoTracking().Where(x => x.Status == EvaluationInvocationStatus.Succeeded).ToListAsync());
    }

    [Fact]
    public async Task WorkerHeartbeatsLongProviderCallAndInvocationIsDurableBeforeProviderReturns()
    {
        await using var fixture = await EvaluationFixture.CreateAsync(attemptCount: 1);
        var ai = new BlockingAi();
        var time = new MutableTimeProvider(fixture.Now);
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(fixture.ConnectionString));
        services.AddSingleton<TimeProvider>(time);
        services.AddSingleton<IAiProfileCatalog>(new TestProfiles());
        services.AddSingleton<IScenarioTurnAiService>(ai);
        services.AddSingleton<IEvaluationMachineJudge>(new PassingJudge());
        services.AddScoped<EvaluationSessionService>();
        await using var provider = services.BuildServiceProvider();

        EvaluationClaim claim;
        await using (var scope = provider.CreateAsyncScope())
        {
            claim = (await scope.ServiceProvider.GetRequiredService<EvaluationSessionService>()
                .ClaimAsync("worker-a", TimeSpan.FromSeconds(3), default))!;
            Assert.NotNull(claim);
        }
        DateTimeOffset initialExpiry;
        await using (var initialDb = fixture.CreateContext())
        {
            initialExpiry = (await initialDb.EvaluationAttempts.AsNoTracking().SingleAsync()).LeaseExpiresAt!.Value;
        }
        var worker = new EvaluationExecutionWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new EvaluationWorkerSettings { LeaseSeconds = 3, ClaimBatchSize = 1 },
            time,
            NullLogger<EvaluationExecutionWorker>.Instance);
        var run = worker.RunAsync(claim, CancellationToken.None);
        await ai.Started.Task.WaitAsync(TimeSpan.FromSeconds(2));

        await using (var durableDb = fixture.CreateContext())
        {
            var invocation = await durableDb.EvaluationModelInvocations.AsNoTracking().SingleAsync(x => x.Id == claim.InvocationId);
            Assert.Equal(EvaluationInvocationStatus.Started, invocation.Status);
            Assert.Equal(claim.LeaseToken, invocation.LeaseToken);
        }

        time.Advance(TimeSpan.FromSeconds(2));
        var renewedExpiry = DateTimeOffset.MinValue;
        for (var attempt = 0; attempt < 100 && renewedExpiry <= initialExpiry; attempt++)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(100));
            await using var heartbeatDb = fixture.CreateContext();
            renewedExpiry = (await heartbeatDb.EvaluationAttempts.AsNoTracking().SingleAsync()).LeaseExpiresAt!.Value;
        }
        Assert.True(renewedExpiry > initialExpiry);
        time.Advance(TimeSpan.FromMilliseconds(1_200));
        Assert.True(time.GetUtcNow() > initialExpiry);
        Assert.True(time.GetUtcNow() < renewedExpiry);
        await using (var contenderDb = fixture.CreateContext())
        {
            Assert.Null(await Service(contenderDb, time).ClaimAsync("worker-b", TimeSpan.FromSeconds(3), default));
        }

        ai.Release.TrySetResult();
        await run.WaitAsync(TimeSpan.FromSeconds(3));
        await using var finalDb = fixture.CreateContext();
        Assert.Equal(EvaluationAttemptStatus.Succeeded, (await finalDb.EvaluationAttempts.AsNoTracking().SingleAsync()).Status);
        Assert.Equal(EvaluationInvocationStatus.Succeeded, (await finalDb.EvaluationModelInvocations.AsNoTracking().SingleAsync()).Status);
    }

    private static EvaluationSessionService Service(ApplicationDbContext db, TimeProvider time) => new(db, new TestProfiles(), time);

    private static NarrativeGeneration<ModelActionDecisionResult> Generation(string responseId) => new(
        new(ScenarioTurnSchemas.ModelActionDecisionResult, "system:clarify", Element("{}")),
        new(new AiProviderProfileId("profile-a"), "model-a", responseId, 10, 5, 12, 1, "stop"),
        "prompt",
        "{\"schemaVersion\":\"model-action-decision-result.v3\",\"selectionCode\":\"system:clarify\",\"arguments\":{}}");

    private static ModelActionDecisionRequest ActionRequest() => new(
        ScenarioTurnSchemas.ModelActionDecisionRequest,
        "open",
        new(new("room", "Room", ""), []),
        [],
        [new("system:clarify", "clarify", "Clarify", "", Element("{}"))]);

    private static JsonElement Element(string json) => JsonDocument.Parse(json).RootElement.Clone();

    private sealed class PassingJudge : IEvaluationMachineJudge
    {
        public string Key => "test-judge";
        public string Version => "1";
        public EvaluationScore Judge(EvaluationStage stage, string requestJson, string outputJson, string expectationsJson) =>
            new(true, ["pass"], Score: 1, Confidence: 1);
    }

    private sealed class TestProfiles : IAiProfileCatalog
    {
        private static readonly AiProfileDescriptor Profile = new(
            new("profile-a"), "Profile A", "http://test", "model-a", new("credential"), true, AiProfileDefinitionSource.Deployment, 1);
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) => Task.FromResult(
            new AiProfileCatalogSnapshot(new Dictionary<AiProviderProfileId, AiProfileDescriptor> { [Profile.Id] = Profile }, Profile.Id, Profile.Id));
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId id, CancellationToken ct) => Task.FromResult(Profile);
        public Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? id, CancellationToken ct) => Task.FromResult(id ?? Profile.Id);
        public Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? id, CancellationToken ct) => Task.FromResult(id ?? Profile.Id);
    }

    private sealed class BlockingAi : IScenarioTurnAiService
    {
        public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public async Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(
            AiProviderProfileId id,
            ModelActionDecisionRequest request,
            CancellationToken ct)
        {
            Started.TrySetResult();
            await Release.Task.WaitAsync(ct);
            return Generation("worker-response");
        }

        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken ct) =>
            DecideActionForProfileAsync(new("profile-a"), request, ct);
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken ct) =>
            throw new NotSupportedException();
    }

    private sealed class MutableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset current = now;
        public override DateTimeOffset GetUtcNow() => current;
        public void Advance(TimeSpan duration) => current = current.Add(duration);
    }

    private sealed class EvaluationFixture(string path, DateTimeOffset now) : IAsyncDisposable
    {
        public string ConnectionString { get; } = $"Data Source={path};Default Timeout=10";
        public DateTimeOffset Now { get; } = now;

        public static async Task<EvaluationFixture> CreateAsync(int attemptCount)
        {
            var path = Path.Combine(Path.GetTempPath(), $"myriale-evaluation-reliability-{Guid.NewGuid():N}.db");
            var now = new DateTimeOffset(2026, 8, 10, 12, 0, 0, TimeSpan.Zero);
            var fixture = new EvaluationFixture(path, now);
            await using var db = fixture.CreateContext();
            await db.Database.EnsureCreatedAsync();
            var sessionId = new EvaluationSessionId("EVS-RELIABILITY");
            var situationId = new EvaluationSituationId("EVQ-RELIABILITY");
            var candidateId = new EvaluationCandidateId("EVC-RELIABILITY");
            var requestJson = JsonSerializer.Serialize(ActionRequest(), Json);
            db.EvaluationSessions.Add(new EvaluationSession
            {
                Id = sessionId,
                OwnerId = new AccountId("USR-1"),
                CreatedById = new AccountId("USR-1"),
                Title = "Reliability",
                Status = EvaluationSessionStatus.Queued,
                PlannedAttemptCount = attemptCount,
                CreatedAt = now,
                QueuedAt = now,
            });
            db.EvaluationSituations.Add(new EvaluationSituation
            {
                Id = situationId,
                SessionId = sessionId,
                StableKey = "action-case",
                Stage = EvaluationStage.Action,
                SourceKind = EvaluationSituationSourceKind.Fixture,
                RequestJson = requestJson,
                ExpectationsJson = "{}",
                RequestHash = new string('a', 64),
                SourceBundleHash = new string('b', 64),
                ImportedById = new AccountId("USR-1"),
                ImportedAt = now,
            });
            db.EvaluationCandidates.Add(new EvaluationCandidate
            {
                Id = candidateId,
                SessionId = sessionId,
                CandidateKey = "candidate-a",
                BlindCode = "C-TEST",
                ProfileId = new AiProviderProfileId("profile-a"),
                Provider = "profile-a",
                Adapter = "openai-compatible",
                Model = "model-a",
                ProfileDescriptorJson = "{}",
                ProfileDescriptorHash = new string('c', 64),
                GenerationOverridesJson = "{}",
                RetryPolicyJson = "{}",
                Repetitions = attemptCount,
                MaxInvocations = 3,
            });
            for (var index = 1; index <= attemptCount; index++)
            {
                db.EvaluationAttempts.Add(new EvaluationAttempt
                {
                    Id = new EvaluationAttemptId($"EVA-RELIABILITY-{index}"),
                    SessionId = sessionId,
                    SituationId = situationId,
                    CandidateId = candidateId,
                    Repetition = index,
                    Status = EvaluationAttemptStatus.Queued,
                    CreatedAt = now.AddMilliseconds(index),
                });
            }
            await db.SaveChangesAsync();
            return fixture;
        }

        public ApplicationDbContext CreateContext() => new(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(ConnectionString).Options);

        public ValueTask DisposeAsync()
        {
            var path = new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(ConnectionString).DataSource;
            if (File.Exists(path)) File.Delete(path);
            return ValueTask.CompletedTask;
        }
    }
}
