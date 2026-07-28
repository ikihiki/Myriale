using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public interface IAiProviderSelectionStore
{
    Task<string> GetActiveProviderAsync(CancellationToken cancellationToken);
    Task SetActiveProviderAsync(string provider, CancellationToken cancellationToken);
}

public sealed class DbAiProviderSelectionStore(ApplicationDbContext db, IAiProfileCatalog catalog, IConfiguration configuration) : IAiProviderSelectionStore
{
    public async Task<string> GetActiveProviderAsync(CancellationToken cancellationToken)
    {
        var selected = await db.AiProviderRuntimeSettings.AsNoTracking()
            .Where(settings => settings.Id == AiProviderRuntimeSettings.DefaultId)
            .Select(settings => settings.ActiveProvider)
            .SingleOrDefaultAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(selected))
        {
            try { return (await catalog.ResolveAsync(selected, cancellationToken)).Id; }
            catch (AiProviderException) { }
        }
        var configured = configuration["AiProvider:Provider"];
        if (!string.IsNullOrWhiteSpace(configured) && !string.Equals(configured, "mock", StringComparison.OrdinalIgnoreCase))
        {
            try { return (await catalog.ResolveAsync(configured, cancellationToken)).Id; }
            catch (AiProviderException) { }
        }
        return (await catalog.GetAsync(cancellationToken)).DefaultNarrativeProfileId;
    }

    public async Task SetActiveProviderAsync(string provider, CancellationToken cancellationToken)
    {
        provider = (await catalog.ResolveAsync(provider, cancellationToken)).Id;
        var settings = await db.AiProviderRuntimeSettings.FindAsync([AiProviderRuntimeSettings.DefaultId], cancellationToken);
        if (settings is null)
        {
            settings = new AiProviderRuntimeSettings { Id = AiProviderRuntimeSettings.DefaultId };
            db.AiProviderRuntimeSettings.Add(settings);
        }
        settings.ActiveProvider = provider;
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

}
