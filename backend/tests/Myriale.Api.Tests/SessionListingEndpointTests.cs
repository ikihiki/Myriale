using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Data;

namespace Myriale.Api.Tests;

public sealed class SessionListingEndpointTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-session-list-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public SessionListingEndpointTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));
    }

    [Fact]
    public async Task ListSessions_AnonymousRequestIsUnauthorized()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using var response = await client.GetAsync("/api/sessions");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListSessions_ReturnsOnlyOwnersNonCompletedSessionsInDeterministicOrder()
    {
        using var ownerClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var otherClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        await RegisterAndAuthenticateAsync(ownerClient, "owner@example.test");
        await RegisterAndAuthenticateAsync(otherClient, "other@example.test");

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var ownerId = await db.Users.Where(user => user.Email == "owner@example.test").Select(user => user.Id).SingleAsync();
            var otherOwnerId = await db.Users.Where(user => user.Email == "other@example.test").Select(user => user.Id).SingleAsync();
            var scenario = await db.Scenarios.OrderBy(item => item.Id).FirstAsync();
            var baseTime = new DateTimeOffset(2026, 7, 23, 10, 0, 0, TimeSpan.Zero);

            await AddSessionAsync(db, "SES-NEW", ownerId, scenario.Id, "新しい主人公", "active", baseTime.AddMinutes(3), 2, true);
            await AddSessionAsync(db, "SES-TIE-A", ownerId, scenario.Id, "主人公A", "active", baseTime.AddMinutes(2), 1, false);
            await AddSessionAsync(db, "SES-TIE-B", ownerId, scenario.Id, "主人公B", "active", baseTime.AddMinutes(2), 1, false);
            await AddSessionAsync(db, "SES-COMPLETED", ownerId, scenario.Id, "完了済み", "completed", baseTime.AddMinutes(4), 1, false);
            await AddSessionAsync(db, "SES-OTHER", otherOwnerId, scenario.Id, "別ユーザー", "active", baseTime.AddMinutes(5), 1, false);
        }

        using var response = await ownerClient.GetAsync("/api/sessions");

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());
        var sessions = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(["SES-NEW", "SES-TIE-A", "SES-TIE-B"], sessions.EnumerateArray().Select(item => item.GetProperty("id").GetString()!).ToArray());

        var first = sessions[0];
        Assert.False(string.IsNullOrWhiteSpace(first.GetProperty("scenarioTitle").GetString()));
        Assert.Equal("新しい主人公", first.GetProperty("selectedHero").GetString());
        Assert.Equal("active", first.GetProperty("status").GetString());
        Assert.Equal("SES-NEW-TRN-2", first.GetProperty("headTurnId").GetString());
        Assert.Equal(2, first.GetProperty("headTurnPosition").GetInt32());
        Assert.Equal(2, first.GetProperty("turnCount").GetInt32());
        Assert.Equal("最新の保存済み要約", first.GetProperty("latestSummary").GetString());
        Assert.True(first.TryGetProperty("createdAt", out _));
        Assert.True(first.TryGetProperty("updatedAt", out _));
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    internal static async Task RegisterAndAuthenticateAsync(HttpClient client, string email)
    {
        using var response = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = email,
            email,
            password = "letters1",
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        if (!response.Headers.TryGetValues("Set-Cookie", out var values)) return;
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", string.Join("; ", values.Select(value => value.Split(';', 2)[0])));
    }

    internal static async Task AddSessionAsync(
        ApplicationDbContext db,
        string id,
        string ownerId,
        string scenarioId,
        string selectedHero,
        string status,
        DateTimeOffset updatedAt,
        int turnCount,
        bool includeSummaries)
    {
        var session = new Session
        {
            Id = id,
            OwnerId = ownerId,
            ScenarioId = scenarioId,
            SelectedHero = selectedHero,
            Status = status,
            CreatedAt = updatedAt.AddHours(-1),
            UpdatedAt = updatedAt,
        };
        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        SessionTurn? previous = null;
        for (var position = 1; position <= turnCount; position++)
        {
            var turn = new SessionTurn
            {
                Id = $"{id}-TRN-{position}",
                SessionId = id,
                Position = position,
                PreviousTurnId = previous?.Id,
                Kind = "narrative",
                NarrativeBody = $"turn {position}",
                CreatedAt = updatedAt.AddMinutes(position),
            };
            db.SessionTurns.Add(turn);
            previous = turn;
        }
        await db.SaveChangesAsync();

        session.HeadTurnId = previous?.Id;
        if (includeSummaries)
        {
            db.SessionSummaries.AddRange(
                new SessionSummary
                {
                    Id = $"{id}-SUM-1",
                    SessionId = id,
                    FromTurnId = $"{id}-TRN-1",
                    ToTurnId = $"{id}-TRN-1",
                    FromPosition = 1,
                    ToPosition = 1,
                    Version = 1,
                    Body = "古い要約",
                    GeneratedAt = updatedAt,
                },
                new SessionSummary
                {
                    Id = $"{id}-SUM-2",
                    SessionId = id,
                    FromTurnId = $"{id}-TRN-1",
                    ToTurnId = $"{id}-TRN-2",
                    FromPosition = 1,
                    ToPosition = 2,
                    Version = 2,
                    Body = "最新の保存済み要約",
                    GeneratedAt = updatedAt.AddMinutes(1),
                });
        }
        await db.SaveChangesAsync();
    }
}
