using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Application.AiProviders;

public sealed class AiProviderAdministrationQueryService(
    ApplicationDbContext db,
    IAiCredentialStore credentialStore)
{
    public async Task<AiProviderKeyResponse> GetProviderAsync(
        AiProfileDescriptor profile,
        string? activeProvider,
        CancellationToken cancellationToken)
    {
        var key = await db.AiProviderKeys.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Provider == profile.CredentialId, cancellationToken);
        var definitionSource = await db.AiProviderProfileDefinitions.AsNoTracking()
            .AnyAsync(item => item.Id == profile.Id, cancellationToken)
            ? "database"
            : "configuration";
        var configuredSecret = profile.ApiKey;
        var databaseSecret = string.IsNullOrWhiteSpace(configuredSecret)
            ? await credentialStore.GetAsync(profile.CredentialId, cancellationToken)
            : null;
        var secret = configuredSecret ?? databaseSecret;
        var credentialSource = !string.IsNullOrWhiteSpace(configuredSecret)
            ? "environment"
            : !string.IsNullOrWhiteSpace(databaseSecret) ? "database" : "none";

        return new AiProviderKeyResponse(
            profile.Id,
            profile.DisplayName,
            profile.Adapter,
            profile.BaseUrl,
            profile.Model,
            profile.CredentialId,
            profile.Enabled,
            definitionSource,
            !string.IsNullOrWhiteSpace(secret),
            string.IsNullOrWhiteSpace(secret) ? "未設定" : credentialStore.Mask(secret),
            credentialSource,
            string.Equals(activeProvider, profile.Id, StringComparison.OrdinalIgnoreCase),
            key?.Status ?? "untested",
            key?.UpdatedAt ?? default,
            key?.LastValidatedAt);
    }
}
