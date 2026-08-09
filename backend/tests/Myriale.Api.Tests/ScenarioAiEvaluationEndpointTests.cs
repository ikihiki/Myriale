using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Myriale.Api.Tests;

public sealed class ScenarioAiEvaluationEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-evaluation-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public ScenarioAiEvaluationEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IAiProfileCatalog>();
                services.RemoveAll<IScenarioTurnAiService>();
                services.AddSingleton<IAiProfileCatalog>(new TestProfiles());
                services.AddSingleton<IScenarioTurnAiService>(new TestAi());
            });
        });
    }

    [Fact]
    public async Task EvaluationRuns_RequireAuthenticationAndOwnerAccess()
    {
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var unauthorized = await anonymous.GetAsync("/api/scenarios/SCN-STAR-LIBRARY/ai-evaluations/runs");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        var owner = await CreateSignedInClientAsync("owner");
        var scenarioId = await CreateScenarioAsync(owner);
        var request = CreateRequest([ActionCase()], [new("profile-a")], 1);
        using var created = await owner.PostAsJsonAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs", request);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var run = await created.Content.ReadFromJsonAsync<JsonElement>();
        var runId = run.GetProperty("summary").GetProperty("id").GetString();

        var other = await CreateSignedInClientAsync("other");
        using var forbidden = await other.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}");
        Assert.Equal(HttpStatusCode.NotFound, forbidden.StatusCode);
    }

    [Fact]
    public async Task EvaluationRuns_PersistProfilesRepetitionsScoresAndExports()
    {
        var owner = await CreateSignedInClientAsync("runner");
        var scenarioId = await CreateScenarioAsync(owner);
        var request = CreateRequest([ActionCase(), NarrativeCase(), StateCase()], [new("profile-a"), new("profile-b")], 2);

        using var created = await owner.PostAsJsonAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs", request);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var json = await created.Content.ReadFromJsonAsync<JsonElement>();
        var summary = json.GetProperty("summary");
        Assert.Equal("completed", summary.GetProperty("status").GetString());
        Assert.Equal(3, summary.GetProperty("caseCount").GetInt32());
        Assert.Equal(12, summary.GetProperty("attemptCount").GetInt32());
        Assert.Equal(12, summary.GetProperty("passedAttemptCount").GetInt32());
        var cases = json.GetProperty("cases").EnumerateArray().ToList();
        Assert.Contains(cases, item => item.GetProperty("stage").GetString() == "action"
            && item.GetProperty("attempts")[0].GetProperty("labels").EnumerateArray().Any(label => label.GetString() == "selection_exact"));
        Assert.Contains(cases, item => item.GetProperty("stage").GetString() == "narrative"
            && item.GetProperty("attempts")[0].GetProperty("labels").EnumerateArray().Any(label => label.GetString() == "runtime_validator_passed"));
        Assert.Contains(cases, item => item.GetProperty("stage").GetString() == "entityState"
            && item.GetProperty("attempts")[0].GetProperty("labels").EnumerateArray().Any(label => label.GetString() == "state_schema_valid"));
        var runId = summary.GetProperty("id").GetString();

        using var listed = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs");
        Assert.Equal(HttpStatusCode.OK, listed.StatusCode);
        var list = await listed.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains(list.EnumerateArray(), item => item.GetProperty("id").GetString() == runId && item.GetProperty("attemptCount").GetInt32() == 12);

        using var jsonExport = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}/export?format=json");
        Assert.Equal("application/json", jsonExport.Content.Headers.ContentType?.MediaType);
        var exported = await jsonExport.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(12, exported.GetProperty("summary").GetProperty("attemptCount").GetInt32());

        using var csvExport = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}/export?format=csv");
        Assert.Equal("text/csv", csvExport.Content.Headers.ContentType?.MediaType);
        var csv = await csvExport.Content.ReadAsStringAsync();
        Assert.Contains("runId,caseId,stage,profileId", csv);
        Assert.Equal(13, csv.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length);
    }

    [Fact]
    public async Task CorpusManifest_IsVersionedAndOwnerScoped()
    {
        var owner = await CreateSignedInClientAsync("corpus");
        var scenarioId = await CreateScenarioAsync(owner);
        using var response = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/corpus");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("myriale-low-cost-model-comparison", json.GetProperty("corpusId").GetString());
        Assert.Equal("1.0.0", json.GetProperty("version").GetString());
        Assert.Equal(3, json.GetProperty("stages").GetArrayLength());
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private static CreateScenarioAiEvaluationRunRequest CreateRequest(IReadOnlyList<ScenarioAiEvaluationCaseInput> cases,
        IReadOnlyList<AiProviderProfileId> profiles, int repetitions) => new(profiles, repetitions, "fixture", "1.0.0",
        Element("{\"temperature\":0}"), cases);

    private static ScenarioAiEvaluationCaseInput ActionCase()
    {
        var request = new ModelActionDecisionRequest(ScenarioTurnSchemas.ModelActionDecisionRequest, "open",
            new(new("room", "Room", ""), []), [], [new("system:clarify", "clarify", "Clarify", "", Element("{}"))]);
        return new("action-1", "action", Element(request), Element("{\"expectedSelectionCode\":\"system:clarify\",\"expectedArguments\":{}}"));
    }

    private static ScenarioAiEvaluationCaseInput NarrativeCase()
    {
        var location = new RulePublicLocation(new("LOC"), "room", "Room", "");
        var selectedObject = new RulePublicObject(new("OBJ"), "guide", "Guide", location.Id, false, 1, Element("{}"));
        var action = new RulePublicAction(selectedObject.Id, new("ACT"), "talk", "Talk", "", Element("{}"), true);
        var state = new RulePostState("state.v1", location, [selectedObject], new Dictionary<string, bool>(), 2);
        var request = new PostStateNarrativeRequest(ScenarioTurnSchemas.PostStateNarrative,
            new("Title", "", "", "", "", "", "Hero", [], ""), [], "hello", selectedObject, action, state, [], [], [], ["secret"]);
        return new("narrative-1", "narrative", Element(request),
            Element("{\"requiredTerms\":[\"Guide\"],\"forbiddenTerms\":[\"secret\"],\"forbiddenPlayerAgencyTerms\":[\"Hero decided\"]}"));
    }

    private static ScenarioAiEvaluationCaseInput StateCase()
    {
        var request = new EntityStateTransitionRequest(ScenarioTurnSchemas.EntityStateTransition, "guide", 4, Element("{}"), "",
            Element("{\"type\":\"object\",\"properties\":{\"mood\":{\"type\":\"string\"}}}"), Element("{\"mood\":\"neutral\"}"),
            Element("{}"), "hello", "room", "room", [], []);
        return new("state-1", "entityState", Element(request),
            Element("{\"allowedNextStateFields\":[\"mood\"],\"expectedNextState\":{\"mood\":\"warm\"}}"));
    }

    private async Task<string> CreateScenarioAsync(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/scenarios/", new { title = "Evaluation scenario" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<HttpClient> CreateSignedInClientAsync(string name)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = name, email = $"{name}-{Guid.NewGuid():N}@example.test", password = "letters1"
        });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        ApplyCookies(client, register);
        return client;
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        foreach (var value in values) client.DefaultRequestHeaders.Add("Cookie", value.Split(';', 2)[0]);
    }

    private static JsonElement Element<T>(T value) => JsonSerializer.SerializeToElement(value, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    private static JsonElement Element(string json) => JsonDocument.Parse(json).RootElement.Clone();

    private sealed class TestProfiles : IAiProfileCatalog
    {
        private static readonly IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> Profiles = new Dictionary<AiProviderProfileId, AiProfileDescriptor>
        {
            [new("profile-a")] = Descriptor("profile-a", 1), [new("profile-b")] = Descriptor("profile-b", 2),
        };
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken) =>
            Task.FromResult(new AiProfileCatalogSnapshot(Profiles, new("profile-a"), new("profile-a")));
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId profileId, CancellationToken cancellationToken) =>
            Task.FromResult(Profiles[profileId]);
        public Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken cancellationToken) => Task.FromResult(requested ?? new("profile-a"));
        public Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken cancellationToken) => Task.FromResult(requested ?? new("profile-a"));
        private static AiProfileDescriptor Descriptor(string id, long revision) => new(new(id), id, "http://test", $"model-{id}", new("credential"), true, AiProfileDefinitionSource.Deployment, revision);
    }

    private sealed class TestAi : IScenarioTurnAiService
    {
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(AiProviderProfileId profileId,
            ModelActionDecisionRequest request, CancellationToken cancellationToken) => Task.FromResult(Generation(profileId,
                new ModelActionDecisionResult(ScenarioTurnSchemas.ModelActionDecisionResult, "system:clarify", Element("{}"))));
        public Task<NarrativeGeneration<EntityStateTransitionResult>> GenerateEntityStateTransitionForProfileAsync(AiProviderProfileId profileId,
            EntityStateTransitionRequest request, CancellationToken cancellationToken) => Task.FromResult(Generation(profileId,
                new EntityStateTransitionResult(ScenarioTurnSchemas.EntityStateTransition, request.EntityCode, request.ExpectedRevision,
                    Element("{\"mood\":\"warm\"}"), [], [], [], null)));
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeForProfileAsync(AiProviderProfileId profileId,
            PostStateNarrativeRequest request, CancellationToken cancellationToken) => Task.FromResult(Generation(profileId,
                new PostStateNarrativeResult(ScenarioTurnSchemas.PostStateNarrative, "Greeting", "Guide welcomes the visitor.")));
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        private static NarrativeGeneration<T> Generation<T>(AiProviderProfileId profileId, T value) => new(value,
            new(profileId, $"model-{profileId.AsPrimitive()}", "response", 10, 5, 12, 1, "stop"), "prompt", JsonSerializer.Serialize(value));
    }
}
