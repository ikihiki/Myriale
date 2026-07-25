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
            schemaVersion = 1, locations = Array.Empty<object>(), objectTypes = Array.Empty<object>(), objects = Array.Empty<object>()
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", json.GetProperty("status").GetString());
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
        var duplicate = payload["objects"]![0]!["actionRules"]![0]!.DeepClone();
        payload["objects"]![0]!["actionRules"]!.AsArray().Add(duplicate);
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

    private static JsonNode ValidRuleData() => JsonNode.Parse("""
        {
          "schemaVersion": 1,
          "locations": [{ "code": "hall", "name": "広間", "description": "", "authoringData": {} }],
          "objectTypes": [{
            "code": "door", "name": "扉", "description": "", "schemaVersion": 1,
            "stateSchema": { "type": "object", "additionalProperties": false, "properties": { "open": { "type": "boolean" } } },
            "defaultState": { "open": false }, "publicProjection": { "include": ["open"] },
            "actions": [{
              "code": "open", "label": "開ける", "description": "扉を開ける。",
              "argumentSchema": { "type": "object", "additionalProperties": false },
              "availabilityCondition": {}, "visibility": "ai-choice", "executionMode": "rule"
            }]
          }],
          "objects": [{
            "code": "north-door", "name": "北の扉", "objectTypeCode": "door", "locationCode": "hall",
            "initialStateOverride": {}, "isGlobal": false,
            "actionRules": [{
              "actionCode": "open", "condition": { "op": "eq", "path": "state.open", "value": false },
              "priority": 100, "authoringNote": "", "effects": [{ "type": "set-state", "path": "state.open", "value": true }],
              "moduleBinding": null
            }]
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
