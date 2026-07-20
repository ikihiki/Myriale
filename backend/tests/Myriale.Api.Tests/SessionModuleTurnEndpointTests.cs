using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Data;
using Myriale.Api.Modules;
using Myriale.Api.Modules.Runtime;

namespace Myriale.Api.Tests;

public sealed class SessionModuleTurnEndpointTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-session-turn-tests-{Guid.NewGuid():N}");
    private readonly WebApplicationFactory<Program> _factory;
    private ModulePackageIdentity? _identity;

    public SessionModuleTurnEndpointTests()
    {
        Directory.CreateDirectory(_root);
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={Path.Combine(_root, "myriale.db")}");
            builder.UseSetting("Modules:StoragePath", Path.Combine(_root, "modules"));
        });
    }

    [Fact]
    public async Task SessionEndpointsRequireAuthenticationAndUnknownScenarioIsNotCreated()
    {
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var create = await anonymous.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-STAR-LIBRARY" });
        using var get = await anonymous.GetAsync("/api/sessions/SES-UNKNOWN");
        using var turn = await anonymous.PostAsJsonAsync("/api/sessions/SES-UNKNOWN/module-turns", InitializeBody("anonymous"));
        Assert.Equal(HttpStatusCode.Unauthorized, create.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, get.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, turn.StatusCode);

        var client = await AuthenticatedClientAsync("unknown-scenario@example.test");
        using var unknown = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-UNKNOWN" });
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Sessions.CountAsync());
    }

    [Fact]
    public async Task IdempotentSessionStartCreatesOneOpeningTurn()
    {
        var client = await AuthenticatedClientAsync("session-opening@example.test");
        var body = new { scenarioId = "SCN-STAR-LIBRARY", requestId = "start-star-library" };

        using var created = await client.PostAsJsonAsync("/api/sessions/", body);
        using var replay = await client.PostAsJsonAsync("/api/sessions/", body);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var createdJson = await created.Content.ReadFromJsonAsync<JsonElement>();
        var replayJson = await replay.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(createdJson.GetProperty("id").GetString(), replayJson.GetProperty("id").GetString());
        Assert.Equal(1, createdJson.GetProperty("revision").GetInt64());
        Assert.Equal(createdJson.GetProperty("turns")[0].GetProperty("id").GetString(), createdJson.GetProperty("headTurnId").GetString());
        var openingNarrative = createdJson.GetProperty("turns")[0].GetProperty("narrative");
        Assert.Equal("あなたは水没した閲覧室で目を覚ます。", openingNarrative.GetProperty("body").GetString());
        Assert.Equal("narrative-dialogue.v5", openingNarrative.GetProperty("schemaVersion").GetString());
        Assert.Equal("opening", openingNarrative.GetProperty("turnType").GetString());
        Assert.Equal("星喰いの地下図書館", openingNarrative.GetProperty("heading").GetString());
        Assert.Equal(1, createdJson.GetProperty("turns")[0].GetProperty("position").GetInt32());
        Assert.Empty(createdJson.GetProperty("pendingInputs").EnumerateArray());

        using var reused = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-ASH-STATION", requestId = "start-star-library" });
        Assert.Equal(HttpStatusCode.Conflict, reused.StatusCode);
        Assert.Equal("idempotency_key_reused", (await reused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await db.Sessions.CountAsync());
        Assert.Equal(1, await db.SessionTurns.CountAsync());
    }

    [Fact]
    public async Task InterpretationSettingRequiresPermissionAndIsPartOfIdempotentSessionConfiguration()
    {
        const string email = "session-interpretation@example.test";
        var client = await AuthenticatedClientAsync(email);
        var body = new { scenarioId = "SCN-STAR-LIBRARY", requestId = "start-with-interpretation", interpretationEnabled = true };

        using var forbidden = await client.PostAsJsonAsync("/api/sessions/", body);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
        Assert.Equal("dialogue_debug_forbidden", (await forbidden.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());

        await GrantDialogueDebugAsync(email);
        using var created = await client.PostAsJsonAsync("/api/sessions/", body);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var createdJson = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(createdJson.GetProperty("interpretationEnabled").GetBoolean());

        using var reused = await client.PostAsJsonAsync("/api/sessions/", new
        {
            scenarioId = "SCN-STAR-LIBRARY",
            requestId = "start-with-interpretation",
            interpretationEnabled = false,
        });
        Assert.Equal(HttpStatusCode.Conflict, reused.StatusCode);
        Assert.Equal("idempotency_key_reused", (await reused.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task ModuleTurnIsPersistedAtomicallyAndInternalDispatchDoesNotAddTurns()
    {
        var client = await AuthenticatedClientAsync("session-owner@example.test");
        var sessionId = await CreateSessionAsync(client);

        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("turn-one"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var turn = await created.Content.ReadFromJsonAsync<JsonElement>();
        var turnId = turn.GetProperty("id").GetString()!;
        var executionId = turn.GetProperty("execution").GetProperty("id").GetString()!;
        Assert.Equal(1, turn.GetProperty("position").GetInt32());
        Assert.Equal("module", turn.GetProperty("kind").GetString());

        using var dispatch = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", new
        {
            requestId = "inside-turn",
            expectedRevision = 0,
            action = new { mode = "active" },
            randomValueCount = 0,
        });
        Assert.Equal(HttpStatusCode.OK, dispatch.StatusCode);
        Assert.Equal(1, (await dispatch.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("revision").GetInt64());

        using var getTurn = await client.GetAsync($"/api/sessions/{sessionId}/turns/{turnId}");
        Assert.Equal(HttpStatusCode.OK, getTurn.StatusCode);
        Assert.Equal(1, (await getTurn.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("revision").GetInt64());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await db.Sessions.CountAsync());
        Assert.Equal(1, await db.SessionTurns.CountAsync());
        Assert.Equal(1, await db.ModuleExecutions.CountAsync());
        Assert.Equal(2, await db.ModuleExecutionRequests.CountAsync());
        var stored = await db.SessionTurns.Include(item => item.ModuleExecution).SingleAsync();
        Assert.Equal(sessionId, stored.SessionId);
        Assert.NotNull(stored.ModuleExecution);
        Assert.Equal(executionId, stored.ModuleExecution.Id);
        Assert.Equal(stored.Id, stored.ModuleExecution.SessionTurnId);
    }

    [Fact]
    public async Task ModuleTurnInitializationReplaysAndPositionsRemainStable()
    {
        var client = await AuthenticatedClientAsync("turn-order@example.test");
        var sessionId = await CreateSessionAsync(client);
        var body = InitializeBody("same-turn");

        using var first = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", body);
        using var replay = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", body);
        using var second = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("second-turn", new { completeOnInitialize = true }));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, replay.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);
        var firstJson = await first.Content.ReadFromJsonAsync<JsonElement>();
        var replayJson = await replay.Content.ReadFromJsonAsync<JsonElement>();
        var secondJson = await second.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(firstJson.GetProperty("id").GetString(), replayJson.GetProperty("id").GetString());
        Assert.Equal(1, firstJson.GetProperty("position").GetInt32());
        Assert.Equal(2, secondJson.GetProperty("position").GetInt32());
        Assert.Equal("completed", secondJson.GetProperty("execution").GetProperty("status").GetString());

        using var session = await client.GetAsync($"/api/sessions/{sessionId}");
        var sessionJson = await session.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, sessionJson.GetProperty("state").GetProperty("revision").GetInt64());
        Assert.True(sessionJson.GetProperty("state").GetProperty("flags").GetProperty("module-completed").GetBoolean());
        Assert.Equal(2, sessionJson.GetProperty("turns").GetArrayLength());
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(2, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync());
    }

    [Fact]
    public async Task CompletedOutcomeAppliesOrderedFlagsExactlyOnce()
    {
        var client = await AuthenticatedClientAsync("effect-owner@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("effect-init"));
        var executionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("id").GetString()!;
        var body = new
        {
            requestId = "effect-complete",
            expectedRevision = 0,
            action = new { mode = "complete" },
            randomValueCount = 0,
        };

        using var completed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);

        using var session = await client.GetAsync($"/api/sessions/{sessionId}");
        var sessionJson = await session.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, sessionJson.GetProperty("state").GetProperty("revision").GetInt64());
        Assert.True(sessionJson.GetProperty("state").GetProperty("flags").GetProperty("module-completed").GetBoolean());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var application = await db.ModuleOutcomeApplications.SingleAsync();
        Assert.Equal(0, application.ExpectedSessionRevision);
        Assert.Equal(1, application.AppliedSessionRevision);
        Assert.Equal(2, application.EffectCount);
        Assert.Equal(1, await db.ModuleOutcomeApplications.CountAsync());
    }

    [Fact]
    public async Task PendingCompletionKeepsItsRecordedSessionRevision()
    {
        var client = await AuthenticatedClientAsync("stale-effect@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("stale-effect-init"));
        var executionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("id").GetString()!;
        var body = new
        {
            requestId = "stale-effect-complete",
            expectedRevision = 0,
            action = new { mode = "delay-complete", milliseconds = 250 },
            randomValueCount = 0,
        };
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body, cancellation.Token));

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var state = await db.SessionStates.SingleAsync();
            state.Revision = 1;
            state.FlagsJson = "{\"other-turn\":true}";
            await db.SaveChangesAsync();
            Assert.Equal(0, (await db.ModuleExecutionRequests.SingleAsync(item => item.RequestId == "stale-effect-complete")).ExpectedSessionRevision);
        }

        using var resumed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", body);
        Assert.Equal(HttpStatusCode.Conflict, resumed.StatusCode);
        var error = await resumed.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("session_revision_conflict", error.GetProperty("code").GetString());
        Assert.Equal(1, error.GetProperty("currentSessionRevision").GetInt64());

        await using var verification = _factory.Services.CreateAsyncScope();
        var verificationDb = verification.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal("active", (await verificationDb.ModuleExecutions.SingleAsync()).Status);
        Assert.Equal(0, (await verificationDb.ModuleExecutions.SingleAsync()).Revision);
        Assert.Equal(0, await verificationDb.ModuleOutcomeApplications.CountAsync());
        Assert.Equal("rejected", (await verificationDb.ModuleExecutionRequests.SingleAsync(item => item.RequestId == "stale-effect-complete")).Status);
    }

    [Fact]
    public async Task InvalidEffectIsRejectedWithoutCompletingExecutionOrChangingSessionState()
    {
        var client = await AuthenticatedClientAsync("invalid-effect@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("invalid-effect-init"));
        var executionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("id").GetString()!;

        using var rejected = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", new
        {
            requestId = "invalid-effect",
            expectedRevision = 0,
            action = new { mode = "complete-malformed-effect" },
            randomValueCount = 0,
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, rejected.StatusCode);
        var error = await rejected.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("invalid_effect_payload", error.GetProperty("code").GetString());
        Assert.Equal(0, error.GetProperty("currentRevision").GetInt64());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal("active", (await db.ModuleExecutions.SingleAsync()).Status);
        Assert.Equal(0, (await db.ModuleExecutions.SingleAsync()).Revision);
        Assert.Equal(0, (await db.SessionStates.SingleAsync()).Revision);
        Assert.Equal(0, await db.ModuleOutcomeApplications.CountAsync());
    }

    [Fact]
    public async Task CatalogChangeDoesNotRevokePinnedEffectCapability()
    {
        var client = await AuthenticatedClientAsync("pinned-capability@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("pinned-capability-init"));
        var executionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("id").GetString()!;
        await SetCatalogCapabilitiesAsync();

        using var completed = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", new
        {
            requestId = "pinned-capability-complete",
            expectedRevision = 0,
            action = new { mode = "complete" },
            randomValueCount = 0,
        });
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(1, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleOutcomeApplications.CountAsync());
    }

    [Fact]
    public async Task MissingEffectCapabilityIsRejected()
    {
        var client = await AuthenticatedClientAsync("missing-capability@example.test");
        var sessionId = await CreateSessionAsync(client);
        _ = await GetIdentityAsync();
        await SetCatalogCapabilitiesAsync();

        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("capability-init"));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var executionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("id").GetString()!;
        await SetCatalogCapabilitiesAsync("emit:session-effects");

        using var rejected = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", new
        {
            requestId = "capability-complete",
            expectedRevision = 0,
            action = new { mode = "complete" },
            randomValueCount = 0,
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, rejected.StatusCode);
        Assert.Equal("effect_capability_missing", (await rejected.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task CorruptSessionStateReturnsControlledErrors()
    {
        var client = await AuthenticatedClientAsync("corrupt-state@example.test");
        var sessionId = await CreateSessionAsync(client);
        using var created = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("corrupt-state-init"));
        var executionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("execution").GetProperty("id").GetString()!;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var state = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionStates.SingleAsync();
            state.FlagsJson = "not-json";
            await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SaveChangesAsync();
        }

        using var get = await client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.InternalServerError, get.StatusCode);
        Assert.Equal("session_state_corrupt", (await get.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());

        using var rejected = await client.PostAsJsonAsync($"/api/module-executions/{executionId}/dispatch", new
        {
            requestId = "corrupt-state-complete",
            expectedRevision = 0,
            action = new { mode = "complete" },
            randomValueCount = 0,
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, rejected.StatusCode);
        Assert.Equal("session_state_corrupt", (await rejected.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task ConcurrentModuleTurnRequestsReceiveUniqueOrderedPositions()
    {
        var client = await AuthenticatedClientAsync("parallel-turns@example.test");
        var sessionId = await CreateSessionAsync(client);

        var responses = await Task.WhenAll(
            client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("parallel-one")),
            client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("parallel-two")));
        using var first = responses[0];
        using var second = responses[1];
        Assert.All(responses, response => Assert.Equal(HttpStatusCode.Created, response.StatusCode));
        var positions = new[]
        {
            (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("position").GetInt32(),
            (await second.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("position").GetInt32(),
        };
        Assert.Equal(new[] { 1, 2 }, positions.Order().ToArray());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(2, await db.SessionTurns.CountAsync());
        Assert.Equal(2, await db.ModuleExecutions.CountAsync());
        Assert.Equal(2, await db.ModuleExecutionRequests.CountAsync());
        var storedSession = await db.Sessions.Include(item => item.HeadTurn).SingleAsync();
        Assert.Equal(2, storedSession.HeadTurn?.Position);
    }

    [Fact]
    public async Task CancelledPendingModuleTurnResumesWithoutCreatingAnotherTurn()
    {
        var client = await AuthenticatedClientAsync("pending-turn@example.test");
        var sessionId = await CreateSessionAsync(client);
        var body = InitializeBody("pending-turn", new { initializationDelayMilliseconds = 5_000 });
        using var cancellation = new CancellationTokenSource();

        var pendingRequest = client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", body, cancellation.Token);
        await WaitForPendingRequestAsync("pending-turn");
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pendingRequest);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(1, await db.SessionTurns.CountAsync());
            Assert.Equal("pending", (await db.ModuleExecutionRequests.SingleAsync()).Status);
        }

        using var resumed = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", body);
        Assert.Equal(HttpStatusCode.Created, resumed.StatusCode);
        Assert.Equal(1, (await resumed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("position").GetInt32());
        await using var verification = _factory.Services.CreateAsyncScope();
        Assert.Equal(1, await verification.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync());
    }

    [Fact]
    public async Task SessionOwnershipIsHiddenAndRequestIdCannotCrossSessionScope()
    {
        var owner = await AuthenticatedClientAsync("private-session@example.test");
        var firstSession = await CreateSessionAsync(owner);
        var secondSession = await CreateSessionAsync(owner);
        using var first = await owner.PostAsJsonAsync($"/api/sessions/{firstSession}/module-turns", InitializeBody("scoped-request"));
        using var conflict = await owner.PostAsJsonAsync($"/api/sessions/{secondSession}/module-turns", InitializeBody("scoped-request"));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal("idempotency_key_reused", (await conflict.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());

        var other = await AuthenticatedClientAsync("session-intruder@example.test");
        var turnId = (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        using var getSession = await other.GetAsync($"/api/sessions/{firstSession}");
        using var getTurn = await other.GetAsync($"/api/sessions/{firstSession}/turns/{turnId}");
        using var createTurn = await other.PostAsJsonAsync($"/api/sessions/{firstSession}/module-turns", InitializeBody("intruder"));
        Assert.Equal(HttpStatusCode.NotFound, getSession.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getTurn.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, createTurn.StatusCode);
    }

    private async Task WaitForPendingRequestAsync(string requestId)
    {
        for (var attempt = 0; attempt < 500; attempt++)
        {
            await using var scope = _factory.Services.CreateAsyncScope();
            if (await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleExecutionRequests
                .AnyAsync(request => request.RequestId == requestId && request.Status == "pending"))
                return;
            await Task.Delay(20);
        }
        throw new TimeoutException($"Pending request was not persisted: {requestId}");
    }

    private async Task<string> CreateSessionAsync(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-STAR-LIBRARY" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
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
            context = new { scene = "session-test" },
            randomValueCount = 0,
        };
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

    private async Task SetCatalogCapabilitiesAsync(params string[] capabilities)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var package = await db.ModulePackages.SingleAsync();
        using var manifest = JsonDocument.Parse(package.ManifestJson);
        var root = manifest.RootElement;
        package.ManifestJson = JsonSerializer.Serialize(new
        {
            id = root.GetProperty("id").GetString(),
            version = root.GetProperty("version").GetString(),
            displayName = root.GetProperty("displayName").GetString(),
            description = root.GetProperty("description").GetString(),
            contractVersion = root.GetProperty("contractVersion").GetString(),
            configuration = root.GetProperty("configuration"),
            userInterfaces = root.GetProperty("userInterfaces"),
            capabilities,
            limits = root.GetProperty("limits"),
        });
        await db.SaveChangesAsync();
    }

    private async Task GrantDialogueDebugAsync(string email)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.SingleAsync(item => item.Email == email);
        user.CanDebugDialogue = true;
        await db.SaveChangesAsync();
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
}
