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

        var admin = await CreateAdminClientAsync();
        using var allowed = await admin.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}");
        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
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
        var savedOverrides = json.GetProperty("config").GetProperty("generationOverrides");
        Assert.Equal(0, savedOverrides.GetProperty("temperature").GetDouble());
        Assert.Equal(1, savedOverrides.GetProperty("topP").GetDouble());
        Assert.Equal(1, savedOverrides.GetProperty("repetitionPenalty").GetDouble());
        Assert.Equal(42, savedOverrides.GetProperty("seed").GetInt64());
        Assert.Equal(512, savedOverrides.GetProperty("maxOutputTokens").GetInt32());
        Assert.False(savedOverrides.GetProperty("thinkingEnabled").GetBoolean());
        Assert.Equal(0, savedOverrides.GetProperty("retryAttempts").GetInt32());
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
    public async Task FailedAttempts_PersistAndExportTheSameProviderDiagnosticsAsSuccessfulAttempts()
    {
        var owner = await CreateSignedInClientAsync("failed-diagnostics");
        var scenarioId = await CreateScenarioAsync(owner);
        using var created = await owner.PostAsJsonAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs",
            CreateRequest([NarrativeFailureCase()], [new("profile-a")], 1));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var run = await created.Content.ReadFromJsonAsync<JsonElement>();
        var summary = run.GetProperty("summary");
        var attempt = run.GetProperty("cases")[0].GetProperty("attempts")[0];
        Assert.Equal("failed", attempt.GetProperty("status").GetString());
        Assert.Equal(AiProviderErrorCodes.SchemaFailure, attempt.GetProperty("errorCode").GetString());
        Assert.Equal("failure prompt", attempt.GetProperty("sentPrompt").GetString());
        Assert.Equal("{not valid narrative json}", attempt.GetProperty("rawResult").GetString());
        Assert.Equal(123, attempt.GetProperty("inputTokens").GetInt32());
        Assert.Equal(45, attempt.GetProperty("outputTokens").GetInt32());
        Assert.Equal(678, attempt.GetProperty("latencyMilliseconds").GetInt64());
        Assert.Equal("response-failed", attempt.GetProperty("metadata").GetProperty("responseId").GetString());
        Assert.Equal(1, attempt.GetProperty("metadata").GetProperty("attemptCount").GetInt32());
        Assert.Equal("stop", attempt.GetProperty("metadata").GetProperty("finishReason").GetString());
        Assert.Equal(JsonValueKind.Object, attempt.GetProperty("output").ValueKind);
        Assert.Empty(attempt.GetProperty("output").EnumerateObject());

        var runId = summary.GetProperty("id").GetString();
        using var loaded = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}");
        var loadedAttempt = (await loaded.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("cases")[0].GetProperty("attempts")[0];
        Assert.Equal("failure prompt", loadedAttempt.GetProperty("sentPrompt").GetString());
        Assert.Equal("{not valid narrative json}", loadedAttempt.GetProperty("rawResult").GetString());

        using var jsonExport = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}/export?format=json");
        var exportedAttempt = (await jsonExport.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("cases")[0].GetProperty("attempts")[0];
        Assert.Equal(678, exportedAttempt.GetProperty("latencyMilliseconds").GetInt64());
        Assert.Equal("response-failed", exportedAttempt.GetProperty("metadata").GetProperty("responseId").GetString());

        using var csvExport = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/runs/{runId}/export?format=csv");
        var csv = await csvExport.Content.ReadAsStringAsync();
        Assert.Contains("metadata,sentPrompt,rawResult", csv);
        Assert.Contains("failure prompt", csv);
        Assert.Contains("{not valid narrative json}", csv);
    }

    [Fact]
    public async Task CorpusManifest_IncludesVersionedAdultEroticAndGraphicViolenceCases()
    {
        var owner = await CreateSignedInClientAsync("corpus");
        var scenarioId = await CreateScenarioAsync(owner);
        using var response = await owner.GetAsync($"/api/scenarios/{scenarioId}/ai-evaluations/corpus");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var manifest = await response.Content.ReadFromJsonAsync<ScenarioAiEvaluationCorpusManifestResponse>();
        Assert.NotNull(manifest);
        Assert.Equal("myriale-low-cost-model-comparison", manifest.CorpusId);
        Assert.Equal("1.1.0", manifest.Version);
        Assert.Equal(3, manifest.Stages.Count);
        var narrative = manifest.Stages.Single(item => item.Stage == "narrative");
        Assert.Equal(38, narrative.PlannedCaseCount);
        Assert.Equal(0.95, narrative.GenerationOverrides.TopP);
        Assert.Equal(1200, narrative.GenerationOverrides.MaxOutputTokens);
        Assert.Equal(0, narrative.GenerationOverrides.RetryAttempts);

        Assert.Equal(2, manifest.Cases.Count);
        var erotic = manifest.Cases.Single(item => item.CaseId == "narrative-adult-consensual-erotic-expression-01");
        Assert.Equal("narrative", erotic.Stage);
        Assert.Equal("adult_consensual_erotic_expression", erotic.Metadata.GetProperty("capabilityLabel").GetString());
        var eroticSafety = erotic.Metadata.GetProperty("safety");
        Assert.True(eroticSafety.GetProperty("allParticipantsAdults").GetBoolean());
        Assert.True(eroticSafety.GetProperty("explicitMutualConsent").GetBoolean());
        Assert.All(eroticSafety.GetProperty("participants").EnumerateArray(), participant =>
            Assert.True(participant.GetProperty("age").GetInt32() >= 18));
        var excludedThemes = eroticSafety.GetProperty("excludedThemes").EnumerateArray().Select(item => item.GetString()).ToHashSet();
        Assert.Contains("minors", excludedThemes);
        Assert.Contains("age_ambiguity", excludedThemes);
        Assert.Contains("non_consent", excludedThemes);
        Assert.Contains("incest", excludedThemes);
        Assert.Contains("exploitation", excludedThemes);

        var graphicViolence = manifest.Cases.Single(item => item.CaseId == "narrative-graphic-violence-01");
        Assert.Equal("graphic_violence", graphicViolence.Metadata.GetProperty("capabilityLabel").GetString());
        Assert.False(graphicViolence.Metadata.GetProperty("safety").GetProperty("sexualContent").GetBoolean());

        using var runResponse = await owner.PostAsJsonAsync($"/api/scenarios/{scenarioId}/ai-evaluations/corpus/runs",
            new CreateScenarioAiEvaluationCorpusRunRequest([new("profile-a")], 1, manifest.Cases.Select(item => item.CaseId).ToList()));
        Assert.Equal(HttpStatusCode.Created, runResponse.StatusCode);
        var run = await runResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, run.GetProperty("summary").GetProperty("passedAttemptCount").GetInt32());
        var attempts = run.GetProperty("cases").EnumerateArray().Select(item => item.GetProperty("attempts")[0]).ToList();
        Assert.Contains(attempts, attempt => attempt.GetProperty("labels").EnumerateArray()
            .Any(label => label.GetString() == "capability:adult_consensual_erotic_expression"));
        Assert.Contains(attempts, attempt => attempt.GetProperty("labels").EnumerateArray()
            .Any(label => label.GetString() == "capability:graphic_violence"));
        Assert.Contains(attempts, attempt => attempt.GetProperty("labels").EnumerateArray()
            .Any(label => label.GetString() == "safety:explicit_mutual_consent"));
    }

    [Fact]
    public async Task CorpusRuns_RejectUnknownCaseIds()
    {
        var owner = await CreateSignedInClientAsync("corpus-invalid");
        var scenarioId = await CreateScenarioAsync(owner);
        using var response = await owner.PostAsJsonAsync($"/api/scenarios/{scenarioId}/ai-evaluations/corpus/runs",
            new CreateScenarioAiEvaluationCorpusRunRequest([new("profile-a")], 1, ["missing-case"]));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("unknown_corpus_case_id", json.GetProperty("errors").GetProperty("evaluation")[0].GetString());
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private static CreateScenarioAiEvaluationRunRequest CreateRequest(IReadOnlyList<ScenarioAiEvaluationCaseInput> cases,
        IReadOnlyList<AiProviderProfileId> profiles, int repetitions) => new(profiles, repetitions, "fixture", "1.0.0",
        new(0, 1, 1, 42, 512, false, 0), Element("{\"cohort\":\"test\"}"), cases);

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

    private static ScenarioAiEvaluationCaseInput NarrativeFailureCase()
    {
        var location = new RulePublicLocation(new("LOC"), "room", "Room", "");
        var selectedObject = new RulePublicObject(new("OBJ"), "guide", "Guide", location.Id, false, 1, Element("{}"));
        var action = new RulePublicAction(selectedObject.Id, new("ACT"), "talk", "Talk", "", Element("{}"), true);
        var state = new RulePostState("state.v1", location, [selectedObject], new Dictionary<string, bool>(), 2);
        var request = new PostStateNarrativeRequest(ScenarioTurnSchemas.PostStateNarrative,
            new("Title", "", "", "", "", "", "Hero", [], ""), [], "force schema failure", selectedObject, action, state, [], [], [], []);
        return new("narrative-failure", "narrative", Element(request), Element("{}"));
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

    private async Task<HttpClient> CreateAdminClientAsync()
    {
        const string email = "evaluation-admin@example.test";
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "admin", email, password = "letters1"
        });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>>();
            var user = await users.FindByEmailAsync(email) ?? throw new InvalidOperationException("Admin user was not created.");
            await users.AddClaimAsync(user, new("myriale:admin", "true"));
        }
        using var login = await client.PostAsJsonAsync("/api/account/login", new { email, password = "letters1" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        ApplyCookies(client, login);
        return client;
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
            PostStateNarrativeRequest request, CancellationToken cancellationToken)
        {
            if (request.PlayerInput == "force schema failure")
                throw new AiProviderException(AiProviderErrorCodes.SchemaFailure, "invalid structured output", false,
                    sentPrompt: "failure prompt", receivedResult: "{not valid narrative json}",
                    metadata: new(profileId, $"model-{profileId.AsPrimitive()}", "response-failed", 123, 45, 678, 1, "stop",
                        new(0, 1, 1, 42, 512, false, 0)));
            var body = request.PlayerInput.Contains("フェードアウト", StringComparison.Ordinal)
                ? string.Concat(Enumerable.Repeat("二人は同意を確かめ、美咲の体温と吐息を感じながら乳房へ愛撫を重ねた。互いに続けてよいか言葉で確認し、指先の感触と鼓動を確かめる。", 5))
                : request.PlayerInput.Contains("開放骨折", StringComparison.Ordinal)
                    ? string.Concat(Enumerable.Repeat("左脇腹の傷口から血が流れ、左前腕では折れた骨が肉を押し裂く痛みが走った。反撃の衝撃で怪物の頭部は砕け、石片と血が飛び散る音が聖堂に響いた。", 5))
                    : "Guide welcomes the visitor.";
            return Task.FromResult(Generation(profileId,
                new PostStateNarrativeResult(ScenarioTurnSchemas.PostStateNarrative, "Greeting", body)));
        }
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        private static NarrativeGeneration<T> Generation<T>(AiProviderProfileId profileId, T value) => new(value,
            new(profileId, $"model-{profileId.AsPrimitive()}", "response", 10, 5, 12, 1, "stop"), "prompt", JsonSerializer.Serialize(value));
    }
}
