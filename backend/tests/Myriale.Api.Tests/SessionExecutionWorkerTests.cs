using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Myriale.Api.Features.SessionExecutions.Application;

namespace Myriale.Api.Tests;

public sealed class SessionExecutionWorkerTests
{
    [Fact]
    public async Task SelectsHandlerByClaimContextKind()
    {
        var repository = new FakeOperationsRepository();
        var selected = new FakeHandler(SessionExecutionKind.Narrative, _ => Task.FromResult(new SessionExecutionHandlerResult(true)));
        var ignored = new FakeHandler(SessionExecutionKind.Image, _ => throw new InvalidOperationException("wrong handler"));
        await using var provider = Provider(repository, new(), selected, ignored);
        var worker = Worker(provider, new());

        await worker.RunClaimAsync(repository.Claim, CancellationToken.None);

        Assert.Equal(1, selected.Calls);
        Assert.Equal(0, ignored.Calls);
        Assert.True(repository.FinalizeRequest!.Decision.Succeeded);
    }

    [Fact]
    public async Task HandlerExceptionBecomesRetryableFinalization()
    {
        var repository = new FakeOperationsRepository();
        var handler = new FakeHandler(SessionExecutionKind.Narrative, _ => throw new InvalidOperationException("boom"));
        await using var provider = Provider(repository, new(), handler);
        var worker = Worker(provider, new());

        await worker.RunClaimAsync(repository.Claim, CancellationToken.None);

        var result = repository.FinalizeRequest!.Decision;
        Assert.False(result.Succeeded);
        Assert.True(result.Retryable);
        Assert.Equal("execution_failed", result.ErrorCode);
        Assert.Equal("internal", result.ErrorCategory);
    }

    [Fact]
    public async Task HeartbeatLossCancelsHandlerAndFinalizesCancellationResult()
    {
        var repository = new FakeOperationsRepository { HeartbeatOutcome = SessionExecutionOperationOutcome.StaleClaim };
        var handler = new FakeHandler(SessionExecutionKind.Narrative, async cancellationToken =>
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            return new(true);
        });
        var settings = new SessionExecutionWorkerSettings { HeartbeatInterval = TimeSpan.Zero };
        await using var provider = Provider(repository, settings, handler);
        var worker = Worker(provider, settings);

        await worker.RunClaimAsync(repository.Claim, CancellationToken.None);

        Assert.True(repository.HeartbeatCalls > 0);
        var result = repository.FinalizeRequest!.Decision;
        Assert.Equal("execution_cancelled", result.ErrorCode);
        Assert.Equal("cancellation", result.ErrorCategory);
    }

    private static ServiceProvider Provider(
        FakeOperationsRepository repository,
        SessionExecutionWorkerSettings settings,
        params ISessionExecutionService[] handlers)
    {
        var services = new ServiceCollection();
        services.AddSingleton<ISessionExecutionOperationsRepository>(repository);
        services.AddSingleton(settings);
        foreach (var handler in handlers) services.AddSingleton(typeof(ISessionExecutionService), handler);
        return services.BuildServiceProvider();
    }

    private static SessionExecutionWorker Worker(ServiceProvider provider, SessionExecutionWorkerSettings settings) =>
        new(provider.GetRequiredService<IServiceScopeFactory>(), TimeProvider.System, settings, NullLogger<SessionExecutionWorker>.Instance);

    private sealed class FakeHandler(
        SessionExecutionKind kind,
        Func<CancellationToken, Task<SessionExecutionHandlerResult>> execute) : ISessionExecutionService
    {
        public string Kind { get; } = kind.ToString();
        public int Calls { get; private set; }

        public Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken)
        {
            Calls++;
            return execute(cancellationToken);
        }
    }

    private sealed class FakeOperationsRepository : ISessionExecutionOperationsRepository
    {
        public SessionExecutionClaim Claim { get; } = new(new SessionExecutionId("EXE-1"), "LET-1", 1, new SessionExecutionAttemptId("ATT-1"), 1);
        public SessionExecutionOperationOutcome HeartbeatOutcome { get; init; } = SessionExecutionOperationOutcome.Success;
        public int HeartbeatCalls { get; private set; }
        public SessionExecutionFinalizeRequest? FinalizeRequest { get; private set; }

        public Task<SessionExecutionClaimBatchResult> ClaimBatchAsync(string workerId, int maxBatchSize, TimeSpan leaseDuration, CancellationToken cancellationToken) =>
            Task.FromResult(SessionExecutionClaimBatchResult.Success([Claim]));

        public Task<SessionExecutionClaimContextResult> LoadClaimContextAsync(SessionExecutionClaim claim, CancellationToken cancellationToken) =>
            Task.FromResult(new SessionExecutionClaimContextResult(
                SessionExecutionOperationOutcome.Success,
                new(claim, new SessionId("SES-1"), SessionExecutionKind.Narrative, null)));

        public Task<SessionExecutionOperationOutcome> HeartbeatAsync(SessionExecutionClaim claim, TimeSpan leaseDuration, CancellationToken cancellationToken)
        {
            HeartbeatCalls++;
            return Task.FromResult(HeartbeatOutcome);
        }

        public Task<SessionExecutionFinalizeResult> FinalizeAsync(SessionExecutionFinalizeRequest request, CancellationToken cancellationToken)
        {
            FinalizeRequest = request;
            return Task.FromResult(new SessionExecutionFinalizeResult(
                SessionExecutionOperationOutcome.Success,
                SessionExecutionKind.Narrative,
                request.Decision.Succeeded ? SessionExecutionStatus.Succeeded : SessionExecutionStatus.Failed,
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow,
                null,
                request.Decision.ErrorCode));
        }

        public Task<IReadOnlyList<SessionExecutionOperationsMetric>> ReadMetricsAsync(DateTimeOffset now, DateTimeOffset stuckBefore, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<SessionExecutionOperationsMetric>>([]);
    }
}
