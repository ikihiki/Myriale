using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Data;

namespace Myriale.Api.Tests;

public sealed class SessionAiHistoryEndpointTests : IDisposable
{
    private const string Password = "letters1";
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-history-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> factory;

    public SessionAiHistoryEndpointTests()
    {
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}"));
    }

    [Fact]
    public async Task GetAiHistory_AllowsScenarioAuthorAndAdministrator_HidesFromUnrelatedUser()
    {
        using var authorClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var adminClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var unrelatedClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterAsync(authorClient, "author@example.test");
        await RegisterAsync(adminClient, "admin@example.test");
        await RegisterAsync(unrelatedClient, "unrelated@example.test");

        string sessionId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var authorId = await db.Users.Where(user => user.Email == "author@example.test").Select(user => user.Id).SingleAsync();
            var admin = await users.FindByEmailAsync("admin@example.test") ?? throw new InvalidOperationException();
            Assert.True((await users.AddClaimAsync(admin, new Claim("myriale:admin", "true"))).Succeeded);
            var ownerId = await db.Users.Where(user => user.Email == "unrelated@example.test").Select(user => user.Id).SingleAsync();
            var scenario = await db.Scenarios.OrderBy(item => item.Id).FirstAsync();
            scenario.AuthorId = authorId;
            sessionId = "SES-AI-HISTORY";
            db.Sessions.Add(new Session
            {
                Id = sessionId,
                OwnerId = ownerId,
                ScenarioId = scenario.Id,
                SelectedHero = "hero",
                Status = "active",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            db.SessionExecutions.Add(new SessionExecution
            {
                Id = "EXE-AI-HISTORY",
                SessionId = sessionId,
                Kind = SessionExecutionKinds.ScenarioTurn,
                TriggerType = "player-input",
                TriggerId = "INP-AI-HISTORY",
                Status = SessionExecutionStatuses.Succeeded,
                IdempotencyKey = "ai-history-test",
                PayloadHash = new string('a', 64),
                CreatedAt = DateTimeOffset.UtcNow,
                QueuedAt = DateTimeOffset.UtcNow,
            });
            db.SessionExecutionAttempts.AddRange(
                new SessionExecutionAttempt { Id = "ATT-AI-HISTORY-1", ExecutionId = "EXE-AI-HISTORY", AttemptNumber = 1, Status = "failed", StartedAt = DateTimeOffset.UtcNow },
                new SessionExecutionAttempt { Id = "ATT-AI-HISTORY-2", ExecutionId = "EXE-AI-HISTORY", AttemptNumber = 2, Status = "succeeded", StartedAt = DateTimeOffset.UtcNow });
            var baseTime = new DateTimeOffset(2026, 7, 30, 10, 0, 0, TimeSpan.Zero);
            db.SessionAiInteractions.AddRange(
                Interaction("AII-NARRATIVE", "ATT-AI-HISTORY-2", 2, SessionAiInteractionStages.Narrative, baseTime.AddSeconds(2), "narrative prompt", "narrative result"),
                Interaction("AII-ACTION", "ATT-AI-HISTORY-1", 1, SessionAiInteractionStages.ActionDecision, baseTime, "action prompt", "action result"));
            await db.SaveChangesAsync();
        }
        await LoginAsync(adminClient, "admin@example.test");

        using var authorResponse = await authorClient.GetAsync($"/api/sessions/{sessionId}/ai-history");
        Assert.Equal(HttpStatusCode.OK, authorResponse.StatusCode);
        var history = await authorResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(sessionId, history.GetProperty("sessionId").GetString());
        Assert.False(string.IsNullOrWhiteSpace(history.GetProperty("scenarioId").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(history.GetProperty("scenarioTitle").GetString()));
        var interactions = history.GetProperty("interactions");
        Assert.Equal(["AII-ACTION", "AII-NARRATIVE"], interactions.EnumerateArray().Select(item => item.GetProperty("id").GetString()!).ToArray());
        var action = interactions[0];
        Assert.Equal("EXE-AI-HISTORY", action.GetProperty("executionId").GetString());
        Assert.Equal("profile-test", action.GetProperty("aiProfileId").GetString());
        Assert.Equal("provider-test", action.GetProperty("provider").GetString());
        Assert.Equal("model-test", action.GetProperty("model").GetString());
        Assert.Equal("request-AII-ACTION", action.GetProperty("providerRequestId").GetString());
        Assert.Equal(11, action.GetProperty("inputTokens").GetInt32());
        Assert.Equal(7, action.GetProperty("outputTokens").GetInt32());
        Assert.Equal("action prompt", action.GetProperty("sentPrompt").GetString());
        Assert.Equal("action result", action.GetProperty("receivedResult").GetString());
        Assert.False(action.TryGetProperty("attemptId", out _));
        Assert.False(action.TryGetProperty("workerId", out _));
        Assert.False(action.TryGetProperty("traceId", out _));
        Assert.False(action.TryGetProperty("correlationId", out _));
        Assert.False(action.TryGetProperty("exceptionChain", out _));

        using var adminResponse = await adminClient.GetAsync($"/api/sessions/{sessionId}/ai-history");
        Assert.Equal(HttpStatusCode.OK, adminResponse.StatusCode);

        using var unrelatedResponse = await unrelatedClient.GetAsync($"/api/sessions/{sessionId}/ai-history");
        Assert.Equal(HttpStatusCode.NotFound, unrelatedResponse.StatusCode);
        using var missingResponse = await unrelatedClient.GetAsync("/api/sessions/SES-MISSING/ai-history");
        Assert.Equal(HttpStatusCode.NotFound, missingResponse.StatusCode);
    }

    private static SessionAiInteraction Interaction(string id, string attemptId, int sequence, string stage, DateTimeOffset startedAt, string prompt, string result) => new()
    {
        Id = id,
        SessionId = "SES-AI-HISTORY",
        ExecutionId = "EXE-AI-HISTORY",
        AttemptId = attemptId,
        Sequence = sequence,
        Stage = stage,
        AiProfileId = "profile-test",
        Provider = "provider-test",
        Model = "model-test",
        ProviderRequestId = $"request-{id}",
        StartedAt = startedAt,
        CompletedAt = startedAt.AddMilliseconds(25),
        LatencyMilliseconds = 25,
        InputTokens = 11,
        OutputTokens = 7,
        FinishReason = "stop",
        Status = SessionAiInteractionStatuses.Succeeded,
        SentPrompt = prompt,
        ReceivedResult = result,
        ValidationResult = "{\"status\":\"valid\"}",
    };

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/account/register", new { displayName = email, email, password = Password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        ApplyCookies(client, response);
    }

    private static async Task LoginAsync(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/account/login", new { email, password = Password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        ApplyCookies(client, response);
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", string.Join("; ", values.Select(value => value.Split(';', 2)[0])));
    }

    public void Dispose()
    {
        factory.Dispose();
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }
}
