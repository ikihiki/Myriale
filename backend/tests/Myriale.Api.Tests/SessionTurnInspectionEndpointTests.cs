using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Tests;

public sealed class SessionTurnInspectionEndpointTests : IDisposable
{
    private const string Password = "letters1";
    private const string SessionId = "SES-INSPECTION";
    private const string TurnId = "TUR-INSPECTION";
    private const string InputId = "INP-INSPECTION";
    private const string ExecutionId = "EXE-INSPECTION";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-turn-inspection-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> factory;

    public SessionTurnInspectionEndpointTests()
    {
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}"));
    }

    [Fact]
    public async Task GetTurnInspection_AllowsAuthorAndAdministrator_ReturnsScopedAiAndRuleDetails()
    {
        using var authorClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var adminClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var unrelatedClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterAsync(authorClient, "author@example.test");
        await RegisterAsync(adminClient, "admin@example.test");
        await RegisterAsync(unrelatedClient, "unrelated@example.test");
        await SeedAsync();
        await LoginAsync(adminClient, "admin@example.test");

        using var authorResponse = await authorClient.GetAsync($"/api/sessions/{SessionId}/turns/{TurnId}/inspection");
        Assert.Equal(HttpStatusCode.OK, authorResponse.StatusCode);
        var inspection = await authorResponse.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(SessionId, inspection.GetProperty("session").GetProperty("id").GetString());
        Assert.False(string.IsNullOrWhiteSpace(inspection.GetProperty("scenario").GetProperty("title").GetString()));
        Assert.Equal(TurnId, inspection.GetProperty("turn").GetProperty("id").GetString());
        Assert.Equal("The north door opens.", inspection.GetProperty("turn").GetProperty("narrativeBody").GetString());
        var playerInput = inspection.GetProperty("playerInput");
        Assert.Equal(InputId, playerInput.GetProperty("id").GetString());
        Assert.Equal("Open the north door", playerInput.GetProperty("text").GetString());
        Assert.Equal(new DateTimeOffset(2026, 7, 30, 10, 0, 0, TimeSpan.Zero), playerInput.GetProperty("acceptedAt").GetDateTimeOffset());

        var execution = inspection.GetProperty("execution");
        Assert.Equal(ExecutionId, execution.GetProperty("id").GetString());
        Assert.Equal(900, execution.GetProperty("elapsedMilliseconds").GetInt64());
        Assert.False(execution.TryGetProperty("leaseOwner", out _));
        Assert.False(execution.TryGetProperty("traceParent", out _));
        Assert.False(execution.TryGetProperty("userErrorMessage", out _));

        var interactions = inspection.GetProperty("aiInteractions");
        Assert.Equal(["AII-ACTION", "AII-NARRATIVE"], interactions.EnumerateArray().Select(item => item.GetProperty("id").GetString()!).ToArray());
        Assert.Equal([1, 2], interactions.EnumerateArray().Select(item => item.GetProperty("attemptNumber").GetInt32()).ToArray());
        Assert.Equal(25, interactions[0].GetProperty("elapsedMilliseconds").GetInt64());
        Assert.Equal(25, interactions[0].GetProperty("latencyMilliseconds").GetInt64());
        Assert.Equal("action prompt", interactions[0].GetProperty("sentPrompt").GetString());
        Assert.DoesNotContain(interactions.EnumerateArray(), item => item.GetProperty("id").GetString() == "AII-OTHER-TURN");
        Assert.False(interactions[0].TryGetProperty("executionAttemptId", out _));
        Assert.False(interactions[0].TryGetProperty("workerId", out _));
        Assert.False(interactions[0].TryGetProperty("traceId", out _));
        Assert.False(interactions[0].TryGetProperty("exceptionChain", out _));

        var rule = inspection.GetProperty("ruleEngine");
        Assert.Equal("OBJ-DOOR", rule.GetProperty("selectedAction").GetProperty("objectId").GetString());
        Assert.Equal("ACT-OPEN", rule.GetProperty("selectedAction").GetProperty("actionId").GetString());
        Assert.Equal("north-door", rule.GetProperty("selectedAction").GetProperty("objectCode").GetString());
        Assert.Equal("open", rule.GetProperty("selectedAction").GetProperty("actionCode").GetString());
        Assert.False(rule.GetProperty("actionSnapshot").GetProperty("objects")[0].GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal("set-state", rule.GetProperty("appliedEffects")[0].GetProperty("type").GetString());
        Assert.True(rule.GetProperty("postState").GetProperty("objects")[0].GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal("The door is open.", rule.GetProperty("facts")[0].GetString());
        Assert.Equal("door-opened", rule.GetProperty("events")[0].GetProperty("type").GetString());
        Assert.Equal("Describe the opened door.", rule.GetProperty("hints")[0].GetString());
        Assert.Contains(rule.GetProperty("changes").EnumerateArray(), change =>
            change.GetProperty("kind").GetString() == "object"
            && change.GetProperty("targetId").GetString() == "OBJ-DOOR"
            && change.GetProperty("path").GetString() == "state.open"
            && !change.GetProperty("before").GetBoolean()
            && change.GetProperty("after").GetBoolean());
        var timing = rule.GetProperty("timing");
        Assert.Equal(100, timing.GetProperty("enumerationElapsedMilliseconds").GetInt64());
        Assert.Equal(150, timing.GetProperty("selectionElapsedMilliseconds").GetInt64());
        Assert.Equal(250, timing.GetProperty("applicationElapsedMilliseconds").GetInt64());
        Assert.Equal(400, timing.GetProperty("narrativeElapsedMilliseconds").GetInt64());
        Assert.Equal(900, timing.GetProperty("totalElapsedMilliseconds").GetInt64());

        using var adminResponse = await adminClient.GetAsync($"/api/sessions/{SessionId}/turns/{TurnId}/inspection");
        Assert.Equal(HttpStatusCode.OK, adminResponse.StatusCode);
        using var unrelatedResponse = await unrelatedClient.GetAsync($"/api/sessions/{SessionId}/turns/{TurnId}/inspection");
        Assert.Equal(HttpStatusCode.NotFound, unrelatedResponse.StatusCode);
    }

    [Fact]
    public async Task GetTurnInspection_ReturnsNotFoundForMissingUnrelatedOrNonInspectableTurn()
    {
        using var authorClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterAsync(authorClient, "author@example.test");
        await SeedAsync();

        using var missing = await authorClient.GetAsync($"/api/sessions/{SessionId}/turns/TUR-MISSING/inspection");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        using var unrelated = await authorClient.GetAsync($"/api/sessions/{SessionId}/turns/TUR-OTHER-SESSION/inspection");
        Assert.Equal(HttpStatusCode.NotFound, unrelated.StatusCode);
        using var noInput = await authorClient.GetAsync($"/api/sessions/{SessionId}/turns/TUR-NO-INPUT/inspection");
        Assert.Equal(HttpStatusCode.NotFound, noInput.StatusCode);
    }

    private async Task SeedAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var authorId = await db.Users.Where(user => user.Email == "author@example.test").Select(user => user.Id).SingleAsync();
        var admin = await users.FindByEmailAsync("admin@example.test");
        if (admin is not null) Assert.True((await users.AddClaimAsync(admin, new Claim("myriale:admin", "true"))).Succeeded);
        var ownerId = await db.Users.Where(user => user.Email == "author@example.test").Select(user => user.Id).SingleAsync();
        var scenario = await db.Scenarios.OrderBy(item => item.Id).FirstAsync();
        scenario.AuthorId = authorId;
        var baseTime = new DateTimeOffset(2026, 7, 30, 10, 0, 0, TimeSpan.Zero);

        db.Sessions.AddRange(
            new Session { Id = SessionId, OwnerId = ownerId, ScenarioId = scenario.Id, ScenarioDefinitionVersionId = null, SelectedHero = "hero", Status = SessionStatus.Active, Revision = 8, CreatedAt = baseTime.AddMinutes(-2), UpdatedAt = baseTime.AddSeconds(1) },
            new Session { Id = "SES-OTHER", OwnerId = ownerId, ScenarioId = scenario.Id, SelectedHero = "hero", Status = SessionStatus.Active, CreatedAt = baseTime, UpdatedAt = baseTime });
        db.SessionPlayerInputs.AddRange(
            Input(InputId, SessionId, "Open the north door", baseTime),
            Input("INP-OTHER-TURN", SessionId, "Inspect the hall", baseTime.AddSeconds(2)),
            Input("INP-OTHER-SESSION", "SES-OTHER", "Other session", baseTime));
        db.SessionTurns.AddRange(
            new SessionTurn { Id = TurnId, SessionId = SessionId, Position = 1, Kind = SessionTurnKind.Narrative, Heading = "Opened", NarrativeBody = "The north door opens.", PlayerInputId = InputId, CreatedAt = baseTime.AddSeconds(1) },
            new SessionTurn { Id = "TUR-OTHER-TURN", SessionId = SessionId, Position = 2, PreviousTurnId = TurnId, Kind = SessionTurnKind.Narrative, PlayerInputId = "INP-OTHER-TURN", CreatedAt = baseTime.AddSeconds(3) },
            new SessionTurn { Id = "TUR-NO-INPUT", SessionId = SessionId, Position = 3, PreviousTurnId = "TUR-OTHER-TURN", Kind = SessionTurnKind.Module, CreatedAt = baseTime.AddSeconds(4) },
            new SessionTurn { Id = "TUR-OTHER-SESSION", SessionId = "SES-OTHER", Position = 1, Kind = SessionTurnKind.Narrative, PlayerInputId = "INP-OTHER-SESSION", CreatedAt = baseTime.AddSeconds(1) });
        db.SessionExecutions.AddRange(
            Execution(ExecutionId, SessionId, InputId, baseTime),
            Execution("EXE-OTHER-TURN", SessionId, "INP-OTHER-TURN", baseTime.AddSeconds(2)),
            Execution("EXE-OTHER-SESSION", "SES-OTHER", "INP-OTHER-SESSION", baseTime));
        db.SessionExecutionAttempts.AddRange(
            Attempt("ATT-INSPECTION-1", ExecutionId, 1, baseTime),
            Attempt("ATT-INSPECTION-2", ExecutionId, 2, baseTime.AddMilliseconds(500)),
            Attempt("ATT-OTHER-TURN", "EXE-OTHER-TURN", 1, baseTime.AddSeconds(2)));
        db.SessionAiInteractions.AddRange(
            Interaction("AII-NARRATIVE", ExecutionId, "ATT-INSPECTION-2", 2, SessionAiInteractionStages.Narrative, baseTime.AddMilliseconds(600), "narrative prompt", "narrative result"),
            Interaction("AII-ACTION", ExecutionId, "ATT-INSPECTION-1", 1, SessionAiInteractionStages.ActionDecision, baseTime.AddMilliseconds(200), "action prompt", "action result"),
            Interaction("AII-OTHER-TURN", "EXE-OTHER-TURN", "ATT-OTHER-TURN", 1, SessionAiInteractionStages.Narrative, baseTime.AddSeconds(2), "other prompt", "other result"));
        db.SessionRuleActionSteps.Add(RuleStep(baseTime));
        await db.SaveChangesAsync();
    }

    private static SessionPlayerInput Input(string id, string sessionId, string text, DateTimeOffset createdAt) => new()
    {
        Id = id, SessionId = sessionId, RequestId = $"request-{id}", Text = text, InteractionType = SessionInputInteractionType.Dialogue,
        PayloadHash = new string('b', 64), CreatedBy = "test", CreatedAt = createdAt,
    };

    private static SessionExecution Execution(string id, string sessionId, string inputId, DateTimeOffset startedAt) => new()
    {
        Id = id, SessionId = sessionId, Kind = SessionExecutionKinds.ScenarioTurn, TriggerType = SessionExecutionTriggerType.PlayerInput, TriggerId = inputId,
        Status = SessionExecutionStatuses.Succeeded, Stage = ScenarioTurnStage.Completed.ToWireValue(), AttemptCount = id == ExecutionId ? 2 : 1,
        IdempotencyKey = id, PayloadHash = new string('a', 64), CreatedAt = startedAt, QueuedAt = startedAt,
        StartedAt = startedAt, CompletedAt = startedAt.AddMilliseconds(900),
    };

    private static SessionExecutionAttempt Attempt(string id, string executionId, int number, DateTimeOffset startedAt) => new()
    {
        Id = id, ExecutionId = executionId, AttemptNumber = number, Status = "succeeded", StartedAt = startedAt, CompletedAt = startedAt.AddMilliseconds(100),
    };

    private static SessionAiInteraction Interaction(string id, string executionId, string attemptId, int sequence, string stage, DateTimeOffset startedAt, string prompt, string result) => new()
    {
        Id = id, SessionId = executionId == "EXE-OTHER-SESSION" ? "SES-OTHER" : SessionId, ExecutionId = executionId, AttemptId = attemptId,
        Sequence = sequence, Stage = stage, AiProfileId = "profile-test", Provider = "provider-test", Model = "model-test",
        ProviderRequestId = $"request-{id}", StartedAt = startedAt, CompletedAt = startedAt.AddMilliseconds(25), LatencyMilliseconds = 25,
        InputTokens = 11, OutputTokens = 7, FinishReason = "stop", Status = SessionAiInteractionStatuses.Succeeded,
        SentPrompt = prompt, ReceivedResult = result, ValidationResult = "{\"status\":\"valid\"}",
    };

    private static SessionRuleActionStep RuleStep(DateTimeOffset createdAt)
    {
        var location = new RulePublicLocation("LOC-HALL", "hall", "Hall", "A stone hall");
        var beforeObject = new RulePublicObject("OBJ-DOOR", "north-door", "North Door", location.Id, false, 0, JsonSerializer.SerializeToElement(new { open = false }));
        var afterObject = beforeObject with { Revision = 1, State = JsonSerializer.SerializeToElement(new { open = true }) };
        var snapshot = new RuleActionSnapshot(
            ScenarioTurnSchemas.ActionSnapshot,
            "snapshot-1",
            location,
            [beforeObject],
            [new RulePublicAction(beforeObject.Id, "ACT-OPEN", "open", "Open", "Open the door", JsonSerializer.SerializeToElement(new { type = "object" }), true)]);
        var decision = new RuleActionDecisionResult(ScenarioTurnSchemas.ActionDecision, beforeObject.Id, "ACT-OPEN", JsonSerializer.SerializeToElement(new { force = true }));
        var effects = new[] { new RuleAppliedEffect("set-state", beforeObject.Id, "state.open", JsonSerializer.SerializeToElement(true)) };
        var postState = new RulePostState(ScenarioTurnSchemas.PostStateNarrative, location, [afterObject], new Dictionary<string, bool>(), 8);
        var step = SessionRuleActionStep.CreateSnapshot(
            "RAS-INSPECTION", SessionId, ExecutionId, InputId, "SDV-TEST", 7,
            "{\"OBJ-DOOR\":0}", JsonSerializer.Serialize(snapshot, Json), createdAt.AddMilliseconds(100), createdAt);
        step.RecordDecision(JsonSerializer.Serialize(decision, Json), createdAt.AddMilliseconds(250));
        step.RecordResolution("RULE-OPEN", "{}", false, createdAt.AddMilliseconds(300));
        step.CommitEffects(7, 8, JsonSerializer.Serialize(effects, Json), JsonSerializer.Serialize(postState, Json),
            "[\"The door is open.\"]", "[{\"type\":\"door-opened\"}]", "[\"Describe the opened door.\"]", "[]",
            createdAt.AddMilliseconds(500));
        step.PublishNarrative(createdAt.AddMilliseconds(900));
        return step;
    }

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
