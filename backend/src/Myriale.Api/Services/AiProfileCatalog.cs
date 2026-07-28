using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record AiProfileDescriptor(
    string Id,
    string DisplayName,
    string Adapter,
    string BaseUrl,
    string Model,
    string CredentialId,
    bool Enabled,
    string? ApiKey = null,
    bool Selectable = true);

public sealed record AiProfileCatalogSnapshot(
    IReadOnlyDictionary<string, AiProfileDescriptor> Profiles,
    string DefaultActionDecisionProfileId,
    string DefaultNarrativeProfileId);

public interface IAiProfileCatalog
{
    Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken);
    Task<AiProfileDescriptor> ResolveAsync(string profileId, CancellationToken cancellationToken);
    Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken cancellationToken);
    Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken cancellationToken);
}

public sealed class AiProfileCatalog(
    IOptions<AiProviderOptions> configuredOptions,
    ApplicationDbContext db) : IAiProfileCatalog
{
    private const string SupportedAdapter = "openai-compatible";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        var configured = configuredOptions.Value;
        var profiles = LegacyProfiles(configured);
        var actionDefault = configured.DefaultActionDecisionProfileId;
        var narrativeDefault = configured.DefaultNarrativeProfileId;

        if (!string.IsNullOrWhiteSpace(configured.CatalogJson))
        {
            AiCatalogDocument document;
            try
            {
                document = JsonSerializer.Deserialize<AiCatalogDocument>(configured.CatalogJson, Json)
                    ?? throw new JsonException("AI catalog JSON was empty.");
            }
            catch (JsonException exception)
            {
                throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "AiProvider:CatalogJson is invalid.", false, inner: exception);
            }

            foreach (var profile in document.EnumerateProfiles())
            {
                var descriptor = Validate(profile.Id, profile.DisplayName, profile.Adapter, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled, profile.ApiKey);
                profiles[descriptor.Id] = descriptor;
            }
            actionDefault = FirstNonBlank(document.DefaultActionDecisionProfileId, actionDefault);
            narrativeDefault = FirstNonBlank(document.DefaultNarrativeProfileId, narrativeDefault);
        }

        // Definition precedence and credential precedence are intentionally independent. Profiles may share
        // a credentialId, so a secret declared once in configuration/Vault is inherited by every profile using
        // that credential before DB definitions are overlaid.
        var configurationCredentials = profiles.Values
            .Where(profile => !string.IsNullOrWhiteSpace(profile.ApiKey))
            .GroupBy(profile => profile.CredentialId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Last().ApiKey, StringComparer.OrdinalIgnoreCase);
        foreach (var item in profiles.ToList())
        {
            if (string.IsNullOrWhiteSpace(item.Value.ApiKey)
                && configurationCredentials.TryGetValue(item.Value.CredentialId, out var sharedCredential))
                profiles[item.Key] = item.Value with { ApiKey = sharedCredential };
        }

        // DB definitions win over configuration definitions with the same profile ID, while the deployment-owned
        // configuration/Vault credential continues to win over an encrypted DB credential for the same credentialId.
        var databaseProfiles = await db.AiProviderProfileDefinitions.AsNoTracking().ToListAsync(cancellationToken);
        foreach (var profile in databaseProfiles)
        {
            configurationCredentials.TryGetValue(profile.CredentialId, out var configuredCredential);
            var descriptor = Validate(profile.Id, profile.DisplayName, profile.Adapter, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled, configuredCredential);
            profiles[descriptor.Id] = descriptor;
        }

        var enabled = profiles.Values.Where(profile => profile.Enabled)
            .OrderBy(profile => profile.Id, StringComparer.Ordinal)
            .ToDictionary(profile => profile.Id, StringComparer.OrdinalIgnoreCase);
        if (enabled.Count == 0)
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "Selectable AI profiles are not configured.", false);

        var selectable = enabled.Values.Where(profile => profile.Selectable).ToDictionary(profile => profile.Id, StringComparer.OrdinalIgnoreCase);
        if (selectable.Count == 0)
            throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "Selectable AI profiles are not configured.", false);
        var fallback = selectable.Keys.First();
        actionDefault = ResolveDefault(actionDefault, selectable, fallback);
        narrativeDefault = ResolveDefault(narrativeDefault, selectable, fallback);
        return new AiProfileCatalogSnapshot(enabled, actionDefault, narrativeDefault);
    }

    public async Task<AiProfileDescriptor> ResolveAsync(string profileId, CancellationToken cancellationToken)
    {
        var snapshot = await GetAsync(cancellationToken);
        var id = NormalizeId(profileId);
        return snapshot.Profiles.TryGetValue(id, out var profile)
            ? profile
            : throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, $"AI profile '{id}' is not configured.", false);
    }

    public async Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken cancellationToken) =>
        await ResolveRequestedAsync(requested, (await GetAsync(cancellationToken)).DefaultActionDecisionProfileId, cancellationToken);

    public async Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken cancellationToken) =>
        await ResolveRequestedAsync(requested, (await GetAsync(cancellationToken)).DefaultNarrativeProfileId, cancellationToken);

    private async Task<string> ResolveRequestedAsync(string? requested, string defaultId, CancellationToken cancellationToken)
    {
        var id = NormalizeId(string.IsNullOrWhiteSpace(requested) ? defaultId : requested);
        await ResolveAsync(id, cancellationToken);
        return id;
    }

    private static Dictionary<string, AiProfileDescriptor> LegacyProfiles(AiProviderOptions configured)
    {
        var profiles = new Dictionary<string, AiProfileDescriptor>(StringComparer.OrdinalIgnoreCase);
        var activeProviderId = string.IsNullOrWhiteSpace(configured.Provider) ? null : NormalizeId(configured.Provider);
        foreach (var item in configured.Providers)
        {
            var providerId = NormalizeId(item.Key);
            var isActive = providerId == activeProviderId;
            var baseUrl = FirstNonBlank(isActive ? configured.BaseUrl : null, item.Value.BaseUrl,
                providerId == "openai" ? "https://api.openai.com/v1" : null);
            var model = FirstNonBlank(isActive ? configured.Model : null, item.Value.Model);
            var apiKey = FirstNonBlank(isActive ? configured.ApiKey : null, item.Value.ApiKey);
            var descriptor = Validate(providerId, providerId, SupportedAdapter, baseUrl, model, providerId, true, apiKey) with { Selectable = false };
            profiles[descriptor.Id] = descriptor;
        }
        foreach (var item in configured.Profiles)
        {
            var providerId = NormalizeId(item.Value.Provider);
            configured.Providers.TryGetValue(providerId, out var provider);
            var baseUrl = FirstNonBlank(item.Value.BaseUrl, provider?.BaseUrl,
                providerId == "openai" ? "https://api.openai.com/v1" : null);
            var model = FirstNonBlank(item.Value.Model, provider?.Model);
            var apiKey = FirstNonBlank(item.Value.ApiKey, provider?.ApiKey);
            var descriptor = Validate(item.Key, item.Value.DisplayName, SupportedAdapter, baseUrl, model, providerId, true, apiKey);
            profiles[descriptor.Id] = descriptor;
        }
        return profiles;
    }

    private static AiProfileDescriptor Validate(string? id, string? displayName, string? adapter, string? baseUrl, string? model, string? credentialId, bool enabled, string? apiKey)
    {
        var normalizedId = NormalizeId(id);
        if (normalizedId.Length > 80 || normalizedId.Any(character => !(char.IsLetterOrDigit(character) || character is '-' or '_' or '.')))
            throw Invalid(normalizedId, "ID must contain only letters, numbers, '.', '_' or '-'.");
        var normalizedAdapter = (adapter ?? string.Empty).Trim().ToLowerInvariant();
        if (normalizedAdapter != SupportedAdapter) throw Invalid(normalizedId, $"Adapter must be '{SupportedAdapter}'.");
        if (!Uri.TryCreate(baseUrl?.Trim(), UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
            throw Invalid(normalizedId, "BaseUrl must be an absolute HTTP(S) URL.");
        if (string.IsNullOrWhiteSpace(model)) throw Invalid(normalizedId, "Model is required.");
        var normalizedCredentialId = NormalizeId(string.IsNullOrWhiteSpace(credentialId) ? normalizedId : credentialId);
        return new AiProfileDescriptor(
            normalizedId,
            string.IsNullOrWhiteSpace(displayName) ? normalizedId : displayName.Trim(),
            normalizedAdapter,
            uri.ToString().TrimEnd('/'),
            model.Trim(),
            normalizedCredentialId,
            enabled,
            string.IsNullOrWhiteSpace(apiKey) ? null : apiKey);
    }

    private static AiProviderException Invalid(string id, string reason) =>
        new(AiProviderErrorCodes.ProviderUnavailable, $"AI profile '{id}' is invalid. {reason}", false);

    private static string ResolveDefault(string? candidate, IReadOnlyDictionary<string, AiProfileDescriptor> enabled, string fallback)
    {
        if (string.IsNullOrWhiteSpace(candidate)) return fallback;
        var id = NormalizeId(candidate);
        return enabled.ContainsKey(id) ? id : fallback;
    }

    private static string NormalizeId(string? value)
    {
        var normalized = value?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized)) throw Invalid("(empty)", "ID is required.");
        return normalized;
    }

    private static string? FirstNonBlank(params string?[] values) => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();

    private sealed class AiCatalogDocument
    {
        public string? DefaultActionDecisionProfileId { get; init; }
        public string? DefaultNarrativeProfileId { get; init; }
        public JsonElement Profiles { get; init; }

        public IEnumerable<AiCatalogProfile> EnumerateProfiles()
        {
            if (Profiles.ValueKind == JsonValueKind.Array)
                return Profiles.Deserialize<List<AiCatalogProfile>>(Json) ?? [];
            if (Profiles.ValueKind == JsonValueKind.Object)
                return Profiles.EnumerateObject().Select(property =>
                {
                    var profile = property.Value.Deserialize<AiCatalogProfile>(Json) ?? new AiCatalogProfile();
                    profile.Id ??= property.Name;
                    return profile;
                }).ToList();
            return [];
        }
    }

    private sealed class AiCatalogProfile
    {
        public string? Id { get; set; }
        public string? DisplayName { get; init; }
        public string? Adapter { get; init; }
        public string? BaseUrl { get; init; }
        public string? Model { get; init; }
        public string? CredentialId { get; init; }
        public bool Enabled { get; init; } = true;
        public string? ApiKey { get; init; }
    }
}
