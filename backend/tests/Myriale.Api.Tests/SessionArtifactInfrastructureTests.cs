using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Myriale.Api.Application.SessionExecutions;
using Myriale.Api.Application.SessionArtifacts;
using Myriale.Api.Endpoints;
using Myriale.Api.Data;
using Myriale.Api.Infrastructure.SessionExecutions;
using Myriale.Api.Infrastructure.SessionArtifacts;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionArtifactInfrastructureTests
{
    [Fact]
    public async Task ValidatorAcceptsTinyPngAndRejectsChecksumAndModeration()
    {
        var validator = new SessionImageValidator(Options.Create(new SessionImageOptions()));
        var checksum = Convert.ToHexStringLower(SHA256.HashData(SessionArtifactFixtureSeedData.TinyPng));
        var file = FormFile(SessionArtifactFixtureSeedData.TinyPng, "image/png");

        var validated = await validator.ValidateAsync(file, checksum, "approved", "{\"provider\":\"fixture\"}", default);

        Assert.Equal((1, 1), (validated.Width, validated.Height));
        Assert.Equal(checksum, validated.Checksum);
        await Assert.ThrowsAsync<SessionImageValidationException>(() => validator.ValidateAsync(file, new string('0', 64), "approved", null, default));
        await Assert.ThrowsAsync<SessionImageValidationException>(() => validator.ValidateAsync(file, checksum, "rejected", null, default));
    }

    [Fact]
    public async Task ReconcilerDeletesExpiredAndOldOrphanButReportsMissingObject()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = Db(connection);
        await db.Database.EnsureCreatedAsync();
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        SeedImageGraph(db, "IMG-EXPIRED", "expired.png", now.AddMinutes(-1));
        SeedImageGraph(db, "IMG-MISSING", "missing.png", null, suffix: "2");
        await db.SaveChangesAsync();
        var storage = new MemoryStorage(now);
        storage.Add("expired.png", now.AddHours(-2));
        storage.Add("orphan.png", now.AddHours(-2));
        var reconciler = new SessionArtifactReconciler(new EfSessionArtifactRepository(db), storage, Options.Create(new SessionImageOptions { OrphanGraceMinutes = 30 }), new FixedTimeProvider(now), NullLogger<SessionArtifactReconciler>.Instance);

        var result = await reconciler.ReconcileAsync();

        Assert.Equal(new SessionArtifactReconciliationResult(1, 1, 1), result);
        Assert.DoesNotContain("expired.png", storage.Keys);
        Assert.DoesNotContain("orphan.png", storage.Keys);
        Assert.Equal(1, await db.SessionArtifacts.CountAsync());
        Assert.Equal(1, await db.SessionImages.CountAsync());
    }

    [Fact]
    public async Task RepositoryClassifiesExecutionKindUniquenessAsAttachConflict()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = Db(connection);
        await db.Database.EnsureCreatedAsync();
        var now = new DateTimeOffset(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);
        SeedExecutionGraph(db, "EXE-UNIQUE", SessionExecutionKind.Image, SessionExecutionStatus.Succeeded, now, suffix: "UNIQUE");
        var uniqueAttempt = SessionExecutionAttempt.Start("ATT-UNIQUE", "EXE-UNIQUE", 1, "fixture", now);
        uniqueAttempt.Succeed(now);
        db.SessionExecutionAttempts.Add(uniqueAttempt);
        await db.SaveChangesAsync();
        var repository = new EfSessionArtifactRepository(db);

        var firstArtifact = SessionArtifact.CreateCommittedImage(
            "ART-UNIQUE-1", "SES-UNIQUE", "EXE-UNIQUE", "ATT-UNIQUE", "first.png", "image/png",
            new string('a', 64), "{\"decision\":\"approved\"}", now);
        var firstImage = SessionImage.Create("IMG-UNIQUE-1", firstArtifact, null, null, 1, 1, 1, null);
        var secondArtifact = SessionArtifact.CreateCommittedImage(
            "ART-UNIQUE-2", "SES-UNIQUE", "EXE-UNIQUE", "ATT-UNIQUE", "second.png", "image/png",
            new string('b', 64), "{\"decision\":\"approved\"}", now);
        var secondImage = SessionImage.Create("IMG-UNIQUE-2", secondArtifact, null, null, 1, 1, 1, null);

        Assert.Equal(SessionImagePersistenceOutcome.Created, await repository.TryAddImageAsync(firstArtifact, firstImage, default));
        Assert.Equal(SessionImagePersistenceOutcome.Conflict, await repository.TryAddImageAsync(secondArtifact, secondImage, default));
        Assert.Equal(1, await db.SessionArtifacts.CountAsync());
        Assert.Equal(1, await db.SessionImages.CountAsync());
    }

    [Fact]
    public async Task MetricSamplerCachesBoundedPerKindSnapshot()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var services = new ServiceCollection();
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connection));
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(now));
        services.AddSingleton<ISessionExecutionJitter>(new FixedJitter());
        services.AddSingleton<ISessionExecutionRetryPolicy, SessionExecutionRetryPolicy>();
        services.AddScoped<ISessionExecutionOperationsRepository, EfSessionExecutionOperationsRepository>();
        await using var provider = services.BuildServiceProvider();
        await using (var scope = provider.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.EnsureCreatedAsync();
            SeedExecutionGraph(db, "EXE-QUEUE", SessionExecutionKind.Narrative, SessionExecutionStatus.Queued, now.AddMinutes(-2));
            SeedExecutionGraph(db, "EXE-STUCK", SessionExecutionKind.Image, SessionExecutionStatus.Running, now.AddMinutes(-20), now.AddMinutes(-1), suffix: "2");
            await db.SaveChangesAsync();
        }
        var snapshot = new SessionExecutionMetricSnapshot();
        var sampler = new SessionExecutionMetricsSampler(provider.GetRequiredService<IServiceScopeFactory>(), snapshot,
            Options.Create(new SessionExecutionMetricsOptions { SampleIntervalSeconds = 10, StuckAfterSeconds = 600 }),
            new FixedTimeProvider(new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero)), NullLogger<SessionExecutionMetricsSampler>.Instance);

        await sampler.SampleOnceAsync();

        Assert.Equal(1, snapshot.Read().Single(item => item.Kind == SessionExecutionKind.Narrative.ToContractValue()).QueueDepth);
        Assert.Equal(120, snapshot.Read().Single(item => item.Kind == SessionExecutionKind.Narrative.ToContractValue()).OldestQueuedAgeSeconds);
        Assert.Equal(1, snapshot.Read().Single(item => item.Kind == SessionExecutionKind.Image.ToContractValue()).Stuck);
    }

    private static FormFile FormFile(byte[] content, string contentType)
    {
        var file = new FormFile(new MemoryStream(content), 0, content.Length, "file", "tiny.png");
        file.Headers = new HeaderDictionary(); file.ContentType = contentType; return file;
    }

    private static ApplicationDbContext Db(SqliteConnection connection) => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(connection).Options);

    private static void SeedImageGraph(ApplicationDbContext db, string imageId, string key, DateTimeOffset? retainUntil, string suffix = "")
    {
        var now = new DateTimeOffset(2026, 7, 21, 10, 0, 0, TimeSpan.Zero);
        SeedExecutionGraph(db, "EXE-IMG" + suffix, SessionExecutionKind.Image, SessionExecutionStatus.Succeeded, now, suffix: suffix);
        var attempt = SessionExecutionAttempt.Start("ATT-IMG" + suffix, "EXE-IMG" + suffix, 1, "fixture", now);
        attempt.Succeed(now);
        db.SessionExecutionAttempts.Add(attempt);
        var artifact = SessionArtifact.CreateCommittedImage(
            "ART-IMG" + suffix, "SES-" + suffix, "EXE-IMG" + suffix, "ATT-IMG" + suffix,
            key, "image/png", new string('a', 64), "{\"decision\":\"approved\"}", now);
        db.SessionArtifacts.Add(artifact);
        db.SessionImages.Add(SessionImage.Create(imageId, artifact, null, null, 1, 1, 1, retainUntil));
    }

    private static void SeedExecutionGraph(ApplicationDbContext db, string executionId, SessionExecutionKind kind, SessionExecutionStatus status, DateTimeOffset queuedAt, DateTimeOffset? leaseExpiresAt = null, string suffix = "")
    {
        var ownerId = "USR-" + suffix; var scenarioId = "SCN-" + suffix; var sessionId = "SES-" + suffix;
        if (!db.Users.Local.Any(item => item.Id == ownerId))
        {
            var user = ApplicationUser.Create(ownerId, ownerId + "@test");
            user.Id = ownerId;
            db.Users.Add(user);
        }
        if (!db.Scenarios.Local.Any(item => item.Id == scenarioId)) db.Scenarios.Add(new Scenario { Id = scenarioId, Title = "Fixture", Summary = "Fixture", Genre = "Fixture", Tone = "Fixture", Lore = "Fixture", AiFreedom = "Fixture", HeroMode = HeroMode.Fixed, Hero = "Fixture", Opening = "Fixture", IllustrationStyle = "Fixture", IllustrationMood = "Fixture", IllustrationNegative = "", SampleScene = "Fixture", Status = ScenarioPublicationStatus.Published, AuthorId = ownerId, CreatedAt = queuedAt, UpdatedAt = queuedAt });
        if (!db.Sessions.Local.Any(item => item.Id == sessionId)) db.Sessions.Add(new Session { Id = sessionId, OwnerId = ownerId, ScenarioId = scenarioId, SelectedHero = "Fixture", Status = SessionStatus.Active, CreatedAt = queuedAt, UpdatedAt = queuedAt });
        db.SessionExecutions.Add(new SessionExecution { Id = executionId, SessionId = sessionId, Kind = kind, TriggerType = SessionExecutionTriggerType.Manual, TriggerId = executionId, Status = status, IdempotencyKey = executionId, PayloadHash = new string('a', 64), CreatedAt = queuedAt, QueuedAt = queuedAt, StartedAt = status == SessionExecutionStatus.Running ? queuedAt : null, LeaseExpiresAt = leaseExpiresAt });
    }

    private sealed class FixedJitter : ISessionExecutionJitter { public double NextUnit() => 0; }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }

    private sealed class MemoryStorage(DateTimeOffset now) : ISessionObjectStorage
    {
        private readonly Dictionary<string, SessionObjectInfo> objects = [];
        public IReadOnlyCollection<string> Keys => objects.Keys;
        public void Add(string key, DateTimeOffset modified) => objects[key] = new(key, 1, modified);
        public Task PutAsync(string key, Stream content, string contentType, CancellationToken cancellationToken) { objects[key] = new(key, content.Length, now); return Task.CompletedTask; }
        public Task<StoredSessionObject?> OpenReadAsync(string key, CancellationToken cancellationToken) => Task.FromResult<StoredSessionObject?>(null);
        public Task<IReadOnlyList<SessionObjectInfo>> ListAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<SessionObjectInfo>>(objects.Values.ToArray());
        public Task DeleteAsync(string key, CancellationToken cancellationToken) { objects.Remove(key); return Task.CompletedTask; }
    }
}

