
namespace Myriale.Api.Features.AiProviders.Application.Ports;

public sealed record ActiveAiProviderSelection(AiProviderProfileId Provider, long Revision);

public enum ActiveAiProviderSettingsSaveOutcome
{
    Saved,
    Conflict,
}

public interface IActiveAiProviderSettingsRepository
{
    Task<AiProviderRuntimeSettings?> LoadAsync(CancellationToken cancellationToken);
    void Add(AiProviderRuntimeSettings settings);
    Task<ActiveAiProviderSettingsSaveOutcome> SaveAsync(CancellationToken cancellationToken);
}

public interface IActiveAiProviderSettingsReader
{
    Task<ActiveAiProviderSelection?> GetAsync(CancellationToken cancellationToken);
}

public sealed class ActiveAiProviderQueryService(
    IActiveAiProviderSettingsReader reader,
    IAiProfileCatalog catalog)
{
    public async Task<AiProviderProfileId> GetActiveProviderAsync(CancellationToken cancellationToken)
    {
        var selected = await reader.GetAsync(cancellationToken);
        if (selected is not null)
        {
            try { return (await catalog.ResolveAsync(selected.Provider, cancellationToken)).Id; }
            catch (AiProviderException) { }
        }

        return (await catalog.GetAsync(cancellationToken)).DefaultNarrativeProfileId;
    }
}
