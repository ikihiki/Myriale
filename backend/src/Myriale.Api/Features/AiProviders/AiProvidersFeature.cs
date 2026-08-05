using Myriale.Api.Architecture;

namespace Myriale.Api.Features.AiProviders;

[FeatureSlice("AiProviders")]
public static class AiProvidersFeature
{
    public static IServiceCollection AddAiProvidersFeature(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        return services;
    }

    public static IEndpointRouteBuilder MapAiProvidersFeature(this IEndpointRouteBuilder endpoints) => endpoints;
}
