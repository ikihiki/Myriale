using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class AiLeaseRecoveryWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<AiProviderOptions> options,
    ILogger<AiLeaseRecoveryWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(options.Value.LeaseRecoveryIntervalSeconds);
        using var timer = new PeriodicTimer(interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await RecoverAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "AI lease recovery failed.");
            }
        }
    }

    internal async Task RecoverAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTimeOffset.UtcNow;

        var expiredInputs = (await db.SessionPendingPlayerInputs
                .Where(input => input.IsRetryable && input.LeaseExpiresAt != null)
                .ToListAsync(cancellationToken))
            .Where(input => input.LeaseExpiresAt <= now)
            .ToList();
        foreach (var input in expiredInputs)
        {
            input.Status = "failed";
            input.ErrorCode = "lease_expired";
            input.ErrorMessage = "AI生成leaseの期限が切れました。再試行できます。";
            input.LeaseId = null;
            input.LeaseExpiresAt = null;
            input.UpdatedAt = now;
        }

        if (expiredInputs.Count == 0) return;
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Recovered {PendingInputCount} pending AI inputs.", expiredInputs.Count);
    }
}
