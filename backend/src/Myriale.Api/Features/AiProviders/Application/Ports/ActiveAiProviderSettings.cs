using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Features.AiProviders.Application.Ports;

public sealed record ActiveAiProviderSelection(string Provider, long Revision);

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
    public async Task<string> GetActiveProviderAsync(CancellationToken cancellationToken)
    {
        var selected = await reader.GetAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(selected?.Provider))
        {
            try { return (await catalog.ResolveAsync(selected.Provider, cancellationToken)).Id; }
            catch (AiProviderException) { }
        }

        return (await catalog.GetAsync(cancellationToken)).DefaultNarrativeProfileId;
    }
}
