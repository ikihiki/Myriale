using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class ScenarioTurnRuntimeEndpointTests : IDisposable
{
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-scenario-turn-{Guid.NewGuid():N}.db");
    private readonly TestScenarioTurnAi ai = new();
    private readonly WebApplicationFactory<Program> factory;

    public ScenarioTurnRuntimeEndpointTests()
    {
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IScenarioTurnAi>();
                services.AddSingleton<IScenarioTurnAi>(ai);
            });
        });
    }

    [Fact]
    public async Task DeclarativeDoor_CommitsOnce_AndNarratesFromPostStateAfterRetry()
    {
        ai.NarrativeFailuresRemaining = 1;
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client);
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-door" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var createdJson = await created.Content.ReadFromJsonAsync<JsonElement>();
        var sessionId = createdJson.GetProperty("id").GetString()!;
        Assert.False(string.IsNullOrWhiteSpace(createdJson.GetProperty("scenarioDefinitionVersionId").GetString()));

        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId = "open-door", text = "北の扉を開ける" });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        var acceptedJson = await accepted.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("scenario-turn", acceptedJson.GetProperty("execution").GetProperty("kind").GetString());
        Assert.Equal(1, acceptedJson.GetProperty("execution").GetProperty("schemaVersion").GetInt32());

        var session = await WaitForExecutionAsync(client, sessionId, "succeeded");
        var step = Assert.Single(session.GetProperty("ruleActionSteps").EnumerateArray().ToArray());
        Assert.Equal("completed", step.GetProperty("stage").GetString());
        Assert.Equal("rule-action-step.v1", step.GetProperty("schemaVersion").GetString());
        var snapshot = step.GetProperty("actionSnapshot");
        var objectCodes = snapshot.GetProperty("objects").EnumerateArray().Select(item => item.GetProperty("code").GetString()).ToArray();
        Assert.Contains("north-door", objectCodes);
        Assert.Contains("world-clock", objectCodes);
        Assert.DoesNotContain("cellar-door", objectCodes);
        var door = session.GetProperty("objectStates").EnumerateArray().Single(item => item.GetProperty("code").GetString() == "north-door");
        Assert.True(door.GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal(1, door.GetProperty("revision").GetInt64());
        Assert.Equal(1, ai.DecisionCalls);
        Assert.Equal(2, ai.NarrativeCalls);
        Assert.All(ai.NarrativeRequests, request => Assert.True(request.PostState.Objects.Single(item => item.Code == "north-door").State.GetProperty("open").GetBoolean()));
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
    }

    [Fact]
    public async Task InvalidDecision_IsRejectedBeforeMutation()
    {
        ai.ReturnUnknownAction = true;
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client);
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-invalid" });
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId = "invalid", text = "開ける" });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);

        var session = await WaitForExecutionAsync(client, sessionId, "failed");
        var door = session.GetProperty("objectStates").EnumerateArray().Single(item => item.GetProperty("code").GetString() == "north-door");
        Assert.False(door.GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal(0, door.GetProperty("revision").GetInt64());
        Assert.Equal("unknown_action", session.GetProperty("executions")[0].GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task StaleObjectRevision_IsRejectedBeforeEffects()
    {
        ai.PauseDecision = true;
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client);
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-stale" });
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId = "stale", text = "開ける" });
        await ai.DecisionEntered.Task.WaitAsync(TimeSpan.FromSeconds(10));
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Data.ApplicationDbContext>();
            var state = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
                db.SessionObjectStates.Where(item => item.SessionId == sessionId && item.ScenarioObject.Code == "north-door"));
            state.Revision++;
            await db.SaveChangesAsync();
        }
        ai.DecisionRelease.TrySetResult();

        var session = await WaitForExecutionAsync(client, sessionId, "superseded");
        var door = session.GetProperty("objectStates").EnumerateArray().Single(item => item.GetProperty("code").GetString() == "north-door");
        Assert.False(door.GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal("stale_object_revision", session.GetProperty("executions")[0].GetProperty("errorCode").GetString());
    }

    private async Task<HttpClient> SignedInClientAsync()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Player", email = $"player-{Guid.NewGuid():N}@example.test", password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode); ApplyCookies(client, register); return client;
    }

    private static async Task<string> CreatePublishedDoorScenarioAsync(HttpClient client)
    {
        using var scenario = await client.PostAsJsonAsync("/api/scenarios/", new { title = "Door runtime" });
        var scenarioId = (await scenario.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var payload = JsonSerializer.Deserialize<JsonElement>("""
        {
          "schemaVersion":1,
          "locations":[
            {"code":"start","name":"Hall","description":"","authoringData":{}},
            {"code":"cellar","name":"Cellar","description":"","authoringData":{}}
          ],
          "objectTypes":[{
            "code":"door","name":"Door","description":"","schemaVersion":1,
            "stateSchema":{"type":"object","additionalProperties":false,"properties":{"open":{"type":"boolean"}},"required":["open"]},
            "defaultState":{"open":false},"publicProjection":{"include":["open"]},
            "actions":[{"code":"open","label":"Open","description":"Open the door","argumentSchema":{"type":"object","additionalProperties":false},"availabilityCondition":{},"visibility":"ai-choice","executionMode":"rule"}]
          }],
          "objects":[
            {"code":"north-door","name":"North door","objectTypeCode":"door","locationCode":"start","initialStateOverride":{},"isGlobal":false,"actionRules":[{"actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.open","value":true},{"type":"emit-fact","text":"The north door is open."}],"moduleBinding":null}]},
            {"code":"cellar-door","name":"Cellar door","objectTypeCode":"door","locationCode":"cellar","initialStateOverride":{},"isGlobal":false,"actionRules":[{"actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.open","value":true}],"moduleBinding":null}]},
            {"code":"world-clock","name":"World clock","objectTypeCode":"door","locationCode":"cellar","initialStateOverride":{},"isGlobal":true,"actionRules":[{"actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.open","value":true}],"moduleBinding":null}]}
          ]
        }
        """);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload); Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null); Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        return scenarioId;
    }

    private static async Task<JsonElement> WaitForExecutionAsync(HttpClient client, string sessionId, string status)
    {
        for (var i = 0; i < 120; i++)
        {
            using var response = await client.GetAsync($"/api/sessions/{sessionId}");
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode) throw new Xunit.Sdk.XunitException($"GET session failed {(int)response.StatusCode}: {body}");
            var json = JsonSerializer.Deserialize<JsonElement>(body);
            if (json.GetProperty("executions").GetArrayLength() > 0 && json.GetProperty("executions")[0].GetProperty("status").GetString() == status) return json;
            await Task.Delay(100);
        }
        throw new TimeoutException();
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        foreach (var value in values) client.DefaultRequestHeaders.Add("Cookie", value.Split(';', 2)[0]);
    }

    public void Dispose() { factory.Dispose(); if (File.Exists(dbPath)) File.Delete(dbPath); }

    private sealed class TestScenarioTurnAi : IScenarioTurnAi
    {
        public int DecisionCalls { get; private set; }
        public int NarrativeCalls { get; private set; }
        public int NarrativeFailuresRemaining { get; set; }
        public bool ReturnUnknownAction { get; set; }
        public bool PauseDecision { get; set; }
        public TaskCompletionSource DecisionEntered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public TaskCompletionSource DecisionRelease { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public List<PostStateNarrativeRequest> NarrativeRequests { get; } = [];
        public async Task<NarrativeGeneration<RuleActionDecisionResult>> DecideActionAsync(RuleActionDecisionRequest request, CancellationToken cancellationToken)
        {
            DecisionCalls++;
            if (PauseDecision)
            {
                DecisionEntered.TrySetResult();
                await DecisionRelease.Task.WaitAsync(cancellationToken);
            }
            var northDoorId = request.Snapshot.Objects.Single(item => item.Code == "north-door").Id;
            var action = request.Snapshot.Actions.First(item => item.Enabled && item.ObjectId == northDoorId);
            var result = new RuleActionDecisionResult(ScenarioTurnSchemas.ActionDecision, action.ObjectId, ReturnUnknownAction ? "missing" : action.ActionId, JsonSerializer.Deserialize<JsonElement>("{}"));
            return new NarrativeGeneration<RuleActionDecisionResult>(result, Metadata());
        }
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken)
        {
            NarrativeCalls++; NarrativeRequests.Add(request);
            if (NarrativeFailuresRemaining-- > 0) throw new AiProviderException(AiProviderErrorCodes.Timeout, "retry", true);
            return Task.FromResult(new NarrativeGeneration<PostStateNarrativeResult>(new(ScenarioTurnSchemas.PostStateNarrative, "Door opened", "The north door now stands open."), Metadata()));
        }
        private static AiGenerationMetadata Metadata() => new("test", "deterministic", null, null, null, 1, 1, "stop");
    }
}
