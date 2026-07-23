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

public sealed class ModuleExecutionEndpointTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-execution-tests-{Guid.NewGuid():N}");
    private readonly WebApplicationFactory<Program> _factory;
    private ModulePackageIdentity? _identity;

    public ModuleExecutionEndpointTests()
    {
        Directory.CreateDirectory(_root);
        var dbPath = Path.Combine(_root, "myriale.db");
        var storagePath = Path.Combine(_root, "modules");
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
            builder.UseSetting("Modules:StoragePath", storagePath);
        });
    }

    [Fact]
    public async Task EndpointsRequireAuthentication()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var create = await client.PostAsJsonAsync("/api/module-executions/", InitializeBody("anonymous"));
        using var get = await client.GetAsync("/api/module-executions/MEX-UNKNOWN");
        using var dispatch = await client.PostAsJsonAsync("/api/module-executions/MEX-UNKNOWN/dispatch", DispatchBody("anonymous-dispatch", 0, new { }));

        Assert.Equal(HttpStatusCode.Unauthorized, create.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, get.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, dispatch.StatusCode);
    }

    [Fact]
    public async Task InitializePersistsPrivateSnapshotsAndGetReturnsOwnerVisibleProjection()
    {
        var client = await AuthenticatedClientAsync("owner@example.test");
        using var create = await client.PostAsJsonAsync("/api/module-executions/", InitializeBody("initialize-1", new { difficulty = 2 }, new { secret = "hidden" }, 3));

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var response = await create.Content.ReadFromJsonAsync<JsonElement>();
        var id = response.GetProperty("id").GetString()!;
        Assert.Equal(0, response.GetProperty("revision").GetInt64());
        Assert.Equal("active", response.GetProperty("status").GetString());
        Assert.False(response.TryGetProperty("state", out _));
        Assert.False(response.TryGetProperty("configuration", out _));
        Assert.False(response.TryGetProperty("context", out _));
        Assert.False(response.TryGetProperty("randomValues", out _));

        using var get = await client.GetAsync($"/api/module-executions/{id}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var stored = await db.ModuleExecutions.SingleAsync(item => item.Id == id);
        Assert.Null(stored.SessionTurn);
        Assert.Contains("difficulty", stored.ConfigurationJson);
        Assert.Contains("hidden", stored.ContextJson);
        Assert.Contains("initialized", stored.StateJson);
        var receipt = await db.ModuleExecutionRequests.SingleAsync(item => item.ExecutionId == id);
        Assert.Equal(3, JsonSerializer.Deserialize<uint[]>(receipt.RandomValuesJson)!.Length);
    }

    [Fact]
    public async Task InitializeIsIdempotentAndCanonicalizesJsonObjects()
    {
        var client = await AuthenticatedClientAsync("idempotent@example.test");
        var firstBody = InitializeBody("same-request", JsonSerializer.Deserialize<JsonElement>("{\"a\":1,\"b\":2}"), new { scene = 1 });
        var secondBody = InitializeBody("same-request", JsonSerializer.Deserialize<JsonElement>("{\"b\":2,\"a\":1}"), new { scene = 1 });

        using var first = await client.PostAsJsonAsync("/api/module-executions/", firstBody);
        using var replay = await client.PostAsJsonAsync("/api/module-executions/", secondBody);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, replay.StatusCode);
        var firstJson = await first.Content.ReadFromJsonAsync<JsonElement>();
        var replayJson = await replay.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(firstJson.GetProperty("id").GetString(), replayJson.GetProperty("id").GetString());

        using var conflict = await client.PostAsJsonAsync("/api/module-executions/", InitializeBody("same-request", new { a = 9 }, new { scene = 1 }));
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal("idempotency_key_reused", (await conflict.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());

        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal(1, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleExecutions.CountAsync());
    }

    [Fact]
    public async Task EquivalentNumericJsonFormsShareTheSameIdempotencyFingerprint()
    {
        var client = await AuthenticatedClientAsync("numeric@example.test");
        var integer = InitializeBody("numeric-request", JsonSerializer.Deserialize<JsonElement>("{\"value\":1}"), new { });
        var decimalValue = InitializeBody("numeric-request", JsonSerializer.Deserialize<JsonElement>("{\"value\":1.0}"), new { });

        using var first = await client.PostAsJsonAsync("/api/module-executions/", integer);
        using var replay = await client.PostAsJsonAsync("/api/module-executions/", decimalValue);

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, replay.StatusCode);
        Assert.Equal(
            (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString(),
            (await replay.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString());
    }

    [Fact]
    public async Task DistinctLargeNumbersDoNotCollideInIdempotencyFingerprint()
    {
        var client = await AuthenticatedClientAsync("large-number@example.test");
        var firstBody = InitializeBody(
            "large-number-request",
            JsonSerializer.Deserialize<JsonElement>("{\"value\":1000000000000000000000000000000}"),
            new { });
        var differentBody = InitializeBody(
            "large-number-request",
            JsonSerializer.Deserialize<JsonElement>("{\"value\":1000000000000000000000000000001}"),
            new { });

        using var first = await client.PostAsJsonAsync("/api/module-executions/", firstBody);
        using var conflict = await client.PostAsJsonAsync("/api/module-executions/", differentBody);

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal("idempotency_key_reused", (await conflict.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task CancelledPendingInitializationCanResume()
    {
        var client = await AuthenticatedClientAsync("initialize-recovery@example.test");
        var body = InitializeBody("initialize-recovery", new { initializationDelayMilliseconds = 5_000 }, new { }, 3);
        using var cancellation = new CancellationTokenSource();

        var pendingRequest = client.PostAsJsonAsync("/api/module-executions/", body, cancellation.Token);
        await WaitForPendingRequestAsync("initialize-recovery");
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pendingRequest);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pending = await db.ModuleExecutionRequests.SingleAsync(item => item.RequestId == "initialize-recovery");
            Assert.Equal("pending", pending.Status);
            Assert.Equal("initializing", (await db.ModuleExecutions.SingleAsync(item => item.Id == pending.ExecutionId)).Status);
        }

        using var resumed = await client.PostAsJsonAsync("/api/module-executions/", body);
        Assert.Equal(HttpStatusCode.Created, resumed.StatusCode);
        Assert.Equal("active", (await resumed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task OtherOwnerCannotReadOrDispatchExecution()
    {
        var owner = await AuthenticatedClientAsync("owner2@example.test");
        using var create = await owner.PostAsJsonAsync("/api/module-executions/", InitializeBody("owner-init"));
        var id = (await create.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var other = await AuthenticatedClientAsync("other@example.test");

        using var get = await other.GetAsync($"/api/module-executions/{id}");
        using var dispatch = await other.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", DispatchBody("other-dispatch", 0, new { }));
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, dispatch.StatusCode);
    }

    [Fact]
    public async Task DispatchPersistsAcceptedStateAndReplaysUiEvents()
    {
        var client = await AuthenticatedClientAsync("dispatch@example.test");
        var id = await CreateExecutionAsync(client, "dispatch-init");
        var body = DispatchBody("dispatch-1", 0, new { mode = "active" }, 2);

        using var dispatch = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", body);
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, dispatch.StatusCode);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        var result = await dispatch.Content.ReadFromJsonAsync<JsonElement>();
        var replayResult = await replay.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, result.GetProperty("revision").GetInt64());
        Assert.Equal("updated", result.GetProperty("uiEvents")[0].GetProperty("type").GetString());
        Assert.Equal(result.GetRawText(), replayResult.GetRawText());

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, (await db.ModuleExecutions.SingleAsync(item => item.Id == id)).Revision);
        Assert.Equal(2, await db.ModuleExecutionRequests.CountAsync(item => item.ExecutionId == id));
    }

    [Fact]
    public async Task CancelledPendingDispatchResumesWithTheRecordedRequest()
    {
        var client = await AuthenticatedClientAsync("recovery@example.test");
        var id = await CreateExecutionAsync(client, "recovery-init");
        var body = DispatchBody("recover-dispatch", 0, new { id = "continue", mode = "delay", milliseconds = 5_000 }, 1);
        using var cancellation = new CancellationTokenSource();

        var pendingRequest = client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", body, cancellation.Token);
        await WaitForPendingRequestAsync("recover-dispatch");
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pendingRequest);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var pending = await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleExecutionRequests
                .SingleAsync(item => item.RequestId == "recover-dispatch");
            Assert.Equal("pending", pending.Status);
            Assert.Equal(4, JsonSerializer.Deserialize<uint[]>(pending.RandomValuesJson)!.Length);
        }

        using var resumed = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", body);
        Assert.Equal(HttpStatusCode.OK, resumed.StatusCode);
        Assert.Equal(1, (await resumed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("revision").GetInt64());
    }

    [Fact]
    public async Task StaleRevisionIsRecordedAndReplayedWithoutChangingExecution()
    {
        var client = await AuthenticatedClientAsync("stale@example.test");
        var id = await CreateExecutionAsync(client, "stale-init");
        var stale = DispatchBody("stale-dispatch", 4, new { mode = "active" });

        using var first = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", stale);
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", stale);
        Assert.Equal(HttpStatusCode.Conflict, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, replay.StatusCode);
        var error = await first.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("revision_conflict", error.GetProperty("code").GetString());
        Assert.Equal(0, error.GetProperty("currentRevision").GetInt64());
    }

    [Fact]
    public async Task FailedDispatchLeavesSnapshotUnchangedAndCompletionPersistsOrderedOutcome()
    {
        var client = await AuthenticatedClientAsync("outcome@example.test");
        var id = await CreateExecutionAsync(client, "outcome-init");

        using var failed = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", DispatchBody("failed", 0, new { mode = "failed" }));
        Assert.Equal(HttpStatusCode.OK, failed.StatusCode);
        var failedJson = await failed.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, failedJson.GetProperty("revision").GetInt64());
        Assert.Equal("active", failedJson.GetProperty("status").GetString());
        Assert.Equal("action_rejected", failedJson.GetProperty("error").GetProperty("code").GetString());

        using var complete = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", DispatchBody("complete", 0, new { mode = "complete" }));
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);
        var completed = await complete.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("completed", completed.GetProperty("status").GetString());
        Assert.Equal("set-flag", completed.GetProperty("outcome").GetProperty("effects")[0].GetProperty("type").GetString());
        Assert.False(completed.GetProperty("outcome").GetProperty("effects")[0].GetProperty("payload").GetProperty("value").GetBoolean());
        Assert.Equal("set-flag", completed.GetProperty("outcome").GetProperty("effects")[1].GetProperty("type").GetString());
        Assert.True(completed.GetProperty("outcome").GetProperty("effects")[1].GetProperty("payload").GetProperty("value").GetBoolean());
        Assert.Equal("completed", completed.GetProperty("outcome").GetProperty("emittedEvents")[0].GetProperty("type").GetString());
    }

    [Fact]
    public async Task DispatchAgainstCompletedExecutionStoresReplayableRejection()
    {
        var client = await AuthenticatedClientAsync("inactive@example.test");
        var id = await CreateExecutionAsync(client, "inactive-init");
        using var complete = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", DispatchBody("inactive-complete", 0, new { mode = "complete" }));
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);
        var rejectedBody = DispatchBody("inactive-rejected", 1, new { mode = "active" });

        using var rejected = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", rejectedBody);
        using var replay = await client.PostAsJsonAsync($"/api/module-executions/{id}/dispatch", rejectedBody);

        Assert.Equal(HttpStatusCode.Conflict, rejected.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, replay.StatusCode);
        Assert.Equal("execution_not_active", (await replay.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        await using var scope = _factory.Services.CreateAsyncScope();
        Assert.Equal("rejected", (await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().ModuleExecutionRequests
            .SingleAsync(item => item.RequestId == "inactive-rejected")).Status);
    }

    [Fact]
    public async Task ImmediateCompletionAndDisabledPackageAreHandled()
    {
        var client = await AuthenticatedClientAsync("immediate@example.test");
        using var complete = await client.PostAsJsonAsync("/api/module-executions/", InitializeBody("immediate", new { completeOnInitialize = true }, new { }));
        Assert.Equal(HttpStatusCode.Created, complete.StatusCode);
        Assert.Equal("completed", (await complete.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
        await using (var verification = _factory.Services.CreateAsyncScope())
        {
            var db = verification.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(0, await db.ModuleOutcomeApplications.CountAsync());
            Assert.Null((await db.ModuleExecutions.SingleAsync(item => item.SessionTurnId == null)).SessionTurnId);
        }

        var identity = await GetIdentityAsync();
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<IModulePackageService>().SetEnabledAsync(identity.Digest, false, default);
        }
        using var disabled = await client.PostAsJsonAsync("/api/module-executions/", InitializeBody("disabled"));
        Assert.Equal(HttpStatusCode.Conflict, disabled.StatusCode);
        Assert.Equal("package_disabled", (await disabled.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
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

    private async Task<string> CreateExecutionAsync(HttpClient client, string requestId)
    {
        using var response = await client.PostAsJsonAsync("/api/module-executions/", InitializeBody(requestId));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private object InitializeBody(string requestId, object? configuration = null, object? context = null, int randomValueCount = 0)
    {
        var identity = GetIdentityAsync().GetAwaiter().GetResult();
        return new
        {
            requestId,
            moduleId = identity.ModuleId,
            version = identity.Version,
            digest = identity.Digest,
            configuration = configuration ?? new { },
            context = context ?? new { scene = "test" },
            randomValueCount,
        };
    }

    private static object DispatchBody(string requestId, long expectedRevision, object action, int randomValueCount = 0) =>
        new { requestId, expectedRevision, action, randomValueCount };

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