public sealed class SessionImageAttachEndpointTests : IDisposable
{
    private readonly string root = Path.Combine(Path.GetTempPath(), $"myriale-image-attach-{Guid.NewGuid():N}");
    private readonly WebApplicationFactory<Program> factory;

    public SessionImageAttachEndpointTests()
    {
        Directory.CreateDirectory(root);
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={Path.Combine(root, "test.db")}"));
    }

    [Fact]
    public async Task AttachRequiresAuthenticationAndPersistsValidatedImage()
    {
        var anonymous = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var unauthenticated = await anonymous.PostAsync("/api/session-artifacts/images/attach", new MultipartFormDataContent());
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var register = await client.PostAsJsonAsync("/api/account/register", new { displayName = "Image", email = "image@example.test", password = "letters1" });
        ApplyCookies(client, register);
        using var created = await client.PostAsJsonAsync("/api/sessions", new { scenarioId = "SCN-STAR-LIBRARY", requestId = "image-session" });
        Assert.True(created.StatusCode == HttpStatusCode.Created, $"{created.StatusCode}: {await created.Content.ReadAsStringAsync()}");
        var sessionId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.SessionExecutions.Add(new SessionExecution { Id = "EXE-IMAGE-ATTACH", SessionId = sessionId, Kind = SessionExecutionKind.Image, TriggerType = SessionExecutionTriggerType.Manual, TriggerId = "fixture", Status = SessionExecutionStatus.Succeeded, IdempotencyKey = "image-attach", PayloadHash = new string('a', 64), CreatedAt = DateTimeOffset.UtcNow, QueuedAt = DateTimeOffset.UtcNow });
            var attachNow = DateTimeOffset.UtcNow;
            var attachAttempt = SessionExecutionAttempt.Start("ATT-IMAGE-ATTACH", "EXE-IMAGE-ATTACH", 1, "fixture", attachNow);
            attachAttempt.Succeed(attachNow);
            db.SessionExecutionAttempts.Add(attachAttempt);
            await db.SaveChangesAsync();
        }
        var checksum = Convert.ToHexStringLower(SHA256.HashData(SessionArtifactFixtureSeedData.TinyPng));
        using var form = new MultipartFormDataContent();
        var image = new ByteArrayContent(SessionArtifactFixtureSeedData.TinyPng); image.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(image, "File", "tiny.png"); form.Add(new StringContent(sessionId), "SessionId"); form.Add(new StringContent("EXE-IMAGE-ATTACH"), "ExecutionId");
        form.Add(new StringContent("ATT-IMAGE-ATTACH"), "AttemptId"); form.Add(new StringContent(checksum), "Checksum"); form.Add(new StringContent("approved"), "ModerationDecision");

