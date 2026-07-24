using System.Diagnostics.Metrics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class SessionExecutionMetricsOptions
{
    public const string SectionName = "SessionExecutionMetrics";
    public int SampleIntervalSeconds { get; set; } = 15;
    public int StuckAfterSeconds { get; set; } = 600;
}

public sealed record SessionExecutionMetricSample(
    string Kind,
    long QueueDepth,
    long Running,
    long RetryWait,
    double OldestQueuedAgeSeconds,
    long Stuck);

public sealed class SessionExecutionMetricSnapshot
{
    private static readonly string[] KnownKinds =
    [
        SessionExecutionKinds.ScenarioTurn,
        SessionExecutionKinds.Narrative,
        SessionExecutionKinds.ModuleHandoff,
        SessionExecutionKinds.NoteProposal,
        SessionExecutionKinds.Image,
    ];

    private IReadOnlyList<SessionExecutionMetricSample> samples = EmptySamples();

    public IReadOnlyList<SessionExecutionMetricSample> Read() => Volatile.Read(ref samples);

    public void Update(IReadOnlyList<SessionExecutionMetricSample> value) =>
        Volatile.Write(ref samples, value);

    public static IReadOnlyList<SessionExecutionMetricSample> EmptySamples() =>
        KnownKinds.Select(kind => new SessionExecutionMetricSample(kind, 0, 0, 0, 0, 0)).ToArray();

    public static IReadOnlyList<string> Kinds => KnownKinds;
}

public sealed class SessionExecutionObservableMetrics
{
    public SessionExecutionObservableMetrics(SessionExecutionMetricSnapshot snapshot)
    {
        SessionExecutionTelemetry.Meter.CreateObservableGauge(
            "myriale.session.execution.queue_depth",
            () => Measurements(snapshot, sample => sample.QueueDepth),
            description: "Queued session executions awaiting a worker.");
        SessionExecutionTelemetry.Meter.CreateObservableGauge(
            "myriale.session.execution.running",
            () => Measurements(snapshot, sample => sample.Running),
            description: "Session executions currently running or cancelling.");
        SessionExecutionTelemetry.Meter.CreateObservableGauge(
            "myriale.session.execution.retry_wait",
            () => Measurements(snapshot, sample => sample.RetryWait),
            description: "Session executions waiting for a retry time.");
        SessionExecutionTelemetry.Meter.CreateObservableGauge(
            "myriale.session.execution.oldest_queued_age",
            () => Measurements(snapshot, sample => sample.OldestQueuedAgeSeconds),
            unit: "s",
            description: "Age of the oldest queued session execution.");
        SessionExecutionTelemetry.Meter.CreateObservableGauge(
            "myriale.session.execution.stuck",
            () => Measurements(snapshot, sample => sample.Stuck),
            description: "Running executions with an expired lease or over the configured age threshold.");
    }

    private static IEnumerable<Measurement<long>> Measurements(
        SessionExecutionMetricSnapshot snapshot,
        Func<SessionExecutionMetricSample, long> selector) =>
        snapshot.Read().Select(sample => new Measurement<long>(selector(sample), new KeyValuePair<string, object?>("myriale.execution.kind", sample.Kind)));

    private static IEnumerable<Measurement<double>> Measurements(
        SessionExecutionMetricSnapshot snapshot,
        Func<SessionExecutionMetricSample, double> selector) =>
        snapshot.Read().Select(sample => new Measurement<double>(selector(sample), new KeyValuePair<string, object?>("myriale.execution.kind", sample.Kind)));
}

public sealed class SessionExecutionMetricsSampler(
    IServiceScopeFactory scopeFactory,
    SessionExecutionMetricSnapshot snapshot,
    IOptions<SessionExecutionMetricsOptions> options,
    TimeProvider timeProvider,
    ILogger<SessionExecutionMetricsSampler> logger) : BackgroundService
{
    public async Task SampleOnceAsync(CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var active = await db.SessionExecutions.AsNoTracking()
            .Where(execution => execution.Status == SessionExecutionStatuses.Queued
                || execution.Status == SessionExecutionStatuses.Running
                || execution.Status == SessionExecutionStatuses.RetryWait
                || execution.Status == SessionExecutionStatuses.CancelRequested)
            .Select(execution => new
            {
                execution.Kind,
                execution.Status,
                execution.QueuedAt,
                execution.StartedAt,
                execution.LeaseExpiresAt,
            })
            .ToListAsync(cancellationToken);

        var stuckBefore = now.AddSeconds(-options.Value.StuckAfterSeconds);
        var samples = SessionExecutionMetricSnapshot.Kinds.Select(kind =>
        {
            var rows = active.Where(execution => execution.Kind == kind).ToArray();
            var queued = rows.Where(execution => execution.Status == SessionExecutionStatuses.Queued).ToArray();
            return new SessionExecutionMetricSample(
                kind,
                queued.LongLength,
                rows.LongCount(execution => execution.Status is SessionExecutionStatuses.Running or SessionExecutionStatuses.CancelRequested),
                rows.LongCount(execution => execution.Status == SessionExecutionStatuses.RetryWait),
                queued.Length == 0 ? 0 : Math.Max(0, (now - queued.Min(execution => execution.QueuedAt)).TotalSeconds),
                rows.LongCount(execution => execution.Status is SessionExecutionStatuses.Running or SessionExecutionStatuses.CancelRequested
                    && ((execution.LeaseExpiresAt is not null && execution.LeaseExpiresAt < now)
                        || (execution.StartedAt is not null && execution.StartedAt < stuckBefore))));
        }).ToArray();

        snapshot.Update(samples);
        logger.LogDebug("Sampled session execution metrics. ActiveExecutions={ActiveExecutions}", active.Count);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(options.Value.SampleIntervalSeconds);
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await SampleOnceAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogWarning(exception, "Session execution metric sampling failed."); }
            await Task.Delay(interval, timeProvider, stoppingToken);
        }
    }
}
