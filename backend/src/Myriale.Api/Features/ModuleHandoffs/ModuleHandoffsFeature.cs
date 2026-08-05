using Myriale.Api.Architecture;

namespace Myriale.Api.Features.ModuleHandoffs;

[FeatureSlice("ModuleHandoffs")]
public static class ModuleHandoffsFeature
{
    public static IServiceCollection AddModuleHandoffsFeature(this IServiceCollection services)
    {
        services.AddScoped<IModuleHandoffEnqueuePort, EfModuleHandoffEnqueuePort>();
        services.AddScoped<EnqueueModuleHandoffCommand>();
        services.AddScoped<IModuleHandoffSourceSnapshotQuery, EfModuleHandoffSourceSnapshotQuery>();
        services.AddSingleton<ModuleHandoffCausalityValidator>();
        services.AddSingleton<ModuleHandoffNarrativeRequestBuilder>();
        services.AddScoped<IModuleHandoffAiInteractionRecorder, EfModuleHandoffAiInteractionRecorder>();
        services.AddScoped<IModuleHandoffNarrativeService, ModuleHandoffNarrativeService>();
        services.AddScoped<IModuleHandoffArtifactWriter, ModuleHandoffArtifactWriter>();
        services.AddScoped<IModuleHandoffSessionTurnAppender, ModuleHandoffSessionTurnAppender>();
        services.AddScoped<IModuleHandoffPublishUnitOfWork, EfModuleHandoffPublishUnitOfWork>();
        services.AddScoped<ModuleHandoffExecutionOrchestrator>();
        services.AddScoped<ISessionExecutionHandler, ModuleHandoffExecutionHandler>();
        return services;
    }
}
