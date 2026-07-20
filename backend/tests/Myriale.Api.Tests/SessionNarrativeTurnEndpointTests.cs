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
