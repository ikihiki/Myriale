using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Myriale.Api.Tests;

public sealed class AiEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;
    public AiEndpointTests() => _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
    {
        builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}");
        builder.ConfigureServices(services => { services.RemoveAll<IAiTextProvider>(); services.AddSingleton<IAiTextProvider, SuccessfulTextProvider>(); });
    });

    [Fact]
    public async Task LegacyAiKeysRouteIsAbsentAndNewRoutesRequireAdmin()
    {
        var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync("/api/admin/ai-keys/")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/admin/ai-profiles/")).StatusCode);
        var user = await CreateSignedInClientAsync(false);
        Assert.Equal(HttpStatusCode.Forbidden, (await user.GetAsync("/api/admin/ai-credentials/")).StatusCode);
    }

    [Fact]
    public async Task ProfileCredentialLifecycleUsesSplitResourcesAndNeverExposesSecret()
    {
        var client = await CreateSignedInClientAsync(true);
        using var credential = await client.PostAsJsonAsync("/api/admin/ai-credentials/", new { id = "local-secret", displayName = "Local", secret = "top-secret-9876" });
        Assert.Equal(HttpStatusCode.Created, credential.StatusCode); var credentialBody = await credential.Content.ReadAsStringAsync();
        Assert.DoesNotContain("top-secret-9876", credentialBody); Assert.DoesNotContain("protected", credentialBody, StringComparison.OrdinalIgnoreCase);
        using var profile = await client.PostAsJsonAsync("/api/admin/ai-profiles/", new { id = "local", displayName = "Local", baseUrl = "https://local.test/v1", model = "local-model", credentialId = "local-secret", enabled = true });
        Assert.Equal(HttpStatusCode.Created, profile.StatusCode);
        using var listed = await client.GetAsync("/api/admin/ai-profiles/");
        Assert.True(listed.IsSuccessStatusCode, await listed.Content.ReadAsStringAsync());
        var row = (await listed.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().Single(x => x.GetProperty("id").GetString() == "local");
        Assert.True(row.GetProperty("credentialConfigured").GetBoolean()); Assert.Equal(1, row.GetProperty("revision").GetInt64()); Assert.DoesNotContain("top-secret-9876", row.ToString());
        using var tested = await client.PostAsJsonAsync("/api/admin/ai-profiles/local/connection-tests", new { expectedProfileRevision = 1, expectedCredentialRevision = 1 });
        Assert.Equal(HttpStatusCode.OK, tested.StatusCode);
        using var prompt = await client.PostAsJsonAsync("/api/admin/ai-profiles/local/prompt-tests", new { prompt = "hello", expectedProfileRevision = 1, expectedCredentialRevision = 1 });
        Assert.Equal(HttpStatusCode.OK, prompt.StatusCode); Assert.Contains("テスト応答", await prompt.Content.ReadAsStringAsync());
        using var replaced = await client.PutAsJsonAsync("/api/admin/ai-credentials/local-secret", new { displayName = "Local replaced", secret = "replacement-4321", expectedRevision = 1 });
        Assert.Equal(HttpStatusCode.OK, replaced.StatusCode);
        using var afterReplacement = await client.GetAsync("/api/admin/ai-profiles/");
        var replacedProfile = (await afterReplacement.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().Single(x => x.GetProperty("id").GetString() == "local");
        Assert.Equal(2, replacedProfile.GetProperty("credentialRevision").GetInt64());
        Assert.Equal("untested", replacedProfile.GetProperty("validationStatus").GetString());
    }

    [Fact]
    public async Task StaleProfileUpdateSharedCredentialDeleteAndActiveDisableConflict()
    {
        var client = await CreateSignedInClientAsync(true);
        await client.PostAsJsonAsync("/api/admin/ai-credentials/", new { id = "shared", displayName = "Shared", secret = "shared-secret" });
        await client.PostAsJsonAsync("/api/admin/ai-profiles/", new { id = "first", displayName = "First", baseUrl = "https://first.test/v1", model = "model", credentialId = "shared", enabled = true });
        using var stale = await client.PutAsJsonAsync("/api/admin/ai-profiles/first", new { displayName = "Changed", baseUrl = "https://first.test/v1", model = "model", credentialId = "shared", expectedRevision = 0 });
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.DeleteAsync("/api/admin/ai-credentials/shared?expectedRevision=1")).StatusCode);
        using var activated = await client.PutAsJsonAsync("/api/admin/ai-profiles/active", new { provider = "first" });
        Assert.True(activated.IsSuccessStatusCode, await activated.Content.ReadAsStringAsync());
        using var disabled = await client.PostAsJsonAsync("/api/admin/ai-profiles/first/disable", new { expectedRevision = 1 });
        Assert.Equal(HttpStatusCode.Conflict, disabled.StatusCode);
    }

    public void Dispose() { _factory.Dispose(); if (File.Exists(_dbPath)) File.Delete(_dbPath); }
    private async Task<HttpClient> CreateSignedInClientAsync(bool grantAdmin)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false }); var email = $"admin-{Guid.NewGuid():N}@example.test";
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = "管理者", email, password = "letters1" }); ApplyCookies(client, register); Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        if (grantAdmin) { await using var scope = _factory.Services.CreateAsyncScope(); var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>(); var user = await users.FindByEmailAsync(email) ?? throw new InvalidOperationException(); await users.AddClaimAsync(user, new("myriale:ai-admin", "true")); using var login = await client.PostAsJsonAsync("/api/account/login", new { email, password = "letters1" }); ApplyCookies(client, login); }
        return client;
    }
    private static void ApplyCookies(HttpClient client, HttpResponseMessage response) { if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return; client.DefaultRequestHeaders.Remove("Cookie"); foreach (var value in values) { var cookie = value.Split(';', 2)[0]; if (!string.IsNullOrWhiteSpace(cookie)) client.DefaultRequestHeaders.Add("Cookie", cookie); } }
    private sealed class SuccessfulTextProvider : IAiTextProvider
    {
        public Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken ct) => GenerateForProviderAsync("openai", "test", request, ct);
        public Task<AiTextResponse> GenerateForProviderAsync(string provider, string credential, AiTextRequest request, CancellationToken ct) => Task.FromResult(new AiTextResponse("{\"response\":\"テスト応答です。\"}", new(provider, "test-model", "response-1", 12, 7, 42, 1, "stop")));
        public Task TestConnectionAsync(string provider, string credential, CancellationToken ct) => Task.CompletedTask;
    }
}
