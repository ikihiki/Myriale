using System.Text.Json;

namespace Myriale.Api.Features.Evaluations.Infrastructure.Hosting;

public sealed class EvaluationWorkerSettings
{
    public bool Enabled { get; set; } = true;
    public int ClaimBatchSize { get; set; } = 4;
    public int LeaseSeconds { get; set; } = 120;
    public int IdleDelayMilliseconds { get; set; } = 100;
}

public sealed class EvaluationExecutionWorker(
    IServiceScopeFactory scopes,
    EvaluationWorkerSettings settings,
    TimeProvider timeProvider,
    ILogger<EvaluationExecutionWorker> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly string workerId = $"evaluation-{Environment.MachineName}-{Guid.NewGuid():N}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!settings.Enabled) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                IReadOnlyList<EvaluationClaim> claims;
                await using (var scope = scopes.CreateAsyncScope())
                {
                    claims = await scope.ServiceProvider.GetRequiredService<EvaluationSessionService>().ClaimBatchAsync(
                        workerId,
                        Math.Clamp(settings.ClaimBatchSize, 1, 32),
                        LeaseDuration,
                        stoppingToken);
                }
                if (claims.Count == 0)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(Math.Max(10, settings.IdleDelayMilliseconds)), timeProvider, stoppingToken);
                    continue;
                }
                await Task.WhenAll(claims.Select(x => RunAsync(x, stoppingToken)));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Evaluation execution worker loop failed.");
                await Task.Delay(TimeSpan.FromSeconds(1), timeProvider, stoppingToken);
            }
        }
    }

    internal async Task RunAsync(EvaluationClaim claim, CancellationToken stoppingToken)
    {
        await using var scope = scopes.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<EvaluationSessionService>();
        var ai = scope.ServiceProvider.GetRequiredService<IScenarioTurnAiService>();
        var judge = scope.ServiceProvider.GetRequiredService<IEvaluationMachineJudge>();
        var overrides = JsonSerializer.Deserialize<AiGenerationOverrides>(claim.Candidate.GenerationOverridesJson, Json);
        overrides = overrides is null ? new(RetryAttempts: 0) : overrides with { RetryAttempts = 0 };

        switch (claim.Stage)
        {
            case EvaluationStage.Action:
                await RunProviderCallAsync(
                    claim,
                    ct => ai.DecideActionForProfileWithOverridesAsync(
                        claim.Candidate.ProfileId,
                        Deserialize<ModelActionDecisionRequest>(claim.RequestJson),
                        overrides,
                        ct),
                    (generation, ct) => service.CompleteSuccessAsync(claim, generation, judge, ct),
                    (generation, ct) => service.AuditLeaseLostAsync(claim, generation, ct),
                    service,
                    stoppingToken);
                break;
            case EvaluationStage.Narrative:
                await RunProviderCallAsync(
                    claim,
                    ct => ai.GeneratePostStateNarrativeForProfileWithOverridesAsync(
                        claim.Candidate.ProfileId,
                        Deserialize<PostStateNarrativeRequest>(claim.RequestJson),
                        overrides,
                        ct),
                    (generation, ct) => service.CompleteSuccessAsync(claim, generation, judge, ct),
                    (generation, ct) => service.AuditLeaseLostAsync(claim, generation, ct),
                    service,
                    stoppingToken);
                break;
            case EvaluationStage.EntityState:
                await RunProviderCallAsync(
                    claim,
                    ct => ai.GenerateEntityStateTransitionForProfileWithOverridesAsync(
                        claim.Candidate.ProfileId,
                        Deserialize<EntityStateTransitionRequest>(claim.RequestJson),
                        overrides,
                        ct),
                    (generation, ct) => service.CompleteSuccessAsync(claim, generation, judge, ct),
                    (generation, ct) => service.AuditLeaseLostAsync(claim, generation, ct),
                    service,
                    stoppingToken);
                break;
        }
    }

    private async Task RunProviderCallAsync<T>(
        EvaluationClaim claim,
        Func<CancellationToken, Task<NarrativeGeneration<T>>> invoke,
        Func<NarrativeGeneration<T>, CancellationToken, Task<bool>> completeSuccess,
        Func<NarrativeGeneration<T>, CancellationToken, Task> auditLeaseLost,
        EvaluationSessionService service,
        CancellationToken stoppingToken)
    {
        using var heartbeatStop = new CancellationTokenSource();
        using var providerCancellation = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
        var heartbeatTask = MaintainLeaseAsync(claim, providerCancellation, heartbeatStop.Token);
        NarrativeGeneration<T>? generation = null;
        Exception? failure = null;
        try
        {
            generation = await invoke(providerCancellation.Token);
        }
        catch (Exception ex)
        {
            failure = ex;
        }

        var finalFence = await TryHeartbeatAsync(claim, CancellationToken.None);
        heartbeatStop.Cancel();
        var heartbeatFence = await heartbeatTask;
        var ownsLease = finalFence == true && heartbeatFence != false;

        if (generation is not null)
        {
            if (ownsLease) await completeSuccess(generation, CancellationToken.None);
            else await auditLeaseLost(generation, CancellationToken.None);
            return;
        }

        failure ??= new OperationCanceledException("Evaluation provider call was cancelled before returning an outcome.", providerCancellation.Token);
        if (ownsLease) await service.CompleteFailureAsync(claim, failure, CancellationToken.None);
        else await service.AuditLeaseLostAsync(claim, failure, CancellationToken.None);
    }

    private async Task<bool?> MaintainLeaseAsync(
        EvaluationClaim claim,
        CancellationTokenSource providerCancellation,
        CancellationToken stopToken)
    {
        while (!stopToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(HeartbeatInterval, timeProvider, stopToken);
            }
            catch (OperationCanceledException) when (stopToken.IsCancellationRequested)
            {
                return null;
            }

            var heartbeat = await TryHeartbeatAsync(claim, stopToken);
            if (heartbeat == true) continue;
            providerCancellation.Cancel();
            return heartbeat;
        }
        return null;
    }

    private async Task<bool?> TryHeartbeatAsync(EvaluationClaim claim, CancellationToken ct)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            return await scope.ServiceProvider.GetRequiredService<EvaluationSessionService>()
                .HeartbeatAsync(claim, LeaseDuration, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Evaluation lease heartbeat failed for attempt {AttemptId}; cancelling the provider call.", claim.AttemptId);
            return null;
        }
    }

    private TimeSpan LeaseDuration => TimeSpan.FromSeconds(Math.Max(1, settings.LeaseSeconds));
    private TimeSpan HeartbeatInterval => TimeSpan.FromMilliseconds(
        Math.Clamp(LeaseDuration.TotalMilliseconds / 3, 50, 30_000));
    private static T Deserialize<T>(string json) => JsonSerializer.Deserialize<T>(json, Json)
        ?? throw new JsonException("Frozen evaluation request was empty.");
}
