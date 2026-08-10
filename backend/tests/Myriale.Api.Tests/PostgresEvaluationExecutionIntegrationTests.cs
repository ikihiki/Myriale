using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Myriale.Api.Infrastructure.Composition.Evaluations;
using Myriale.Api.Infrastructure.Persistence;
using Npgsql;

namespace Myriale.Api.Tests;

public sealed class PostgresEvaluationExecutionIntegrationTests
{
    [PostgresFact]
    public async Task ConcurrentWorkersClaimDisjointEvaluationBatchesWithSkipLocked()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 8, 10, 12, 0, 0, TimeSpan.Zero);
        await SeedAsync(database.Db, now, attemptCount: 4);
        await using var firstDb = database.CreateContext();
        await using var secondDb = database.CreateContext();
        var first = Service(firstDb, now).ClaimBatchAsync("worker-a", 2, TimeSpan.FromMinutes(2), default);
        var second = Service(secondDb, now).ClaimBatchAsync("worker-b", 2, TimeSpan.FromMinutes(2), default);

        var batches = await Task.WhenAll(first, second);

        Assert.All(batches, batch => Assert.Equal(2, batch.Count));
        var attempts = batches.SelectMany(x => x).Select(x => x.AttemptId).ToList();
        Assert.Equal(4, attempts.Distinct().Count());
        await using var verification = database.CreateContext();
        Assert.Equal(4, await verification.EvaluationModelInvocations.CountAsync());
        Assert.Equal(4, await verification.EvaluationAttempts.CountAsync(x => x.Status == EvaluationAttemptStatus.Running));
    }

    private static EvaluationSessionService Service(ApplicationDbContext db, DateTimeOffset now) =>
        new(db, new TestProfiles(), new FixedTimeProvider(now));

    private static async Task SeedAsync(ApplicationDbContext db, DateTimeOffset now, int attemptCount)
    {
        var sessionId = new EvaluationSessionId("EVS-PG-CLAIM");
        var situationId = new EvaluationSituationId("EVQ-PG-CLAIM");
        var candidateId = new EvaluationCandidateId("EVC-PG-CLAIM");
        var request = new ModelActionDecisionRequest(
            ScenarioTurnSchemas.ModelActionDecisionRequest,
            "open",
            new(new("room", "Room", ""), []),
            [],
            [new("system:clarify", "clarify", "Clarify", "", JsonDocument.Parse("{}").RootElement.Clone())]);
        db.EvaluationSessions.Add(new EvaluationSession
        {
            Id = sessionId,
            OwnerId = new AccountId("USR-1"),
            CreatedById = new AccountId("USR-1"),
            Title = "PostgreSQL claim",
            Status = EvaluationSessionStatus.Queued,
            PlannedAttemptCount = attemptCount,
            CreatedAt = now,
            QueuedAt = now,
        });
        db.EvaluationSituations.Add(new EvaluationSituation
        {
            Id = situationId,
            SessionId = sessionId,
            StableKey = "action-case",
            Stage = EvaluationStage.Action,
            SourceKind = EvaluationSituationSourceKind.Fixture,
            RequestJson = JsonSerializer.Serialize(request, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            ExpectationsJson = "{}",
            RequestHash = new string('a', 64),
            SourceBundleHash = new string('b', 64),
            ImportedById = new AccountId("USR-1"),
            ImportedAt = now,
        });
        db.EvaluationCandidates.Add(new EvaluationCandidate
        {
            Id = candidateId,
            SessionId = sessionId,
            CandidateKey = "candidate-a",
            BlindCode = "C-PG",
            ProfileId = new AiProviderProfileId("profile-a"),
            Provider = "profile-a",
            Adapter = "openai-compatible",
            Model = "model-a",
            ProfileDescriptorJson = "{}",
            ProfileDescriptorHash = new string('c', 64),
            GenerationOverridesJson = "{}",
            RetryPolicyJson = "{}",
            Repetitions = attemptCount,
            MaxInvocations = 3,
        });
        for (var index = 1; index <= attemptCount; index++)
        {
            db.EvaluationAttempts.Add(new EvaluationAttempt
            {
                Id = new EvaluationAttemptId($"EVA-PG-CLAIM-{index}"),
                SessionId = sessionId,
                SituationId = situationId,
                CandidateId = candidateId,
                Repetition = index,
                Status = EvaluationAttemptStatus.Queued,
                CreatedAt = now.AddMilliseconds(index),
            });
        }
        await db.SaveChangesAsync();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class TestProfiles : IAiProfileCatalog
    {
        private static readonly AiProfileDescriptor Profile = new(
            new("profile-a"), "Profile A", "http://test", "model-a", new("credential"), true, AiProfileDefinitionSource.Deployment, 1);
        public Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken ct) => Task.FromResult(
            new AiProfileCatalogSnapshot(new Dictionary<AiProviderProfileId, AiProfileDescriptor> { [Profile.Id] = Profile }, Profile.Id, Profile.Id));
        public Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId id, CancellationToken ct) => Task.FromResult(Profile);
        public Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? id, CancellationToken ct) => Task.FromResult(id ?? Profile.Id);
        public Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? id, CancellationToken ct) => Task.FromResult(id ?? Profile.Id);
    }

    private sealed class PostgresFixture(string adminConnectionString, string connectionString, string databaseName, ApplicationDbContext db) : IAsyncDisposable
    {
        public string ConnectionString { get; } = connectionString;
        public ApplicationDbContext Db { get; } = db;

        public static async Task<PostgresFixture> CreateAsync()
        {
            var configured = Environment.GetEnvironmentVariable(PostgresSessionExecutionIntegrationTests.ConnectionEnvironmentVariable)
                ?? throw new InvalidOperationException($"{PostgresSessionExecutionIntegrationTests.ConnectionEnvironmentVariable} is required.");
            var databaseName = $"evaluation_execution_{Guid.NewGuid():N}";
            var adminBuilder = new NpgsqlConnectionStringBuilder(configured) { Database = "postgres" };
            await using (var connection = new NpgsqlConnection(adminBuilder.ConnectionString))
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", connection);
                await command.ExecuteNonQueryAsync();
            }
            var builder = new NpgsqlConnectionStringBuilder(configured) { Database = databaseName };
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(builder.ConnectionString)
                .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning)).Options;
            var db = new ApplicationDbContext(options);
            await db.Database.MigrateAsync();
            return new PostgresFixture(adminBuilder.ConnectionString, builder.ConnectionString, databaseName, db);
        }

        public ApplicationDbContext CreateContext() => new(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(ConnectionString)
                .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning)).Options);

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await using var connection = new NpgsqlConnection(adminConnectionString);
            await connection.OpenAsync();
            await using (var terminate = new NpgsqlCommand(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = @database AND pid <> pg_backend_pid()",
                connection))
            {
                terminate.Parameters.AddWithValue("database", databaseName);
                await terminate.ExecuteNonQueryAsync();
            }
            await using var command = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{databaseName}\"", connection);
            await command.ExecuteNonQueryAsync();
        }
    }
}
