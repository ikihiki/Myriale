using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Myriale.Api.Tests;

public sealed class ScenarioEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-scenario-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public ScenarioEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));
    }

    [Fact]
    public async Task GetScenario_ReturnsSeededScenario()
    {
        var client = _factory.CreateClient();

        using var response = await client.GetAsync("/api/scenarios/SCN-STAR-LIBRARY");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("星喰いの地下図書館", json.GetProperty("title").GetString());
        Assert.Equal("select", json.GetProperty("heroMode").GetString());
        Assert.Contains("ミラ", json.GetProperty("hero").GetString());
        Assert.Equal("あなたは水没した閲覧室で目を覚ます。", json.GetProperty("opening").GetString());
    }

    [Fact]
    public async Task GetScenario_ReturnsSelectableScenarioWithFreeGenerationEnabled()
    {
        var client = _factory.CreateClient();

        using var response = await client.GetAsync("/api/scenarios/SCN-MOONLIT-GARDEN");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("月虹の庭と眠らない時計", json.GetProperty("title").GetString());
        Assert.Equal("select", json.GetProperty("heroMode").GetString());
        Assert.True(json.GetProperty("heroFreeGenerationAllowed").GetBoolean());
        Assert.Contains("イリス", json.GetProperty("hero").GetString());
    }

    [Fact]
    public async Task GetScenario_ReturnsNotFoundForUnknownId()
    {
        var client = _factory.CreateClient();

        using var response = await client.GetAsync("/api/scenarios/SCN-UNKNOWN");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateScenario_RequiresAuthentication()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using var response = await client.PostAsJsonAsync("/api/scenarios/", new { title = "星喰いの地下図書館" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateScenario_ValidatesTitle()
    {
        var client = await CreateSignedInClientAsync();

        using var response = await client.PostAsJsonAsync("/api/scenarios/", new { title = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("errors").TryGetProperty("title", out _));
    }

    [Fact]
    public async Task CreateScenario_CreatesDraftWithSettings()
    {
        var client = await CreateSignedInClientAsync();

        using var response = await client.PostAsJsonAsync("/api/scenarios/", new
        {
            title = "星喰いの地下図書館",
            summary = "地下に沈んだ王都の探索譚。",
            genre = "ダークファンタジー",
            tone = "静かで不穏",
            lore = "星座は魔法体系の鍵。",
            aiFreedom = "中: 設定を守りつつ提案する",
            heroMode = "select",
            heroFreeGenerationAllowed = true,
            hero = "禁書司書の見習い。",
            opening = "あなたは水没した閲覧室で目を覚ます。",
            illustrationStyle = "銅版画風",
            illustrationMood = "孤独",
            illustrationNegative = "現代車両",
            sampleScene = "水没した閲覧室。"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.StartsWith("SCN-", json.GetProperty("id").GetString());
        Assert.Equal("draft", json.GetProperty("status").GetString());
        Assert.Equal("星喰いの地下図書館", json.GetProperty("title").GetString());
        Assert.Equal("select", json.GetProperty("heroMode").GetString());
        Assert.True(json.GetProperty("heroFreeGenerationAllowed").GetBoolean());
        Assert.Equal("銅版画風", json.GetProperty("illustrationStyle").GetString());
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
