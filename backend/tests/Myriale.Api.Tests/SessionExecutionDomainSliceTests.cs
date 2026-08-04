using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using Myriale.Api.Application.SessionExecutions;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Infrastructure.SessionExecutions;

namespace Myriale.Api.Tests;

public sealed class SessionExecutionDomainSliceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CoreDiscriminatorsAreEnumsAndLifecycleSettersAreNotPublic()
    {
        Assert.True(typeof(SessionExecutionKind).IsEnum);
        Assert.True(typeof(SessionExecutionStatus).IsEnum);
        Assert.True(typeof(SessionExecutionTriggerType).IsEnum);
        Assert.True(typeof(SessionExecutionPublishPolicy).IsEnum);
        Assert.False(typeof(SessionExecution).GetProperty(nameof(SessionExecution.Status))!.SetMethod!.IsPublic);
        Assert.False(typeof(SessionExecution).GetProperty(nameof(SessionExecution.Revision))!.SetMethod!.IsPublic);
        Assert.False(typeof(SessionExecution).GetProperty(nameof(SessionExecution.CancelRequestedAt))!.SetMethod!.IsPublic);
        Assert.False(typeof(SessionExecution).GetProperty(nameof(SessionExecution.DismissedAt))!.SetMethod!.IsPublic);
    }

    [Fact]
    public void AggregateOwnsRetryCancellationAndDismissBehavior()
    {
        var failed = Execution(SessionExecutionStatus.Failed);
        failed.Revision = 7;
        failed.CompletedAt = Now.AddMinutes(-1);
        failed.Dismiss(Now.AddMinutes(-2));

        failed.Retry(Now);

        Assert.Equal(SessionExecutionStatus.Queued, failed.Status);
        Assert.Equal(9, failed.Revision);
        Assert.Null(failed.CompletedAt);
        Assert.Null(failed.DismissedAt);

        var queued = Execution(SessionExecutionStatus.Queued);
        queued.LeaseOwner = "stale";
        queued.LeaseToken = "LET-STALE";
        queued.LeaseExpiresAt = Now.AddMinutes(1);
        queued.RequestCancellation(Now);
        Assert.Equal(SessionExecutionStatus.Cancelled, queued.Status);
        Assert.Equal(2, queued.Revision);
        Assert.Equal(Now, queued.CancelRequestedAt);
        Assert.Equal(Now, queued.CompletedAt);
        Assert.Null(queued.LeaseToken);
        queued.Dismiss(Now.AddSeconds(1));
        Assert.Equal(Now.AddSeconds(1), queued.DismissedAt);
    }

    [Fact]
    public void EndpointLayerDoesNotDependOnApplicationDbContext()
    {
        var endpointMethods = typeof(SessionExecutionEndpoints).GetMethods(
            System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic);
        Assert.DoesNotContain(endpointMethods.SelectMany(method => method.GetParameters()), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
    }

    [Fact]
    public async Task EndpointMapsRevisionConflictOutcomeToHttp409()
    {
        var executeMethod = typeof(SessionExecutionEndpoints).GetMethod(
            "ExecuteAsync",
            System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.NonPublic)!;
        var identity = new System.Security.Claims.ClaimsIdentity(
            [new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "USR-1")],
            "test");
        Func<string, Task<SessionExecutionUseCaseResult>> command = _ => Task.FromResult(
            new SessionExecutionUseCaseResult(SessionExecutionUseCaseOutcome.Conflict));
        var task = (Task<IResult>)executeMethod.Invoke(null, [new System.Security.Claims.ClaimsPrincipal(identity), command])!;
        var result = await task;

        Assert.Equal(StatusCodes.Status409Conflict, Assert.IsAssignableFrom<IStatusCodeHttpResult>(result).StatusCode);
    }

    [Fact]
    public async Task EfConversionKeepsExistingLowercaseAndKebabCaseValues()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        await SeedOwnerGraphAsync(db);
        db.SessionExecutions.Add(new SessionExecution
        {
            Id = "EXE-WIRE", SessionId = "SES-1", Kind = SessionExecutionKind.ScenarioTurn,
            TriggerType = SessionExecutionTriggerType.PlayerInput, TriggerId = "INP-1",
            Status = SessionExecutionStatus.RetryWait, IdempotencyKey = "wire", PayloadHash = new string('a', 64),
            PublishPolicy = SessionExecutionPublishPolicy.Optional, CreatedAt = Now, QueuedAt = Now,
        });
        await db.SaveChangesAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT \"Kind\", \"TriggerType\", \"Status\", \"PublishPolicy\" FROM \"SessionExecutions\" WHERE \"Id\" = 'EXE-WIRE'";
        await using var reader = await command.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync());
        Assert.Equal("scenario-turn", reader.GetString(0));
        Assert.Equal("player-input", reader.GetString(1));
        Assert.Equal("retry-wait", reader.GetString(2));
        Assert.Equal("optional", reader.GetString(3));
    }

    [Fact]
    public async Task CancelCommandKeepsRunningLeaseAndImmediatelyClearsQueuedLease()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDb(connection);
        await db.Database.EnsureCreatedAsync();
        await SeedOwnerGraphAsync(db);
        var running = Execution(SessionExecutionStatus.Running, "EXE-RUN");
        running.LeaseOwner = "worker"; running.LeaseToken = "LET-RUN"; running.LeaseExpiresAt = Now.AddMinutes(2); running.Revision = 3;
        var queued = Execution(SessionExecutionStatus.Queued, "EXE-QUEUED");
        queued.LeaseOwner = "stale"; queued.LeaseToken = "LET-QUEUED"; queued.LeaseExpiresAt = Now.AddMinutes(2);
        db.SessionExecutions.AddRange(running, queued);
        await db.SaveChangesAsync();
        var repository = new EfSessionExecutionRepository(db);
        var command = new CancelSessionExecutionCommand(repository, new TestEnvironment(), new FixedTimeProvider(Now));

        Assert.Equal(SessionExecutionUseCaseOutcome.Success, (await command.ExecuteAsync(running.Id, "USR-1", CancellationToken.None)).Outcome);
        Assert.Equal(SessionExecutionUseCaseOutcome.Success, (await command.ExecuteAsync(queued.Id, "USR-1", CancellationToken.None)).Outcome);
        db.ChangeTracker.Clear();
        running = await db.SessionExecutions.SingleAsync(item => item.Id == "EXE-RUN");
        queued = await db.SessionExecutions.SingleAsync(item => item.Id == "EXE-QUEUED");
        Assert.Equal(SessionExecutionStatus.CancelRequested, running.Status);
        Assert.Equal("LET-RUN", running.LeaseToken);
        Assert.Equal(SessionExecutionStatus.Cancelled, queued.Status);
        Assert.Null(queued.LeaseToken);
    }

    private static SessionExecution Execution(SessionExecutionStatus status, string id = "EXE-1") => new()
    {
        Id = id, SessionId = "SES-1", Kind = SessionExecutionKind.Narrative,
        TriggerType = SessionExecutionTriggerType.PlayerInput, TriggerId = $"INP-{id}", Status = status,
        IdempotencyKey = id, PayloadHash = new string('a', 64), CreatedAt = Now, QueuedAt = Now,
    };

    private static ApplicationDbContext CreateDb(SqliteConnection connection) =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite(connection).Options);

    private static async Task SeedOwnerGraphAsync(ApplicationDbContext db)
    {
        var user = ApplicationUser.Create("user", "user@test");
        user.Id = "USR-1";
        db.Users.Add(user);
        db.Scenarios.Add(new Scenario { Id = "SCN-1", Title = "Execution slice", AuthorId = "USR-1", CreatedAt = Now, UpdatedAt = Now });
        db.Sessions.Add(new Session { Id = "SES-1", OwnerId = "USR-1", ScenarioId = "SCN-1", SelectedHero = "Hero", Status = SessionStatus.Active, CreatedAt = Now, UpdatedAt = Now });
        await db.SaveChangesAsync();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
    private sealed class TestEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
