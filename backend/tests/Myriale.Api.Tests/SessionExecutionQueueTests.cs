using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionExecutionQueueTests
{
    [Fact]
    public async Task ClaimAsyncClaimsOnlyBoundedHighestPriorityEligibleBatch()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        fixture.Db.SessionExecutions.AddRange(
            Execution("EXE-LOW", SessionExecutionStatuses.Queued, 1, now.AddMinutes(-3)),
            Execution("EXE-HIGH", SessionExecutionStatuses.Queued, 9, now.AddMinutes(-1)),
            Execution("EXE-RETRY", SessionExecutionStatuses.RetryWait, 5, now.AddMinutes(-2), now.AddSeconds(-1)),
            Execution("EXE-NOT-DUE", SessionExecutionStatuses.RetryWait, 20, now.AddMinutes(-4), now.AddMinutes(1)));
        await fixture.Db.SaveChangesAsync();

        var claims = await fixture.Queue.ClaimAsync("worker-test", 2, TimeSpan.FromMinutes(2), CancellationToken.None);

        Assert.Equal(["EXE-HIGH", "EXE-RETRY"], claims.Select(claim => claim.ExecutionId).ToArray());
        Assert.All(claims, claim => Assert.Equal(1, claim.Revision));
        var claimed = await fixture.Db.SessionExecutions.Where(item => claims.Select(claim => claim.ExecutionId).Contains(item.Id)).ToListAsync();
        Assert.All(claimed, item =>
        {
            Assert.Equal(SessionExecutionStatuses.Running, item.Status);
            Assert.Equal("worker-test", item.LeaseOwner);
            Assert.NotNull(item.LeaseToken);
            Assert.Equal(now.AddMinutes(2), item.LeaseExpiresAt);
            Assert.Equal(1, item.AttemptCount);
        });
        Assert.Equal(2, await fixture.Db.SessionExecutionAttempts.CountAsync());
        Assert.Equal(SessionExecutionStatuses.Queued, (await fixture.Db.SessionExecutions.FindAsync("EXE-LOW"))!.Status);
        Assert.Equal(SessionExecutionStatuses.RetryWait, (await fixture.Db.SessionExecutions.FindAsync("EXE-NOT-DUE"))!.Status);
    }

    [Fact]
    public async Task HeartbeatAsyncRequiresMatchingLeaseTokenAndRevision()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        fixture.Db.SessionExecutions.Add(Execution("EXE-1", SessionExecutionStatuses.Queued, 0, now));
        await fixture.Db.SaveChangesAsync();
        var claim = Assert.Single(await fixture.Queue.ClaimAsync("worker-test", 1, TimeSpan.FromMinutes(2), CancellationToken.None));
        fixture.Time.Advance(TimeSpan.FromSeconds(30));

        Assert.False(await fixture.Queue.HeartbeatAsync(claim with { LeaseToken = "LET-STALE" }, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.False(await fixture.Queue.HeartbeatAsync(claim with { Revision = claim.Revision - 1 }, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.True(await fixture.Queue.HeartbeatAsync(claim, TimeSpan.FromMinutes(2), CancellationToken.None));

        fixture.Db.ChangeTracker.Clear();
        var execution = await fixture.Db.SessionExecutions.SingleAsync();
        Assert.Equal(now.AddMinutes(2).AddSeconds(30), execution.LeaseExpiresAt);
        Assert.Equal(claim.Revision, execution.Revision);
    }

    [Fact]
    public async Task ClaimAsyncReplacesExpiredLeaseWithNewFenceGeneration()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        var expired = Execution("EXE-1", SessionExecutionStatuses.Running, 0, now.AddMinutes(-5));
        expired.Revision = 4;
        expired.LeaseOwner = "worker-old";
        expired.LeaseToken = "LET-OLD";
        expired.LeaseExpiresAt = now.AddSeconds(-1);
        expired.AttemptCount = 1;
        fixture.Db.SessionExecutions.Add(expired);
        fixture.Db.SessionExecutionAttempts.Add(new SessionExecutionAttempt
        {
            Id = "ATT-OLD",
            ExecutionId = expired.Id,
            AttemptNumber = 1,
            Status = "running",
            WorkerId = "worker-old",
            StartedAt = now.AddMinutes(-5),
        });
        await fixture.Db.SaveChangesAsync();

        var claim = Assert.Single(await fixture.Queue.ClaimAsync("worker-new", 1, TimeSpan.FromMinutes(2), CancellationToken.None));

        Assert.Equal(5, claim.Revision);
        Assert.NotEqual("LET-OLD", claim.LeaseToken);
        Assert.Equal(2, claim.AttemptNumber);
        Assert.False(await fixture.Queue.HeartbeatAsync(claim with { LeaseToken = "LET-OLD", Revision = 4 }, TimeSpan.FromMinutes(2), CancellationToken.None));
    }

    private static SessionExecution Execution(string id, string status, int priority, DateTimeOffset queuedAt, DateTimeOffset? nextAttemptAt = null) => new()
    {
        Id = id,
        SessionId = "SES-1",
        Kind = SessionExecutionKinds.Narrative,
        TriggerType = "player-input",
        TriggerId = $"INP-{id}",
        Status = status,
        Revision = 0,
        IdempotencyKey = id,
        PayloadHash = new string('a', 64),
        Priority = priority,
        MaxAttempts = 3,
        NextAttemptAt = nextAttemptAt,
        CreatedAt = queuedAt,
        QueuedAt = queuedAt,
    };

    private sealed class QueueFixture(SqliteConnection connection, ApplicationDbContext db, MutableTimeProvider time) : IAsyncDisposable
    {
        public ApplicationDbContext Db { get; } = db;
        public MutableTimeProvider Time { get; } = time;
        public SessionExecutionQueue Queue { get; } = new(db, time);

        public static async Task<QueueFixture> CreateAsync(DateTimeOffset now)
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(connection).Options;
            var db = new ApplicationDbContext(options);
            await db.Database.EnsureCreatedAsync();
            db.Scenarios.Add(new Scenario
            {
                Id = "SCN-1",
                Title = "Queue test",
                AuthorId = "USR-1",
                CreatedAt = now,
                UpdatedAt = now,
            });
            db.Sessions.Add(new Session
            {
                Id = "SES-1",
                OwnerId = "USR-1",
                ScenarioId = "SCN-1",
                SelectedHero = "Hero",
                Status = "active",
                CreatedAt = now,
                UpdatedAt = now,
            });
            await db.SaveChangesAsync();
            return new QueueFixture(connection, db, new MutableTimeProvider(now));
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    private sealed class MutableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset current = now;
        public override DateTimeOffset GetUtcNow() => current;
        public void Advance(TimeSpan duration) => current = current.Add(duration);
    }
}
