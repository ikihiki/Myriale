using Microsoft.Extensions.Http.Resilience;
using Myriale.Api.Architecture;
namespace Myriale.Api.Features.AiProviders;
[FeatureSlice("AiProviders")]
public static class AiProvidersFeature
{
 public static IServiceCollection AddAiProvidersFeature(this IServiceCollection s,IConfiguration c){s.AddOptions<AiProviderOptions>().Bind(c.GetSection(AiProviderOptions.SectionName)).Validate(o=>o.TimeoutSeconds>0&&o.MaxOutputTokens>0&&o.MaxAttempts>0,"AI provider limits must be positive.").Validate(o=>o.SessionRequestsPerMinute>0&&o.UserRequestsPerMinute>0&&o.MaxTokensPerSession>0&&o.LeaseRecoveryIntervalSeconds>0,"AI quota and recovery limits must be positive.").ValidateOnStart();s.AddOptions<AiProviderDeploymentOptions>().Bind(c.GetSection(AiProviderDeploymentOptions.SectionName));s.AddOptions<AiRuntimeOptions>().Bind(c.GetSection(AiRuntimeOptions.SectionName));s.AddSingleton<IAiDeploymentProfileSource,OptionsAiDeploymentProfileSource>();s.AddScoped<IAiSecretProtector,DataProtectionAiSecretProtector>();s.AddScoped<IAiProviderProfileRepository,EfAiProviderProfileRepository>();s.AddScoped<IAiCredentialRepository,EfAiCredentialRepository>();s.AddScoped<IAiRuntimeCredentialResolver,AiRuntimeCredentialResolver>();s.AddScoped<AiProviderProfileUseCases>();s.AddScoped<AiCredentialUseCases>();s.AddScoped<AiProviderTestUseCases>();s.AddScoped<EfActiveAiProviderSettingsRepository>();s.AddScoped<IActiveAiProviderSettingsRepository>(p=>p.GetRequiredService<EfActiveAiProviderSettingsRepository>());s.AddScoped<IActiveAiProviderSettingsReader>(p=>p.GetRequiredService<EfActiveAiProviderSettingsRepository>());s.AddScoped<ActiveAiProviderQueryService>();s.AddScoped<ActivateAiProviderUseCase>();s.AddScoped<AiProviderAdministrationQueryService>();s.AddScoped<OpenAiCompatibleTextProvider>();s.AddScoped<IAiTextService>(p=>p.GetRequiredService<OpenAiCompatibleTextProvider>());
#pragma warning disable EXTEXP0001
 s.AddHttpClient("OpenAiCompatible").RemoveAllResilienceHandlers();
#pragma warning restore EXTEXP0001
 s.AddHttpClient("MockAi",x=>x.BaseAddress=new Uri(c["MockAi:BaseUrl"]??"https+http://myriale-mock-ai"));s.AddScoped<IAiProfileCatalog,AiProfileCatalog>();return s;}
 public static IEndpointRouteBuilder MapAiProvidersFeature(this IEndpointRouteBuilder e){e.MapAiAdminEndpoints();e.MapAiProfileEndpoints();return e;}
}
