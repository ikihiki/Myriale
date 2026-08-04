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
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PutAsJsonAsync("/api/admin/ai-keys/active-provider", new { provider = "openai" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/ai-keys/")).StatusCode);
        client = await CreateSignedInClientAsync(grantAdmin: true);

        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/openai", new { displayName = "OpenAI", secret = "test-secret-1234" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedJson = await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("••••••••1234", savedJson.GetProperty("maskedKey").GetString());
        Assert.True(savedJson.GetProperty("active").GetBoolean());
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
    public async Task AdminAiKeys_SendsPromptToInactiveConfiguredProviderAndReturnsDiagnostics()
    {
        var client = await CreateSignedInClientAsync(grantAdmin: true);
        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/runpod", new { displayName = "Runpod Serverless", secret = "runpod-secret-5678" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.False((await saved.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("active").GetBoolean());

        using var response = await client.PostAsJsonAsync("/api/admin/ai-keys/runpod/prompt-test", new
        {
            prompt = "日本語で短く応答してください。"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("runpod", json.GetProperty("provider").GetString());
        Assert.Equal("test-model", json.GetProperty("model").GetString());
        Assert.Equal("テスト応答です。", json.GetProperty("response").GetString());
        Assert.Equal(12, json.GetProperty("inputTokens").GetInt32());
        Assert.Equal(7, json.GetProperty("outputTokens").GetInt32());
    }

    [Fact]
    public async Task AdminAiKeys_ActivatesConfiguredProviderAtRuntime()
    {
        var client = await CreateSignedInClientAsync(grantAdmin: true);
        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/runpod", new { displayName = "Runpod Serverless", secret = "runpod-secret-5678" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        using var activated = await client.PutAsJsonAsync("/api/admin/ai-keys/active-provider", new { provider = "runpod" });
        Assert.Equal(HttpStatusCode.OK, activated.StatusCode);
        Assert.True((await activated.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("active").GetBoolean());

        using var listed = await client.GetAsync("/api/admin/ai-keys/");
        var providers = (await listed.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToArray();
        Assert.True(providers.Single(item => item.GetProperty("provider").GetString() == "runpod").GetProperty("active").GetBoolean());
        Assert.False(providers.Single(item => item.GetProperty("provider").GetString() == "openai").GetProperty("active").GetBoolean());
    }

    [Fact]
    public async Task AdminAiKeys_MapsStaleActivationRevisionToConflict()
    {
        var client = await CreateSignedInClientAsync(grantAdmin: true);
        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/runpod", new { displayName = "Runpod Serverless", secret = "runpod-secret-5678" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var activated = await client.PutAsJsonAsync("/api/admin/ai-keys/active-provider", new { provider = "runpod" });
        Assert.Equal(HttpStatusCode.OK, activated.StatusCode);

        using var stale = await client.PutAsJsonAsync("/api/admin/ai-keys/active-provider", new { provider = "openai", expectedRevision = 0 });

        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
    }

    [Fact]
    public async Task AdminAiKeys_RejectsActivationWhenProviderHasNoCredential()
    {
        var client = await CreateSignedInClientAsync(grantAdmin: true);
        using var response = await client.PutAsJsonAsync("/api/admin/ai-keys/active-provider", new { provider = "runpod" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
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
    public async Task Profiles_CatalogJsonAddsArbitraryUsableProfileWithoutExposingSecret()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"myriale-ai-catalog-{Guid.NewGuid():N}.db");
        const string catalogJson = """
            {"defaultActionDecisionProfileId":"acme-fast","defaultNarrativeProfileId":"acme-fast","profiles":[{"id":"acme-fast","displayName":"Acme Fast","adapter":"openai-compatible","baseUrl":"https://ai.acme.test/v1","model":"acme/story-1","credentialId":"acme-main","enabled":true,"apiKey":"catalog-secret-9999"}]}
            """;
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={databasePath}");
                builder.UseSetting("AiProvider:CatalogJson", catalogJson);
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<IAiTextProvider>();
                    services.AddSingleton<IAiTextProvider, SuccessfulTextProvider>();
                });
            });
        try
        {
            var client = await CreateSignedInClientAsync(factory: factory);
            using var listed = await client.GetAsync("/api/ai/profiles");
            Assert.Equal(HttpStatusCode.OK, listed.StatusCode);
            var body = await listed.Content.ReadAsStringAsync();
            Assert.Contains("acme-fast", body, StringComparison.Ordinal);
            Assert.DoesNotContain("catalog-secret-9999", body, StringComparison.Ordinal);

            var admin = await CreateSignedInClientAsync(grantAdmin: true, factory);
            using var overridden = await admin.PutAsJsonAsync("/api/admin/ai-keys/acme-fast", new
            {
                displayName = "Acme DB Override",
                adapter = "openai-compatible",
                baseUrl = "https://db.acme.test/v1",
                model = "acme/db-model",
                credentialId = "acme-main",
                enabled = true,
                secret = "database-secret-0000"
            });
            Assert.Equal(HttpStatusCode.OK, overridden.StatusCode);
            var overrideJson = await overridden.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("acme/db-model", overrideJson.GetProperty("model").GetString());
            Assert.Equal("environment", overrideJson.GetProperty("credentialSource").GetString());
            Assert.Equal("••••••••9999", overrideJson.GetProperty("maskedKey").GetString());
            Assert.DoesNotContain("catalog-secret-9999", overrideJson.ToString(), StringComparison.Ordinal);
            Assert.DoesNotContain("database-secret-0000", overrideJson.ToString(), StringComparison.Ordinal);

            using var prompted = await admin.PostAsJsonAsync("/api/admin/ai-keys/acme-fast/prompt-test", new { prompt = "hello" });
            Assert.Equal(HttpStatusCode.OK, prompted.StatusCode);
            Assert.DoesNotContain("catalog-secret-9999", await prompted.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        }
        finally
        {
            if (File.Exists(databasePath)) File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task Profiles_CatalogJsonSharesCredentialAcrossProfiles()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"myriale-ai-shared-credential-{Guid.NewGuid():N}.db");
        const string catalogJson = """
            {"profiles":[
              {"id":"shared-primary","displayName":"Shared Primary","adapter":"openai-compatible","baseUrl":"https://primary.example.test/v1","model":"example/primary","credentialId":"shared-main","enabled":true,"apiKey":"shared-secret-4321"},
              {"id":"shared-secondary","displayName":"Shared Secondary","adapter":"openai-compatible","baseUrl":"https://secondary.example.test/v1","model":"example/secondary","credentialId":"shared-main","enabled":true}
            ]}
            """;
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={databasePath}");
                builder.UseSetting("AiProvider:CatalogJson", catalogJson);
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<IAiTextProvider>();
                    services.AddSingleton<IAiTextProvider, SuccessfulTextProvider>();
                });
            });
        try
        {
            var admin = await CreateSignedInClientAsync(grantAdmin: true, factory);
            using var listed = await admin.GetAsync("/api/admin/ai-keys/");
            Assert.Equal(HttpStatusCode.OK, listed.StatusCode);
            var profiles = (await listed.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToArray();
            var secondary = profiles.Single(item => item.GetProperty("provider").GetString() == "shared-secondary");
            Assert.True(secondary.GetProperty("configured").GetBoolean());
            Assert.Equal("environment", secondary.GetProperty("credentialSource").GetString());
            Assert.Equal("••••••••4321", secondary.GetProperty("maskedKey").GetString());

            using var prompted = await admin.PostAsJsonAsync("/api/admin/ai-keys/shared-secondary/prompt-test", new { prompt = "hello" });
            Assert.Equal(HttpStatusCode.OK, prompted.StatusCode);
            Assert.DoesNotContain("shared-secret-4321", await prompted.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        }
        finally
        {
            if (File.Exists(databasePath)) File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task AdminAiProfiles_BootstrapsFirstProfileFromEmptyCatalog()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"myriale-ai-empty-catalog-{Guid.NewGuid():N}.db");
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={databasePath}");
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<Microsoft.Extensions.Options.IOptions<AiProviderOptions>>();
                    services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new AiProviderOptions()));
                    services.RemoveAll<IAiTextProvider>();
                    services.AddSingleton<IAiTextProvider, SuccessfulTextProvider>();
                });
            });
        try
        {
            var admin = await CreateSignedInClientAsync(grantAdmin: true, factory);
            using var initiallyListed = await admin.GetAsync("/api/admin/ai-keys/");
            Assert.Equal(HttpStatusCode.OK, initiallyListed.StatusCode);
            Assert.Empty((await initiallyListed.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray());

            using var saved = await admin.PutAsJsonAsync("/api/admin/ai-keys/first-profile", new
            {
                displayName = "First Profile",
                adapter = "openai-compatible",
                baseUrl = "https://first.example.test/v1",
                model = "example/first",
                credentialId = "first-credential",
                enabled = true,
                secret = "first-secret-1357"
            });
            Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

            using var profilesResponse = await admin.GetAsync("/api/ai/profiles");
            Assert.Equal(HttpStatusCode.OK, profilesResponse.StatusCode);
            var profiles = await profilesResponse.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Contains(profiles.GetProperty("profiles").EnumerateArray(), item => item.GetProperty("id").GetString() == "first-profile");
        }
        finally
        {
            if (File.Exists(databasePath)) File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task AdminAiProfiles_CreatesArbitraryDbDefinitionThatAppearsAndIsUsable()
    {
        var client = await CreateSignedInClientAsync(grantAdmin: true);
        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/local-llm", new
        {
            displayName = "Local LLM",
            adapter = "openai-compatible",
            baseUrl = "https://local-ai.test/v1",
            model = "local/story-model",
            credentialId = "local-credential",
            enabled = true,
            secret = "database-secret-2468"
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedBody = await saved.Content.ReadAsStringAsync();
        Assert.Contains("local-llm", savedBody, StringComparison.Ordinal);
        Assert.DoesNotContain("database-secret-2468", savedBody, StringComparison.Ordinal);

        using var listed = await client.GetAsync("/api/ai/profiles");
        var profiles = await listed.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains(profiles.GetProperty("profiles").EnumerateArray(), item => item.GetProperty("id").GetString() == "local-llm");

        using var prompted = await client.PostAsJsonAsync("/api/admin/ai-keys/local-llm/prompt-test", new { prompt = "hello" });
        Assert.Equal(HttpStatusCode.OK, prompted.StatusCode);
        Assert.DoesNotContain("database-secret-2468", await prompted.Content.ReadAsStringAsync(), StringComparison.Ordinal);
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
        Assert.Contains("基本情報案", json.GetProperty("message").GetString());
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
        public Task<AiTextResponse> GenerateAsync(AiTextRequest request, CancellationToken cancellationToken) =>
            GenerateForProviderAsync("openai", "test", request, cancellationToken);
        public Task<AiTextResponse> GenerateForProviderAsync(string provider, string credential, AiTextRequest request, CancellationToken cancellationToken) =>
            Task.FromResult(new AiTextResponse(
                "{\"response\":\"テスト応答です。\"}",
                new AiGenerationMetadata(provider, "test-model", "response-1", 12, 7, 42, 1, "stop")));
        public Task TestConnectionAsync(string provider, string credential, CancellationToken cancellationToken) => Task.CompletedTask;
    }

}
