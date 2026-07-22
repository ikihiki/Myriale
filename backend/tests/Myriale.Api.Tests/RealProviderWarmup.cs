using System.Diagnostics;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

internal sealed class RealProviderWarmup(
    Func<CancellationToken, Task> generateProbe,
    Func<TimeSpan, CancellationToken, Task>? delay = null)
{
    private static readonly HashSet<string> RetryableErrorCodes =
    [
        AiProviderErrorCodes.Timeout,
        AiProviderErrorCodes.ProviderUnavailable,
        AiProviderErrorCodes.RateLimited,
    ];

    private readonly Func<TimeSpan, CancellationToken, Task> delay = delay ?? Task.Delay;

    public async Task<RealProviderWarmupResult> RunAsync(
        int maxAttempts,
        TimeSpan attemptTimeout,
        TimeSpan initialBackoff,
        CancellationToken cancellationToken = default)
    {
        var total = Stopwatch.StartNew();
        var attempts = new List<RealProviderWarmupAttempt>();

        for (var attempt = 1; attempt <= Math.Max(1, maxAttempts); attempt++)
        {
            var attemptStopwatch = Stopwatch.StartNew();
            string? errorCode = null;
            var retryable = false;
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(attemptTimeout);

            try
            {
                await generateProbe(timeout.Token);
                attemptStopwatch.Stop();
                attempts.Add(new(attempt, attemptStopwatch.ElapsedMilliseconds, null));
                total.Stop();
                return new(true, total.ElapsedMilliseconds, attempts);
            }
            catch (AiProviderException exception)
            {
                errorCode = exception.Code;
                retryable = RetryableErrorCodes.Contains(exception.Code);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                errorCode = AiProviderErrorCodes.Timeout;
                retryable = true;
            }
            catch when (!cancellationToken.IsCancellationRequested)
            {
                errorCode = AiProviderErrorCodes.ProviderUnavailable;
            }

            attemptStopwatch.Stop();
            attempts.Add(new(attempt, attemptStopwatch.ElapsedMilliseconds, errorCode));
            if (!retryable || attempt == Math.Max(1, maxAttempts)) break;

            var multiplier = Math.Pow(2, attempt - 1);
            await delay(TimeSpan.FromMilliseconds(initialBackoff.TotalMilliseconds * multiplier), cancellationToken);
        }

        total.Stop();
        return new(false, total.ElapsedMilliseconds, attempts);
    }
}

internal sealed record RealProviderWarmupAttempt(int Attempt, long DurationMilliseconds, string? ErrorCode);
internal sealed record RealProviderWarmupResult(
    bool Succeeded,
    long DurationMilliseconds,
    IReadOnlyList<RealProviderWarmupAttempt> Attempts);
