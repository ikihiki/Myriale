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
    public async Task CompletedModuleTurnCreatesOneNarrativeTurnFromPublicAppliedOutcome()
    {
        var client = await AuthenticatedClientAsync("narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (moduleTurnId, _) = await CreateCompletedTurnAsync(client, sessionId, "narrative");

        using var response = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{moduleTurnId}/narrative", null);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var narrative = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, narrative.GetProperty("position").GetInt32());
        Assert.Equal("narrative", narrative.GetProperty("kind").GetString());
        Assert.Equal(moduleTurnId, narrative.GetProperty("narrative").GetProperty("sourceModuleTurnId").GetString());
        Assert.Equal(1, narrative.GetProperty("narrative").GetProperty("sourceSessionRevision").GetInt64());
        Assert.False(narrative.TryGetProperty("execution", out var execution) && execution.ValueKind != JsonValueKind.Null);

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

        using var sessionResponse = await client.GetAsync($"/api/sessions/{sessionId}");
        var session = await sessionResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
        Assert.Equal("module", session.GetProperty("turns")[0].GetProperty("kind").GetString());
        Assert.Equal("narrative", session.GetProperty("turns")[1].GetProperty("kind").GetString());

        await using var scope = _factory.Services.CreateAsyncScope();
        var turns = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.OrderBy(turn => turn.Position).ToListAsync();
        Assert.Equal(2, turns.Count);
        Assert.Equal(moduleTurnId, turns[1].SourceModuleTurnId);
    }

    [Fact]
    public async Task HandoffRequiresCompletionAndHidesForeignSessions()
    {
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var unauthorized = await anonymous.PostAsync("/api/sessions/SES-UNKNOWN/module-turns/TRN-UNKNOWN/narrative", null);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        var owner = await AuthenticatedClientAsync("handoff-owner@example.test");
        var sessionId = await CreateSessionAsync(owner);
        var (turnId, _) = await CreateActiveTurnAsync(owner, sessionId, "active-source");

        using var incomplete = await owner.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.Conflict, incomplete.StatusCode);
        Assert.Equal("module_turn_not_completed", (await incomplete.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Empty(_generator.Requests);

        var other = await AuthenticatedClientAsync("handoff-other@example.test");
        using var hidden = await other.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
    }

    [Fact]
    public async Task EffectfulOutcomeRequiresApplicationReceipt()
    {
        var client = await AuthenticatedClientAsync("missing-application@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateCompletedTurnAsync(client, sessionId, "missing-application");
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.ModuleOutcomeApplications.Remove(await db.ModuleOutcomeApplications.SingleAsync());
            await db.SaveChangesAsync();
        }

        using var rejected = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.Conflict, rejected.StatusCode);
        Assert.Equal("effects_not_applied", (await rejected.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Empty(_generator.Requests);
    }

    [Fact]
    public async Task RepeatedAndConcurrentHandoffsPersistOneNarrativeTurn()
    {
        var client = await AuthenticatedClientAsync("replay-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateCompletedTurnAsync(client, sessionId, "replay-narrative");

        var responses = await Task.WhenAll(
            client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null),
            client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null));
        using var first = responses[0];
        using var second = responses[1];
        Assert.All(responses, response => Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Created, HttpStatusCode.OK }));
        var firstId = (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        var secondId = (await second.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString();
        Assert.Equal(firstId, secondId);

        using var replay = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        Assert.Equal(firstId, (await replay.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await db.SessionTurns.CountAsync(turn => turn.Kind == "narrative"));
        Assert.Equal(2, (await db.Sessions.SingleAsync()).NextTurnPosition);
    }

    [Fact]
    public async Task ProviderFailureDoesNotAdvanceSessionAndCanRetry()
    {
        var client = await AuthenticatedClientAsync("provider-retry@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateCompletedTurnAsync(client, sessionId, "provider-retry");
        _generator.Fail = true;

        using var failed = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.BadGateway, failed.StatusCode);
        Assert.Equal("narrative_generation_failed", (await failed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(1, (await db.Sessions.SingleAsync()).NextTurnPosition);
            Assert.Equal(0, await db.SessionTurns.CountAsync(turn => turn.Kind == "narrative"));
        }

        _generator.Fail = false;
        using var retried = await client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        Assert.Equal(HttpStatusCode.Created, retried.StatusCode);
    }

    [Fact]
    public async Task SessionStateChangeDuringGenerationRejectsStaleNarrative()
    {
        var client = await AuthenticatedClientAsync("state-race-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateCompletedTurnAsync(client, sessionId, "state-race-narrative");
        _generator.Pause = true;

        var pending = client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        await _generator.Entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var state = await db.SessionStates.SingleAsync();
            state.Revision++;
            state.FlagsJson = "{\"module-completed\":true,\"later-effect\":true}";
            state.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
        _generator.Release.TrySetResult();

        using var stale = await pending;
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Equal("session_advanced", (await stale.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        await using var verification = _factory.Services.CreateAsyncScope();
        Assert.Equal(0, await verification.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync(turn => turn.Kind == "narrative"));
    }

    [Fact]
    public async Task CancellationDoesNotPersistNarrative()
    {
        var client = await AuthenticatedClientAsync("cancel-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateCompletedTurnAsync(client, sessionId, "cancel-narrative");
        _generator.Pause = true;
        using var cancellation = new CancellationTokenSource();

        var pending = client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null, cancellation.Token);
        await _generator.Entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(0, await db.SessionTurns.CountAsync(turn => turn.Kind == "narrative"));
        Assert.Equal(1, (await db.Sessions.SingleAsync()).NextTurnPosition);
    }

    [Fact]
    public async Task SessionAdvanceDuringGenerationRejectsStaleNarrative()
    {
        var client = await AuthenticatedClientAsync("stale-narrative@example.test");
        var sessionId = await CreateSessionAsync(client);
        var (turnId, _) = await CreateCompletedTurnAsync(client, sessionId, "stale-narrative");
        _generator.Pause = true;

        var pending = client.PostAsync($"/api/sessions/{sessionId}/module-turns/{turnId}/narrative", null);
        await _generator.Entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        using var advanced = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody("advanced-turn"));
        Assert.Equal(HttpStatusCode.Created, advanced.StatusCode);
        _generator.Release.TrySetResult();

        using var stale = await pending;
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Equal("session_advanced", (await stale.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().SessionTurns.CountAsync(turn => turn.Kind == "narrative"));
    }

    private async Task<(string TurnId, string ExecutionId)> CreateCompletedTurnAsync(HttpClient client, string sessionId, string prefix)
    {
        var active = await CreateActiveTurnAsync(client, sessionId, $"{prefix}-init");
        using var completed = await client.PostAsJsonAsync($"/api/module-executions/{active.ExecutionId}/dispatch", new
        {
            requestId = $"{prefix}-complete",
            expectedRevision = 0,
            action = new { mode = "complete" },
            randomValueCount = 0,
        });
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);
        return active;
    }

    private async Task<(string TurnId, string ExecutionId)> CreateActiveTurnAsync(HttpClient client, string sessionId, string requestId)
    {
        using var response = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/module-turns", InitializeBody(requestId));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (json.GetProperty("id").GetString()!, json.GetProperty("execution").GetProperty("id").GetString()!);
    }

    private async Task<string> CreateSessionAsync(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId = "SCN-STAR-LIBRARY" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private object InitializeBody(string requestId)
    {
        var identity = GetIdentityAsync().GetAwaiter().GetResult();
        return new
        {
            requestId,
            moduleId = identity.ModuleId,
            version = identity.Version,
            digest = identity.Digest,
            configuration = new { },
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
        public bool Pause { get; set; }
        public TaskCompletionSource Entered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource Release { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public async Task<string> GenerateAsync(NarrativeHandoffRequest request, CancellationToken cancellationToken)
        {
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
