using System.Diagnostics.Metrics;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.SessionExecutions.Application;

namespace Myriale.Api.Features.SessionExecutions.Infrastructure;

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
        SessionExecutionKind.ScenarioTurn.ToContractValue(),
        SessionExecutionKind.Narrative.ToContractValue(),
        SessionExecutionKind.ModuleHandoff.ToContractValue(),
        SessionExecutionKind.NoteProposal.ToContractValue(),
        SessionExecutionKind.Image.ToContractValue(),
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
        var repository = scope.ServiceProvider.GetRequiredService<ISessionExecutionOperationsRepository>();
        var rows = await repository.ReadMetricsAsync(
            now,
            now.AddSeconds(-options.Value.StuckAfterSeconds),
            cancellationToken);
        var byKind = rows.ToDictionary(row => row.Kind.ToContractValue(), StringComparer.Ordinal);
        var samples = SessionExecutionMetricSnapshot.Kinds.Select(kind =>
        {
            if (!byKind.TryGetValue(kind, out var row)) return new SessionExecutionMetricSample(kind, 0, 0, 0, 0, 0);
            return new SessionExecutionMetricSample(
                kind,
                row.QueueDepth,
                row.Running,
                row.RetryWait,
                row.OldestQueuedAt is null ? 0 : Math.Max(0, (now - row.OldestQueuedAt.Value).TotalSeconds),
                row.Stuck);
        }).ToArray();

        snapshot.Update(samples);
        logger.LogDebug("Sampled session execution metrics. KindGroups={KindGroups}", rows.Count);
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
