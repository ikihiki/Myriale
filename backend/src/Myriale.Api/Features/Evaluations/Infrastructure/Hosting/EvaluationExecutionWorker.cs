using System.Text.Json;

namespace Myriale.Api.Features.Evaluations.Infrastructure.Hosting;

public sealed class EvaluationWorkerSettings
{
    public bool Enabled { get; set; } = true;
    public int ClaimBatchSize { get; set; } = 4;
    public int LeaseSeconds { get; set; } = 120;
    public int IdleDelayMilliseconds { get; set; } = 100;
}

public sealed class EvaluationExecutionWorker(IServiceScopeFactory scopes, EvaluationWorkerSettings settings, TimeProvider timeProvider, ILogger<EvaluationExecutionWorker> logger) : BackgroundService
{
    private readonly string workerId = $"evaluation-{Environment.MachineName}-{Guid.NewGuid():N}";
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!settings.Enabled) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var claims = new List<EvaluationClaim>();
                for (var i = 0; i < Math.Clamp(settings.ClaimBatchSize, 1, 32); i++) { await using var scope = scopes.CreateAsyncScope(); var claim = await scope.ServiceProvider.GetRequiredService<EvaluationSessionService>().ClaimAsync(workerId, TimeSpan.FromSeconds(settings.LeaseSeconds), stoppingToken); if (claim is null) break; claims.Add(claim); }
                if (claims.Count == 0) { await Task.Delay(TimeSpan.FromMilliseconds(settings.IdleDelayMilliseconds), timeProvider, stoppingToken); continue; }
                await Task.WhenAll(claims.Select(x => RunAsync(x, stoppingToken)));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex) { logger.LogError(ex, "Evaluation execution worker loop failed."); await Task.Delay(TimeSpan.FromSeconds(1), timeProvider, stoppingToken); }
        }
    }
    internal async Task RunAsync(EvaluationClaim claim, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope(); var service = scope.ServiceProvider.GetRequiredService<EvaluationSessionService>(); var ai = scope.ServiceProvider.GetRequiredService<IScenarioTurnAiService>(); var judge = scope.ServiceProvider.GetRequiredService<IEvaluationMachineJudge>();
        try
        {
            var overrides = JsonSerializer.Deserialize<AiGenerationOverrides>(claim.Candidate.GenerationOverridesJson, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            overrides = overrides is null ? new(RetryAttempts: 0) : overrides with { RetryAttempts = 0 };
            switch (claim.Stage)
            {
                case EvaluationStage.Action: await service.CompleteSuccessAsync(claim, await ai.DecideActionForProfileWithOverridesAsync(claim.Candidate.ProfileId, Deserialize<ModelActionDecisionRequest>(claim.RequestJson), overrides, ct), judge, ct); break;
                case EvaluationStage.Narrative: await service.CompleteSuccessAsync(claim, await ai.GeneratePostStateNarrativeForProfileWithOverridesAsync(claim.Candidate.ProfileId, Deserialize<PostStateNarrativeRequest>(claim.RequestJson), overrides, ct), judge, ct); break;
                case EvaluationStage.EntityState: await service.CompleteSuccessAsync(claim, await ai.GenerateEntityStateTransitionForProfileWithOverridesAsync(claim.Candidate.ProfileId, Deserialize<EntityStateTransitionRequest>(claim.RequestJson), overrides, ct), judge, ct); break;
            }
        }
        catch (Exception ex) { await service.CompleteFailureAsync(claim, ex, ct); }
    }
    private static T Deserialize<T>(string json) => JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? throw new JsonException("Frozen evaluation request was empty.");
}
