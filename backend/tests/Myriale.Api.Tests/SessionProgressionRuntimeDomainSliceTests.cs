using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Myriale.Api.Application.ProgressionRuntime;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Infrastructure.ProgressionRuntime;
using Myriale.Api.Application.ModuleExecutions;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionProgressionRuntimeDomainSliceTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 8, 4, 12, 0, 0, TimeSpan.Zero);
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-progression-{Guid.NewGuid():N}.db");

    [Theory]
    [InlineData(ProgressionReceiptStatus.Pending, "pending")]
    [InlineData(ProgressionReceiptStatus.WaitingConfiguration, "waiting-configuration")]
    [InlineData(ProgressionReceiptStatus.Completed, "completed")]
    [InlineData(ProgressionReceiptStatus.Failed, "failed")]
    public void StatusWireValuesRemainStable(ProgressionReceiptStatus status, string wireValue)
    {
        Assert.Equal(wireValue, status.ToWireValue());
        Assert.Equal(status, ProgressionReceiptStatusValues.Parse(wireValue));
    }

    [Fact]
    public void ReceiptLifecycleIsAggregateOwnedAndLeaseFenced()
    {
        var receipt = CreateReceipt();

        Assert.True(receipt.Claim("lease-a", Now.AddMinutes(2), Now));
        Assert.False(receipt.Complete("lease-stale", "TRN-1", Now.AddSeconds(1)));
        Assert.True(receipt.Fail("lease-a", "temporary", "retry", true, Now.AddSeconds(1)));
        Assert.True(receipt.IsRetryable);
        Assert.True(receipt.Claim("lease-b", Now.AddMinutes(3), Now.AddSeconds(2)));
        Assert.True(receipt.Release("lease-b", Now.AddSeconds(3)));
        Assert.True(receipt.Claim("lease-c", Now.AddMinutes(4), Now.AddSeconds(4)));
        Assert.True(receipt.Complete("lease-c", "TRN-1", Now.AddSeconds(5)));
        Assert.Equal(ProgressionReceiptStatus.Completed, receipt.Status);
        Assert.False(receipt.IsRetryable);
        Assert.Equal(6, receipt.Revision);
    }

    [Fact]
    public void MissingSnapshotIsTerminal()
    {
        var receipt = SessionProgressionTransitionReceipt.Create(
            "PTR-1", "SES-1", "NSG-1", "TRA-1", "NODE-1", "NODE-2", null, Now);

        Assert.Equal(ProgressionReceiptStatus.WaitingConfiguration, receipt.Status);
        Assert.False(receipt.IsRetryable);
        Assert.Equal(SessionProgressionTransitionReceipt.MissingSnapshotErrorCode, receipt.ErrorCode);
        Assert.False(receipt.Claim("lease", Now.AddMinutes(2), Now));
    }

    [Fact]
    public void IdentityRevisionAndLifecycleSettersAreNotPublic()
    {
        var names = new[] { "Id", "SessionId", "SourceSignalId", "TransitionId", "FromNodeId", "ToNodeId", "Status", "Revision", "LeaseId", "LeaseExpiresAt", "IsRetryable", "CreatedAt", "UpdatedAt", "CompletedAt" };
        var properties = typeof(SessionProgressionTransitionReceipt).GetProperties().ToDictionary(property => property.Name);
        Assert.All(names, name => Assert.False(properties[name].SetMethod?.IsPublic ?? false, name));
    }

    [Fact]
    public void CompatibilityServiceWasRemovedAndCommandOwnsTheBoundary()
    {
        var assembly = typeof(EnsureProgressionReceiptCommand).Assembly;
        Assert.Null(assembly.GetType("Myriale.Api.Services.SessionScenarioProgressionService"));
        Assert.Contains(typeof(IProgressionReceiptCommand), typeof(EnsureProgressionReceiptCommand).GetInterfaces());
    }

    [Fact]
    public async Task AtomicClaimHasSingleWinnerAndPreservesWireValue()
    {
        await SeedAsync(CreateReceipt());
        await using var firstDb = CreateDb();
        await using var secondDb = CreateDb();
        var first = new EfProgressionReceiptRepository(firstDb);
        var second = new EfProgressionReceiptRepository(secondDb);

        var claims = await Task.WhenAll(
            first.TryClaimOwnedAsync("owner", "PTR-1", "lease-a", Now, Now.AddMinutes(2), default),
            second.TryClaimOwnedAsync("owner", "PTR-1", "lease-b", Now, Now.AddMinutes(2), default));

        var winner = Assert.Single(claims, claim => claim is not null)!;
        await using var verification = CreateDb();
        var stored = await verification.SessionProgressionTransitionReceipts.AsNoTracking().SingleAsync();
        Assert.Equal(winner.LeaseId, stored.LeaseId);
        Assert.Equal(1, stored.AttemptCount);
        Assert.Equal(1, stored.Revision);
        await verification.Database.OpenConnectionAsync();
        await using var command = verification.Database.GetDbConnection().CreateCommand();
        command.CommandText = "SELECT Status FROM SessionProgressionTransitionReceipts WHERE Id = 'PTR-1'";
        Assert.Equal("pending", await command.ExecuteScalarAsync());
    }

    [Fact]
    public async Task StaleLeaseCannotCompleteAfterReleaseAndReclaim()
    {
        await SeedAsync(CreateReceipt());
        await using var db = CreateDb();
        var repository = new EfProgressionReceiptRepository(db);
        var first = Assert.IsType<ClaimedProgressionReceipt>(await repository.TryClaimOwnedAsync("owner", "PTR-1", "lease-a", Now, Now.AddMinutes(2), default));
        Assert.True(await repository.ReleaseAsync(first.Id, first.LeaseId, first.Revision, Now.AddSeconds(1), default));
        var second = Assert.IsType<ClaimedProgressionReceipt>(await repository.TryClaimOwnedAsync("owner", "PTR-1", "lease-b", Now.AddSeconds(2), Now.AddMinutes(2), default));

        Assert.False(await repository.CompleteAsync(first.Id, first.LeaseId, first.Revision, "TRN-STALE", Now.AddSeconds(3), default));
        Assert.True(await repository.CompleteAsync(second.Id, second.LeaseId, second.Revision, "TRN-WINNER", Now.AddSeconds(4), default));
        db.ChangeTracker.Clear();
        var stored = await db.SessionProgressionTransitionReceipts.SingleAsync();
        Assert.Equal("TRN-WINNER", stored.ModuleTurnId);
        Assert.Equal(ProgressionReceiptStatus.Completed, stored.Status);
    }

    [Fact]
    public async Task RepositoryMarksIncompleteLegacySnapshotTerminal()
    {
        var incomplete = new ProgressionModuleSnapshot("module", "1.0.0", "short", "{}", "{}", 0);
        await SeedAsync(SessionProgressionTransitionReceipt.Create(
            "PTR-1", "SES-1", "NSG-1", "TRA-1", "NODE-1", "NODE-2", incomplete, Now));
        await using (var legacyDb = CreateDb())
            await legacyDb.Database.ExecuteSqlRawAsync("UPDATE SessionProgressionTransitionReceipts SET Status = 'pending', IsRetryable = 1, ErrorCode = NULL, ErrorMessage = NULL, Revision = 0");
        await using var db = CreateDb();
        var repository = new EfProgressionReceiptRepository(db);

        Assert.Null(await repository.TryClaimOwnedAsync("owner", "PTR-1", "lease", Now, Now.AddMinutes(2), default));
        var stored = await db.SessionProgressionTransitionReceipts.AsNoTracking().SingleAsync();
        Assert.Equal(ProgressionReceiptStatus.WaitingConfiguration, stored.Status);
        Assert.False(stored.IsRetryable);
        Assert.Equal(SessionProgressionTransitionReceipt.MissingSnapshotErrorCode, stored.ErrorCode);
    }

    [Fact]
    public async Task InvalidStoredJsonMapsToNonRetryableSnapshotFailure()
    {
        var repository = new RecordingRepository
        {
            Snapshot = new("module", "1.0.0", new string('a', 64), "not-json", "{}", 0),
        };
        var command = Command(repository, new StubExecutions((_, _, _, _) => throw new InvalidOperationException("Module execution must not be called.")));

        await command.ExecuteAsync("owner", "PTR-1", default);

        Assert.Equal(1, repository.FailCalls);
        Assert.False(repository.LastRetryable);
        Assert.Equal("module_snapshot_invalid", repository.LastErrorCode);
    }

    [Fact]
    public async Task CancellationReleasesClaim()
    {
        var repository = new RecordingRepository();
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        var command = Command(repository, new StubExecutions((_, _, _, token) => Task.FromCanceled<ModuleExecutionResult>(token)));

        await Assert.ThrowsAsync<TaskCanceledException>(() => command.ExecuteAsync("owner", "PTR-1", cancellation.Token));
        Assert.Equal(1, repository.ReleaseCalls);
        Assert.Equal(0, repository.FailCalls);
    }

    [Theory]
    [InlineData(ModuleExecutionOutcome.Unavailable, "package_unavailable", true)]
    [InlineData(ModuleExecutionOutcome.InvalidRequest, "invalid_configuration", false)]
    public async Task ModuleErrorsMapRetryability(ModuleExecutionOutcome outcome, string code, bool retryable)
    {
        var repository = new RecordingRepository();
        var result = new ModuleExecutionResult(outcome, Error: new ModuleExecutionErrorResponse(code, "error"));
        var command = Command(repository, new StubExecutions((_, _, _, _) => Task.FromResult(result)));

        await command.ExecuteAsync("owner", "PTR-1", default);

        Assert.Equal(1, repository.FailCalls);
        Assert.Equal(retryable, repository.LastRetryable);
        Assert.Equal(code, repository.LastErrorCode);
    }

    private static EnsureProgressionReceiptCommand Command(RecordingRepository repository, IModuleExecutionWorkflow executions) =>
        new(repository, new InitializeSessionTurnModuleExecutionCommand(executions), new FixedTimeProvider(Now), NullLogger<EnsureProgressionReceiptCommand>.Instance);

    private async Task SeedAsync(SessionProgressionTransitionReceipt receipt)
    {
        await using var db = CreateDb();
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
        await db.Database.OpenConnectionAsync();
        await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
        db.Sessions.Add(new Session
        {
            Id = "SES-1", OwnerId = "owner", ScenarioId = "SCN-1", SelectedHero = "hero",
            Status = SessionStatus.Active, CreatedAt = Now, UpdatedAt = Now,
        });
        db.SessionProgressionTransitionReceipts.Add(receipt);
        await db.SaveChangesAsync();
    }

    private ApplicationDbContext CreateDb() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseSqlite($"Data Source={dbPath};Default Timeout=10").Options);

    private static SessionProgressionTransitionReceipt CreateReceipt() => SessionProgressionTransitionReceipt.Create(
        "PTR-1", "SES-1", "NSG-1", "TRA-1", "NODE-1", "NODE-2",
        new ProgressionModuleSnapshot("module", "1.0.0", new string('a', 64), "{}", "{}", 0), Now);

    public void Dispose()
    {
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class RecordingRepository : IProgressionReceiptRepository
    {
        public int ReleaseCalls { get; private set; }
        public int FailCalls { get; private set; }
        public bool LastRetryable { get; private set; }
        public string? LastErrorCode { get; private set; }
        public ProgressionModuleSnapshot Snapshot { get; init; } =
            new("module", "1.0.0", new string('a', 64), "{}", "{}", 0);

        public Task<IReadOnlyList<string>> ListOwnedIdsForNarrativeTurnAsync(string ownerId, string narrativeTurnId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<string>>(["PTR-1"]);

        public Task<ClaimedProgressionReceipt?> TryClaimOwnedAsync(string ownerId, string receiptId, string leaseId, DateTimeOffset now, DateTimeOffset leaseExpiresAt, CancellationToken cancellationToken) =>
            Task.FromResult<ClaimedProgressionReceipt?>(new(receiptId, "SES-1", leaseId, 1, Snapshot));

        public Task<bool> CompleteAsync(string receiptId, string leaseId, long revision, string moduleTurnId, DateTimeOffset now, CancellationToken cancellationToken) => Task.FromResult(true);

        public Task<bool> FailAsync(string receiptId, string leaseId, long revision, string code, string message, bool retryable, DateTimeOffset now, CancellationToken cancellationToken)
        {
            FailCalls++;
            LastRetryable = retryable;
            LastErrorCode = code;
            return Task.FromResult(true);
        }

        public Task<bool> ReleaseAsync(string receiptId, string leaseId, long revision, DateTimeOffset now, CancellationToken cancellationToken)
        {
            ReleaseCalls++;
            return Task.FromResult(true);
        }
    }

    private sealed class StubExecutions(
        Func<string, string, InitializeModuleExecutionRequest, CancellationToken, Task<ModuleExecutionResult>> initialize) : IModuleExecutionWorkflow
    {
        public Task<ModuleExecutionResult> InitializeSessionTurnAsync(string ownerId, string sessionId, InitializeModuleExecutionRequest request, SessionTurnInitializationPolicy policy, CancellationToken cancellationToken) => initialize(ownerId, sessionId, request, cancellationToken);
        public Task<ModuleExecutionResult> InitializeDetachedAsync(string ownerId, InitializeModuleExecutionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<ModuleExecutionResult> DispatchAsync(string ownerId, string executionId, DispatchModuleExecutionRequest request, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
