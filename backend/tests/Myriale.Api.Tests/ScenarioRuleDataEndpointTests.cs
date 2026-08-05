using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Myriale.Api.Tests;

public sealed class ScenarioRuleDataEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-rule-data-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public ScenarioRuleDataEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));
    }

    [Fact]
    public async Task ConcurrentDraftCreation_ProducesOneDraftAndOneAllocatedVersion()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);

        var responses = await Task.WhenAll(
            client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/drafts", null),
            client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/drafts", null));

        Assert.Contains(responses, response => response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created);
        Assert.All(responses, response => Assert.Contains(response.StatusCode,
            new[] { HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.Conflict }));
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Infrastructure.Persistence.ApplicationDbContext>();
        var drafts = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Where(x => x.ScenarioId == new ScenarioId(scenarioId) && x.Status == DefinitionStatus.Draft).ToListAsync();
        var draft = Assert.Single(drafts);
        Assert.Equal(1, draft.Version);
    }

    [Fact]
    public async Task DraftSave_AllowsIncompleteDefinition()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", new
        {
            schemaVersion = 2,
            startLocationCode = "",
            locations = Array.Empty<object>(),
            objectTypes = Array.Empty<object>(),
            objects = Array.Empty<object>()
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", json.GetProperty("status").GetString());
    }

    [Fact]
    public async Task DraftSave_RoundTripsEntityProfileMarkdown()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objects"]![0]!["profileMarkdown"] = "## 外観\n\n星図が刻まれた重い石扉。";

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var entity = Assert.Single(json.GetProperty("objects").EnumerateArray().ToArray());
        Assert.Contains("重い石扉", entity.GetProperty("profileMarkdown").GetString());
    }

    [Fact]
    public async Task DebugRuleData_AppliesDirectActionWithoutPersistingWorldState()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", ValidRuleData());
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        using var response = await client.PostAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data/debug", new
        {
            trigger = "direct-action",
            currentLocationCode = "hall",
            flags = new Dictionary<string, bool>(),
            objects = new[] { new { objectCode = "north-door", locationCode = "hall", state = new { open = false } } },
            objectCode = "north-door",
            actionCode = "open",
            arguments = new { },
            playerInput = (string?)null,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var debug = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("open-default", debug.GetProperty("selectedRuleCode").GetString());
        Assert.True(debug.GetProperty("postState").GetProperty("objects")[0].GetProperty("state").GetProperty("open").GetBoolean());

        using var persisted = await client.GetAsync($"/api/scenarios/{scenarioId}/rule-data");
        var ruleData = await persisted.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(ruleData.GetProperty("objectTypes")[0].GetProperty("defaultState").GetProperty("open").GetBoolean());
    }

    [Fact]
    public async Task DraftSave_RejectsTopLevelSchemaVersionOne()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["schemaVersion"] = 1;

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("errors").TryGetProperty("schemaVersion", out _));
    }

    [Fact]
    public async Task ObjectOnlyConfiguration_RoundTripsWithoutMixinFallback()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objectTypes"] = new JsonArray();
        var item = payload["objects"]![0]!;
        item["mixinTypeCodes"] = new JsonArray();
        item["stateSchema"] = JsonNode.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"open\":{\"type\":\"boolean\"}}}");
        item["defaultState"] = JsonNode.Parse("{\"open\":false}");
        item["publicProjection"] = JsonNode.Parse("{\"include\":[\"open\"]}");
        item["actions"] = JsonNode.Parse("[{\"code\":\"open\",\"label\":\"開ける\",\"description\":\"\",\"argumentSchema\":{},\"availabilityCondition\":{},\"visibility\":\"ai-choice\",\"executionMode\":\"rule\"}]");
        item["actionRules"] = JsonNode.Parse("[{\"operation\":\"add\",\"code\":\"open-local\",\"actionCode\":\"open\",\"condition\":{},\"priority\":100,\"authoringNote\":\"\",\"effects\":[{\"type\":\"set-state\",\"path\":\"state.open\",\"value\":true}],\"moduleBinding\":null}]");

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        var json = await published.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Empty(json.GetProperty("objects")[0].GetProperty("mixinTypeCodes").EnumerateArray());
    }

    [Fact]
    public async Task DraftSave_RejectsObjectLocalExtensionActions()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        var item = payload["objects"]![0]!;
        item["actions"] = JsonNode.Parse("[{\"code\":\"inspect\",\"label\":\"調べる\",\"description\":\"\",\"argumentSchema\":{},\"availabilityCondition\":{},\"visibility\":\"ai-choice\",\"executionMode\":\"extension-module\"}]");

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("errors").TryGetProperty("objects[0].actions", out _));
    }

    [Fact]
    public async Task DraftSave_RejectsMalformedReferenceWithNestedPath()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objects"]![0]!["locationCode"] = "missing";

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("errors").TryGetProperty("objects[0].locationCode", out _));
    }

    [Fact]
    public async Task DraftSave_AcceptsRecursiveConditionsForAllowedContexts()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objectTypes"]![0]!["actions"]![0]!["argumentSchema"] = JsonNode.Parse("""
            {"type":"object","additionalProperties":false,"properties":{"amount":{"type":"number"}}}
            """);
        payload["objectTypes"]![0]!["actions"]![0]!["availabilityCondition"] = JsonNode.Parse("""
            {"or":[{"op":"eq","path":"state.open","value":false},{"op":"exists","path":"session.flags.override"}]}
            """);
        payload["objectTypes"]![0]!["actionRules"]![0]!["condition"] = JsonNode.Parse("""
            {"and":[
              {"op":"eq","path":"state.open","value":false},
              {"op":"gte","path":"arguments.amount","value":1},
              {"not":{"op":"eq","path":"session.flags.blocked","value":true}}
            ]}
            """);

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DraftSave_RejectsInvalidRecursiveConditionsWithNestedPaths()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objectTypes"]![0]!["actions"]![0]!["argumentSchema"] = JsonNode.Parse("""
            {"type":"object","additionalProperties":false,"properties":{"amount":{"type":"number"},"mode":{"type":"string"}}}
            """);
        payload["objectTypes"]![0]!["actions"]![0]!["availabilityCondition"] = JsonNode.Parse("""
            {"and":[{}, {"op":"eq","path":"arguments.amount","value":1}]}
            """);
        payload["objectTypes"]![0]!["actionRules"]![0]!["condition"] = JsonNode.Parse("""
            {"and":[
              {"op":"eq","path":"state.missing","value":true},
              {"op":"gt","path":"arguments.mode","value":2},
              {"op":"lt","path":"arguments.amount","value":"2"}
            ]}
            """);

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var errors = json.GetProperty("errors");
        Assert.True(errors.TryGetProperty("objectTypes[0].actions[0].availabilityCondition.and[1].path", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].condition.and[0].path", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].condition.and[1].path", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].condition.and[2].value", out _));
    }

    [Fact]
    public async Task DraftSave_ValidatesObjectLocalAvailabilityAgainstResolvedState()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objects"]![0]!["actions"] = JsonNode.Parse("""
            [{
              "code":"inspect","label":"調べる","description":"","argumentSchema":{},
              "availabilityCondition":{"not":{"op":"exists","path":"state.missing"}},
              "visibility":"manual-ui","executionMode":"rule"
            }]
            """);

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("errors").TryGetProperty("objects[0].actions[0].availabilityCondition.not.path", out _));
    }

    [Fact]
    public async Task Readiness_RejectsIncompleteAndAmbiguousMappings()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        var duplicate = payload["objectTypes"]![0]!["actionRules"]![0]!.DeepClone();
        duplicate!["code"] = "open-duplicate";
        payload["objectTypes"]![0]!["actionRules"]!.AsArray().Add(duplicate);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        using var readiness = await client.GetAsync($"/api/scenarios/{scenarioId}/rule-data/readiness");

        Assert.Equal(HttpStatusCode.OK, readiness.StatusCode);
        var json = await readiness.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(json.GetProperty("ready").GetBoolean());
        Assert.True(json.GetProperty("errors").TryGetProperty("objects[0].actionRules", out _));
    }

    [Fact]
    public async Task Publish_MakesDefinitionImmutableUntilNewDraftIsCreated()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", ValidRuleData());
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        var publishedJson = await published.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("published", publishedJson.GetProperty("status").GetString());
        Assert.Equal(1, publishedJson.GetProperty("version").GetInt32());

        using var immutable = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", ValidRuleData());
        Assert.Equal(HttpStatusCode.Conflict, immutable.StatusCode);

        using var newDraft = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/drafts", null);
        Assert.Equal(HttpStatusCode.Created, newDraft.StatusCode);
        var draftJson = await newDraft.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", draftJson.GetProperty("status").GetString());
        Assert.Equal(2, draftJson.GetProperty("version").GetInt32());
        Assert.Equal(1, draftJson.GetProperty("objects").GetArrayLength());
    }

    [Fact]
    public async Task Publish_PreservesMoveSessionAndMoveObjectStableCodeReferences()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["locations"]!.AsArray().Add(JsonNode.Parse("{\"code\":\"outside\",\"name\":\"屋外\",\"description\":\"\",\"authoringData\":{}}"));
        payload["objectTypes"]![0]!["actionRules"]![0]!["effects"] = JsonNode.Parse("""
          [
            { "type": "set-state", "path": "state.open", "value": true },
            { "type": "move-object", "objectCode": "north-door", "locationCode": "outside" },
            { "type": "move-session", "locationCode": "outside" }
          ]
          """);

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        using var read = await client.GetAsync($"/api/scenarios/{scenarioId}/rule-data");
        var body = await read.Content.ReadFromJsonAsync<JsonElement>();
        var effects = body.GetProperty("objectTypes")[0].GetProperty("actionRules")[0].GetProperty("effects");

        Assert.Equal("north-door", effects[1].GetProperty("objectCode").GetString());
        Assert.Equal("outside", effects[1].GetProperty("locationCode").GetString());
        Assert.Equal("outside", effects[2].GetProperty("locationCode").GetString());
    }

    [Fact]
    public async Task WestDoorEffects_SaveReadinessPublishAndReadBackInExactOrder()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["locations"]!.AsArray().Add(JsonNode.Parse("{\"code\":\"outside\",\"name\":\"屋外\",\"description\":\"\",\"authoringData\":{}}"));
        payload["objectTypes"]![0]!["actionRules"]![0]!["effects"] = JsonNode.Parse("""
          [
            { "type": "set-state", "path": "state.open", "value": true },
            { "type": "move-session", "locationCode": "outside" },
            { "type": "emit-fact", "text": "西の扉が開いた。" },
            { "type": "emit-fact", "text": "プレイヤーは外へ出た。" },
            { "type": "emit-event", "event": "session-moved", "locationCode": "outside" },
            { "type": "add-narrative-hint", "text": "冷たい夜風を描写する。" },
            { "type": "forbid-narrative-fact", "text": "まだ室内にいる" },
            { "type": "forbid-narrative-fact", "text": "扉は閉じたまま" }
          ]
          """);

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var readiness = await client.GetAsync($"/api/scenarios/{scenarioId}/rule-data/readiness");
        var readinessBody = await readiness.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(readinessBody.GetProperty("ready").GetBoolean());
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        using var read = await client.GetAsync($"/api/scenarios/{scenarioId}/rule-data");
        var body = await read.Content.ReadFromJsonAsync<JsonElement>();
        var effects = body.GetProperty("objectTypes")[0].GetProperty("actionRules")[0].GetProperty("effects");

        Assert.Equal(new[] { "set-state", "move-session", "emit-fact", "emit-fact", "emit-event", "add-narrative-hint", "forbid-narrative-fact", "forbid-narrative-fact" },
            effects.EnumerateArray().Select(effect => effect.GetProperty("type").GetString()).ToArray());
        Assert.Equal("session-moved", effects[4].GetProperty("event").GetString());
        Assert.Equal("outside", effects[4].GetProperty("locationCode").GetString());
    }

    [Fact]
    public async Task DraftSave_RejectsMalformedEventAndNarrativeEffectsWithNestedPaths()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objectTypes"]![0]!["actionRules"]![0]!["effects"] = JsonNode.Parse("""
          [
            { "type": "emit-event", "event": "", "locationCode": "missing" },
            { "type": "emit-fact", "text": " " },
            { "type": "add-narrative-hint" },
            { "type": "forbid-narrative-fact", "text": "" }
          ]
          """);

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var errors = json.GetProperty("errors");
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].effects[0].event", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].effects[0].locationCode", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].effects[1].text", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].effects[2].text", out _));
        Assert.True(errors.TryGetProperty("objectTypes[0].actionRules[0].effects[3].text", out _));
    }

    [Fact]
    public async Task RuleDataAndScenarioUpdates_AreRestrictedToAuthor()
    {
        var owner = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(owner);
        using var saved = await owner.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", ValidRuleData());
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var other = await CreateSignedInClientAsync();

        using var read = await other.GetAsync($"/api/scenarios/{scenarioId}/rule-data");
        using var update = await other.PutAsJsonAsync($"/api/scenarios/{scenarioId}", new { title = "盗用" });

        Assert.Equal(HttpStatusCode.NotFound, read.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);
    }

    [Fact]
    public async Task GenericRuleStableCode_RoundTrips_AndInvalidMutationTargetIsRejected()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedBody = await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("open-default", savedBody.GetProperty("objectTypes")[0].GetProperty("actionRules")[0].GetProperty("code").GetString());

        payload["objects"]![0]!["actionRules"] = JsonNode.Parse("[{\"operation\":\"adjust\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"missing-rule\",\"priority\":101}]");
        using var invalid = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var invalidBody = await invalid.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(invalidBody.GetProperty("errors").TryGetProperty("objects[0].actionRules[0]", out _));
    }

    [Fact]
    public async Task GenericRuleRename_CascadesObjectTargets_AndReferencedDeleteIsBlocked()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["objects"]![0]!["actionRules"] = JsonNode.Parse("[{\"operation\":\"adjust\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open-default\",\"priority\":101}]");
        using var first = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var renamedPayload = payload.DeepClone();
        renamedPayload["objectTypes"]![0]!["actionRules"]![0]!["code"] = "open-standard";
        using var renamed = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", renamedPayload);
        Assert.Equal(HttpStatusCode.OK, renamed.StatusCode);
        var renamedBodyText = await renamed.Content.ReadAsStringAsync();
        var renamedBody = JsonNode.Parse(renamedBodyText)!;
        Assert.Equal("open-standard", renamedBody["objects"]![0]!["actionRules"]![0]!["targetRuleCode"]!.GetValue<string>());

        renamedBody["objectTypes"]![0]!["actionRules"] = new JsonArray();
        renamedBody["objects"]![0]!["actionRules"] = new JsonArray();
        using var blocked = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", renamedBody);
        Assert.Equal(HttpStatusCode.BadRequest, blocked.StatusCode);
        var blockedBody = await blocked.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(blockedBody.GetProperty("errors").TryGetProperty("objects[0].actionRules", out _));
    }

    [Fact]
    public async Task DraftSave_RejectsDuplicateGenericCodesAndOverrideActionMismatch()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var duplicatePayload = ValidRuleData();
        duplicatePayload["objectTypes"]![0]!["actionRules"]!.AsArray().Add(duplicatePayload["objectTypes"]![0]!["actionRules"]![0]!.DeepClone());
        using var duplicate = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", duplicatePayload);
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
        var duplicateBody = await duplicate.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(duplicateBody.GetProperty("errors").TryGetProperty("objectTypes[0].actionRules[1].code", out _));

        var conflictPayload = ValidRuleData();
        conflictPayload["objects"]![0]!["actionRules"] = JsonNode.Parse("[{\"operation\":\"adjust\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open-default\",\"priority\":101},{\"operation\":\"delete\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open-default\"}]");
        using var conflict = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", conflictPayload);
        Assert.Equal(HttpStatusCode.BadRequest, conflict.StatusCode);
        var conflictBody = await conflict.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(conflictBody.GetProperty("errors").TryGetProperty("objects[0].actionRules[1]", out _));

        var mismatchPayload = ValidRuleData();
        mismatchPayload["objects"]![0]!["actions"] = JsonNode.Parse("[{\"code\":\"inspect\",\"label\":\"Inspect\",\"description\":\"\",\"argumentSchema\":{},\"availabilityCondition\":{},\"visibility\":\"ai-choice\",\"executionMode\":\"rule\"}]");
        mismatchPayload["objects"]![0]!["actionRules"] = JsonNode.Parse("[{\"operation\":\"override\",\"targetTypeCode\":\"door\",\"targetRuleCode\":\"open-default\",\"actionCode\":\"inspect\",\"condition\":{},\"priority\":100,\"authoringNote\":\"\",\"effects\":[],\"moduleBinding\":null}]");
        using var mismatch = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", mismatchPayload);
        Assert.Equal(HttpStatusCode.BadRequest, mismatch.StatusCode);
        var mismatchBody = await mismatch.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(mismatchBody.GetProperty("errors").TryGetProperty("objects[0].actionRules[0].actionCode", out _));
    }

    [Fact]
    public async Task Publish_WhenNotReady_LeavesScenarioAndDefinitionAsDraft()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", new
        {
            schemaVersion = 2,
            startLocationCode = "",
            locations = Array.Empty<object>(),
            objectTypes = Array.Empty<object>(),
            objects = Array.Empty<object>()
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.BadRequest, published.StatusCode);

        using var scenarioResponse = await client.GetAsync($"/api/scenarios/{scenarioId}");
        var scenario = await scenarioResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", scenario.GetProperty("status").GetString());
        using var definitionResponse = await client.GetAsync($"/api/scenarios/{scenarioId}/rule-data");
        var definition = await definitionResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", definition.GetProperty("status").GetString());
    }

    [Fact]
    public async Task PublishedDefinition_PinsNarrativeGuidanceAfterScenarioEdit()
    {
        var client = await CreateSignedInClientAsync();
        using var createdScenario = await client.PostAsJsonAsync("/api/scenarios/", new
        {
            title = "固定された題名",
            lore = "固定された世界設定",
            aiFreedom = "固定された指針",
            heroMode = "free",
            opening = "固定された導入"
        });
        var scenarioJson = await createdScenario.Content.ReadFromJsonAsync<JsonElement>();
        var scenarioId = scenarioJson.GetProperty("id").GetString()!;
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", ValidRuleData());
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);

        using var edited = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}", new
        {
            title = "編集後の題名",
            lore = "編集後の世界設定",
            aiFreedom = "編集後の指針",
            heroMode = "free",
            opening = "編集後の導入"
        });
        Assert.Equal(HttpStatusCode.OK, edited.StatusCode);
        using var sessionResponse = await client.PostAsJsonAsync("/api/sessions/", new { scenarioId, requestId = $"pin-{Guid.NewGuid():N}" });
        Assert.Equal(HttpStatusCode.Created, sessionResponse.StatusCode);
        var sessionJson = await sessionResponse.Content.ReadFromJsonAsync<JsonElement>();
        var sessionId = sessionJson.GetProperty("id").GetString()!;

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Infrastructure.Persistence.ApplicationDbContext>();
        var session = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
            db.Sessions, item => item.Id == new SessionId(sessionId));
        var definition = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
            db.ScenarioDefinitionVersions, item => item.Id == session.ScenarioDefinitionVersionId);
        Assert.Equal("固定された世界設定", definition.ScenarioLore);
        Assert.Equal("固定された指針", definition.ScenarioAiFreedom);
        Assert.Equal("固定された導入", definition.ScenarioOpening);
        var opening = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(
            db.SessionTurns, turn => turn.SessionId == new SessionId(sessionId) && turn.Position == 1);
        Assert.Equal("固定された題名", opening.Heading);
        Assert.Equal("固定された導入", opening.NarrativeBody);
    }

    [Fact]
    public async Task CreateDraft_ClonesPublishedProgressionGraphWithNewIds()
    {
        _ = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Infrastructure.Persistence.ApplicationDbContext>();
        var published = await db.ScenarioDefinitionVersions.AsNoTracking()
            .Include(version => version.ProgressionNodes)
            .Include(version => version.ProgressionTransitions)
            .SingleAsync(version => version.Id == new ScenarioDefinitionVersionId("SDV-STAR-LIBRARY-1"));

        var drafts = scope.ServiceProvider.GetRequiredService<Myriale.Api.Features.Scenarios.Application.ScenarioDefinitionDraftService>();
        var draft = await drafts.GetOrCreateDraftAsync(published.ScenarioId, CancellationToken.None);

        Assert.Equal(2, draft.Version);
        Assert.Equal(DefinitionStatus.Draft, draft.Status);
        Assert.Equal(published.ProgressionNodes.Count, draft.ProgressionNodes.Count);
        Assert.Equal(published.ProgressionTransitions.Count, draft.ProgressionTransitions.Count);
        Assert.All(draft.ProgressionNodes, node =>
        {
            Assert.Equal(draft.Id, node.DefinitionVersionId);
            Assert.DoesNotContain(node.Id, published.ProgressionNodes.Select(item => item.Id));
        });
        Assert.All(draft.ProgressionTransitions, transition =>
        {
            Assert.Equal(draft.Id, transition.DefinitionVersionId);
            Assert.Contains(draft.ProgressionNodes, node => node.Id == transition.SourceNodeId);
            Assert.Contains(draft.ProgressionNodes, node => node.Id == transition.TargetNodeId);
            Assert.DoesNotContain(transition.Id, published.ProgressionTransitions.Select(item => item.Id));
        });
        Assert.Equal(
            published.ProgressionNodes.Select(node => node.Code).Order().ToArray(),
            draft.ProgressionNodes.Select(node => node.Code).Order().ToArray());
        var publishedNodes = published.ProgressionNodes.ToDictionary(node => node.Id);
        var draftNodes = draft.ProgressionNodes.ToDictionary(node => node.Id);
        foreach (var publishedTransition in published.ProgressionTransitions)
        {
            var draftTransition = Assert.Single(draft.ProgressionTransitions, item => item.SignalCode == publishedTransition.SignalCode);
            Assert.Equal(publishedTransition.TriggerDescription, draftTransition.TriggerDescription);
            Assert.Equal(publishedTransition.ModuleId, draftTransition.ModuleId);
            Assert.Equal(publishedTransition.ModuleVersion, draftTransition.ModuleVersion);
            Assert.Equal(publishedTransition.ModuleDigest, draftTransition.ModuleDigest);
            Assert.Equal(publishedTransition.ModuleConfigurationJson, draftTransition.ModuleConfigurationJson);
            Assert.Equal(publishedTransition.ModuleContextJson, draftTransition.ModuleContextJson);
            Assert.Equal(publishedTransition.ModuleRandomValueCount, draftTransition.ModuleRandomValueCount);
            Assert.Equal(publishedNodes[publishedTransition.SourceNodeId].Code, draftNodes[draftTransition.SourceNodeId].Code);
            Assert.Equal(publishedNodes[publishedTransition.TargetNodeId].Code, draftNodes[draftTransition.TargetNodeId].Code);
        }
        Assert.Equal(
            published.ProgressionTransitions.Select(transition => transition.SignalCode).Order().ToArray(),
            draft.ProgressionTransitions.Select(transition => transition.SignalCode).Order().ToArray());
    }

    [Fact]
    public async Task CreateDraft_ConcurrentRequestsLeaveOneActiveDraft()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", ValidRuleData());
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);

        var responses = await Task.WhenAll(
            client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/drafts", null),
            client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/drafts", null));
        Assert.All(responses, response => Assert.True(response.StatusCode is HttpStatusCode.Created or HttpStatusCode.OK));
        foreach (var response in responses) response.Dispose();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Myriale.Api.Infrastructure.Persistence.ApplicationDbContext>();
        Assert.Equal(1, await db.ScenarioDefinitionVersions.CountAsync(
            version => version.ScenarioId == new ScenarioId(scenarioId) && version.Status == DefinitionStatus.Draft));
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private async Task<HttpClient> CreateSignedInClientAsync()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "作者",
            email = $"author-{Guid.NewGuid():N}@example.test",
            password = "letters1"
        });
        ApplyCookies(client, register);
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        return client;
    }

    private static async Task<string> CreateScenarioAsync(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/scenarios/", new { title = "ルール作成テスト" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task V2_RoundTripsOrderedMixinsAndObjectLocalConfiguration()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["schemaVersion"] = 2;
        payload["objectTypes"]!.AsArray().Add(JsonNode.Parse("""
          { "code":"exit", "name":"出口", "description":"", "schemaVersion":1,
            "stateSchema":{"type":"object","additionalProperties":false,"properties":{"destination":{"type":"string"}}},
            "defaultState":{"destination":"outside"}, "publicProjection":{"include":["destination"]},
            "actions":[{"code":"leave","label":"出る","description":"","argumentSchema":{},"availabilityCondition":{},"visibility":"ai-choice","executionMode":"rule"}],
            "actionRules":[{"code":"leave-default","actionCode":"leave","condition":{},"priority":10,"authoringNote":"generic","effects":[{"type":"emit-fact","text":"外へ出た"}],"moduleBinding":null}] }
          """));
        var item = payload["objects"]![0]!;
        item["mixinTypeCodes"] = new JsonArray("door", "exit");
        item["stateSchema"] = JsonNode.Parse("{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"direction\":{\"type\":\"string\"}}}");
        item["defaultState"] = JsonNode.Parse("{\"direction\":\"north\"}");
        item["publicProjection"] = JsonNode.Parse("{\"include\":[\"direction\"]}");
        item["actions"] = JsonNode.Parse("[{\"code\":\"inspect\",\"label\":\"調べる\",\"description\":\"\",\"argumentSchema\":{},\"availabilityCondition\":{},\"visibility\":\"ai-choice\",\"executionMode\":\"rule\"}]");
        item["actionRules"]!.AsArray().Add(JsonNode.Parse("{\"operation\":\"add\",\"code\":\"inspect-local\",\"actionCode\":\"inspect\",\"condition\":{},\"priority\":20,\"authoringNote\":\"local\",\"effects\":[{\"type\":\"emit-fact\",\"text\":\"調べた\"}],\"moduleBinding\":null}"));

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var json = await saved.Content.ReadFromJsonAsync<JsonElement>();
        var savedObject = json.GetProperty("objects")[0];
        Assert.Equal(["door", "exit"], savedObject.GetProperty("mixinTypeCodes").EnumerateArray().Select(value => value.GetString()));
        Assert.False(savedObject.TryGetProperty("objectTypeCode", out _));
        Assert.Equal("inspect", savedObject.GetProperty("actions")[0].GetProperty("code").GetString());
        Assert.Contains(savedObject.GetProperty("actionRules").EnumerateArray(), rule => rule.GetProperty("actionCode").GetString() == "inspect");

        using var published = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/publish", null);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        using var cloned = await client.PostAsync($"/api/scenarios/{scenarioId}/rule-data/drafts", null);
        Assert.Equal(HttpStatusCode.Created, cloned.StatusCode);
        var clone = await cloned.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(["door", "exit"], clone.GetProperty("objects")[0].GetProperty("mixinTypeCodes").EnumerateArray().Select(value => value.GetString()));
    }

    [Fact]
    public async Task DraftSave_RoundTripsExplicitStartLocationAndRejectsUnknownReference()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = ValidRuleData();
        payload["locations"]!.AsArray().Add(JsonNode.Parse("{\"code\":\"vault\",\"name\":\"地下庫\",\"description\":\"\",\"authoringData\":{}}"));
        payload["startLocationCode"] = "vault";

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedJson = await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("vault", savedJson.GetProperty("startLocationCode").GetString());

        payload["startLocationCode"] = "";
        using var missing = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        var missingJson = await missing.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("required", missingJson.GetProperty("errors").GetProperty("startLocationCode")[0].GetString());

        payload["startLocationCode"] = "missing";
        using var invalid = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var invalidJson = await invalid.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("does not exist", invalidJson.GetProperty("errors").GetProperty("startLocationCode")[0].GetString());
    }

    [Fact]
    public async Task DraftSave_ValidatesCrossObjectSetStateAgainstTargetSchema()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);
        var payload = CrossObjectRuleData("north-door", "state.open", JsonValue.Create(true)!);

        using var saved = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", payload);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        var invalidPath = CrossObjectRuleData("north-door", "state.solved", JsonValue.Create(true)!);
        using var pathResponse = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", invalidPath);
        Assert.Equal(HttpStatusCode.BadRequest, pathResponse.StatusCode);
        var pathError = await pathResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("target schema", pathError.GetProperty("errors").EnumerateObject().Single(error => error.Name.EndsWith("effects[0].path", StringComparison.Ordinal)).Value[0].GetString());

        var invalidValue = CrossObjectRuleData("north-door", "state.open", JsonValue.Create("yes")!);
        using var valueResponse = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", invalidValue);
        Assert.Equal(HttpStatusCode.BadRequest, valueResponse.StatusCode);
        var valueError = await valueResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("target schema type", valueError.GetProperty("errors").EnumerateObject().Single(error => error.Name.EndsWith("effects[0].value", StringComparison.Ordinal)).Value[0].GetString());

        var invalidObject = CrossObjectRuleData("missing-door", "state.open", JsonValue.Create(true)!);
        using var objectResponse = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", invalidObject);
        Assert.Equal(HttpStatusCode.BadRequest, objectResponse.StatusCode);
        var objectError = await objectResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("does not exist", objectError.GetProperty("errors").EnumerateObject().Single(error => error.Name.EndsWith("effects[0].objectCode", StringComparison.Ordinal)).Value[0].GetString());
    }

    private static JsonNode CrossObjectRuleData(string targetObjectCode, string statePath, JsonNode value)
    {
        var payload = ValidRuleData();
        payload["objectTypes"]!.AsArray().Add(JsonNode.Parse("""
          { "code":"puzzle", "name":"謎解き", "description":"", "schemaVersion":1,
            "stateSchema":{"type":"object","additionalProperties":false,"properties":{"solved":{"type":"boolean"}}},
            "defaultState":{"solved":false}, "publicProjection":{"include":["solved"]},
            "actions":[{"code":"solve","label":"解く","description":"","argumentSchema":{},"availabilityCondition":{},"visibility":"ai-choice","executionMode":"rule"}],
            "actionRules":[{"code":"solve-default","actionCode":"solve","condition":{},"priority":100,"authoringNote":"",
              "effects":[{"type":"set-state","objectCode":"north-door","path":"state.open","value":true}],"moduleBinding":null}] }
          """));
        payload["objects"]!.AsArray().Add(JsonNode.Parse("""
          { "code":"puzzle-device", "name":"謎解き装置", "mixinTypeCodes":["puzzle"], "locationCode":"hall",
            "stateSchema":{}, "defaultState":{}, "publicProjection":{}, "actions":[],
            "initialStateOverride":{}, "isGlobal":false, "actionRules":[] }
          """));
        var effect = payload["objectTypes"]![1]!["actionRules"]![0]!["effects"]![0]!;
        effect["objectCode"] = targetObjectCode;
        effect["path"] = statePath;
        effect["value"] = value;
        return payload;
    }

    private static JsonNode ValidRuleData() => JsonNode.Parse("""
        {
          "schemaVersion": 2,
          "startLocationCode": "hall",
          "locations": [{ "code": "hall", "name": "広間", "description": "", "authoringData": {} }],
          "objectTypes": [{
            "code": "door", "name": "扉", "description": "", "schemaVersion": 1,
            "stateSchema": { "type": "object", "additionalProperties": false, "properties": { "open": { "type": "boolean" } } },
            "defaultState": { "open": false }, "publicProjection": { "include": ["open"] },
            "actions": [{
              "code": "open", "label": "開ける", "description": "扉を開ける。",
              "argumentSchema": { "type": "object", "additionalProperties": false },
              "availabilityCondition": {}, "visibility": "ai-choice", "executionMode": "rule"
            }],
            "actionRules": [{
              "code": "open-default", "actionCode": "open", "condition": { "op": "eq", "path": "state.open", "value": false },
              "priority": 100, "authoringNote": "", "effects": [{ "type": "set-state", "path": "state.open", "value": true }],
              "moduleBinding": null
            }]
          }],
          "objects": [{
            "code": "north-door", "name": "北の扉", "profileMarkdown": "## 外観\\n\\n重い石扉。", "mixinTypeCodes": ["door"], "locationCode": "hall",
            "stateSchema": {}, "defaultState": {}, "publicProjection": {}, "actions": [],
            "initialStateOverride": {}, "isGlobal": false,
            "actionRules": []
          }]
        }
        """)!;

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        foreach (var value in values)
        {
            var cookie = value.Split(';', 2)[0];
            if (!string.IsNullOrWhiteSpace(cookie)) client.DefaultRequestHeaders.Add("Cookie", cookie);
        }
    }
}
