using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Data;

namespace Myriale.Api.Tests;

public sealed class HomeDashboardEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-home-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public HomeDashboardEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));
    }

    [Fact]
    public async Task GetHomeDashboard_AnonymousRequestIsUnauthorized()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using var response = await client.GetAsync("/api/home/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetHomeDashboard_ReturnsOwnersActiveSessionsAndRecommendations()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await SessionListingEndpointTests.RegisterAndAuthenticateAsync(client, "home-owner@example.test");

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var ownerId = await db.Users.Where(user => user.Email == "home-owner@example.test").Select(user => user.Id).SingleAsync();
            var scenario = await db.Scenarios.OrderBy(item => item.Id).FirstAsync();
            await SessionListingEndpointTests.AddSessionAsync(
                db,
                "SES-HOME-REAL",
                ownerId,
                scenario.Id,
                "ホームの主人公",
                "active",
                new DateTimeOffset(2026, 7, 23, 10, 0, 0, TimeSpan.Zero),
                1,
                false);
            await SessionListingEndpointTests.AddSessionAsync(
                db,
                "SES-HOME-COMPLETED",
                ownerId,
                scenario.Id,
                "完了した主人公",
                "completed",
                new DateTimeOffset(2026, 7, 23, 11, 0, 0, TimeSpan.Zero),
                1,
                false);
        }

        using var response = await client.GetAsync("/api/home/dashboard");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Object, json.ValueKind);

        Assert.True(json.TryGetProperty("account", out var account));
        Assert.Equal("ミリア", account.GetProperty("displayName").GetString());
        Assert.True(account.TryGetProperty("unreadNotifications", out _));

        var activeSessions = json.GetProperty("activeSessions");
        var session = Assert.Single(activeSessions.EnumerateArray());
        Assert.Equal("SES-HOME-REAL", session.GetProperty("id").GetString());
        Assert.Equal("ホームの主人公", session.GetProperty("selectedHero").GetString());

        var recommendedScenarios = json.GetProperty("recommendedScenarios");
        Assert.Contains(
            recommendedScenarios.EnumerateArray(),
            scenario => scenario.GetProperty("id").GetString() == "SCN-NEON-ARCHIVE"
                && scenario.GetProperty("genre").GetString() == "サイバーパンク潜入スリラー");
        Assert.NotEmpty(recommendedScenarios.EnumerateArray());
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }
}
