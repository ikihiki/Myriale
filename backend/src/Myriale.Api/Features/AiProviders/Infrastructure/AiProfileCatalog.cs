using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.AiProviders.Application;

namespace Myriale.Api.Features.AiProviders.Infrastructure;

public sealed record AiProfileDescriptor(
    AiProviderProfileId Id,
    string DisplayName,
    string BaseUrl,
    string Model,
    AiCredentialId CredentialId,
    bool Enabled,
    AiProfileDefinitionSource Source,
    long Revision,
    bool Selectable = true,
    string SystemPrompt = "")
{
    public string Adapter => "openai-compatible";
}

public sealed record AiProfileCatalogSnapshot(
    IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> Profiles,
    AiProviderProfileId DefaultActionDecisionProfileId,
    AiProviderProfileId DefaultNarrativeProfileId);

public interface IAiProfileCatalog
{
    Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken);
    Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId profileId, CancellationToken cancellationToken);
    Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken cancellationToken);
    Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken cancellationToken);
}

public sealed class AiProviderDeploymentOptions
{
    public const string SectionName = "AiDeployment";
    public Dictionary<string, AiDeploymentProfileOptions> Profiles { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, AiDeploymentCredentialOptions> Credentials { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class AiProviderCatalogOptions
{
    public const string SectionName = "AiProvider";
    public string? CatalogJson { get; set; }
}

public sealed class AiDeploymentProfileOptions
{
    public string DisplayName { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string SystemPrompt { get; set; } = string.Empty;
    public string CredentialId { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}

public sealed class AiDeploymentCredentialOptions
{
    public string Secret { get; set; } = string.Empty;
}

public sealed record AiDeploymentCatalogSnapshot(
    IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> Profiles,
    IReadOnlyDictionary<AiCredentialId, string> Credentials,
    string? DefaultActionDecisionProfileId,
    string? DefaultNarrativeProfileId);

public interface IAiDeploymentCatalogSource
{
    AiDeploymentCatalogSnapshot GetSnapshot();
}

public sealed class ConfigurationAiDeploymentCatalogSource(
    IOptions<AiProviderDeploymentOptions> deploymentOptions,
    IOptions<AiProviderCatalogOptions> catalogOptions) : IAiDeploymentCatalogSource
{
    private const string SupportedAdapter = "openai-compatible";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    public AiDeploymentCatalogSnapshot GetSnapshot()
    {
        var profiles = new Dictionary<AiProviderProfileId, AiProfileDescriptor>();
        var credentials = new Dictionary<AiCredentialId, string>();

        foreach (var pair in deploymentOptions.Value.Profiles)
            profiles[new AiProviderProfileId(pair.Key)] = CreateProfile(pair.Key, pair.Value.DisplayName, pair.Value.BaseUrl,
                pair.Value.Model, pair.Value.SystemPrompt, pair.Value.CredentialId, pair.Value.Enabled, null);
        foreach (var pair in deploymentOptions.Value.Credentials)
            AddCredential(credentials, pair.Key, pair.Value.Secret);

        string? actionDefault = null;
        string? narrativeDefault = null;
        if (!string.IsNullOrWhiteSpace(catalogOptions.Value.CatalogJson))
        {
            AiCatalogDocument document;
            try
            {
                document = JsonSerializer.Deserialize<AiCatalogDocument>(catalogOptions.Value.CatalogJson, Json)
                    ?? throw new JsonException("AI catalog JSON was empty.");
                var catalogCredentials = new Dictionary<AiCredentialId, string>();
                foreach (var pair in document.EnumerateCredentials()) AddCredential(catalogCredentials, pair.Key, pair.Value);
                foreach (var configured in document.EnumerateProfiles())
                {
                    var profile = CreateProfile(configured.Id, configured.DisplayName, configured.BaseUrl, configured.Model,
                        configured.SystemPrompt, configured.CredentialId, configured.Enabled, configured.Adapter);
                    profiles[profile.Id] = profile;
                    if (!string.IsNullOrWhiteSpace(configured.ApiKey))
                        AddCredential(catalogCredentials, profile.CredentialId.AsPrimitive(), configured.ApiKey);
                }
                foreach (var pair in catalogCredentials) credentials[pair.Key] = pair.Value;
                actionDefault = document.DefaultActionDecisionProfileId;
                narrativeDefault = document.DefaultNarrativeProfileId;
            }
            catch (Exception exception) when (exception is JsonException or ArgumentException)
            {
                throw new AiProviderException(
                    AiProviderErrorCodes.ProviderUnavailable,
                    "AiProvider:CatalogJson is invalid.",
                    false,
                    inner: exception);
            }
        }

        return new(profiles, credentials, actionDefault, narrativeDefault);
    }

    private static AiProfileDescriptor CreateProfile(
        string? id,
        string? displayName,
        string? baseUrl,
        string? model,
        string? systemPrompt,
        string? credentialId,
        bool enabled,
        string? adapter)
    {
        if (!string.IsNullOrWhiteSpace(adapter)
            && !string.Equals(adapter.Trim(), SupportedAdapter, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException($"Adapter must be '{SupportedAdapter}'.");
        var profileId = new AiProviderProfileId(id ?? string.Empty);
        var resolvedCredentialId = new AiCredentialId(string.IsNullOrWhiteSpace(credentialId) ? profileId.AsPrimitive() : credentialId);
        var profile = AiProviderProfile.Create(profileId, displayName ?? string.Empty, baseUrl ?? string.Empty, model ?? string.Empty,
            resolvedCredentialId, enabled, DateTimeOffset.UnixEpoch, systemPrompt ?? string.Empty);
        return new(profile.Id, profile.DisplayName, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled,
            AiProfileDefinitionSource.Deployment, 0, SystemPrompt: profile.SystemPrompt);
    }

    private static void AddCredential(IDictionary<AiCredentialId, string> credentials, string id, string? secret)
    {
        if (string.IsNullOrWhiteSpace(secret)) return;
        var credentialId = new AiCredentialId(id);
        var normalizedSecret = secret.Trim();
        if (credentials.TryGetValue(credentialId, out var existing)
            && !string.Equals(existing, normalizedSecret, StringComparison.Ordinal))
            throw new ArgumentException($"Credential '{credentialId.AsPrimitive()}' has conflicting secrets.");
        credentials[credentialId] = normalizedSecret;
    }

    private sealed class AiCatalogDocument
    {
        public string? DefaultActionDecisionProfileId { get; init; }
        public string? DefaultNarrativeProfileId { get; init; }
        public JsonElement Profiles { get; init; }
        public JsonElement Credentials { get; init; }

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

        public IEnumerable<KeyValuePair<string, string?>> EnumerateCredentials()
        {
            if (Credentials.ValueKind != JsonValueKind.Object) return [];
            return Credentials.EnumerateObject().Select(property => new KeyValuePair<string, string?>(
                property.Name,
                property.Value.ValueKind == JsonValueKind.String
                    ? property.Value.GetString()
                    : property.Value.Deserialize<AiCatalogCredential>(Json)?.Secret)).ToList();
        }
    }

    private sealed class AiCatalogProfile
    {
        public string? Id { get; set; }
        public string? DisplayName { get; init; }
        public string? Adapter { get; init; }
        public string? BaseUrl { get; init; }
        public string? Model { get; init; }
        public string? SystemPrompt { get; init; }
        public string? CredentialId { get; init; }
        public bool Enabled { get; init; } = true;
        public string? ApiKey { get; init; }
    }

    private sealed class AiCatalogCredential
    {
        public string? Secret { get; init; }
    }
}

public sealed class AiProfileCatalog(
    IAiDeploymentCatalogSource deployment,
    IAiProviderProfileRepository profiles,
    IOptions<AiProviderOptions> options) : IAiProfileCatalog
{
    public async Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        var deploymentSnapshot = deployment.GetSnapshot();
        var combined = deploymentSnapshot.Profiles.ToDictionary(pair => pair.Key, pair => pair.Value);
        foreach (var profile in await profiles.ListAsync(cancellationToken))
            combined[profile.Id] = new(profile.Id, profile.DisplayName, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled, AiProfileDefinitionSource.Database, profile.Revision, SystemPrompt: profile.SystemPrompt);
        var enabled = combined.Values.Where(x => x.Enabled).OrderBy(x => x.Id.AsPrimitive(), StringComparer.Ordinal).ToDictionary(x => x.Id);
        if (enabled.Count == 0) throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "Selectable AI profiles are not configured.", false);
        var fallback = enabled.Keys.First();
        return new(
            enabled,
            ResolveDefault(FirstNonBlank(deploymentSnapshot.DefaultActionDecisionProfileId, options.Value.DefaultActionDecisionProfileId), enabled, fallback),
            ResolveDefault(FirstNonBlank(deploymentSnapshot.DefaultNarrativeProfileId, options.Value.DefaultNarrativeProfileId), enabled, fallback));
    }

    public async Task<AiProfileDescriptor> ResolveAsync(AiProviderProfileId profileId, CancellationToken cancellationToken)
    {
        var snapshot = await GetAsync(cancellationToken);
        return snapshot.Profiles.TryGetValue(profileId, out var profile)
            ? profile
            : throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, $"AI profile '{profileId.AsPrimitive()}' is not configured.", false);
    }

    public async Task<AiProviderProfileId> ResolveActionDecisionProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) =>
        await ResolveRequestedAsync(requested, (await GetAsync(ct)).DefaultActionDecisionProfileId, ct);

    public async Task<AiProviderProfileId> ResolveNarrativeProfileIdAsync(AiProviderProfileId? requested, CancellationToken ct) =>
        await ResolveRequestedAsync(requested, (await GetAsync(ct)).DefaultNarrativeProfileId, ct);

    private async Task<AiProviderProfileId> ResolveRequestedAsync(AiProviderProfileId? requested, AiProviderProfileId fallback, CancellationToken ct) =>
        (await ResolveAsync(requested ?? fallback, ct)).Id;

    private static AiProviderProfileId ResolveDefault(string? candidate, IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> enabled, AiProviderProfileId fallback)
    {
        if (string.IsNullOrWhiteSpace(candidate)) return fallback;
        var id = new AiProviderProfileId(candidate);
        return enabled.ContainsKey(id) ? id : fallback;
    }

    private static string? FirstNonBlank(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
}
