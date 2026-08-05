using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ScenarioTurns;

[FeatureSlice("ScenarioTurns")]
public static class ScenarioTurnsFeature
{
    public static IServiceCollection AddScenarioTurnsFeature(this IServiceCollection services)
    {
        services.AddSingleton<ScenarioRuleJsonCodec>();
        services.AddScoped<IScenarioExecutionFence, EfScenarioExecutionFence>();
        services.AddScoped<IScenarioWorldSnapshotQuery, EfScenarioWorldSnapshotQuery>();
        services.AddScoped<IScenarioActionSnapshotRepository, EfScenarioActionSnapshotRepository>();
        services.AddScoped<IScenarioAiInteractionRecorder, EfScenarioAiInteractionRecorder>();
        services.AddScoped<IScenarioAiDecisionService, ScenarioAiDecisionService>();
        services.AddScoped<IScenarioTurnArtifactWriter, ScenarioTurnArtifactWriter>();
        services.AddScoped<IScenarioEffectCommitUnitOfWork, EfScenarioEffectCommitUnitOfWork>();
        services.AddScoped<IScenarioNarrativeGenerationService, ScenarioNarrativeGenerationService>();
        services.AddScoped<IScenarioSessionTurnAppender, ScenarioSessionTurnAppender>();
        services.AddScoped<IScenarioNarrativePublisher, EfScenarioNarrativePublisher>();
        services.AddScoped<ScenarioTurnExecutionOrchestrator>();
        services.AddScoped<IScenarioExtensionAdapter, ScenarioModuleExtensionAdapter>();
        services.AddScoped<ISessionExecutionHandler, ScenarioTurnExecutionHandler>();
        return services;
    }
}
