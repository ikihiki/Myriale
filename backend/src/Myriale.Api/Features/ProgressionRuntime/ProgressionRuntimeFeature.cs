using Myriale.Api.Architecture;
using Myriale.Api.Features.ProgressionRuntime.Application.Services;

namespace Myriale.Api.Features.ProgressionRuntime;

[FeatureSlice("ProgressionRuntime")]
public static class ProgressionRuntimeFeature
{
    public static IServiceCollection AddProgressionRuntimeFeature(this IServiceCollection services)
    {
        services.AddScoped<IProgressionReceiptRepository, EfProgressionReceiptRepository>();
        services.AddScoped<EnsureProgressionReceiptCommand>();
        services.AddScoped<IProgressionReceiptCommand>(provider => provider.GetRequiredService<EnsureProgressionReceiptCommand>());
        services.AddScoped<EnsureProgressionSignalCommand>();
        return services;
    }
}
