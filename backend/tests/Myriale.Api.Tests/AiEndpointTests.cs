using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Myriale.Api.Tests;

public sealed class AiEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public AiEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));
    }

    [Fact]
    public async Task AdminAiKeys_StoresMaskedKeyAndTestsMockConnection()
    {
        var client = await CreateSignedInClientAsync();

        using var saved = await client.PutAsJsonAsync("/api/admin/ai-keys/mock-text", new { displayName = "Mock Text", secret = "mock-secret-1234" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedJson = await saved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("••••••••1234", savedJson.GetProperty("maskedKey").GetString());
        Assert.False(savedJson.ToString().Contains("mock-secret-1234", StringComparison.Ordinal));

        using var tested = await client.PostAsync("/api/admin/ai-keys/mock-text/test", null);
        Assert.Equal(HttpStatusCode.OK, tested.StatusCode);
        var testedJson = await tested.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("mock-validated", testedJson.GetProperty("status").GetString());
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

    private async Task<HttpClient> CreateSignedInClientAsync()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "管理者",
            email = $"admin-{Guid.NewGuid():N}@example.test",
            password = "letters1"
        });
        ApplyCookies(client, register);
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
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
}
