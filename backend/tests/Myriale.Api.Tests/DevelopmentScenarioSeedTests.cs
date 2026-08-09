using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Infrastructure.Persistence;

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
        Assert.Equal(2, publishedJson.GetProperty("version").GetInt32());
        Assert.Equal("start", publishedJson.GetProperty("startLocationCode").GetString());
        Assert.Equal(new[] { "corridor", "puzzle-room", "start" }, publishedJson.GetProperty("locations").EnumerateArray()
            .Select(location => location.GetProperty("code").GetString()).Order().ToArray());

        var objects = publishedJson.GetProperty("objects").EnumerateArray().ToArray();
        Assert.Equal("start", objects.Single(item => item.GetProperty("code").GetString() == "conversation-terminal").GetProperty("locationCode").GetString());
        Assert.Equal("corridor", objects.Single(item => item.GetProperty("code").GetString() == "escape-door").GetProperty("locationCode").GetString());
        Assert.Equal("puzzle-room", objects.Single(item => item.GetProperty("code").GetString() == "puzzle-device").GetProperty("locationCode").GetString());

        Assert.Equal(3, publishedJson.GetProperty("schemaVersion").GetInt32());
        var guideType = publishedJson.GetProperty("objectTypes").EnumerateArray()
            .Single(type => type.GetProperty("code").GetString() == "conversation-terminal");
        var guideProfile = guideType.GetProperty("profileSchema");
        Assert.Equal(new[] { "role", "speech-style", "values" }, guideProfile.GetProperty("properties").EnumerateObject()
            .Select(property => property.Name).Order().ToArray());
        Assert.Empty(guideType.GetProperty("profileDefaults").EnumerateObject());
        var rapport = guideType.GetProperty("stateSchema").GetProperty("properties").GetProperty("rapport");
        Assert.Equal("ai", rapport.GetProperty("updateAuthority").GetString());
        Assert.Contains("未公開情報", rapport.GetProperty("aiGuidance").GetString());
        Assert.False(guideType.GetProperty("defaultState").TryGetProperty("rapport", out _));
        Assert.DoesNotContain("rapport", guideType.GetProperty("publicProjection").GetProperty("include").EnumerateArray()
            .Select(field => field.GetString()));

        var guideEntity = objects.Single(item => item.GetProperty("code").GetString() == "conversation-terminal");
        Assert.Equal("閉鎖研究施設の案内と安全管理を担う対話窓口", guideEntity.GetProperty("profileValues").GetProperty("role").GetString());
        Assert.Contains("## 演技指針", guideEntity.GetProperty("profileMarkdown").GetString());
        Assert.Equal("start", guideEntity.GetProperty("locationCode").GetString());

        var puzzleType = publishedJson.GetProperty("objectTypes").EnumerateArray().Single(type => type.GetProperty("code").GetString() == "puzzle-device");
        var correctRule = puzzleType.GetProperty("actionRules").EnumerateArray().Single(rule => rule.GetProperty("code").GetString() == "solve-correct");
        var doorEffect = correctRule.GetProperty("effects").EnumerateArray().Single(effect =>
            effect.GetProperty("type").GetString() == "set-state" && effect.TryGetProperty("objectCode", out _));
        Assert.Equal("escape-door", doorEffect.GetProperty("objectCode").GetString());
        Assert.Equal("state.open", doorEffect.GetProperty("path").GetString());
        Assert.True(doorEffect.GetProperty("value").GetBoolean());
        Assert.Equal("published", publishedJson.GetProperty("status").GetString());

        using var createdDraft = await owner.PostAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/drafts", null);
        Assert.Equal(HttpStatusCode.Created, createdDraft.StatusCode);
        var draftJson = await createdDraft.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("draft", draftJson.GetProperty("status").GetString());
        Assert.Equal(3, draftJson.GetProperty("version").GetInt32());

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
        var ruleSavedBody = await ruleSaved.Content.ReadAsStringAsync();
        Assert.True(ruleSaved.StatusCode == HttpStatusCode.OK, ruleSavedBody);

        var other = await CreateRegisteredClientAsync(factory);
        using var otherRead = await other.GetAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data");
        using var otherDraft = await other.PostAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/drafts", null);
        using var otherUpdate = await other.PutAsJsonAsync("/api/scenarios/SCN-AWAKENING-LAB", new { title = "盗用" });
        Assert.Equal(HttpStatusCode.NotFound, otherRead.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherDraft.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherUpdate.StatusCode);
    }

    [Fact]
    public async Task SeedPuzzle_CorrectAnswerOpensCorridorEscapeDoor_WhileIncorrectAnswerDoesNot()
    {
        using var factory = CreateFactory(recreateOnStartup: true);
        var owner = await CreateSeedAccountClientAsync(factory);
        var world = new[]
        {
            new { objectCode = "conversation-terminal", locationCode = "start", state = (object)new { activated = false } },
            new { objectCode = "start-passage", locationCode = "start", state = (object)new { used = false } },
            new { objectCode = "corridor-start-passage", locationCode = "corridor", state = (object)new { used = false } },
            new { objectCode = "corridor-puzzle-passage", locationCode = "corridor", state = (object)new { used = false } },
            new { objectCode = "puzzle-passage", locationCode = "puzzle-room", state = (object)new { used = false } },
            new { objectCode = "escape-door", locationCode = "corridor", state = (object)new { open = false } },
            new { objectCode = "puzzle-device", locationCode = "puzzle-room", state = (object)new { solved = false } },
        };

        using var incorrect = await owner.PostAsJsonAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/debug", new
        {
            trigger = "direct-action", currentLocationCode = "puzzle-room", flags = new Dictionary<string, bool>(),
            objects = world, objectCode = "puzzle-device", actionCode = "solve", arguments = new { answer = "黒" }, playerInput = (string?)null,
        });
        Assert.Equal(HttpStatusCode.OK, incorrect.StatusCode);
        var incorrectJson = await incorrect.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("solve-incorrect", incorrectJson.GetProperty("selectedRuleCode").GetString());
        Assert.DoesNotContain(incorrectJson.GetProperty("appliedEffects").EnumerateArray(), effect =>
            effect.GetProperty("targetId").GetString() == "SOBJ-AWAKENING-LAB-ESCAPE-DOOR");

        using var correct = await owner.PostAsJsonAsync("/api/scenarios/SCN-AWAKENING-LAB/rule-data/debug", new
        {
            trigger = "direct-action", currentLocationCode = "puzzle-room", flags = new Dictionary<string, bool>(),
            objects = world, objectCode = "puzzle-device", actionCode = "solve", arguments = new { answer = "白" }, playerInput = (string?)null,
        });
        var correctBody = await correct.Content.ReadAsStringAsync();
        Assert.True(correct.StatusCode == HttpStatusCode.OK, correctBody);
        var correctJson = JsonSerializer.Deserialize<JsonElement>(correctBody);
        Assert.Equal("solve-correct", correctJson.GetProperty("selectedRuleCode").GetString());
        var openedDoor = correctJson.GetProperty("appliedEffects").EnumerateArray().Single(effect =>
            effect.GetProperty("targetId").GetString() == "SOBJ-AWAKENING-LAB-ESCAPE-DOOR");
        Assert.Equal("state.open", openedDoor.GetProperty("path").GetString());
        Assert.True(openedDoor.GetProperty("value").GetBoolean());
    }

    [Fact]
    public async Task SeedConversationScenario_QuestionsAndEvidenceChangeNpcStateWithoutMovement()
    {
        using var factory = CreateFactory(recreateOnStartup: true);
        var owner = await CreateSeedAccountClientAsync(factory);

        using var scenarioResponse = await owner.GetAsync("/api/scenarios/SCN-LIGHTHOUSE-CONFESSION");
        Assert.Equal(HttpStatusCode.OK, scenarioResponse.StatusCode);
        var scenario = await scenarioResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("灯台守の告白", scenario.GetProperty("title").GetString());
        Assert.Equal("fixed", scenario.GetProperty("heroMode").GetString());
        Assert.False(scenario.GetProperty("heroFreeGenerationAllowed").GetBoolean());
        Assert.Contains("港務局調査官ユナ", scenario.GetProperty("hero").GetString());
        using var ruleDataResponse = await owner.GetAsync("/api/scenarios/SCN-LIGHTHOUSE-CONFESSION/rule-data");
        Assert.Equal(HttpStatusCode.OK, ruleDataResponse.StatusCode);
        var ruleData = await ruleDataResponse.Content.ReadFromJsonAsync<JsonElement>();
        var location = Assert.Single(ruleData.GetProperty("locations").EnumerateArray().ToArray());
        Assert.Equal("interview-room", location.GetProperty("code").GetString());
        var objects = ruleData.GetProperty("objects").EnumerateArray().ToArray();
        Assert.Equal(new[] { "burned-maintenance-record", "keeper-ren" }, objects
            .Select(item => item.GetProperty("code").GetString()).Order().ToArray());
        var keeperEntity = objects.Single(item => item.GetProperty("code").GetString() == "keeper-ren");
        Assert.Contains("keeper-ren.state.stance", keeperEntity.GetProperty("profileMarkdown").GetString());
        Assert.Contains("`confessed`", keeperEntity.GetProperty("profileMarkdown").GetString());
        var evidenceEntity = objects.Single(item => item.GetProperty("code").GetString() == "burned-maintenance-record");
        Assert.Contains("## 外観", evidenceEntity.GetProperty("profileMarkdown").GetString());
        var objectTypes = ruleData.GetProperty("objectTypes").EnumerateArray().ToArray();
        var npcType = objectTypes.Single(type => type.GetProperty("code").GetString() == "conversation-npc");
        Assert.Equal(new[] { "present-evidence", "talk" }, npcType.GetProperty("actions").EnumerateArray()
            .Select(action => action.GetProperty("code").GetString()).Order().ToArray());
        var evidenceType = objectTypes.Single(type => type.GetProperty("code").GetString() == "documentary-evidence");
        Assert.Equal("inspect", Assert.Single(evidenceType.GetProperty("actions").EnumerateArray().ToArray()).GetProperty("code").GetString());

        var guardedWorld = new[]
        {
            new { objectCode = "keeper-ren", locationCode = "interview-room", state = (object)new { stance = "guarded", evidenceAcknowledged = false } },
            new { objectCode = "burned-maintenance-record", locationCode = "interview-room", state = (object)new { examined = false } },
        };
        using var inspectResponse = await owner.PostAsJsonAsync("/api/scenarios/SCN-LIGHTHOUSE-CONFESSION/rule-data/debug", new
        {
            trigger = "direct-action", currentLocationCode = "interview-room", flags = new Dictionary<string, bool>(),
            objects = guardedWorld, objectCode = "burned-maintenance-record", actionCode = "inspect", arguments = new { }, playerInput = (string?)null,
        });
        Assert.Equal(HttpStatusCode.OK, inspectResponse.StatusCode);
        var inspection = await inspectResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("inspect-maintenance-record-first", inspection.GetProperty("selectedRuleCode").GetString());
        Assert.Contains(inspection.GetProperty("facts").EnumerateArray().Select(fact => fact.GetString()), fact => fact!.Contains("21時47分", StringComparison.Ordinal));
        Assert.DoesNotContain(inspection.GetProperty("appliedEffects").EnumerateArray(), effect =>
            effect.TryGetProperty("targetId", out var targetId) && targetId.GetString() == "SOBJ-LIGHTHOUSE-CONFESSION-KEEPER-REN");

        using var questionResponse = await owner.PostAsJsonAsync("/api/scenarios/SCN-LIGHTHOUSE-CONFESSION/rule-data/debug", new
        {
            trigger = "direct-action", currentLocationCode = "interview-room", flags = new Dictionary<string, bool>(),
            objects = guardedWorld, objectCode = "keeper-ren", actionCode = "talk", arguments = new { }, playerInput = (string?)null,
        });
        Assert.Equal(HttpStatusCode.OK, questionResponse.StatusCode);
        var question = await questionResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("question-guarded", question.GetProperty("selectedRuleCode").GetString());
        var evasiveEffect = question.GetProperty("appliedEffects").EnumerateArray().Single(effect => effect.GetProperty("path").GetString() == "state.stance");
        Assert.Equal("evasive", evasiveEffect.GetProperty("value").GetString());

        var evasiveWorld = new[]
        {
            new { objectCode = "keeper-ren", locationCode = "interview-room", state = (object)new { stance = "evasive", evidenceAcknowledged = false } },
            new { objectCode = "burned-maintenance-record", locationCode = "interview-room", state = (object)new { examined = true } },
        };
        using var evidenceResponse = await owner.PostAsJsonAsync("/api/scenarios/SCN-LIGHTHOUSE-CONFESSION/rule-data/debug", new
        {
            trigger = "direct-action", currentLocationCode = "interview-room", flags = new Dictionary<string, bool>(),
            objects = evasiveWorld, objectCode = "keeper-ren", actionCode = "present-evidence", arguments = new { }, playerInput = (string?)null,
        });
        Assert.Equal(HttpStatusCode.OK, evidenceResponse.StatusCode);
        var evidence = await evidenceResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("evidence-breaks-denial", evidence.GetProperty("selectedRuleCode").GetString());
        var effects = evidence.GetProperty("appliedEffects").EnumerateArray().ToArray();
        Assert.Equal("confessed", effects.Single(effect => effect.GetProperty("path").GetString() == "state.stance").GetProperty("value").GetString());
        Assert.True(effects.Single(effect => effect.GetProperty("path").GetString() == "state.evidenceAcknowledged").GetProperty("value").GetBoolean());
        Assert.Contains(evidence.GetProperty("facts").EnumerateArray().Select(fact => fact.GetString()), fact => fact!.Contains("難民船", StringComparison.Ordinal));
    }

    [Fact]
    public async Task MaidConversationSeed_UsesPersonalityProfileAndUninitializedAiStateAcrossMovableLocations()
    {
        using var factory = CreateFactory(recreateOnStartup: true);
        var owner = await CreateSeedAccountClientAsync(factory);

        using var scenarioResponse = await owner.GetAsync("/api/scenarios/SCN-MAID-TEA-TIME");
        Assert.Equal(HttpStatusCode.OK, scenarioResponse.StatusCode);
        var scenario = await scenarioResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("メイドと午後のティータイム", scenario.GetProperty("title").GetString());
        Assert.Equal("fixed", scenario.GetProperty("heroMode").GetString());
        Assert.Contains("質問へ直接答え", scenario.GetProperty("tone").GetString());
        Assert.Contains("未設定であり創作しない", scenario.GetProperty("lore").GetString());
        Assert.Contains("質問を質問で返さない", scenario.GetProperty("summary").GetString());
        Assert.Contains("メイド、クララ", scenario.GetProperty("opening").GetString());

        using var ruleDataResponse = await owner.GetAsync("/api/scenarios/SCN-MAID-TEA-TIME/rule-data");
        Assert.Equal(HttpStatusCode.OK, ruleDataResponse.StatusCode);
        var ruleData = await ruleDataResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, ruleData.GetProperty("schemaVersion").GetInt32());
        Assert.Equal("sunroom", ruleData.GetProperty("startLocationCode").GetString());
        Assert.Equal(new[] { "rose-garden", "sunroom" }, ruleData.GetProperty("locations").EnumerateArray()
            .Select(location => location.GetProperty("code").GetString()).Order().ToArray());

        var attendant = ruleData.GetProperty("objectTypes").EnumerateArray()
            .Single(type => type.GetProperty("code").GetString() == "household-attendant");
        Assert.Equal(new[] { "favorite-topic", "role", "service-boundary", "speech-style", "values" },
            attendant.GetProperty("profileSchema").GetProperty("properties").EnumerateObject()
                .Select(property => property.Name).Order().ToArray());
        Assert.Empty(attendant.GetProperty("profileDefaults").EnumerateObject());
        var talkRule = Assert.Single(attendant.GetProperty("actionRules").EnumerateArray().ToArray());
        Assert.Contains("質問を質問で返さない", talkRule.GetProperty("effects").EnumerateArray().First().GetProperty("text").GetString());
        Assert.Equal("talk", Assert.Single(attendant.GetProperty("actions").EnumerateArray().ToArray()).GetProperty("code").GetString());

        var stateProperties = attendant.GetProperty("stateSchema").GetProperty("properties");
        Assert.Equal(new[] { "lastTopic", "rapport", "rememberedPreference", "visibleMood" },
            stateProperties.EnumerateObject().Select(property => property.Name).Order().ToArray());
        Assert.All(stateProperties.EnumerateObject(), property =>
            Assert.Equal("ai", property.Value.GetProperty("updateAuthority").GetString()));
        Assert.Empty(attendant.GetProperty("defaultState").EnumerateObject());
        Assert.Equal(new[] { "visibleMood" }, attendant.GetProperty("publicProjection").GetProperty("include")
            .EnumerateArray().Select(item => item.GetString()).ToArray());

        var objects = ruleData.GetProperty("objects").EnumerateArray().ToArray();
        var maid = objects.Single(item => item.GetProperty("code").GetString() == "maid-clara");
        Assert.Equal("sunroom", maid.GetProperty("locationCode").GetString());
        Assert.Equal("白薔薇館で客人の応対と給仕を担当するメイド", maid.GetProperty("profileValues").GetProperty("role").GetString());
        Assert.Contains("## 演技指針", maid.GetProperty("profileMarkdown").GetString());
        Assert.Contains(objects, item => item.GetProperty("code").GetString() == "sunroom-garden-door");
        Assert.Contains(objects, item => item.GetProperty("code").GetString() == "garden-sunroom-door");

        using var created = await owner.PostAsJsonAsync("/api/sessions", new
        {
            scenarioId = "SCN-MAID-TEA-TIME",
            requestId = $"maid-seed-{Guid.NewGuid():N}",
        });
        var createdBody = await created.Content.ReadAsStringAsync();
        Assert.True(created.StatusCode == HttpStatusCode.Created, createdBody);
        var session = JsonSerializer.Deserialize<JsonElement>(createdBody);
        var maidState = session.GetProperty("objectStates").EnumerateArray()
            .Single(item => item.GetProperty("code").GetString() == "maid-clara");
        Assert.Equal("SLOC-MAID-TEA-TIME-SUNROOM", maidState.GetProperty("locationId").GetString());
        Assert.Empty(maidState.GetProperty("state").EnumerateObject());
    }

    [Fact]
    public async Task Seed_RepairsLegacySystemOwnershipWithoutReplacingAnExplicitOwner()
    {
        using var factory = CreateFactory(recreateOnStartup: true);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var seedUser = await db.Users.SingleAsync(user => user.Email == AccountSeedData.DefaultEmail);
        var scenario = await db.Scenarios.SingleAsync(item => item.Id == new ScenarioId("SCN-AWAKENING-LAB"));
        scenario.AuthorId = new AccountId("SYSTEM-SEED");
        await db.SaveChangesAsync();

        await ScenarioSeedData.SeedAsync(db, seedUser.Id);
        Assert.Equal(seedUser.Id, scenario.AuthorId.AsPrimitive());

        scenario.AuthorId = new AccountId("EXPLICIT-OWNER");
        await db.SaveChangesAsync();
        await ScenarioSeedData.SeedAsync(db, seedUser.Id);
        Assert.Equal("EXPLICIT-OWNER", scenario.AuthorId.AsPrimitive());
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
