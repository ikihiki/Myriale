using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
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
        await using var database = await PostgresFixture.CreateAsync(migrate: true);
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
        await using var database = await PostgresFixture.CreateAsync(migrate: true);
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
    }

    [PostgresFact]
    public async Task LegacyEnsureCreatedSchemaIsAdoptedBackfilledAndDroppedWithoutDataLoss()
    {
        await using var database = await PostgresFixture.CreateAsync(migrate: true, targetMigration: "20260721135220_InitialSessionExecutionArchitecture");
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, "SES-PENDING", now);
        await SeedSessionAsync(database.Db, "SES-HANDOFF", now);

        database.Db.SessionPlayerInputs.Add(new SessionPlayerInput
        {
            Id = "INP-COMPLETED",
            SessionId = "SES-PENDING",
            RequestId = "completed-request",
            Text = "既存の完了入力",
            InteractionType = "dialogue",
            PayloadHash = new string('c', 64),
            AcceptedSessionRevision = 0,
            CreatedBy = "USR-1",
            CreatedAt = now,
        });
        database.Db.SessionTurns.AddRange(
            new SessionTurn
            {
                Id = "TRN-COMPLETED",
                SessionId = "SES-PENDING",
                Position = 1,
                Kind = "narrative",
                DialogueSchemaVersion = "narrative-dialogue.v8",
                DialogueTurnType = "action-result",
                Heading = "完了",
                NarrativeBody = "既存のNarrative",
                PlayerInputId = "INP-COMPLETED",
                AiProvider = "legacy",
                AiModel = "legacy-model",
                AiAttemptCount = 1,
                CreatedAt = now.AddMinutes(1),
            },
            new SessionTurn
            {
                Id = "TRN-MODULE",
                SessionId = "SES-HANDOFF",
                Position = 1,
                Kind = "module",
                CreatedAt = now,
            },
            new SessionTurn
            {
                Id = "TRN-HANDOFF",
                SessionId = "SES-HANDOFF",
                Position = 2,
                PreviousTurnId = "TRN-MODULE",
                Kind = "narrative",
                DialogueSchemaVersion = "narrative-dialogue.v8",
                DialogueTurnType = "module-handoff",
                Heading = "確定した結果を受ける",
                NarrativeBody = "既存のhandoff narrative",
                SourceModuleTurnId = "TRN-MODULE",
                AiProvider = "legacy",
                AiModel = "legacy-model",
                AiAttemptCount = 1,
                CreatedAt = now.AddMinutes(1),
            });
        await database.Db.SaveChangesAsync();
        await database.Db.Database.ExecuteSqlRawAsync("""
            INSERT INTO "SessionPendingPlayerInputs" (
                "Id", "SessionId", "RequestId", "Text", "InteractionType", "PayloadHash", "AcceptedAfterTurnId",
                "Status", "Revision", "AttemptCount", "LeaseId", "LeaseExpiresAt", "IsRetryable",
                "ErrorCode", "ErrorMessage", "CreatedAt", "UpdatedAt")
            VALUES ('INP-PENDING', 'SES-PENDING', 'pending-request', '保存済みの未完了入力', 'dialogue',
                repeat('p', 64), NULL, 'pending', 2, 1, 'OLD-LEASE', @expires, TRUE,
                NULL, NULL, @created, @updated);

            INSERT INTO "SessionNarrativeHandoffs" (
                "SourceModuleTurnId", "ExecutionId", "SessionId", "SourceSessionRevision", "Status", "Revision",
                "IsRetryable", "AttemptCount", "LeaseId", "LeaseExpiresAt", "LastErrorCode", "LastErrorMessage",
                "CreatedAt", "UpdatedAt", "CompletedAt")
            VALUES ('TRN-MODULE', 'MOD-LEGACY', 'SES-HANDOFF', 0, 'completed', 1,
                FALSE, 1, NULL, NULL, NULL, NULL, @created, @updated, @updated);
            """,
            new NpgsqlParameter("expires", now.AddMinutes(-1)),
            new NpgsqlParameter("created", now),
            new NpgsqlParameter("updated", now.AddMinutes(1)));

        await database.Db.Database.ExecuteSqlRawAsync("""
            DROP TABLE "SessionImages", "SessionNoteProposals", "SessionNoteRevisions", "SessionNotes",
                "SessionArtifacts", "SessionExecutionAttempts", "SessionExecutions" CASCADE;
            ALTER TABLE "SessionPlayerInputs" DROP COLUMN "AcceptedSessionRevision";
            ALTER TABLE "SessionPlayerInputs" DROP COLUMN "CreatedBy";
            ALTER TABLE "SessionPlayerInputs" DROP COLUMN "SupersedesInputId";
            TRUNCATE TABLE "__EFMigrationsHistory";
            """);
        database.Db.ChangeTracker.Clear();

        await LegacyPostgresSchemaAdopter.AdoptAsync(database.Db);
        await database.Db.GetService<IMigrator>().MigrateAsync();
        database.Db.ChangeTracker.Clear();

        Assert.False(await RelationExistsAsync(database.Db, "SessionPendingPlayerInputs"));
        Assert.False(await RelationExistsAsync(database.Db, "SessionNarrativeHandoffs"));
        Assert.Equal(2, await database.Db.SessionPlayerInputs.CountAsync());
        var pending = await database.Db.SessionExecutions.SingleAsync(item => item.IdempotencyKey == "pending-request");
        Assert.Equal(SessionExecutionStatuses.Queued, pending.Status);
        Assert.Null(pending.LeaseToken);
        Assert.Equal(1, pending.AttemptCount);
        var completed = await database.Db.SessionExecutions.SingleAsync(item => item.IdempotencyKey == "completed-request");
        Assert.Equal(SessionExecutionStatuses.Succeeded, completed.Status);
        Assert.True(await database.Db.SessionArtifacts.AnyAsync(item => item.ExecutionId == completed.Id && item.Kind == "narrative-text"));
        var handoff = await database.Db.SessionExecutions.SingleAsync(item => item.IdempotencyKey == "module-handoff:MOD-LEGACY");
        Assert.Equal(SessionExecutionStatuses.Succeeded, handoff.Status);
        Assert.True(await database.Db.SessionArtifacts.AnyAsync(item => item.ExecutionId == handoff.Id && item.Kind == "narrative-text"));
    }

    private static async Task<bool> RelationExistsAsync(ApplicationDbContext db, string name) =>
        await db.Database.SqlQueryRaw<bool>($"SELECT to_regclass('\"{name}\"') IS NOT NULL AS \"Value\"").SingleAsync();

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

    private sealed class PostgresFixture(string baseConnectionString, string connectionString, string schema, ApplicationDbContext db) : IAsyncDisposable
    {
        public string ConnectionString { get; } = connectionString;
        public ApplicationDbContext Db { get; } = db;

        public static async Task<PostgresFixture> CreateAsync(bool migrate, string? targetMigration = null)
        {
            var baseConnectionString = Environment.GetEnvironmentVariable(ConnectionEnvironmentVariable)
                ?? throw new InvalidOperationException($"{ConnectionEnvironmentVariable} is required.");
            var schema = $"session_execution_{Guid.NewGuid():N}";
            await using (var connection = new NpgsqlConnection(baseConnectionString))
            {
                await connection.OpenAsync();
                await using var command = new NpgsqlCommand($"CREATE SCHEMA \"{schema}\"", connection);
                await command.ExecuteNonQueryAsync();
            }
            var builder = new NpgsqlConnectionStringBuilder(baseConnectionString) { SearchPath = schema };
            var connectionString = builder.ConnectionString;
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(connectionString).Options;
            var db = new ApplicationDbContext(options);
            if (migrate) await db.GetService<IMigrator>().MigrateAsync(targetMigration);
            return new PostgresFixture(baseConnectionString, connectionString, schema, db);
        }

        public ApplicationDbContext CreateContext() => new(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(ConnectionString).Options);

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await using var connection = new NpgsqlConnection(baseConnectionString);
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"DROP SCHEMA IF EXISTS \"{schema}\" CASCADE", connection);
            await command.ExecuteNonQueryAsync();
        }
    }
}
