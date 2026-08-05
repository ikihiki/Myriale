using Myriale.Api.Architecture;

namespace Myriale.Api.Features.Sessions;

[FeatureSlice("Sessions")]
public static class SessionsFeature
{
    public static IServiceCollection AddSessionsFeature(this IServiceCollection services)
    {
        services.AddScoped<ISessionInputAcceptanceRepository, EfSessionInputAcceptanceRepository>();
        services.AddScoped<ISessionCreationRepository, EfSessionCreationRepository>();
        services.AddScoped<AcceptSessionInputUseCase>();
        services.AddScoped<CreateSessionUseCase>();
        services.AddScoped<ListSessionsQueryService>();
        services.AddScoped<GetSessionDetailQueryService>();
        services.AddScoped<GetSessionTurnQueryService>();
        services.AddScoped<GetSessionTurnInspectionQueryService>();
        services.AddScoped<GetSessionActionRecommendationContextQuery>();
        return services;
    }

    public static IEndpointRouteBuilder MapSessionsFeature(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapSessionEndpoints();
        return endpoints;
    }
}
