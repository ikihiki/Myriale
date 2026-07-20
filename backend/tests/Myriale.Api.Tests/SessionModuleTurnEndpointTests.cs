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
        Assert.Equal(2, sessionJson.GetProperty("turns").GetArrayLength());
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(2, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync());
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
        Assert.Equal(2, (await db.Sessions.SingleAsync()).NextTurnPosition);
    }

    [Fact]
    public async Task CancelledPendingModuleTurnResumesWithoutCreatingAnotherTurn()
    {
        var client = await AuthenticatedClientAsync("pending-turn@example.test");
        var sessionId = await CreateSessionAsync(client);
        var body = InitializeBody("pending-turn", new { initializationDelayMilliseconds = 250 });
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", body, cancellation.Token));

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
