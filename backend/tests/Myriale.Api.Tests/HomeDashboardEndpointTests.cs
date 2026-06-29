using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Myriale.Api.Tests;

public sealed class HomeDashboardEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HomeDashboardEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHomeDashboard_ReturnsDashboardPayload()
    {
        using var response = await _client.GetAsync("/api/home/dashboard");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Object, json.ValueKind);

        Assert.True(json.TryGetProperty("account", out var account));
        Assert.Equal("ミリア", account.GetProperty("displayName").GetString());
        Assert.Equal("reader@myriale.example", account.GetProperty("email").GetString());
        Assert.Equal("ミリ", account.GetProperty("initials").GetString());
        Assert.True(account.TryGetProperty("unreadNotifications", out _));

        Assert.True(json.TryGetProperty("resumableSessions", out var resumableSessions));
        Assert.Equal(JsonValueKind.Array, resumableSessions.ValueKind);
        Assert.NotEmpty(resumableSessions.EnumerateArray());

        Assert.True(json.TryGetProperty("recommendedScenarios", out var recommendedScenarios));
        Assert.Equal(JsonValueKind.Array, recommendedScenarios.ValueKind);
        Assert.NotEmpty(recommendedScenarios.EnumerateArray());
    }
}
