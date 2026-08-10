using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Myriale.Api.Tests;

public sealed class EvaluationSessionEndpointTests : IDisposable
{
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-evaluation-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> factory;
    public EvaluationSessionEndpointTests() => factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
    {
        builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
        builder.UseSetting("EvaluationWorker:IdleDelayMilliseconds", "10");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IAiProfileCatalog>(); services.RemoveAll<IScenarioTurnAiService>();
            services.AddSingleton<IAiProfileCatalog>(new TestProfiles()); services.AddSingleton<IScenarioTurnAiService>(new TestAi());
        });
    });

    [Fact]
    public async Task IndependentSession_RunsDurablyAndPreservesInvocationAndMachineJudgmentRows()
    {
        using var anonymous = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/evaluation-sessions")).StatusCode);
        var owner = await CreateSignedInClientAsync("evaluation-owner");
        var session = await CreateDraftAsync(owner, "durable"); var id = session.GetProperty("summary").GetProperty("id").GetString()!;
        await AddActionSituationAsync(owner, id, "=formula-safe-key"); await AddCandidateAsync(owner, id);
        using var started = await owner.PostAsync($"/api/evaluation-sessions/{id}:start", null); Assert.Equal(HttpStatusCode.Accepted, started.StatusCode);
        var execution = await WaitForTerminalAsync(owner, id); Assert.Equal("awaitingHumanReview", execution.GetProperty("session").GetProperty("status").GetString());
        Assert.Equal(1, execution.GetProperty("session").GetProperty("succeededAttemptCount").GetInt32());
        await using var scope = factory.Services.CreateAsyncScope(); var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var invocation = await db.EvaluationModelInvocations.AsNoTracking().SingleAsync(); Assert.Equal(EvaluationInvocationStatus.Succeeded, invocation.Status);
        Assert.Equal("prompt", invocation.SentPrompt); Assert.Contains("system:clarify", invocation.RawResponse); Assert.NotNull(invocation.RequestHash); Assert.NotNull(invocation.OutputHash);
        var judgment = await db.EvaluationMachineJudgments.AsNoTracking().SingleAsync(); Assert.True(judgment.Passed); Assert.Equal("myriale-stage-rubric", judgment.JudgeKey); Assert.Equal("1.0.0", judgment.JudgeVersion);
        Assert.Empty(await db.Set<Scenario>().Where(x => false).ToListAsync());
        var other = await CreateSignedInClientAsync("evaluation-other"); Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/evaluation-sessions/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync("/api/scenarios/SCN-STAR-LIBRARY/ai-evaluations/runs")).StatusCode);
    }

    [Fact]
    public async Task BlindReviewerContract_DoesNotExposeIdentityMachineOrTelemetryFields()
    {
        var owner = await CreateSignedInClientAsync("organizer"); var reviewer = await CreateSignedInClientAsync("reviewer"); var reviewerId = await UserIdAsync("reviewer");
        var draft = await CreateDraftAsync(owner, "blind"); var id = draft.GetProperty("summary").GetProperty("id").GetString()!;
        await AddActionSituationAsync(owner, id, "blind-case"); await AddCandidateAsync(owner, id); _ = await owner.PostAsync($"/api/evaluation-sessions/{id}:start", null); _ = await WaitForTerminalAsync(owner, id);
        using var batch = await owner.PostAsJsonAsync($"/api/evaluation-sessions/{id}/review-batches", new { reviewerIds = new[] { reviewerId }, requiredReviewsPerOutput = 1, rubricVersion = "1", deadline = (DateTimeOffset?)null });
        Assert.Equal(HttpStatusCode.Created, batch.StatusCode);
        string code; await using (var scope = factory.Services.CreateAsyncScope()) { var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(); code = await db.EvaluationReviewAssignments.Select(x => x.OpaqueCode).SingleAsync(); }
        var json = await reviewer.GetStringAsync($"/api/evaluation-review-assignments/{code}");
        foreach (var forbidden in new[] { "profileId", "provider", "model", "machine", "inputTokens", "outputTokens", "latency", "providerRequestId" }) Assert.DoesNotContain($"\"{forbidden}\"", json, StringComparison.OrdinalIgnoreCase);
        var document = JsonDocument.Parse(json); Assert.Equal("C-", document.RootElement.GetProperty("items")[0].GetProperty("candidateCode").GetString()![..2]);
    }

    [Fact]
    public async Task FixedSituationSnapshotsInputAndCorpusIsScenarioIndependent()
    {
        var owner = await CreateSignedInClientAsync("snapshot"); var draft = await CreateDraftAsync(owner, "snapshot"); var id = draft.GetProperty("summary").GetProperty("id").GetString()!;
        var request = ActionRequest(); using var added = await owner.PostAsJsonAsync($"/api/evaluation-sessions/{id}/situations/fixed", new { stableKey = "fixed", stage = "action", request, expectations = Element("{\"expectedSelectionCode\":\"system:clarify\",\"expectedArguments\":{}}"), corpusKey = "fixture", corpusVersion = "1", corpusCaseKey = "fixed", sensitivity = "internal" });
        added.EnsureSuccessStatusCode(); var hash = (await added.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("requestHash").GetString(); Assert.Equal(64, hash!.Length);
        using var corpus = await owner.GetAsync("/api/evaluation-corpora"); corpus.EnsureSuccessStatusCode(); var manifests = await corpus.Content.ReadFromJsonAsync<JsonElement>(); Assert.Equal("myriale-low-cost-model-comparison", manifests[0].GetProperty("corpusId").GetString());
    }

    private async Task<JsonElement> CreateDraftAsync(HttpClient client, string title)
    {
        using var response = await client.PostAsJsonAsync("/api/evaluation-sessions", new { title, purpose = "test", tags = new[] { "test" }, sensitivity = "internal", retentionPolicy = "standard", config = Element("{}"), rubric = Element("{\"criteria\":[\"overall\"]}"), reviewPolicy = Element("{}"), idempotencyKey = $"{title}-{Guid.NewGuid():N}" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode); return await response.Content.ReadFromJsonAsync<JsonElement>();
    }
    private static async Task AddActionSituationAsync(HttpClient client, string id, string key)
    {
        using var response = await client.PostAsJsonAsync($"/api/evaluation-sessions/{id}/situations/fixed", new { stableKey = key, stage = "action", request = ActionRequest(), expectations = Element("{\"expectedSelectionCode\":\"system:clarify\",\"expectedArguments\":{}}"), corpusKey = (string?)null, corpusVersion = (string?)null, corpusCaseKey = (string?)null, sensitivity = "internal" }); response.EnsureSuccessStatusCode();
    }
    private static async Task AddCandidateAsync(HttpClient client, string id)
    {
        using var response = await client.PostAsJsonAsync($"/api/evaluation-sessions/{id}/candidates", new { candidateKey = "candidate-a", profileId = "profile-a", repetitions = 1, generationOverrides = new { temperature = 0, retryAttempts = 3 }, maxInvocations = 2 }); response.EnsureSuccessStatusCode();
    }
    private static async Task<JsonElement> WaitForTerminalAsync(HttpClient client, string id)
    {
        for (var i = 0; i < 200; i++) { var value = await client.GetFromJsonAsync<JsonElement>($"/api/evaluation-sessions/{id}/execution"); var status = value.GetProperty("session").GetProperty("status").GetString(); if (status is "awaitingHumanReview" or "completed" or "completedWithErrors" or "failed") return value; await Task.Delay(20); }
        throw new TimeoutException("Evaluation did not complete.");
    }
    private async Task<HttpClient> CreateSignedInClientAsync(string name)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false }); var email = $"{name}@example.test";
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = name, email, password = "letters1" }); Assert.Equal(HttpStatusCode.OK, register.StatusCode); ApplyCookies(client, register); return client;
    }
    private async Task<string> UserIdAsync(string name)
    {
        await using var scope = factory.Services.CreateAsyncScope(); var users = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<ApplicationUser>>(); return (await users.FindByEmailAsync($"{name}@example.test"))!.Id;
    }
    private static ModelActionDecisionRequest ActionRequest() => new(ScenarioTurnSchemas.ModelActionDecisionRequest, "open", new(new("room", "Room", ""), []), [], [new("system:clarify", "clarify", "Clarify", "", Element("{}"))]);
    private static void ApplyCookies(HttpClient client, HttpResponseMessage response) { if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return; client.DefaultRequestHeaders.Remove("Cookie"); foreach (var value in values) client.DefaultRequestHeaders.Add("Cookie", value.Split(';', 2)[0]); }
    private static JsonElement Element<T>(T value) => JsonSerializer.SerializeToElement(value, new JsonSerializerOptions(JsonSerializerDefaults.Web)); private static JsonElement Element(string json) => JsonDocument.Parse(json).RootElement.Clone();
    public void Dispose() { factory.Dispose(); if (File.Exists(dbPath)) File.Delete(dbPath); }

    private sealed class TestProfiles : IAiProfileCatalog
    {
        private static readonly AiProfileDescriptor Profile = new(new("profile-a"), "Profile A", "http://test", "model-a", new("credential"), true, AiProfileDefinitionSource.Deployment, 4);
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) => Task.FromResult(new AiProfileCatalogSnapshot(new Dictionary<AiProviderProfileId, AiProfileDescriptor> { [Profile.Id] = Profile }, Profile.Id, Profile.Id));
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId id, CancellationToken ct) => Task.FromResult(Profile);
        public Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? id, CancellationToken ct) => Task.FromResult(id ?? Profile.Id);
        public Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? id, CancellationToken ct) => Task.FromResult(id ?? Profile.Id);
    }
    private sealed class TestAi : IScenarioTurnAiService
    {
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionForProfileAsync(AiProviderProfileId id, ModelActionDecisionRequest request, CancellationToken ct) => Task.FromResult(new NarrativeGeneration<ModelActionDecisionResult>(new(ScenarioTurnSchemas.ModelActionDecisionResult, "system:clarify", Element("{}")), new(id, "model-a", "response-1", 10, 5, 12, 1, "stop"), "prompt", "{\"schemaVersion\":\"model-action-decision-result.v3\",\"selectionCode\":\"system:clarify\",\"arguments\":{}}"));
        public Task<NarrativeGeneration<ModelActionDecisionResult>> DecideActionAsync(ModelActionDecisionRequest request, CancellationToken ct) => DecideActionForProfileAsync(new("profile-a"), request, ct);
        public Task<NarrativeGeneration<PostStateNarrativeResult>> GeneratePostStateNarrativeAsync(PostStateNarrativeRequest request, CancellationToken ct) => throw new NotSupportedException();
    }
}
