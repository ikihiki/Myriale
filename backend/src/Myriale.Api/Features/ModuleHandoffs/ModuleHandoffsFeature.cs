using Myriale.Api.Architecture;
using Myriale.Api.Features.ModuleHandoffs.Application.Services;

namespace Myriale.Api.Features.ModuleHandoffs;

[FeatureSlice("ModuleHandoffs")]
public static class ModuleHandoffsFeature
{
    public static IServiceCollection AddModuleHandoffsFeature(this IServiceCollection services)
    {
        services.AddScoped<IModuleHandoffEnqueuePersistence, EfModuleHandoffEnqueuePersistence>();
        services.AddScoped<EnqueueModuleHandoffCommand>();
        services.AddScoped<IModuleHandoffEnqueueService>(provider => provider.GetRequiredService<EnqueueModuleHandoffCommand>());
        services.AddScoped<IModuleHandoffSourceSnapshotQuery, EfModuleHandoffSourceSnapshotQuery>();
        services.AddSingleton<ModuleHandoffCausalityValidator>();
        services.AddSingleton<ModuleHandoffNarrativeRequestBuilder>();
        services.AddScoped<IModuleHandoffAiInteractionRecorder, EfModuleHandoffAiInteractionRecorder>();
        services.AddScoped<IModuleHandoffNarrativeService, ModuleHandoffNarrativeService>();
        services.AddScoped<IModuleHandoffArtifactWriter, ModuleHandoffArtifactWriter>();
        services.AddScoped<IModuleHandoffSessionTurnAppender, ModuleHandoffSessionTurnAppender>();
        services.AddScoped<IModuleHandoffPublishUnitOfWork, EfModuleHandoffPublishUnitOfWork>();
        services.AddScoped<ModuleHandoffExecutionOrchestrator>();
        services.AddScoped<ISessionExecutionService, ModuleHandoffExecutionHandler>();
        return services;
    }
}