        using var response = await client.PostAsync("/api/session-artifacts/images/attach", form);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, json.GetProperty("width").GetInt32());
        var imageId = json.GetProperty("imageId").GetString()!;
        using var rangeRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/session-artifacts/media/{imageId}");
        rangeRequest.Headers.Range = new RangeHeaderValue(0, 0);
        using var rangeResponse = await client.SendAsync(rangeRequest);
        Assert.Equal(HttpStatusCode.PartialContent, rangeResponse.StatusCode);
        Assert.Single(await rangeResponse.Content.ReadAsByteArrayAsync());

        var otherClient = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var otherRegister = await otherClient.PostAsJsonAsync("/api/account/register", new { displayName = "Other", email = "other-image@example.test", password = "letters1" });
        ApplyCookies(otherClient, otherRegister);
        using var forbiddenMedia = await otherClient.GetAsync($"/api/session-artifacts/media/{imageId}");
        Assert.Equal(HttpStatusCode.NotFound, forbiddenMedia.StatusCode);

        using var sessionResponse = await client.GetAsync($"/api/sessions/{sessionId}");
        var sessionJson = await sessionResponse.Content.ReadFromJsonAsync<JsonElement>();
        var projectedArtifact = sessionJson.GetProperty("artifacts").EnumerateArray().Single();
        Assert.Equal("image", projectedArtifact.GetProperty("kind").GetString());
        Assert.Equal("image.v1", projectedArtifact.GetProperty("schema").GetString());

        await using var verify = factory.Services.CreateAsyncScope();
        var dbVerify = verify.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(checksum, (await dbVerify.SessionImages.SingleAsync()).Checksum);
    }

    private static void ApplyCookies(HttpClient client, HttpResponseMessage response)
    {
        foreach (var cookie in response.Headers.GetValues("Set-Cookie")) client.DefaultRequestHeaders.TryAddWithoutValidation("Cookie", cookie.Split(';')[0]);
    }

    public void Dispose() { factory.Dispose(); try { Directory.Delete(root, true); } catch { } }
}
