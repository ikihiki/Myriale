using Myriale.Api.Architecture;

namespace Myriale.Api.Features.SessionExecutions;

[FeatureSlice("SessionExecutions")]
public static class SessionExecutionsFeature
{
    public static IServiceCollection AddSessionExecutionsFeature(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ISessionExecutionRepository, EfSessionExecutionRepository>();
        services.AddScoped<GetSessionExecutionQuery>();
        services.AddScoped<RetrySessionExecutionCommand>();
        services.AddScoped<CancelSessionExecutionCommand>();
        services.AddScoped<DismissSessionExecutionCommand>();
        services.AddScoped<ISessionExecutionOperationsRepository, EfSessionExecutionOperationsRepository>();
        services.AddSingleton<ISessionExecutionJitter, RandomSessionExecutionJitter>();
        services.AddSingleton<ISessionExecutionRetryPolicy, SessionExecutionRetryPolicy>();
        services.AddSingleton(new SessionExecutionWorkerSettings());
        services.AddHostedService<SessionExecutionWorker>();
        services.AddSingleton(TimeProvider.System);
        services.AddOptions<SessionExecutionMetricsOptions>()
            .Bind(configuration.GetSection(SessionExecutionMetricsOptions.SectionName))
            .Validate(options => options.SampleIntervalSeconds > 0 && options.StuckAfterSeconds > 0,
                "Session execution metric intervals must be positive.")
            .ValidateOnStart();
        services.AddSingleton<SessionExecutionMetricSnapshot>();
        services.AddSingleton<SessionExecutionObservableMetrics>();
        services.AddSingleton<SessionExecutionMetricsSampler>();
        services.AddHostedService(provider => provider.GetRequiredService<SessionExecutionMetricsSampler>());
        return services;
    }

    public static IEndpointRouteBuilder MapSessionExecutionsFeature(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapSessionExecutionEndpoints();
        return endpoints;
    }
}
