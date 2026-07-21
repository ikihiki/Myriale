using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Services;
using Npgsql;

namespace Myriale.Api.Tests;

public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(PostgresSessionExecutionIntegrationTests.ConnectionEnvironmentVariable)))
            Skip = $"Set {PostgresSessionExecutionIntegrationTests.ConnectionEnvironmentVariable} to run real PostgreSQL integration tests.";
    }
}

public sealed class PostgresSessionExecutionIntegrationTests
{
    public const string ConnectionEnvironmentVariable = "MYRIALE_TEST_POSTGRES";

    [PostgresFact]
    public async Task ClaimAsyncUsesSkipLockedAndClaimsNextEligibleExecution()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, "SES-QUEUE", now);
        database.Db.SessionExecutions.AddRange(
            Execution("EXE-HIGH", "SES-QUEUE", 10, now.AddMinutes(-2)),
            Execution("EXE-NEXT", "SES-QUEUE", 5, now.AddMinutes(-1)));
        await database.Db.SaveChangesAsync();

        await using var lockConnection = new NpgsqlConnection(database.ConnectionString);
        await lockConnection.OpenAsync();
        await using var lockTransaction = await lockConnection.BeginTransactionAsync();
        await using (var command = new NpgsqlCommand("SELECT 1 FROM \"SessionExecutions\" WHERE \"Id\" = 'EXE-HIGH' FOR UPDATE", lockConnection, lockTransaction))
            await command.ExecuteScalarAsync();

        await using var competingDb = database.CreateContext();
        var queue = new SessionExecutionQueue(competingDb, new MutableTimeProvider(now));
        var claim = Assert.Single(await queue.ClaimAsync("worker-next", 1, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.Equal("EXE-NEXT", claim.ExecutionId);

        await lockTransaction.RollbackAsync();
        await using var finalDb = database.CreateContext();
        var finalQueue = new SessionExecutionQueue(finalDb, new MutableTimeProvider(now));
        var nextClaim = Assert.Single(await finalQueue.ClaimAsync("worker-high", 1, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.Equal("EXE-HIGH", nextClaim.ExecutionId);
    }

    [PostgresFact]
    public async Task HeartbeatPreventsEarlyReclaimAndExpiredLeaseGetsNewFence()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, "SES-LEASE", now);
        database.Db.SessionExecutions.Add(Execution("EXE-LEASE", "SES-LEASE", 0, now));
        await database.Db.SaveChangesAsync();

        var time = new MutableTimeProvider(now);
        var queue = new SessionExecutionQueue(database.Db, time);
        var first = Assert.Single(await queue.ClaimAsync("worker-a", 1, TimeSpan.FromMinutes(2), CancellationToken.None));
        time.Advance(TimeSpan.FromMinutes(1));
        Assert.True(await queue.HeartbeatAsync(first, TimeSpan.FromMinutes(2), CancellationToken.None));

        time.Advance(TimeSpan.FromSeconds(90));
        await using (var earlyDb = database.CreateContext())
        {
            var earlyQueue = new SessionExecutionQueue(earlyDb, time);
            Assert.Empty(await earlyQueue.ClaimAsync("worker-b", 1, TimeSpan.FromMinutes(2), CancellationToken.None));
        }

        time.Advance(TimeSpan.FromSeconds(31));
        await using var reclaimDb = database.CreateContext();
        var reclaimQueue = new SessionExecutionQueue(reclaimDb, time);
        var reclaimed = Assert.Single(await reclaimQueue.ClaimAsync("worker-b", 1, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.NotEqual(first.LeaseToken, reclaimed.LeaseToken);
        Assert.True(reclaimed.Revision > first.Revision);
        Assert.False(await reclaimQueue.HeartbeatAsync(first, TimeSpan.FromMinutes(2), CancellationToken.None));
        var expiredAttempt = await reclaimDb.SessionExecutionAttempts.SingleAsync(item => item.Id == first.AttemptId);
        Assert.Equal("expired", expiredAttempt.Status);
        Assert.Equal("lease_expired", expiredAttempt.ErrorCode);
        Assert.NotNull(expiredAttempt.CompletedAt);
    }

    private static async Task SeedSessionAsync(ApplicationDbContext db, string sessionId, DateTimeOffset now)
    {
        if (!await db.Scenarios.AnyAsync(item => item.Id == "SCN-PG"))
        {
            db.Scenarios.Add(new Scenario
            {
                Id = "SCN-PG",
                Title = "PostgreSQL integration",
                AuthorId = "USR-1",
                CreatedAt = now,
                UpdatedAt = now,
            });
        }
        db.Sessions.Add(new Session
        {
            Id = sessionId,
            OwnerId = "USR-1",
            ScenarioId = "SCN-PG",
            SelectedHero = "Hero",
            Status = "active",
            CreatedAt = now,
            UpdatedAt = now,
        });
        await db.SaveChangesAsync();
    }

    private static SessionExecution Execution(string id, string sessionId, int priority, DateTimeOffset queuedAt) => new()
    {
        Id = id,
        SessionId = sessionId,
        Kind = SessionExecutionKinds.Narrative,
        TriggerType = "player-input",
        TriggerId = $"INP-{id}",
        Status = SessionExecutionStatuses.Queued,
        IdempotencyKey = id,
        PayloadHash = new string('a', 64),
        Priority = priority,
        MaxAttempts = 3,
        CreatedAt = queuedAt,
        QueuedAt = queuedAt,
    };

    private sealed class MutableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset current = now;
        public override DateTimeOffset GetUtcNow() => current;
        public void Advance(TimeSpan duration) => current = current.Add(duration);
    }

    private sealed class PostgresFixture(string adminConnectionString, string connectionString, string databaseName, ApplicationDbContext db) : IAsyncDisposable
    {
        public string ConnectionString { get; } = connectionString;
        public ApplicationDbContext Db { get; } = db;

        public static async Task<PostgresFixture> CreateAsync()
        {
            var configuredConnectionString = Environment.GetEnvironmentVariable(ConnectionEnvironmentVariable)
                ?? throw new InvalidOperationException($"{ConnectionEnvironmentVariable} is required.");
            var databaseName = $"session_execution_{Guid.NewGuid():N}";
            var adminBuilder = new NpgsqlConnectionStringBuilder(configuredConnectionString) { Database = "postgres" };
            var adminConnectionString = adminBuilder.ConnectionString;
            await using (var connection = new NpgsqlConnection(adminConnectionString))
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", connection);
                await command.ExecuteNonQueryAsync();
            }
            var builder = new NpgsqlConnectionStringBuilder(configuredConnectionString) { Database = databaseName };
            var connectionString = builder.ConnectionString;
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(connectionString).Options;
            var db = new ApplicationDbContext(options);
            await db.Database.EnsureCreatedAsync();
            return new PostgresFixture(adminConnectionString, connectionString, databaseName, db);
        }

        public ApplicationDbContext CreateContext() => new(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(ConnectionString).Options);

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
