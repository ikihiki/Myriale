using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class RealProviderWarmupTests
{
    [Fact]
    public async Task RetriesTransientFailuresUntilProbeSucceeds()
    {
        var calls = 0;
        var delays = new List<TimeSpan>();
        var warmup = new RealProviderWarmup(
            _ => ++calls switch
            {
                1 => Task.FromException(new AiProviderException(AiProviderErrorCodes.Timeout, "timeout", true)),
                2 => Task.FromException(new AiProviderException(AiProviderErrorCodes.RateLimited, "rate limited", true)),
                _ => Task.CompletedTask,
            },
            (delay, _) =>
            {
                delays.Add(delay);
                return Task.CompletedTask;
            });

        var result = await warmup.RunAsync(3, TimeSpan.FromMinutes(10), TimeSpan.FromSeconds(15));

        Assert.True(result.Succeeded);
        Assert.Equal(3, calls);
        Assert.Equal([TimeSpan.FromSeconds(15), TimeSpan.FromSeconds(30)], delays);
        Assert.Equal(new string?[] { AiProviderErrorCodes.Timeout, AiProviderErrorCodes.RateLimited, null }, result.Attempts.Select(item => item.ErrorCode).ToArray());
    }

    [Fact]
    public async Task StopsImmediatelyForNonTransientFailure()
    {
        var calls = 0;
        var warmup = new RealProviderWarmup(_ =>
        {
            calls++;
            return Task.FromException(new AiProviderException(AiProviderErrorCodes.SchemaFailure, "invalid probe", false));
        });

        var result = await warmup.RunAsync(3, TimeSpan.FromMinutes(10), TimeSpan.Zero);

        Assert.False(result.Succeeded);
        Assert.Equal(1, calls);
        Assert.Single(result.Attempts);
        Assert.Equal(AiProviderErrorCodes.SchemaFailure, result.Attempts[0].ErrorCode);
    }

    [Fact]
    public async Task FailsAfterBoundedTransientAttempts()
    {
        var calls = 0;
        var warmup = new RealProviderWarmup(
            _ =>
            {
                calls++;
                return Task.FromException(new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "unavailable", true));
            },
            (_, _) => Task.CompletedTask);

        var result = await warmup.RunAsync(3, TimeSpan.FromMinutes(10), TimeSpan.Zero);

        Assert.False(result.Succeeded);
        Assert.Equal(3, calls);
        Assert.Equal(3, result.Attempts.Count);
        Assert.All(result.Attempts, attempt => Assert.Equal(AiProviderErrorCodes.ProviderUnavailable, attempt.ErrorCode));
    }
}
