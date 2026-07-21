using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class AiEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public AiEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}");
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<IAiTextProvider>();
                    services.AddSingleton<IAiTextProvider, SuccessfulTextProvider>();
                });
            });
    }

    [Fact]
    public async Task AdminAiKeys_RequiresClaimEncryptsKeyAndTestsProvider()
    {
        using var anonymous = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/admin/ai-keys/")).StatusCode);

        var client = await CreateSignedInClientAsync(grantAdmin: false);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/ai-keys/")).StatusCode);
        client = await CreateSignedInClientAsync(grantAdmin: true);

        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/openai", new { displayName = "OpenAI", secret = "test-secret-1234" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedJson = await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("••••••••1234", savedJson.GetProperty("maskedKey").GetString());
        Assert.DoesNotContain("test-secret-1234", savedJson.ToString(), StringComparison.Ordinal);
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.DoesNotContain("test-secret-1234", (await db.AiProviderKeys.FindAsync("openai"))!.Secret, StringComparison.Ordinal);
        }

        using var tested = await client.PostAsync("/api/admin/ai-keys/openai/test", null);
        Assert.Equal(HttpStatusCode.OK, tested.StatusCode);
        Assert.Equal("valid", (await tested.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task AdminAiKeys_ListsAndTestsEnvironmentConfiguredProviderWithoutDatabaseKey()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"myriale-ai-environment-{Guid.NewGuid():N}.db");
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={databasePath}");
                builder.UseSetting("AiProvider:Provider", "runpod");
                builder.UseSetting("AiProvider:ApiKey", "vault-secret-5678");
                builder.UseSetting("AiProvider:BaseUrl", "https://api.runpod.ai/v2/example/openai/v1");
                builder.UseSetting("AiProvider:Model", "Qwen/Qwen3-8B");
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<IAiTextProvider>();
                    services.AddSingleton<IAiTextProvider, SuccessfulTextProvider>();
                });
            });
        try
        {
            var client = await CreateSignedInClientAsync(grantAdmin: true, factory);
            using var listed = await client.GetAsync("/api/admin/ai-keys/");
            Assert.Equal(HttpStatusCode.OK, listed.StatusCode);
            var providers = (await listed.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToArray();
            var runpod = providers.Single(item => item.GetProperty("provider").GetString() == "runpod");
            Assert.True(runpod.GetProperty("configured").GetBoolean());
            Assert.True(runpod.GetProperty("active").GetBoolean());
            Assert.Equal("environment", runpod.GetProperty("credentialSource").GetString());
            Assert.Equal("••••••••5678", runpod.GetProperty("maskedKey").GetString());

            using var tested = await client.PostAsync("/api/admin/ai-keys/runpod/test", null);
            Assert.Equal(HttpStatusCode.OK, tested.StatusCode);
            var testedJson = await tested.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("valid", testedJson.GetProperty("status").GetString());
            Assert.Equal("environment", testedJson.GetProperty("credentialSource").GetString());
        }
        finally
        {
            if (File.Exists(databasePath)) File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task ScenarioAiAssist_ReturnsMockSuggestion()
    {
        var client = await CreateSignedInClientAsync();

        using var response = await client.PostAsJsonAsync("/api/scenarios/ai/assist", new
        {
            kind = "summary",
            target = "文章AI",
            title = "星喰いの地下図書館",
            summary = "",
            genre = "ダークファンタジー",
            tone = "静かで不穏",
            lore = "星座は魔法体系の鍵。",
            aiFreedom = "中",
            hero = "司書見習い",
            opening = "水没した閲覧室",
            illustrationStyle = "銅版画風",
            illustrationMood = "孤独",
            illustrationNegative = "銃器",
            sampleScene = "星図を抱えた司書"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("概要案", json.GetProperty("message").GetString());
        Assert.NotEmpty(json.GetProperty("suggestions").EnumerateArray());
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private async Task<HttpClient> CreateSignedInClientAsync(bool grantAdmin = false, WebApplicationFactory<Program>? factory = null)
    {
        factory ??= _factory;
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "管理者",
            email = $"admin-{Guid.NewGuid():N}@example.test",
            password = "letters1"
        });
        ApplyCookies(client, register);
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        if (grantAdmin)
        {
            var email = (await register.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("email").GetString()!;
            await using var scope = factory.Services.CreateAsyncScope();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await users.FindByEmailAsync(email) ?? throw new InvalidOperationException();
            await users.AddClaimAsync(user, new System.Security.Claims.Claim("myriale:ai-admin", "true"));
            using var login = await client.PostAsJsonAsync("/api/account/login", new { email, password = "letters1" });
            ApplyCookies(client, login);
        }
        return client;
    }

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
    private sealed class SuccessfulTextProvider : IAiTextProvider
    {
        public Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task TestConnectionAsync(string provider, string credential, CancellationToken cancellationToken) => Task.CompletedTask;
    }

}
