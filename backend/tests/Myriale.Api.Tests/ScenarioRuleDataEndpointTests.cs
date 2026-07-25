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
    public async Task DraftSave_AllowsIncompleteDefinition()
    {
        var client = await CreateSignedInClientAsync();
        var scenarioId = await CreateScenarioAsync(client);

        using var response = await client.PutAsJsonAsync($"/api/scenarios/{scenarioId}/rule-data", new
        {
            schemaVersion = 2, locations = Array.Empty<object>(), objectTypes = Array.Empty<object>(), objects = Array.Empty<object>()
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", json.GetProperty("status").GetString());
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
            displayName = "作者", email = $"author-{Guid.NewGuid():N}@example.test", password = "letters1"
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

    private static JsonNode ValidRuleData() => JsonNode.Parse("""
        {
          "schemaVersion": 2,
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
            "code": "north-door", "name": "北の扉", "mixinTypeCodes": ["door"], "locationCode": "hall",
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
