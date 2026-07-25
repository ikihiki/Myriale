using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Data;

namespace Myriale.Api.Tests;

public sealed class DevelopmentScenarioSeedTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-development-seed-tests-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task SeedAccount_CanCreateDraftAndSaveAwakeningLaboratory_WhileOtherUserCannotEdit()
    {
        using var factory = CreateFactory(recreateOnStartup: true);
        var owner = await CreateSeedAccountClientAsync(factory);

        using var published = await owner.GetAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data");
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);
        var publishedJson = await published.Content.ReadFromJsonAsync<JsonElement>();
        var doorType = publishedJson.GetProperty("objectTypes").EnumerateArray().Single(type => type.GetProperty("code").GetString() == "door");
        Assert.Equal("open-default", doorType.GetProperty("actionRules")[0].GetProperty("code").GetString());
        Assert.Equal(2, publishedJson.GetProperty("objects").EnumerateArray().Count(item =>
            item.GetProperty("mixinTypeCodes").EnumerateArray().Any(code => code.GetString() == "door")));
        Assert.Equal("published", publishedJson.GetProperty("status").GetString());

        using var createdDraft = await owner.PostAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/drafts", null);
        Assert.Equal(HttpStatusCode.Created, createdDraft.StatusCode);
        var draftJson = await createdDraft.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", draftJson.GetProperty("status").GetString());
        Assert.Equal(2, draftJson.GetProperty("version").GetInt32());

        using var reusedDraft = await owner.PostAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/drafts", null);
        Assert.Equal(HttpStatusCode.OK, reusedDraft.StatusCode);
        var reusedJson = await reusedDraft.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(draftJson.GetProperty("definitionVersionId").GetString(), reusedJson.GetProperty("definitionVersionId").GetString());

        using var basicSaved = await owner.PutAsJsonAsync("/api/scenarios/SCN-AWAKENING-LAB", new
        {
            title = "目覚めの研究室",
            summary = "編集済みの基本情報",
            genre = "SFミステリー脱出劇",
            heroMode = "free"
        });
        Assert.Equal(HttpStatusCode.OK, basicSaved.StatusCode);

        using var ruleSaved = await owner.PutAsJsonAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data", draftJson);
        Assert.Equal(HttpStatusCode.OK, ruleSaved.StatusCode);

        var other = await CreateRegisteredClientAsync(factory);
        using var otherRead = await other.GetAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data");
        using var otherDraft = await other.PostAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/drafts", null);
        using var otherUpdate = await other.PutAsJsonAsync("/api/scenarios/SCN-AWAKENING-LAB", new { title = "盗用" });
        Assert.Equal(HttpStatusCode.NotFound, otherRead.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherDraft.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherUpdate.StatusCode);
    }

    [Fact]
    public async Task Startup_RepairsLegacySystemSeedOwnershipWithoutReplacingAnExplicitOwner()
    {
        string seedUserId;
        using (var firstFactory = CreateFactory(recreateOnStartup: true))
        {
            await using var scope = firstFactory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var seedUser = await db.Users.SingleAsync(user => user.Email == AccountSeedData.DefaultEmail);
            seedUserId = seedUser.Id;
            var scenario = await db.Scenarios.SingleAsync(item => item.Id == "SCN-AWAKENING-LAB");
            scenario.AuthorId = "SYSTEM-SEED";
            await db.SaveChangesAsync();
        }

        using (var repairedFactory = CreateFactory(recreateOnStartup: false))
        {
            await using var scope = repairedFactory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.Equal(seedUserId, (await db.Scenarios.SingleAsync(item => item.Id == "SCN-AWAKENING-LAB")).AuthorId);

            var scenario = await db.Scenarios.SingleAsync(item => item.Id == "SCN-AWAKENING-LAB");
            scenario.AuthorId = "EXPLICIT-OWNER";
            await db.SaveChangesAsync();
        }

        using var preservedFactory = CreateFactory(recreateOnStartup: false);
        await using var preservedScope = preservedFactory.Services.CreateAsyncScope();
        var preservedDb = preservedScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal("EXPLICIT-OWNER", (await preservedDb.Scenarios.SingleAsync(item => item.Id == "SCN-AWAKENING-LAB")).AuthorId);
    }

    public void Dispose()
    {
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private WebApplicationFactory<Program> CreateFactory(bool recreateOnStartup) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}");
            builder.UseSetting("Database:RecreateOnStartup", recreateOnStartup.ToString());
            builder.UseSetting("TestScenarioFixtures:Enabled", "false");
        });

    private static async Task<HttpClient> CreateSeedAccountClientAsync(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var login = await client.PostAsJsonAsync("/api/account/login", new
        {
            email = AccountSeedData.DefaultEmail,
            password = AccountSeedData.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        ApplyCookies(client, login);
        return client;
    }

    private static async Task<HttpClient> CreateRegisteredClientAsync(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new
        {
            displayName = "別の作者",
            email = $"other-{Guid.NewGuid():N}@example.test",
            password = "letters1"
        });
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        ApplyCookies(client, register);
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
