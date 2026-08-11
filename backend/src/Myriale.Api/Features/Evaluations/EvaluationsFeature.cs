using Myriale.Api.Architecture;
using Myriale.Api.Features.Evaluations.Infrastructure.Hosting;
using Myriale.Api.Infrastructure.Composition.Evaluations;

namespace Myriale.Api.Features.Evaluations;

[FeatureSlice("Evaluations")]
public static class EvaluationsFeature
{
    public static IServiceCollection AddEvaluationsFeature(this IServiceCollection services, IConfiguration configuration)
    {
        var settings = new EvaluationWorkerSettings(); configuration.GetSection("EvaluationWorker").Bind(settings);
        services.AddSingleton(settings); services.AddScoped<EvaluationSessionService>(); services.AddSingleton<IEvaluationMachineJudge, EvaluationMachineJudge>(); services.AddHostedService<EvaluationExecutionWorker>(); return services;
    }
    public static IEndpointRouteBuilder MapEvaluationsFeature(this IEndpointRouteBuilder endpoints) => endpoints.MapEvaluationEndpoints();
}
