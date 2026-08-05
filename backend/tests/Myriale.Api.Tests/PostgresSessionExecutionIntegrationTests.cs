using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionExecutions.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.SessionExecutions.Infrastructure;
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
    public async Task DestructiveBaselineCreatesTypedLifecycleColumnsAndRequiredIndexes()
    {
        await using var database = await PostgresFixture.CreateAsync();
        await using var command = database.Db.Database.GetDbConnection().CreateCommand();
        command.CommandText = """
            SELECT
                (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SessionAiInteractions' AND column_name = 'Stage'),
                (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SessionAiInteractions' AND column_name = 'Status'),
                (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (
                    'IX_SessionTurns_SessionId_Position',
                    'IX_SessionPlayerInputs_SessionId_RequestId',
                    'IX_SessionExecutions_SessionId_IdempotencyKey'))
            """;
        await database.Db.Database.OpenConnectionAsync();
        await using var reader = await command.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync());
        Assert.Equal("text", reader.GetString(0));
        Assert.Equal("text", reader.GetString(1));
        Assert.Equal(3L, reader.GetInt64(2));
    }

    [PostgresFact]
    public async Task ClaimAsyncUsesSkipLockedAndClaimsNextEligibleExecution()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, new SessionId("SES-QUEUE"), now);
        database.Db.SessionExecutions.AddRange(
            Execution(new SessionExecutionId("EXE-HIGH"), new SessionId("SES-QUEUE"), 10, now.AddMinutes(-2)),
            Execution(new SessionExecutionId("EXE-NEXT"), new SessionId("SES-QUEUE"), 5, now.AddMinutes(-1)));
        await database.Db.SaveChangesAsync();

        await using var lockConnection = new NpgsqlConnection(database.ConnectionString);
        await lockConnection.OpenAsync();
        await using var lockTransaction = await lockConnection.BeginTransactionAsync();
        await using (var command = new NpgsqlCommand("SELECT 1 FROM \"SessionExecutions\" WHERE \"Id\" = 'EXE-HIGH' FOR UPDATE", lockConnection, lockTransaction))
            await command.ExecuteScalarAsync();

        await using var competingDb = database.CreateContext();
        var queue = Operations(competingDb, new MutableTimeProvider(now));
        var claim = Assert.Single((await queue.ClaimBatchAsync("worker-next", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        Assert.Equal(new SessionExecutionId("EXE-NEXT"), claim.ExecutionId);

        await lockTransaction.RollbackAsync();
        await using var finalDb = database.CreateContext();
        var finalQueue = Operations(finalDb, new MutableTimeProvider(now));
        var nextClaim = Assert.Single((await finalQueue.ClaimBatchAsync("worker-high", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        Assert.Equal(new SessionExecutionId("EXE-HIGH"), nextClaim.ExecutionId);
    }

    [PostgresFact]
    public async Task HeartbeatPreventsEarlyReclaimAndExpiredLeaseGetsNewFence()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, new SessionId("SES-LEASE"), now);
        database.Db.SessionExecutions.Add(Execution(new SessionExecutionId("EXE-LEASE"), new SessionId("SES-LEASE"), 0, now));
        await database.Db.SaveChangesAsync();

        var time = new MutableTimeProvider(now);
        var queue = Operations(database.Db, time);
        var first = Assert.Single((await queue.ClaimBatchAsync("worker-a", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        time.Advance(TimeSpan.FromMinutes(1));
        Assert.Equal(SessionExecutionOperationOutcome.Success, await queue.HeartbeatAsync(first, TimeSpan.FromMinutes(2), CancellationToken.None));

        time.Advance(TimeSpan.FromSeconds(90));
        await using (var earlyDb = database.CreateContext())
        {
            var earlyQueue = Operations(earlyDb, time);
            Assert.Empty((await earlyQueue.ClaimBatchAsync("worker-b", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        }

        time.Advance(TimeSpan.FromSeconds(31));
        await using var reclaimDb = database.CreateContext();
        var reclaimQueue = Operations(reclaimDb, time);
        var reclaimed = Assert.Single((await reclaimQueue.ClaimBatchAsync("worker-b", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        Assert.NotEqual(first.LeaseToken, reclaimed.LeaseToken);
        Assert.True(reclaimed.Revision > first.Revision);
        Assert.Equal(SessionExecutionOperationOutcome.StaleClaim, await reclaimQueue.HeartbeatAsync(first, TimeSpan.FromMinutes(2), CancellationToken.None));
        var expiredAttempt = await reclaimDb.SessionExecutionAttempts.SingleAsync(item => item.Id == first.AttemptId);
        Assert.Equal(SessionExecutionAttemptStatus.Expired, expiredAttempt.Status);
        Assert.Equal("lease_expired", expiredAttempt.ErrorCode);
        Assert.NotNull(expiredAttempt.CompletedAt);
    }

    [PostgresFact]
    public async Task ConcurrentInputAcceptanceHasOneWinnerAndStableConflict()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, new SessionId("SES-INPUT-RACE"), now);
        await using var firstDb = database.CreateContext();
        await using var secondDb = database.CreateContext();
        var firstSession = await firstDb.Sessions.SingleAsync(x => x.Id == new SessionId("SES-INPUT-RACE"));
        var secondSession = await secondDb.Sessions.SingleAsync(x => x.Id == new SessionId("SES-INPUT-RACE"));
        var firstInput = firstSession.AcceptInput(new SessionPlayerInputId("INP-RACE-1"), "request-1", "first", SessionInputInteractionType.Dialogue, new string('a', 64), new AccountId("USR-1"), null, now);
        var secondInput = secondSession.AcceptInput(new SessionPlayerInputId("INP-RACE-2"), "request-2", "second", SessionInputInteractionType.Dialogue, new string('b', 64), new AccountId("USR-1"), null, now);
        var firstRepository = new Myriale.Api.Features.Sessions.Infrastructure.EfSessionInputAcceptanceRepository(firstDb);
        var secondRepository = new Myriale.Api.Features.Sessions.Infrastructure.EfSessionInputAcceptanceRepository(secondDb);
        var outcomes = await Task.WhenAll(
            firstRepository.CommitInputAsync(firstSession, InputExecution(firstInput, now), CancellationToken.None),
            secondRepository.CommitInputAsync(secondSession, InputExecution(secondInput, now), CancellationToken.None));
        Assert.Single(outcomes, x => x == Myriale.Api.Features.Sessions.Application.SessionRepositoryCommitOutcome.Committed);
        Assert.Single(outcomes, x => x != Myriale.Api.Features.Sessions.Application.SessionRepositoryCommitOutcome.Committed);
        await using var verification = database.CreateContext();
        Assert.Single(await verification.SessionPlayerInputs.Where(x => x.SessionId == new SessionId("SES-INPUT-RACE")).ToListAsync());
        Assert.Single(await verification.SessionExecutions.Where(x => x.SessionId == new SessionId("SES-INPUT-RACE")).ToListAsync());
    }

    [PostgresFact]
    public async Task ConcurrentRootTurnAppendHasOneWinner()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, new SessionId("SES-TURN-RACE"), now);
        await using var firstDb = database.CreateContext();
        await using var secondDb = database.CreateContext();
        var first = await firstDb.Sessions.SingleAsync(x => x.Id == new SessionId("SES-TURN-RACE"));
        var second = await secondDb.Sessions.SingleAsync(x => x.Id == new SessionId("SES-TURN-RACE"));
        first.AppendOpeningTurn(new SessionTurnId("TRN-RACE-1"), "opening.v1", "First", "First", now);
        second.AppendOpeningTurn(new SessionTurnId("TRN-RACE-2"), "opening.v1", "Second", "Second", now);
        var outcomes = await Task.WhenAll(SaveOutcomeAsync(firstDb), SaveOutcomeAsync(secondDb));
        Assert.Single(outcomes, x => x);
        await using var verification = database.CreateContext();
        Assert.Single(await verification.SessionTurns.Where(x => x.SessionId == new SessionId("SES-TURN-RACE")).ToListAsync());
    }

    [PostgresFact]
    public async Task CancelMutationUsesPostgresRowLockAndPreservesRunningLease()
    {
        await using var database = await PostgresFixture.CreateAsync();
        var now = new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);
        await SeedSessionAsync(database.Db, new SessionId("SES-CANCEL"), now);
        var execution = Execution(new SessionExecutionId("EXE-CANCEL"), new SessionId("SES-CANCEL"), 0, now);
        execution.Status = SessionExecutionStatus.Running;
        execution.Revision = 4;
        execution.LeaseOwner = "worker-a";
        execution.LeaseToken = "LET-CURRENT";
        execution.LeaseExpiresAt = now.AddMinutes(2);
        database.Db.SessionExecutions.Add(execution);
        await database.Db.SaveChangesAsync();
        var repository = new Myriale.Api.Features.SessionExecutions.Infrastructure.EfSessionExecutionRepository(database.Db);

        var result = await repository.MutateOwnedWithLockAsync(
            execution.Id,
            new AccountId("USR-1"),
            item => item.RequestCancellation(now),
            CancellationToken.None);

        Assert.Equal(Myriale.Api.Features.SessionExecutions.Application.SessionExecutionMutationResult.Success, result);
        database.Db.ChangeTracker.Clear();
        execution = await database.Db.SessionExecutions.SingleAsync(item => item.Id == new SessionExecutionId("EXE-CANCEL"));
        Assert.Equal(SessionExecutionStatus.CancelRequested, execution.Status);
        Assert.Equal(5, execution.Revision);
        Assert.Equal("worker-a", execution.LeaseOwner);
        Assert.Equal("LET-CURRENT", execution.LeaseToken);
        Assert.Equal(now.AddMinutes(2), execution.LeaseExpiresAt);
    }

    private static EfSessionExecutionOperationsRepository Operations(ApplicationDbContext db, TimeProvider time) =>
        new(db, time, new SessionExecutionRetryPolicy(new FixedJitter()));

    private sealed class FixedJitter : ISessionExecutionJitter { public double NextUnit() => 0; }

    private static SessionExecution InputExecution(SessionPlayerInput input, DateTimeOffset now) => new()
    {
        Id = new SessionExecutionId($"EXE-{input.Id.AsPrimitive()}"), SessionId = input.SessionId, Kind = SessionExecutionKind.ScenarioTurn,
        TriggerType = SessionExecutionTriggerType.PlayerInput, TriggerId = new SessionExecutionTriggerId(input.Id.AsPrimitive()), Status = SessionExecutionStatus.Queued,
        IdempotencyKey = input.RequestId, PayloadHash = input.PayloadHash, AcceptedHeadTurnId = input.AcceptedAfterTurnId,
        AcceptedSessionRevision = input.AcceptedSessionRevision, CreatedAt = now, QueuedAt = now,
    };

    private static async Task<bool> SaveOutcomeAsync(ApplicationDbContext db)
    {
        try { await db.SaveChangesAsync(); return true; }
        catch (DbUpdateException) { return false; }
    }

    private static async Task SeedSessionAsync(ApplicationDbContext db, SessionId sessionId, DateTimeOffset now)
    {
        if (!await db.Scenarios.AnyAsync(item => item.Id == new ScenarioId("SCN-PG")))
        {
            db.Scenarios.Add(new Scenario
            {
                Id = new ScenarioId("SCN-PG"),
                Title = "PostgreSQL integration",
                AuthorId = new AccountId("USR-1"),
                CreatedAt = now,
                UpdatedAt = now,
            });
        }
        db.Sessions.Add(new Session
        {
            Id = sessionId,
            OwnerId = new AccountId("USR-1"),
            ScenarioId = new ScenarioId("SCN-PG"),
            SelectedHero = "Hero",
            Status = SessionStatus.Active,
            CreatedAt = now,
            UpdatedAt = now,
        });
        await db.SaveChangesAsync();
    }

    private static SessionExecution Execution(SessionExecutionId id, SessionId sessionId, int priority, DateTimeOffset queuedAt) => new()
    {
        Id = id,
        SessionId = sessionId,
        Kind = SessionExecutionKind.Narrative,
        TriggerType = SessionExecutionTriggerType.PlayerInput,
        TriggerId = new SessionExecutionTriggerId($"INP-{id.AsPrimitive()}"),
        Status = SessionExecutionStatus.Queued,
        IdempotencyKey = id.AsPrimitive(),
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
