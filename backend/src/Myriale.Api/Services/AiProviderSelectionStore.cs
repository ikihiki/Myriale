using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public interface IAiProviderSelectionStore
{
    Task<string> GetActiveProviderAsync(CancellationToken cancellationToken);
    Task SetActiveProviderAsync(string provider, CancellationToken cancellationToken);
}

public sealed class DbAiProviderSelectionStore(ApplicationDbContext db, IConfiguration configuration) : IAiProviderSelectionStore
{
    public async Task<string> GetActiveProviderAsync(CancellationToken cancellationToken)
    {
        var selected = await db.AiProviderRuntimeSettings.AsNoTracking()
            .Where(settings => settings.Id == AiProviderRuntimeSettings.DefaultId)
            .Select(settings => settings.ActiveProvider)
            .SingleOrDefaultAsync(cancellationToken);
        return NormalizeSupported(selected) ?? NormalizeSupported(configuration["AiProvider:Provider"]) ?? "openai";
    }

    public async Task SetActiveProviderAsync(string provider, CancellationToken cancellationToken)
    {
        provider = NormalizeSupported(provider)
            ?? throw new ArgumentException("Provider must be openai or runpod.", nameof(provider));
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

    private static string? NormalizeSupported(string? provider)
    {
        var normalized = provider?.Trim().ToLowerInvariant();
        return normalized is "openai" or "runpod" ? normalized : null;
    }
}
