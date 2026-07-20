using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules;
using Myriale.Api.Modules.Runtime;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionNarrativeTurnEndpointTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-narrative-tests-{Guid.NewGuid():N}");
    private readonly CapturingNarrativeGenerator _generator = new();
    private readonly WebApplicationFactory<Program> _factory;
    private ModulePackageIdentity? _identity;

    public SessionNarrativeTurnEndpointTests()
    {
        Directory.CreateDirectory(_root);
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={Path.Combine(_root, "myriale.db")}");
            builder.UseSetting("Modules:StoragePath", Path.Combine(_root, "modules"));
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<INarrativeGenerator>();
                services.AddSingleton<INarrativeGenerator>(_generator);
            });
        });
    }

    [Fact]
    public async Task CompletedDispatchAutomaticallyCreatesNarrativeFromPublicAppliedOutcome()
    {
        var client = await AuthenticatedClientAsync("automatic-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "automatic-init");

        _generator.OnGenerate = async () =>
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal("completed", (await db.ModuleExecutions.SingleAsync()).Status);
            Assert.Equal(1, await db.ModuleOutcomeApplications.CountAsync());
            Assert.Equal("pending", (await db.SessionNarrativeHandoffs.SingleAsync()).Status);
        };
        using var completed = await CompleteAsync(client, executionId, "automatic-complete");
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        Assert.Equal("completed", (await completed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());

        var request = Assert.Single(_generator.Requests);
        Assert.Equal("星喰いの地下図書館", request.Scenario.Title);
        Assert.Equal("complete", request.Outcome.Code);
        Assert.Equal("The module completed.", request.Outcome.PublicFacts[0].Text);
        Assert.Equal("completed", request.Outcome.EmittedEvents[0].Type);
        Assert.True(request.FinalPublicModuleState.GetProperty("completed").GetBoolean());
        Assert.Equal(1, request.SessionState.Revision);
        Assert.True(request.SessionState.Flags["module-completed"]);
        var projected = JsonSerializer.Serialize(request);
        Assert.DoesNotContain("configuration", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("context", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("randomValues", projected, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("stateJson", projected, StringComparison.OrdinalIgnoreCase);

        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        var module = session.GetProperty("turns")[0];
        var narrative = session.GetProperty("turns")[1];
        Assert.Equal("completed", module.GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal(1, await GetHandoffAttemptsAsync());
        Assert.Equal("narrative", narrative.GetProperty("kind").GetString());
        Assert.Equal(module.GetProperty("id").GetString(), narrative.GetProperty("narrative").GetProperty("sourceModuleTurnId").GetString());
    }

    [Fact]
    public async Task ImmediateCompletionAutomaticallyCreatesNarrative()
    {
        var client = await AuthenticatedClientAsync("immediate-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/module-turns",
            InitializeBody("immediate-complete", new { completeOnInitialize = true }));

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal("completed", (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("status").GetString());
        Assert.Single(_generator.Requests);
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        Assert.Equal("narrative", session.GetProperty("turns")[1].GetProperty("kind").GetString());
    }

    [Fact]
    public async Task GenerationFailureKeepsModuleCompletionAndMatchingReplayRetriesAutomatically()
    {
        var client = await AuthenticatedClientAsync("narrative-retry@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "retry-init");
        var body = DispatchBody("retry-complete");
        _generator.Fail = true;

        using var completed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        var failedSession = await GetSessionAsync(client, sessionId);
        Assert.Equal(1, failedSession.GetProperty("turns").GetArrayLength());
        Assert.Equal("failed", failedSession.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal("narrative_generation_failed", failedSession.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("errorCode").GetString());

        _generator.Fail = false;
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var recovered = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, recovered.GetProperty("turns").GetArrayLength());
        Assert.Equal("completed", recovered.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal(2, await GetHandoffAttemptsAsync());
    }

    [Fact]
    public async Task NarrativeTurnPersistsPlayerInputAndReplaysIdempotently()
    {
        var client = await AuthenticatedClientAsync("dialogue-persist@example.test");
        var sessionId = await CreateSessionAsync(client);
        var body = new { requestId = "dialogue-1", input = "銀の鍵を掲げて扉へ進む" };

        using var first = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var firstJson = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("narrative", firstJson.GetProperty("kind").GetString());
        Assert.Equal(body.input, firstJson.GetProperty("narrative").GetProperty("playerInput").GetString());

        using var replay = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayJson = await replay.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(firstJson.GetProperty("id").GetString(), replayJson.GetProperty("id").GetString());
        Assert.Equal(1, await CountNarrativeTurnsAsync());
    }

    [Fact]
    public async Task PlayerInputIsImmutableEventAndPendingIsDerivedFromSessionHead()
    {
        var client = await AuthenticatedClientAsync("dialogue-event@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.PauseDialogue = true;
        var request = client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-event", input = "扉の前で立ち止まる" });
        await _generator.DialogueEntered.Task.WaitAsync(TimeSpan.FromSeconds(5));

        string inputId;
        await using (var pendingScope = _factory.Services.CreateAsyncScope())
        {
            var db = pendingScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var input = await db.SessionPlayerInputs.AsNoTracking().SingleAsync();
            var session = await db.Sessions.AsNoTracking().SingleAsync();
            inputId = input.Id;
            Assert.Null(input.AcceptedAfterTurnId);
            Assert.Null(session.HeadTurnId);
            Assert.False(await db.SessionTurns.AnyAsync(turn => turn.PlayerInputId == input.Id));
            Assert.Equal("pending", (await db.SessionPlayerInputWorks.AsNoTracking().SingleAsync()).Status);
        }

        _generator.DialogueRelease.TrySetResult();
        using var completed = await request;
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        var created = await completed.Content.ReadFromJsonAsync<JsonElement>();
        var turnId = created.GetProperty("id").GetString();
        Assert.Null(created.GetProperty("previousTurnId").GetString());
        Assert.Null(created.GetProperty("narrative").GetProperty("acceptedAfterTurnId").GetString());

        await using var completedScope = _factory.Services.CreateAsyncScope();
        var completedDb = completedScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storedInput = await completedDb.SessionPlayerInputs.AsNoTracking().SingleAsync();
        var storedSession = await completedDb.Sessions.AsNoTracking().SingleAsync();
        Assert.Equal(inputId, storedInput.Id);
        Assert.Equal("扉の前で立ち止まる", storedInput.Text);
        Assert.Null(storedInput.AcceptedAfterTurnId);
        Assert.Equal(turnId, storedSession.HeadTurnId);
        Assert.Equal(0, (await completedDb.SessionStates.AsNoTracking().SingleAsync()).Revision);
        Assert.Equal("completed", (await completedDb.SessionPlayerInputWorks.AsNoTracking().SingleAsync()).Status);
    }

    [Fact]
    public async Task NarrativeTurnReplayDoesNotExposeAnotherOwnersSession()
    {
        var owner = await AuthenticatedClientAsync("dialogue-owner@example.test");
        var intruder = await AuthenticatedClientAsync("dialogue-intruder@example.test");
        var sessionId = await CreateSessionAsync(owner);
        var body = new { requestId = "dialogue-private", input = "扉を調べる" };
        using var created = await owner.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);

        using var replay = await intruder.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.NotFound, replay.StatusCode);
    }

    [Fact]
    public async Task NarrativeThenModuleTurnsUseContiguousPositions()
    {
        var client = await AuthenticatedClientAsync("dialogue-position@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var narrative = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-position", input = "閉じた星座の扉へ進む" });
        Assert.Equal(HttpStatusCode.OK, narrative.StatusCode);
        using var module = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/module-turns",
            InitializeBody("module-after-dialogue"));
        Assert.Equal(HttpStatusCode.Created, module.StatusCode);

        var session = await GetSessionAsync(client, sessionId);
        var orderedTurns = session.GetProperty("turns").EnumerateArray().ToArray();
        Assert.Null(orderedTurns[0].GetProperty("previousTurnId").GetString());
        Assert.Equal(orderedTurns[0].GetProperty("id").GetString(), orderedTurns[1].GetProperty("previousTurnId").GetString());
        Assert.Equal(orderedTurns[1].GetProperty("id").GetString(), session.GetProperty("headTurnId").GetString());
        Assert.Equal([1, 2], session.GetProperty("turns").EnumerateArray().Select(turn => turn.GetProperty("position").GetInt32()).ToArray());
    }

    [Fact]
    public async Task NarrativeTurnRejectsIdempotencyKeyReuseWithDifferentInput()
    {
        var client = await AuthenticatedClientAsync("dialogue-idempotency@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var first = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", new { requestId = "dialogue-1", input = "扉に触れる" });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        using var reused = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", new { requestId = "dialogue-1", input = "階段へ戻る" });
        Assert.Equal(HttpStatusCode.Conflict, reused.StatusCode);
        var error = await reused.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("idempotency_key_reused", error.GetProperty("code").GetString());
    }

    [Fact]
    public async Task AllowedNarrativeSignalIsPersistedAndAdvancesScenarioProgression()
    {
        var client = await AuthenticatedClientAsync("dialogue-signal@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSignals = [new NarrativeProgressionSignal("constellation-door-reached")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-signal", input = "閉じた星座の扉へ進む" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("constellation-door-reached", created.GetProperty("narrative").GetProperty("signals")[0].GetString());
        Assert.Equal(["constellation-door-reached"], Assert.Single(_generator.DialogueRequests).AllowedSignals);

        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal("constellation-door-check", session.GetProperty("progression").GetProperty("currentNode").GetString());
        Assert.Equal(1, session.GetProperty("progression").GetProperty("revision").GetInt64());
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await db.SessionNarrativeSignals.CountAsync());
        Assert.Equal(1, await db.SessionProgressionTransitionReceipts.CountAsync());
    }

    [Fact]
    public async Task NarrativeSignalStartsConfiguredModuleTurnExactlyOnceFromSnapshot()
    {
        var identity = await GetIdentityAsync();
        await ConfigureDoorTransitionAsync(identity);
        var client = await AuthenticatedClientAsync("dialogue-module-transition@example.test");
        var sessionId = await CreateSessionAsync(client);
        await using (var mutationScope = _factory.Services.CreateAsyncScope())
        {
            var mutationDb = mutationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var snapshot = await mutationDb.SessionProgressionModuleSnapshots.SingleAsync(item => item.SessionId == sessionId);
            Assert.Equal("{\"purpose\":\"constellation-door\"}", snapshot.ConfigurationJson);
            var transition = await mutationDb.ScenarioProgressionTransitions.SingleAsync(item => item.Id == snapshot.TransitionId);
            transition.ModuleConfigurationJson = "{\"purpose\":\"changed-after-session-start\"}";
            transition.ModuleContextJson = "{\"scene\":\"changed-after-session-start\"}";
            await mutationDb.SaveChangesAsync();
        }

        using var clientModule = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/module-turns",
            InitializeBody("client-bypass-attempt", new { purpose = "client-controlled" }));
        Assert.Equal(HttpStatusCode.Conflict, clientModule.StatusCode);
        var clientModuleError = await clientModule.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("scenario_module_turn_managed", clientModuleError.GetProperty("code").GetString());

        _generator.DialogueSignals = [new NarrativeProgressionSignal("constellation-door-reached")];
        var body = new { requestId = "dialogue-module-transition", input = "閉じた星座の扉へ進む" };

        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);
        var firstSession = await GetSessionAsync(client, sessionId);
        var turns = firstSession.GetProperty("turns").EnumerateArray().ToArray();
        Assert.Equal([1, 2], turns.Select(turn => turn.GetProperty("position").GetInt32()).ToArray());
        Assert.Equal(["narrative", "module"], turns.Select(turn => turn.GetProperty("kind").GetString()!).ToArray());
        Assert.Equal("completed", firstSession.GetProperty("progression").GetProperty("transitionStatus").GetString());
        Assert.Equal(turns[1].GetProperty("id").GetString(), firstSession.GetProperty("progression").GetProperty("moduleTurnId").GetString());

        using var replay = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/narrative-turns", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var replayedSession = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, replayedSession.GetProperty("turns").GetArrayLength());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var receipt = await db.SessionProgressionTransitionReceipts.SingleAsync();
        Assert.Equal(identity.ModuleId, receipt.ModuleId);
        Assert.Equal(identity.Version, receipt.ModuleVersion);
        Assert.Equal(identity.Digest, receipt.ModuleDigest);
        Assert.Equal("{\"purpose\":\"constellation-door\"}", receipt.ModuleConfigurationJson);
        Assert.Equal("{\"purpose\":\"constellation-door\"}", (await db.ModuleExecutions.SingleAsync()).ConfigurationJson);
        Assert.Equal(1, await db.ModuleExecutions.CountAsync());
        Assert.Equal(1, await db.ModuleExecutionRequests.CountAsync(request => request.RequestId == $"scenario-transition:{receipt.Id}"));
    }

    [Fact]
    public async Task SessionStartRejectsConfiguredModuleThatIsNotEnabled()
    {
        var identity = await GetIdentityAsync();
        await ConfigureDoorTransitionAsync(identity);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var packages = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
            await packages.SetEnabledAsync(identity.Digest, false, default);
        }
        var client = await AuthenticatedClientAsync("dialogue-disabled-module@example.test");

        using var response = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-STAR-LIBRARY" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("scenario_module_unavailable", error.GetProperty("code").GetString());
        await using var verification = _factory.Services.CreateAsyncScope();
        Assert.Equal(0, await verification.ServiceProvider.GetRequiredService<ApplicationDbContext>().Sessions.CountAsync());
    }

    [Fact]
    public async Task UnknownNarrativeSignalIsRejectedWithoutPersistingTurnOrProgression()
    {
        var client = await AuthenticatedClientAsync("dialogue-invalid-signal@example.test");
        var sessionId = await CreateSessionAsync(client);
        _generator.DialogueSignals = [new NarrativeProgressionSignal("untrusted-signal")];

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{sessionId}/narrative-turns",
            new { requestId = "dialogue-invalid-signal", input = "扉へ進む" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var session = await GetSessionAsync(client, sessionId);
        Assert.Empty(session.GetProperty("turns").EnumerateArray());
        Assert.Equal("exploration", session.GetProperty("progression").GetProperty("currentNode").GetString());
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(0, await db.SessionNarrativeSignals.CountAsync());
        Assert.Equal(0, await db.SessionProgressionTransitionReceipts.CountAsync());
    }

    [Fact]
    public async Task ActiveTurnDoesNotGenerateAndPublicTriggerRouteDoesNotExist()
    {
        var client = await AuthenticatedClientAsync("no-trigger@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateActiveTurnAsync(client, sessionId, "active-only");

        Assert.Empty(_generator.Requests);
        using var removedRoute = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.NotFound, removedRoute.StatusCode);
    }

    [Fact]
    public async Task SessionAdvanceDuringAutomaticGenerationMarksHandoffFailedWithoutRollingBackOutcome()
    {
        var client = await AuthenticatedClientAsync("automatic-stale@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "stale-init");
        _generator.Pause = true;

        var completion = client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", DispatchBody("stale-complete"));
        await _generator.Entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        using var advanced = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("later-turn"));
        Assert.Equal(HttpStatusCode.Created, advanced.StatusCode);
        _generator.Release.TrySetResult();

        using var completed = await completion;
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        Assert.Equal("completed", (await completed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        Assert.Equal("failed", session.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
        Assert.Equal("session_advanced", session.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("errorCode").GetString());
        Assert.Equal(0, await CountNarrativeTurnsAsync());
        Assert.Equal(1, await CountOutcomeApplicationsAsync());
    }

    [Fact]
    public async Task ExpiredPendingLeaseIsRecoveredByCompletionReplay()
    {
        var client = await AuthenticatedClientAsync("lease-recovery@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "lease-init");
        var body = DispatchBody("lease-complete");
        _generator.Fail = true;
        using var failed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, failed.StatusCode);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var handoff = await db.SessionNarrativeHandoffs.SingleAsync();
            handoff.Status = "pending";
            handoff.LeaseId = "NHL-EXPIRED";
            handoff.LeaseExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1);
            handoff.LastErrorCode = null;
            handoff.LastErrorMessage = null;
            await db.SaveChangesAsync();
        }

        _generator.Fail = false;
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        Assert.Equal(1, await CountNarrativeTurnsAsync());
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal("completed", session.GetProperty("turns")[0].GetProperty("narrativeHandoff").GetProperty("status").GetString());
    }

    [Fact]
    public async Task ConcurrentCompletionReplayPersistsOneNarrativeTurn()
    {
        var client = await AuthenticatedClientAsync("automatic-concurrent@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (_, executionId) = await CreateActiveTurnAsync(client, sessionId, "concurrent-init");
        var body = DispatchBody("concurrent-complete");
        _generator.Fail = true;
        using var failed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, failed.StatusCode);
        _generator.Fail = false;

        var responses = await Task.WhenAll(
            client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body),
            client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body));
        foreach (var response in responses)
        {
            using (response) Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        Assert.Equal(1, await CountNarrativeTurnsAsync());
        var session = await GetSessionAsync(client, sessionId);
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
    }

    private async Task<(string TurnId, string ExecutionId)> CreateActiveTurnAsync(HttpClient client, string sessionId, string requestId)
    {
        using var response = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody(requestId));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (json.GetProperty("id").GetString()!, json.GetProperty("execution").GetProperty("id").GetString()!);
    }

    private Task<HttpResponseMessage> CompleteAsync(HttpClient client, string executionId, string requestId) =>
        client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", DispatchBody(requestId));

    private static object DispatchBody(string requestId) => new
    {
        requestId,
        expectedRevision = 0,
        action = new { mode = "complete" },
        randomValueCount = 0,
    };

    private async Task<string> CreateSessionAsync(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-STAR-LIBRARY" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private static async Task<JsonElement> GetSessionAsync(HttpClient client, string sessionId)
    {
        using var response = await client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private object InitializeBody(string requestId, object? configuration = null)
    {
        var identity = GetIdentityAsync().GetAwaiter().GetResult();
        return new
        {
            requestId,
            moduleId = identity.ModuleId,
            version = identity.Version,
            digest = identity.Digest,
            configuration = configuration ?? new { },
            context = new { scene = "narrative-test" },
            randomValueCount = 0,
        };
    }

    private async Task ConfigureDoorTransitionAsync(ModulePackageIdentity identity)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var transition = await db.ScenarioProgressionTransitions.SingleAsync(item => item.Id == "SPT-STAR-LIBRARY-DOOR-REACHED");
        transition.ModuleId = identity.ModuleId;
        transition.ModuleVersion = identity.Version;
        transition.ModuleDigest = identity.Digest;
        transition.ModuleConfigurationJson = "{\"purpose\":\"constellation-door\"}";
        transition.ModuleContextJson = "{\"scene\":\"closed-constellation-door\"}";
        transition.ModuleRandomValueCount = 0;
        await db.SaveChangesAsync();
    }

    private async Task<ModulePackageIdentity> GetIdentityAsync()
    {
        if (_identity is not null) return _identity;
        await using var scope = _factory.Services.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
        await using var stream = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "Myriale.HeadlessTestModule.dll"));
        var installed = await service.InstallAsync(stream, default);
        await service.SetEnabledAsync(installed.Package.Digest, true, default);
        _identity = new ModulePackageIdentity(installed.Package.ModuleId, installed.Package.Version, installed.Package.Digest);
        return _identity;
    }

    private async Task<int> GetHandoffAttemptsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionNarrativeHandoffs
            .Select(handoff => handoff.AttemptCount)
            .SingleAsync();
    }

    private async Task<int> CountNarrativeTurnsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync(turn => turn.Kind == "narrative");
    }

    private async Task<int> CountOutcomeApplicationsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleOutcomeApplications.CountAsync();
    }

    private async Task<HttpClient> AuthenticatedClientAsync(string email)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var response = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Player", email, password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        if (response.Headers.TryGetValues("Set-Cookie", out var values))
            client.DefaultRequestHeaders.Add("Cookie", values.First().Split(';', 2)[0]);
        return client;
    }

    public void Dispose()
    {
        _factory.Dispose();
        try { if (Directory.Exists(_root)) Directory.Delete(_root, true); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private sealed class CapturingNarrativeGenerator : INarrativeGenerator
    {
        public List<NarrativeHandoffRequest> Requests { get; } = [];
        public bool Fail { get; set; }
        public Func<Task>? OnGenerate { get; set; }
        public bool Pause { get; set; }
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public List<NarrativeDialogueRequest> DialogueRequests { get; } = [];
        public IReadOnlyList<NarrativeProgressionSignal> DialogueSignals { get; set; } = [];
        public bool PauseDialogue { get; set; }
        public TaskCompletionSource DialogueEntered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource DialogueRelease { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public async Task<NarrativeDialogueResult> GenerateDialogueAsync(NarrativeDialogueRequest request, CancellationToken cancellationToken)
        {
            lock (DialogueRequests) DialogueRequests.Add(request);
            if (Fail) throw new NarrativeGenerationException("test failure");
            if (PauseDialogue)
            {
                DialogueEntered.TrySetResult();
                await DialogueRelease.Task.WaitAsync(cancellationToken);
            }
            return new NarrativeDialogueResult("入力を受け止め、物語は次の場面へ進んだ。", DialogueSignals);
        }

        public async Task<string> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
        {
            if (OnGenerate is not null) await OnGenerate();
            lock (Requests) Requests.Add(request);
            if (Fail) throw new NarrativeGenerationException("test failure");
            if (Pause)
            {
                Entered.TrySetResult();
                await Release.Task.WaitAsync(cancellationToken);
            }
            return "確定した結果を受け、物語は次の場面へ進んだ。";
        }
    }
}
