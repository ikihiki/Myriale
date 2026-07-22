using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace Myriale.Api.Services;

public static class SessionExecutionTelemetry
{
    public const string SourceName = "Myriale.SessionExecution";
    public const string MeterName = "Myriale.SessionExecution";
    public static readonly ActivitySource ActivitySource = new(SourceName);
    public static readonly Meter Meter = new(MeterName);
    public static readonly Counter<long> Enqueued = Meter.CreateCounter<long>("myriale.session.execution.enqueued");
    public static readonly Counter<long> Started = Meter.CreateCounter<long>("myriale.session.execution.started");
    public static readonly Counter<long> Completed = Meter.CreateCounter<long>("myriale.session.execution.completed");
    public static readonly Counter<long> Failed = Meter.CreateCounter<long>("myriale.session.execution.failed");
    public static readonly Counter<long> Retried = Meter.CreateCounter<long>("myriale.session.execution.retried");
    public static readonly Counter<long> Cancelled = Meter.CreateCounter<long>("myriale.session.execution.cancelled");
    public static readonly Counter<long> Superseded = Meter.CreateCounter<long>("myriale.session.execution.superseded");
    public static readonly Counter<long> LeaseExpired = Meter.CreateCounter<long>("myriale.session.execution.lease_expired");
    public static readonly Counter<long> SessionAdvanced = Meter.CreateCounter<long>("myriale.session.execution.session_advanced");
    public static readonly Counter<long> InvalidSignal = Meter.CreateCounter<long>("myriale.ai.dialogue.invalid_signal");
    public static readonly Counter<long> ProviderRequests = Meter.CreateCounter<long>("myriale.ai.provider.requests");
    public static readonly Counter<long> ProviderRetries = Meter.CreateCounter<long>("myriale.ai.provider.retries");
    public static readonly Counter<long> ArtifactCommitted = Meter.CreateCounter<long>("myriale.session.artifact.committed");
    public static readonly Counter<long> TurnPublished = Meter.CreateCounter<long>("myriale.session.turn.published");
    public static readonly Histogram<double> QueueDuration = Meter.CreateHistogram<double>("myriale.session.execution.queue_duration", "s");
    public static readonly Histogram<double> Duration = Meter.CreateHistogram<double>("myriale.session.execution.duration", "s");
    public static readonly Histogram<double> AttemptDuration = Meter.CreateHistogram<double>("myriale.session.execution.attempt_duration", "s");
    public static readonly Histogram<double> RetryDelay = Meter.CreateHistogram<double>("myriale.session.execution.retry_delay", "s");
    public static readonly Histogram<double> ProviderDuration = Meter.CreateHistogram<double>("myriale.ai.provider.duration", "ms");
    public static readonly Histogram<long> ProviderInputTokens = Meter.CreateHistogram<long>("myriale.ai.provider.input_tokens");
    public static readonly Histogram<long> ProviderOutputTokens = Meter.CreateHistogram<long>("myriale.ai.provider.output_tokens");
    public static readonly Histogram<long> ArtifactSize = Meter.CreateHistogram<long>("myriale.artifact.size", "By");

    public static TagList Tags(string kind, string status, string? provider = null, string? model = null, string? errorCode = null)
    {
        var tags = new TagList { { "myriale.execution.kind", kind }, { "myriale.execution.status", status } };
        if (!string.IsNullOrWhiteSpace(provider)) tags.Add("ai.provider.name", provider);
        if (!string.IsNullOrWhiteSpace(model)) tags.Add("ai.model.name", model);
        if (!string.IsNullOrWhiteSpace(errorCode)) tags.Add("error.type", errorCode);
        return tags;
    }

    public static void RecordSessionAdvanced(string kind, string status) =>
        SessionAdvanced.Add(1, Tags(kind, status, errorCode: "session_advanced"));

    public static void RecordInvalidSignal(string kind, string status) =>
        InvalidSignal.Add(1, Tags(kind, status, errorCode: "invalid_signal"));

    public static TagList ProviderTags(string provider, string model, string status, string? errorCode = null)
    {
        var tags = new TagList
        {
            { "ai.provider.name", provider },
            { "ai.model.name", model },
            { "myriale.provider.status", status },
        };
        if (!string.IsNullOrWhiteSpace(errorCode)) tags.Add("error.type", errorCode);
        return tags;
    }
}
