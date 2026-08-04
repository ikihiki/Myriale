using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Myriale.Api.Application.Scenarios;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
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
            builder.UseSetting("DemoModules:Enabled", "true");
            builder.UseSetting("DemoModules:EnableInTestHost", "true");
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
        using var profilesResponse = await client.GetAsync("/api/ai/profiles");
        Assert.Equal(HttpStatusCode.OK, profilesResponse.StatusCode);
        var profilesBody = await profilesResponse.Content.ReadAsStringAsync();
        var profilesJson = JsonSerializer.Deserialize<JsonElement>(profilesBody);
        Assert.Equal(2, profilesJson.GetProperty("profiles").GetArrayLength());
        Assert.Contains("推奨（Deckard 40B AWQ）", profilesBody, StringComparison.Ordinal);
        Assert.DoesNotContain("api.runpod.ai", profilesBody, StringComparison.Ordinal);
        Assert.DoesNotContain("Model", profilesBody, StringComparison.OrdinalIgnoreCase);

        var scenarioId = await CreatePublishedDoorScenarioAsync(client, "start");
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-door" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var createdJson = await created.Content.ReadFromJsonAsync<JsonElement>();
        var sessionId = createdJson.GetProperty("id").GetString()!;
        Assert.False(string.IsNullOrWhiteSpace(createdJson.GetProperty("scenarioDefinitionVersionId").GetString()));

        using var invalidProfile = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new
        {
            requestId = "invalid-profile",
            text = "北の扉を開ける",
            actionDecisionAiProfileId = "missing-profile",
            narrativeAiProfileId = "runpod-recommended",
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalidProfile.StatusCode);

        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new
        {
            requestId = "open-door",
            text = "北の扉を開ける",
            actionDecisionAiProfileId = "runpod-economy",
            narrativeAiProfileId = "runpod-recommended",
        });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        var acceptedJson = await accepted.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("scenario-turn", acceptedJson.GetProperty("execution").GetProperty("kind").GetString());
        Assert.Equal("runpod-economy", acceptedJson.GetProperty("execution").GetProperty("actionDecisionAiProfileId").GetString());
        Assert.Equal("runpod-recommended", acceptedJson.GetProperty("execution").GetProperty("narrativeAiProfileId").GetString());
        using var mismatchedReplay = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new
        {
            requestId = "open-door",
            text = "北の扉を開ける",
            actionDecisionAiProfileId = "runpod-recommended",
            narrativeAiProfileId = "runpod-recommended",
        });
        Assert.Equal(HttpStatusCode.Conflict, mismatchedReplay.StatusCode);

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
        Assert.Equal(["runpod-economy"], ai.DecisionProfileIds);
        Assert.Equal(["runpod-recommended", "runpod-recommended"], ai.NarrativeProfileIds);
        Assert.All(ai.NarrativeRequests, request => Assert.True(request.PostState.Objects.Single(item => item.Code == "north-door").State.GetProperty("open").GetBoolean()));
        Assert.All(ai.NarrativeRequests, request => Assert.Contains(request.Scenario.Entities, entity => entity.Code == "north-door" && entity.ProfileMarkdown.Contains("stone door", StringComparison.Ordinal)));
        await using var verificationScope = factory.Services.CreateAsyncScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await verificationDb.SessionArtifacts.CountAsync(item => item.SessionId == sessionId && item.Kind == SessionArtifactKind.RuleActionStep));
        Assert.Equal(1, await verificationDb.SessionArtifacts.CountAsync(item => item.SessionId == sessionId && item.Kind == SessionArtifactKind.PostStateNarrative));
        Assert.Equal(1, await verificationDb.SessionRuleActionSteps.CountAsync(item => item.SessionId == sessionId && item.AppliedAt != null));
        Assert.Equal(2, session.GetProperty("turns").GetArrayLength());
    }

    [Fact]
    public async Task ScenarioTurn_PersistsSuccessfulAndFailedAiInteractionsWithoutDuplicates()
    {
        ai.NarrativeFailuresRemaining = 1;
        using var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client, "start");
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-ai-history" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new
        {
            requestId = "ai-history-turn",
            text = "北の扉を開ける",
            actionDecisionAiProfileId = "runpod-economy",
            narrativeAiProfileId = "runpod-recommended",
        });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        var completedSession = await WaitForExecutionAsync(client, sessionId, "succeeded");
        var turnId = completedSession.GetProperty("turns").EnumerateArray()
            .Single(turn => turn.GetProperty("narrative").TryGetProperty("playerInputId", out var inputId) && inputId.ValueKind == JsonValueKind.String)
            .GetProperty("id").GetString()!;

        using var historyResponse = await client.GetAsync($"/api/sessions/{sessionId}/turns/{turnId}/inspection");
        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);
        var history = await historyResponse.Content.ReadFromJsonAsync<JsonElement>();
        var interactionsJson = history.GetProperty("aiInteractions");
        Assert.Equal(3, interactionsJson.GetArrayLength());
        Assert.Equal(["action-decision", "narrative", "narrative"], interactionsJson.EnumerateArray().Select(item => item.GetProperty("stage").GetString()!).ToArray());
        Assert.Equal(["succeeded", "failed", "succeeded"], interactionsJson.EnumerateArray().Select(item => item.GetProperty("status").GetString()!).ToArray());
        Assert.Equal("action prompt", interactionsJson[0].GetProperty("sentPrompt").GetString());
        Assert.Equal("action result", interactionsJson[0].GetProperty("receivedResult").GetString());
        Assert.Equal("partial result", interactionsJson[1].GetProperty("receivedResult").GetString());
        Assert.Equal("narrative result", interactionsJson[2].GetProperty("receivedResult").GetString());

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Data.ApplicationDbContext>();
        var interactions = await db.SessionAiInteractions.Where(item => item.SessionId == sessionId).ToListAsync();
        Assert.Equal(3, interactions.Count);
        Assert.Equal(interactions.Count, interactions.Select(item => (item.AttemptId, item.Stage)).Distinct().Count());
    }

    [Fact]
    public async Task WestDoor_OpenAndExit_MovesSessionAndProjectsCommittedExecutionAfterRetry()
    {
        ai.NarrativeFailuresRemaining = 1;
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedWestDoorScenarioAsync(client);
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-west-door" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId = "open-west-door", text = "西の扉を開けて外に出る" });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        var session = await WaitForExecutionAsync(client, sessionId, "succeeded");

        var currentLocationId = session.GetProperty("currentLocationId").GetString();
        Assert.False(string.IsNullOrWhiteSpace(currentLocationId));
        var westDoor = session.GetProperty("objectStates").EnumerateArray().Single(item => item.GetProperty("code").GetString() == "west-door");
        Assert.True(westDoor.GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal(1, westDoor.GetProperty("revision").GetInt64());

        var executionProjection = session.GetProperty("executions")[0].GetProperty("scenarioTurn");
        Assert.Equal("west-door", executionProjection.GetProperty("selectedAction").GetProperty("objectCode").GetString());
        Assert.Equal("open-and-exit", executionProjection.GetProperty("selectedAction").GetProperty("actionCode").GetString());
        var postState = executionProjection.GetProperty("postState");
        Assert.Equal(currentLocationId, postState.GetProperty("currentLocation").GetProperty("id").GetString());
        Assert.Equal("outside", postState.GetProperty("currentLocation").GetProperty("code").GetString());
        Assert.Contains(postState.GetProperty("objects").EnumerateArray(), item => item.GetProperty("code").GetString() == "outside-antenna");
        Assert.DoesNotContain(postState.GetProperty("objects").EnumerateArray(), item => item.GetProperty("code").GetString() == "west-door");
        Assert.Contains(postState.GetProperty("facts").EnumerateArray(), item => item.GetString() == "プレイヤーは研究施設の外へ出た。");

        Assert.Equal(1, ai.DecisionCalls);
        Assert.Equal(2, ai.NarrativeCalls);
        Assert.All(ai.NarrativeRequests, request =>
        {
            Assert.Equal("west-door", request.SelectedObject.Code);
            Assert.Equal("outside", request.PostState.CurrentLocation.Code);
        });
    }

    [Fact]
    public async Task SessionCreation_UsesOnlyPinnedDefinitionProgressionGraphAndSnapshots()
    {
        var client = await SignedInClientAsync();
        string draftId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var drafts = scope.ServiceProvider.GetRequiredService<ScenarioDefinitionDraftService>();
            draftId = (await drafts.GetOrCreateDraftAsync("SCN-STAR-LIBRARY", CancellationToken.None)).Id;
        }

        using var created = await client.PostAsJsonAsync("/api/sessions/", new
        {
            scenarioId = "SCN-STAR-LIBRARY",
            requestId = $"pinned-progression-{Guid.NewGuid():N}",
        });
        Assert.True(created.StatusCode == HttpStatusCode.Created, $"{created.StatusCode}: {await created.Content.ReadAsStringAsync()}");
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        await using var verificationScope = factory.Services.CreateAsyncScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var session = await verificationDb.Sessions
            .Include(item => item.Progress).ThenInclude(progress => progress!.CurrentNode)
            .Include(item => item.ProgressionModuleSnapshots).ThenInclude(snapshot => snapshot.Transition)
            .SingleAsync(item => item.Id == sessionId);

        Assert.Equal("SDV-STAR-LIBRARY-1", session.ScenarioDefinitionVersionId);
        Assert.NotNull(session.Progress);
        Assert.Equal(session.ScenarioDefinitionVersionId, session.Progress!.CurrentNode.DefinitionVersionId);
        Assert.NotEmpty(session.ProgressionModuleSnapshots);
        Assert.All(session.ProgressionModuleSnapshots, snapshot =>
            Assert.Equal(session.ScenarioDefinitionVersionId, snapshot.Transition.DefinitionVersionId));
        Assert.DoesNotContain(session.ProgressionModuleSnapshots, snapshot => snapshot.Transition.DefinitionVersionId == draftId);
    }

    [Fact]
    public async Task ExplicitStartLocationAndObjectStateOverridesInitializeSession()
    {
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client, "cellar", initialOpen: true);

        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-explicit-start" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Data.ApplicationDbContext>();
        var session = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
            db.Sessions.Include(item => item.CurrentLocation).Include(item => item.ObjectStates),
            item => item.Id == sessionId);
        Assert.Equal("cellar", session.CurrentLocation!.Code);
        var northDoorId = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
            db.ScenarioObjects.Where(item => item.DefinitionVersionId == session.ScenarioDefinitionVersionId && item.Code == "north-door").Select(item => item.Id));
        var northDoorState = session.ObjectStates.Single(item => item.ScenarioObjectId == northDoorId);
        using var state = JsonDocument.Parse(northDoorState.StateJson);
        Assert.True(state.RootElement.GetProperty("open").GetBoolean());
    }

    [Fact]
    public void InputContractDoesNotExposeRequestedOutputs()
    {
        Assert.Null(typeof(CreateSessionInputRequest).GetProperty("RequestedOutputs"));
    }

    [Fact]
    public async Task AuthoredExtensionBinding_InvokesExactGuardianPackageWithTypedObjectActionContext()
    {
        var client = await SignedInClientAsync();
        string digest;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Data.ApplicationDbContext>();
            var moduleId = new ModulePackageModuleId("com.myriale.rules.turn-battle");
            var version = new ModulePackageVersion("1.0.0");
            digest = (await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
                db.ModulePackages.Where(item => item.ModuleId == moduleId && item.Version == version))).Digest.Value;
        }
        var scenarioId = await CreatePublishedGuardianScenarioAsync(client, digest);
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-guardian" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;

        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId = "engage-guardian", text = "守護者と戦う" });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);
        var session = await WaitForExecutionAsync(client, sessionId, "succeeded");

        var step = Assert.Single(session.GetProperty("ruleActionSteps").EnumerateArray().ToArray());
        var extension = step.GetProperty("extension");
        Assert.Equal("active", extension.GetProperty("status").GetString());
        Assert.Contains(extension.GetProperty("availableActions").EnumerateArray(), item => item.GetProperty("id").GetString() == "attack");
        var moduleExecutionId = extension.GetProperty("executionId").GetString();
        Assert.False(string.IsNullOrWhiteSpace(moduleExecutionId));

        await using var verificationScope = factory.Services.CreateAsyncScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<Myriale.Api.Data.ApplicationDbContext>();
        var moduleExecution = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
            verificationDb.ModuleExecutions.Where(item => item.Id == moduleExecutionId));
        Assert.Equal("com.myriale.rules.turn-battle", moduleExecution.ModuleId);
        Assert.Equal("1.0.0", moduleExecution.ModuleVersion);
        Assert.Equal(digest, moduleExecution.ModuleDigest);
        using var binding = JsonDocument.Parse(moduleExecution.ContextJson);
        Assert.Equal(step.GetProperty("decision").GetProperty("objectId").GetString(), binding.RootElement.GetProperty("objectId").GetString());
        Assert.Equal(step.GetProperty("decision").GetProperty("actionId").GetString(), binding.RootElement.GetProperty("actionId").GetString());
        Assert.Equal(JsonValueKind.Object, binding.RootElement.GetProperty("arguments").ValueKind);
        Assert.Equal(JsonValueKind.Object, binding.RootElement.GetProperty("objectState").ValueKind);
    }

    [Fact]
    public async Task InvalidDecision_IsRejectedBeforeMutation()
    {
        ai.ReturnUnknownAction = true;
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client, "start");
        using var created = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = "create-invalid" });
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        using var accepted = await client.PostAsJsonAsync($"/api/sessions/{sessionId}/inputs", new { requestId = "invalid", text = "開ける" });
        Assert.Equal(HttpStatusCode.Accepted, accepted.StatusCode);

        var session = await WaitForExecutionAsync(client, sessionId, "failed");
        var door = session.GetProperty("objectStates").EnumerateArray().Single(item => item.GetProperty("code").GetString() == "north-door");
        Assert.False(door.GetProperty("state").GetProperty("open").GetBoolean());
        Assert.Equal(0, door.GetProperty("revision").GetInt64());
        Assert.Equal("unknown_model_action_selection", session.GetProperty("executions")[0].GetProperty("errorCode").GetString());
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var interaction = await db.SessionAiInteractions.SingleAsync(item => item.SessionId == sessionId && item.Stage == SessionAiInteractionStage.ActionDecision);
        Assert.Equal(SessionAiInteractionStatus.ValidationFailed, interaction.Status);
        Assert.Equal("action prompt", interaction.SentPrompt);
        Assert.Equal("action result", interaction.ReceivedResult);
    }

    [Fact]
    public async Task StaleObjectRevision_IsRejectedBeforeEffects()
    {
        ai.PauseDecision = true;
        var client = await SignedInClientAsync();
        var scenarioId = await CreatePublishedDoorScenarioAsync(client, "start");
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

    private static async Task<string> CreatePublishedDoorScenarioAsync(HttpClient client, string startLocationCode, bool initialOpen = false)
    {
        using var scenario = await client.PostAsJsonAsync("/api/scenarios/", new { title = "Door runtime" });
        var scenarioId = (await scenario.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var payload = JsonNode.Parse("""
        {
          "schemaVersion":2,
          "locations":[
            {"code":"start","name":"Hall","description":"","authoringData":{}},
            {"code":"cellar","name":"Cellar","description":"","authoringData":{}}
          ],
          "objectTypes":[{
            "code":"door","name":"Door","description":"","schemaVersion":1,
            "stateSchema":{"type":"object","additionalProperties":false,"properties":{"open":{"type":"boolean"}},"required":["open"]},
            "defaultState":{"open":false},"publicProjection":{"include":["open"]},
            "actions":[{"code":"open","label":"Open","description":"Open the door","argumentSchema":{"type":"object","additionalProperties":false},"availabilityCondition":{},"visibility":"ai-choice","executionMode":"rule"}],
            "actionRules":[{"code":"open-default","actionCode":"open","condition":{"op":"eq","path":"state.open","value":false},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.open","value":true},{"type":"emit-fact","text":"The door is open."}],"moduleBinding":null}]
          }],
          "objects":[
            {"code":"north-door","name":"North door","profileMarkdown":"## Appearance\n\nA heavy stone door.","mixinTypeCodes":["door"],"stateSchema":{},"defaultState":{},"publicProjection":{},"actions":[],"locationCode":"start","initialStateOverride":{},"isGlobal":false,"actionRules":[]},
            {"code":"cellar-door","name":"Cellar door","profileMarkdown":"## Appearance\n\nA cellar door.","mixinTypeCodes":["door"],"stateSchema":{},"defaultState":{},"publicProjection":{},"actions":[],"locationCode":"cellar","initialStateOverride":{},"isGlobal":false,"actionRules":[]},
            {"code":"world-clock","name":"World clock","profileMarkdown":"## Appearance\n\nA brass clock.","mixinTypeCodes":["door"],"stateSchema":{},"defaultState":{},"publicProjection":{},"actions":[],"locationCode":"cellar","initialStateOverride":{},"isGlobal":true,"actionRules":[]}
          ]
        }
        """)!;
        payload["startLocationCode"] = startLocationCode;
        if (initialOpen) payload["objects"]![0]!["initialStateOverride"] = JsonNode.Parse("{\"open\":true}");
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload); Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null); Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        return scenarioId;
    }

    private static async Task<string> CreatePublishedWestDoorScenarioAsync(HttpClient client)
    {
        using var scenario = await client.PostAsJsonAsync("/api/scenarios/", new { title = "West door runtime" });
        var scenarioId = (await scenario.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var payload = JsonSerializer.Deserialize<JsonElement>("""
        {
          "schemaVersion":2,
          "startLocationCode":"inside",
          "locations":[
            {"code":"inside","name":"地下研究室","description":"","authoringData":{}},
            {"code":"outside","name":"研究施設の外","description":"","authoringData":{}}
          ],
          "objectTypes":[
            {"code":"door","name":"Door","description":"","schemaVersion":1,"stateSchema":{"type":"object","additionalProperties":false,"properties":{"open":{"type":"boolean"}},"required":["open"]},"defaultState":{"open":false},"publicProjection":{"include":["open"]},"actions":[{"code":"open-and-exit","label":"扉を開けて外へ出る","description":"","argumentSchema":{"type":"object","additionalProperties":false},"availabilityCondition":{},"visibility":"ai-choice","executionMode":"rule"}],"actionRules":[{"code":"open-and-exit-default","actionCode":"open-and-exit","condition":{"op":"eq","path":"state.open","value":false},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.open","value":true}],"moduleBinding":null}]},
            {"code":"landmark","name":"Landmark","description":"","schemaVersion":1,"stateSchema":{"type":"object","additionalProperties":false,"properties":{"examined":{"type":"boolean"}},"required":["examined"]},"defaultState":{"examined":false},"publicProjection":{"include":["examined"]},"actions":[{"code":"examine","label":"調べる","description":"","argumentSchema":{"type":"object","additionalProperties":false},"availabilityCondition":{},"visibility":"ai-choice","executionMode":"rule"}],"actionRules":[{"code":"examine-default","actionCode":"examine","condition":{},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.examined","value":true}],"moduleBinding":null}]}
          ],
          "objects":[
            {"code":"east-door","name":"東の扉","mixinTypeCodes":["door"],"stateSchema":{},"defaultState":{},"publicProjection":{},"actions":[],"locationCode":"inside","initialStateOverride":{},"isGlobal":false,"actionRules":[]},
            {"code":"west-door","name":"西の扉","mixinTypeCodes":["door"],"stateSchema":{},"defaultState":{},"publicProjection":{},"actions":[],"locationCode":"inside","initialStateOverride":{},"isGlobal":false,"actionRules":[{"operation":"override","targetTypeCode":"door","targetRuleCode":"open-and-exit-default","actionCode":"open-and-exit","condition":{"op":"eq","path":"state.open","value":false},"priority":100,"authoringNote":"","effects":[{"type":"set-state","path":"state.open","value":true},{"type":"move-session","locationCode":"outside"},{"type":"emit-fact","text":"西の扉が開いた。"},{"type":"emit-fact","text":"プレイヤーは研究施設の外へ出た。"}],"moduleBinding":null}]},
            {"code":"outside-antenna","name":"観測アンテナ","mixinTypeCodes":["landmark"],"stateSchema":{},"defaultState":{},"publicProjection":{},"actions":[],"locationCode":"outside","initialStateOverride":{},"isGlobal":false,"actionRules":[]}
          ]
        }
        """);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        return scenarioId;
    }

    private static async Task<string> CreatePublishedGuardianScenarioAsync(HttpClient client, string digest)
    {
        using var scenario = await client.PostAsJsonAsync("/api/scenarios/", new { title = "Guardian runtime" });
        var scenarioId = (await scenario.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        var payload = new
        {
            schemaVersion = 2,
            startLocationCode = "start",
            locations = new[] { new { code = "start", name = "Hall", description = "", authoringData = new { } } },
            objectTypes = new[]
            {
                new
                {
                    code = "guardian",
                    name = "Guardian",
                    description = "",
                    schemaVersion = 1,
                    stateSchema = new { type = "object", additionalProperties = false, properties = new { alert = new { type = "boolean" } }, required = new[] { "alert" } },
                    defaultState = new { alert = true },
                    publicProjection = new { include = new[] { "alert" } },
                    actions = new[]
                    {
                        new { code = "engage", label = "Engage", description = "Begin battle", argumentSchema = new { type = "object", additionalProperties = false }, availabilityCondition = new { }, visibility = "ai-choice", executionMode = "extension-module" },
                    },
                    actionRules = new[]
                    {
                        new
                        {
                            code = "engage-default", actionCode = "engage", condition = new { }, priority = 100, authoringNote = "", effects = Array.Empty<object>(),
                            moduleBinding = new
                            {
                                moduleId = "com.myriale.rules.turn-battle", version = "1.0.0", digest,
                                configuration = new { playerName = "Player", enemyName = "Guardian", playerHp = 24, enemyHp = 22, playerAttack = 6, enemyAttack = 5, skillName = "Flash", skillPower = 10, skillUses = 2, fleeChance = 35, victoryCode = "guardian-defeated", defeatCode = "guardian-victorious", fleeCode = "guardian-escaped" },
                            },
                        },
                    },
                },
            },
            objects = new[]
            {
                new
                {
                    code = "north-door",
                    name = "Library guardian",
                    mixinTypeCodes = new[] { "guardian" },
                    stateSchema = new { },
                    defaultState = new { },
                    publicProjection = new { },
                    actions = Array.Empty<object>(),
                    locationCode = "start",
                    initialStateOverride = new { },
                    isGlobal = false,
                    actionRules = Array.Empty<object>(),
                },
            },
        };
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
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
        public List<string> DecisionProfileIds { get; } = [];
        public List<string> NarrativeProfileIds { get; } = [];
        public List<PostStateNarrativeRequest> NarrativeRequests { get; } = [];
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(string profileId, ModelActionDecisionRequest request, CancellationToken cancellationToken)
        {
            DecisionProfileIds.Add(profileId);
            return DecideActionAsync(request, cancellationToken);
        }

        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(string profileId, PostStateNarrativeRequest request, CancellationToken cancellationToken)
        {
            NarrativeProfileIds.Add(profileId);
            return GeneratePostStateNarrativeAsync(request, cancellationToken);
        }

        public async Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken)
        {
            DecisionCalls++;
            if (PauseDecision)
            {
                DecisionEntered.TrySetResult();
                await DecisionRelease.Task.WaitAsync(cancellationToken);
            }
            var targetCode = request.PlayerInput.Contains("西", StringComparison.Ordinal) ? "west-door" : "north-door";
            var action = request.ObjectActions.Single(item => item.ObjectCode == targetCode).Actions[0];
            var result = new ModelActionDecisionResult(
                ScenarioTurnSchemas.ModelActionDecisionResult,
                ReturnUnknownAction ? "object:missing/missing" : action.SelectionCode,
                JsonSerializer.Deserialize<JsonElement>("{}"));
            return new NarrativeGeneration<ModelActionDecisionResult>(result, Metadata(), "action prompt", "action result");
        }
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken)
        {
            NarrativeCalls++; NarrativeRequests.Add(request);
            if (NarrativeFailuresRemaining-- > 0) throw new AiProviderException(AiProviderErrorCodes.Timeout, "retry", true, sentPrompt: "narrative prompt", receivedResult: "partial result");
            return Task.FromResult(new NarrativeGeneration<PostStateNarrativeResult>(new(ScenarioTurnSchemas.PostStateNarrative, "Door opened", "The north door now stands open."), Metadata(), "narrative prompt", "narrative result"));
        }
        private static AiGenerationMetadata Metadata() => new("test", "deterministic", null, null, null, 1, 1, "stop");
    }
}
