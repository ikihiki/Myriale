using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class RealProviderSessionLoopTests : IDisposable
{
    private static readonly TimeSpan ExecutionTimeout = TimeSpan.FromMinutes(20);
    private readonly string root = Path.Combine(Path.GetTempPath(), $"myriale-real-provider-loop-{Guid.NewGuid():N}");
    private WebApplicationFactory<Program>? factory;

    [Fact]
    [Trait("Category", "RealProviderEvaluation")]
    public async Task TwoTurnsFlowThroughApiWorkerAndPersistenceWhenExplicitlyEnabled()
    {
        if (!IsEnabled(Environment.GetEnvironmentVariable("AI_EVAL_SESSION_LOOP_ENABLED"))) return;

        var provider = Required("AI_PROVIDER").Trim().ToLowerInvariant();
        Assert.Contains(provider, new[] { "openai", "runpod" });
        var model = Required("AI_MODEL");
        var apiKey = Required("AI_API_KEY");
        var baseUrl = Environment.GetEnvironmentVariable("AI_BASE_URL");
        if (provider == "runpod") Assert.False(string.IsNullOrWhiteSpace(baseUrl), "AI_BASE_URL is required for runpod evaluation.");

        Directory.CreateDirectory(root);
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={Path.Combine(root, "myriale.db")}");
            builder.UseSetting("Modules:StoragePath", Path.Combine(root, "modules"));
            builder.UseSetting("AiProvider:Provider", provider);
            builder.UseSetting("AiProvider:Model", model);
            builder.UseSetting("AiProvider:ApiKey", apiKey);
            if (!string.IsNullOrWhiteSpace(baseUrl)) builder.UseSetting("AiProvider:BaseUrl", baseUrl);
            builder.UseSetting("AiProvider:TimeoutSeconds", ReadBoundedInt("AI_EVAL_TIMEOUT_SECONDS", 900, 30, 3600).ToString());
            builder.UseSetting("AiProvider:MaxAttempts", ReadBoundedInt("AI_EVAL_PROVIDER_ATTEMPTS", 2, 1, 5).ToString());
        });

        using var client = await AuthenticatedClientAsync(factory, "real-provider-loop@example.test");
        using var created = await client.PostAsJsonAsync("/api/sessions/", new
        {
            requestId = "real-provider-loop-session",
            scenarioId = "SCN-STAR-LIBRARY",
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var createdSession = await created.Content.ReadFromJsonAsync<JsonElement>();
        var sessionId = createdSession.GetProperty("id").GetString()!;
        var openingTurnId = createdSession.GetProperty("headTurnId").GetString()!;

        var first = await SubmitAndWaitAsync(client, sessionId, "real-provider-loop-turn-1", "閉じた扉を調べる。まだ開けない。");
        var firstTurnId = first.GetProperty("id").GetString()!;
        Assert.Equal(openingTurnId, first.GetProperty("previousTurnId").GetString());
        Assert.Equal("閉じた扉を調べる。まだ開けない。", first.GetProperty("narrative").GetProperty("playerInput").GetString());
        Assert.False(string.IsNullOrWhiteSpace(first.GetProperty("narrative").GetProperty("body").GetString()));

        var afterFirstReload = await GetSessionAsync(client, sessionId);
        Assert.Equal(firstTurnId, afterFirstReload.GetProperty("headTurnId").GetString());
        Assert.Equal(2, afterFirstReload.GetProperty("turns").GetArrayLength());

        var second = await SubmitAndWaitAsync(client, sessionId, "real-provider-loop-turn-2", "司書リラに、今見えている青い魔法灯について尋ねる。");
        var secondTurnId = second.GetProperty("id").GetString()!;
        Assert.Equal(firstTurnId, second.GetProperty("previousTurnId").GetString());
        Assert.False(string.IsNullOrWhiteSpace(second.GetProperty("narrative").GetProperty("body").GetString()));

        var reloaded = await GetSessionAsync(client, sessionId);
        var turns = reloaded.GetProperty("turns").EnumerateArray().ToArray();
        Assert.Equal(3, turns.Length);
        Assert.Equal(secondTurnId, reloaded.GetProperty("headTurnId").GetString());
        Assert.Equal(new[] { openingTurnId, firstTurnId, secondTurnId }, turns.Select(turn => turn.GetProperty("id").GetString()!).ToArray());
        Assert.Equal(firstTurnId, turns[2].GetProperty("previousTurnId").GetString());
        Assert.Empty(reloaded.GetProperty("pendingInputs").EnumerateArray());

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(2, await db.SessionPlayerInputs.CountAsync(item => item.SessionId == sessionId));
        Assert.Equal(2, await db.SessionExecutions.CountAsync(item => item.SessionId == sessionId && item.Kind == SessionExecutionKinds.Narrative && item.Status == SessionExecutionStatuses.Succeeded));
        Assert.Equal(3, await db.SessionTurns.CountAsync(item => item.SessionId == sessionId));
        var persistedTurns = await db.SessionTurns.Where(item => item.SessionId == sessionId && item.PlayerInputId != null).OrderBy(item => item.Position).ToArrayAsync();
        Assert.Equal(2, persistedTurns.Length);
        Assert.Equal(firstTurnId, persistedTurns[1].PreviousTurnId);
        Assert.NotEqual(persistedTurns[0].ContextHash, persistedTurns[1].ContextHash);
        Assert.Equal(2, await db.SessionArtifacts.CountAsync(item => item.SessionId == sessionId && item.Kind == "narrative-text"));
    }

    private static async Task<JsonElement> SubmitAndWaitAsync(HttpClient client, string sessionId, string requestId, string text)
    {
        using var response = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId, text });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var accepted = await response.Content.ReadFromJsonAsync<JsonElement>();
        var inputId = accepted.GetProperty("input").GetProperty("id").GetString()!;
        var executionId = accepted.GetProperty("execution").GetProperty("id").GetString()!;
        var deadline = DateTimeOffset.UtcNow + ExecutionTimeout;
        while (DateTimeOffset.UtcNow < deadline)
        {
            using var executionResponse = await client.GetAsync($"/api/session-executions/{executionId}");
            Assert.Equal(HttpStatusCode.OK, executionResponse.StatusCode);
            var execution = await executionResponse.Content.ReadFromJsonAsync<JsonElement>();
            var status = execution.GetProperty("status").GetString();
            if (status == SessionExecutionStatuses.Succeeded)
            {
                var session = await GetSessionAsync(client, sessionId);
                var publishedTurn = session.GetProperty("turns").EnumerateArray().FirstOrDefault(turn =>
                    turn.TryGetProperty("narrative", out var narrative)
                    && narrative.TryGetProperty("playerInputId", out var publishedInputId)
                    && string.Equals(publishedInputId.GetString(), inputId, StringComparison.Ordinal));
                if (publishedTurn.ValueKind != JsonValueKind.Undefined) return publishedTurn;
            }
            if (status is SessionExecutionStatuses.Failed or SessionExecutionStatuses.Cancelled or SessionExecutionStatuses.Superseded)
            {
                var errorCode = execution.TryGetProperty("errorCode", out var error) ? error.GetString() : null;
                Assert.Fail($"Real-provider session execution ended with sanitized status '{status}' and error code '{errorCode ?? "none"}'.");
            }
            await Task.Delay(500);
        }
        Assert.Fail("Real-provider session execution did not complete before the configured test timeout.");
        return default;
    }

    private static async Task<JsonElement> GetSessionAsync(HttpClient client, string sessionId)
    {
        using var response = await client.GetAsync($"/api/sessions/{sessionId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<HttpClient> AuthenticatedClientAsync(WebApplicationFactory<Program> testFactory, string email)
    {
        var client = testFactory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var response = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Provider Gate", email, password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        if (response.Headers.TryGetValues("Set-Cookie", out var values))
            client.DefaultRequestHeaders.Add("Cookie", values.First().Split(';', 2)[0]);
        return client;
    }

    private static bool IsEnabled(string? value) => value is "1" || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
    private static string Required(string name) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value
        ? value
        : throw new InvalidOperationException($"{name} is required when AI_EVAL_SESSION_LOOP_ENABLED is true.");
    private static int ReadBoundedInt(string name, int fallback, int minimum, int maximum) =>
        int.TryParse(Environment.GetEnvironmentVariable(name), out var value) ? Math.Clamp(value, minimum, maximum) : fallback;

    public void Dispose()
    {
        factory?.Dispose();
        try { if (Directory.Exists(root)) Directory.Delete(root, true); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
}
