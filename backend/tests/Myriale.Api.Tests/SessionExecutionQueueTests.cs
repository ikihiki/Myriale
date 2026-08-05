using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionExecutions.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.SessionExecutions.Infrastructure;

namespace Myriale.Api.Tests;

public sealed class SessionExecutionQueueTests
{
    [Fact]
    public async Task ClaimBatchClaimsOnlyBoundedHighestPriorityEligibleBatch()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        fixture.Db.SessionExecutions.AddRange(
            Execution("EXE-LOW", SessionExecutionStatus.Queued, 1, now.AddMinutes(-3)),
            Execution("EXE-HIGH", SessionExecutionStatus.Queued, 9, now.AddMinutes(-1)),
            Execution("EXE-RETRY", SessionExecutionStatus.RetryWait, 5, now.AddMinutes(-2), now.AddSeconds(-1)),
            Execution("EXE-NOT-DUE", SessionExecutionStatus.RetryWait, 20, now.AddMinutes(-4), now.AddMinutes(1)));
        await fixture.Db.SaveChangesAsync();

        var result = await fixture.Repository.ClaimBatchAsync("worker-test", 2, TimeSpan.FromMinutes(2), CancellationToken.None);

        Assert.Equal(SessionExecutionOperationOutcome.Success, result.Outcome);
        Assert.Equal(["EXE-HIGH", "EXE-RETRY"], result.Claims.Select(claim => claim.ExecutionId).ToArray());
        Assert.All(result.Claims, claim => Assert.Equal(1, claim.Revision));
        fixture.Db.ChangeTracker.Clear();
        var claimed = await fixture.Db.SessionExecutions.Where(item => result.Claims.Select(claim => claim.ExecutionId).Contains(item.Id)).ToListAsync();
        Assert.All(claimed, item =>
        {
            Assert.Equal(SessionExecutionStatus.Running, item.Status);
            Assert.Equal("worker-test", item.LeaseOwner);
            Assert.NotNull(item.LeaseToken);
            Assert.Equal(now.AddMinutes(2), item.LeaseExpiresAt);
            Assert.Equal(1, item.AttemptCount);
        });
        Assert.Equal(2, await fixture.Db.SessionExecutionAttempts.CountAsync());
    }

    [Fact]
    public async Task HeartbeatDistinguishesStaleClaimAndRevisionConflict()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        fixture.Db.SessionExecutions.Add(Execution("EXE-1", SessionExecutionStatus.Queued, 0, now));
        await fixture.Db.SaveChangesAsync();
        var claim = Assert.Single((await fixture.Repository.ClaimBatchAsync("worker-test", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        fixture.Time.Advance(TimeSpan.FromSeconds(30));

        Assert.Equal(SessionExecutionOperationOutcome.StaleClaim,
            await fixture.Repository.HeartbeatAsync(claim with { LeaseToken = "LET-STALE" }, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.Equal(SessionExecutionOperationOutcome.RevisionConflict,
            await fixture.Repository.HeartbeatAsync(claim with { Revision = claim.Revision - 1 }, TimeSpan.FromMinutes(2), CancellationToken.None));
        Assert.Equal(SessionExecutionOperationOutcome.Success,
            await fixture.Repository.HeartbeatAsync(claim, TimeSpan.FromMinutes(2), CancellationToken.None));
    }

    [Fact]
    public async Task ReclaimExpiresAttemptAndStaleFinalizerCannotDestroyNewLease()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        var expired = Execution("EXE-1", SessionExecutionStatus.Running, 0, now.AddMinutes(-5));
        expired.Revision = 4;
        expired.LeaseOwner = "worker-old";
        expired.LeaseToken = "LET-OLD";
        expired.LeaseExpiresAt = now.AddSeconds(-1);
        expired.AttemptCount = 1;
        fixture.Db.SessionExecutions.Add(expired);
        fixture.Db.SessionExecutionAttempts.Add(SessionExecutionAttempt.Start("ATT-OLD", expired.Id, 1, "worker-old", now.AddMinutes(-5)));
        await fixture.Db.SaveChangesAsync();
        var staleClaim = new SessionExecutionClaim(expired.Id, "LET-OLD", 4, "ATT-OLD", 1);

        var claim = Assert.Single((await fixture.Repository.ClaimBatchAsync("worker-new", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);

        Assert.Equal(5, claim.Revision);
        Assert.NotEqual("LET-OLD", claim.LeaseToken);
        Assert.Equal(2, claim.AttemptNumber);
        fixture.Db.ChangeTracker.Clear();
        var attempts = await fixture.Db.SessionExecutionAttempts.OrderBy(item => item.AttemptNumber).ToListAsync();
        Assert.Equal(SessionExecutionAttemptStatus.Expired, attempts[0].Status);
        Assert.Equal("lease_expired", attempts[0].ErrorCode);
        Assert.True(attempts[0].Retryable);

        var staleResult = await fixture.Repository.FinalizeAsync(
            new(staleClaim, new(true), null, null, null), CancellationToken.None);
        Assert.Equal(SessionExecutionOperationOutcome.StaleClaim, staleResult.Outcome);
        fixture.Db.ChangeTracker.Clear();
        var current = await fixture.Db.SessionExecutions.SingleAsync();
        Assert.Equal(SessionExecutionStatus.Running, current.Status);
        Assert.Equal(claim.Revision, current.Revision);
        Assert.Equal(claim.LeaseToken, current.LeaseToken);
    }

    [Fact]
    public async Task FinalizeClosesCancelRequestedAttemptDespiteCancellationRevision()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now);
        fixture.Db.SessionExecutions.Add(Execution("EXE-1", SessionExecutionStatus.Queued, 0, now.AddMinutes(-1)));
        await fixture.Db.SaveChangesAsync();
        var claim = Assert.Single((await fixture.Repository.ClaimBatchAsync("worker-test", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);
        fixture.Db.ChangeTracker.Clear();
        var execution = await fixture.Db.SessionExecutions.SingleAsync();
        execution.RequestCancellation(now);
        await fixture.Db.SaveChangesAsync();

        var result = await fixture.Repository.FinalizeAsync(
            new(claim, new(false, false, "execution_cancelled", "cancelled", ErrorCategory: "cancellation"), null, null, null),
            CancellationToken.None);

        Assert.Equal(SessionExecutionOperationOutcome.Success, result.Outcome);
        fixture.Db.ChangeTracker.Clear();
        execution = await fixture.Db.SessionExecutions.SingleAsync();
        var attempt = await fixture.Db.SessionExecutionAttempts.SingleAsync();
        Assert.Equal(SessionExecutionStatus.Cancelled, execution.Status);
        Assert.Null(execution.LeaseToken);
        Assert.Equal(SessionExecutionAttemptStatus.Cancelled, attempt.Status);
        Assert.Equal("cancellation", attempt.ErrorCategory);
    }

    [Fact]
    public async Task RetryDelayUsesInjectedDeterministicJitter()
    {
        var now = new DateTimeOffset(2026, 7, 21, 12, 0, 0, TimeSpan.Zero);
        await using var fixture = await QueueFixture.CreateAsync(now, jitter: 0.25);
        fixture.Db.SessionExecutions.Add(Execution("EXE-1", SessionExecutionStatus.Queued, 0, now));
        await fixture.Db.SaveChangesAsync();
        var claim = Assert.Single((await fixture.Repository.ClaimBatchAsync("worker-test", 1, TimeSpan.FromMinutes(2), CancellationToken.None)).Claims);

        var result = await fixture.Repository.FinalizeAsync(
            new(claim, new(false, true, "timeout", "retry", ErrorCategory: "provider"), null, null, null),
            CancellationToken.None);

        Assert.Equal(SessionExecutionOperationOutcome.Success, result.Outcome);
        Assert.Equal(TimeSpan.FromSeconds(2.25), result.RetryDelay);
        fixture.Db.ChangeTracker.Clear();
        var execution = await fixture.Db.SessionExecutions.SingleAsync();
        Assert.Equal(SessionExecutionStatus.RetryWait, execution.Status);
        Assert.Equal(now.AddSeconds(2.25), execution.NextAttemptAt);
    }

    private static SessionExecution Execution(string id, SessionExecutionStatus status, int priority, DateTimeOffset queuedAt, DateTimeOffset? nextAttemptAt = null) => new()
    {
        Id = id,
        SessionId = "SES-1",
        Kind = SessionExecutionKind.Narrative,
        TriggerType = SessionExecutionTriggerType.PlayerInput,
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

    private sealed class QueueFixture(SqliteConnection connection, ApplicationDbContext db, MutableTimeProvider time, double jitter) : IAsyncDisposable
    {
        public ApplicationDbContext Db { get; } = db;
        public MutableTimeProvider Time { get; } = time;
        public EfSessionExecutionOperationsRepository Repository { get; } =
            new(db, time, new SessionExecutionRetryPolicy(new FixedJitter(jitter)));

        public static async Task<QueueFixture> CreateAsync(DateTimeOffset now, double jitter = 0)
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(connection).Options;
            var db = new ApplicationDbContext(options);
            await db.Database.EnsureCreatedAsync();
            db.Scenarios.Add(new Scenario { Id = "SCN-1", Title = "Queue test", AuthorId = "USR-1", CreatedAt = now, UpdatedAt = now });
            db.Sessions.Add(new Session
            {
                Id = "SES-1", OwnerId = "USR-1", ScenarioId = "SCN-1", SelectedHero = "Hero",
                Status = SessionStatus.Active, CreatedAt = now, UpdatedAt = now,
            });
            await db.SaveChangesAsync();
            return new QueueFixture(connection, db, new MutableTimeProvider(now), jitter);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    private sealed class FixedJitter(double value) : ISessionExecutionJitter { public double NextUnit() => value; }

    private sealed class MutableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        private DateTimeOffset current = now;
        public override DateTimeOffset GetUtcNow() => current;
        public void Advance(TimeSpan duration) => current = current.Add(duration);
    }
}
