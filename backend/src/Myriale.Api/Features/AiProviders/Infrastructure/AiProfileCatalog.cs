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
    bool Selectable = true)
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
public sealed class AiDeploymentProfileOptions
{
    public string DisplayName { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string CredentialId { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}
public sealed class AiDeploymentCredentialOptions { public string Secret { get; set; } = string.Empty; }

public interface IAiDeploymentProfileSource { IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> GetProfiles(); }
public sealed class OptionsAiDeploymentProfileSource(IOptions<AiProviderDeploymentOptions> options) : IAiDeploymentProfileSource
{
    public IReadOnlyDictionary<AiProviderProfileId, AiProfileDescriptor> GetProfiles()
    {
        var result = new Dictionary<AiProviderProfileId, AiProfileDescriptor>();
        foreach (var pair in options.Value.Profiles)
        {
            var profileId = new AiProviderProfileId(pair.Key);
            var credentialId = new AiCredentialId(string.IsNullOrWhiteSpace(pair.Value.CredentialId) ? pair.Key : pair.Value.CredentialId);
            var profile = AiProviderProfile.Create(profileId, pair.Value.DisplayName, pair.Value.BaseUrl, pair.Value.Model,
                credentialId, pair.Value.Enabled, DateTimeOffset.UnixEpoch);
            result[profile.Id] = new(profile.Id, profile.DisplayName, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled, AiProfileDefinitionSource.Deployment, 0);
        }
        return result;
    }
}

public sealed class AiProfileCatalog(
    IAiDeploymentProfileSource deployment,
    IAiProviderProfileRepository profiles,
    IOptions<AiProviderOptions> options) : IAiProfileCatalog
{
    public async Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        var combined = deployment.GetProfiles().ToDictionary(pair => pair.Key, pair => pair.Value);
        foreach (var profile in await profiles.ListAsync(cancellationToken))
            combined[profile.Id] = new(profile.Id, profile.DisplayName, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled, AiProfileDefinitionSource.Database, profile.Revision);
        var enabled = combined.Values.Where(x => x.Enabled).OrderBy(x => x.Id.AsPrimitive(), StringComparer.Ordinal).ToDictionary(x => x.Id);
        if (enabled.Count == 0) throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "Selectable AI profiles are not configured.", false);
        var fallback = enabled.Keys.First();
        return new(enabled, ResolveDefault(options.Value.DefaultActionDecisionProfileId, enabled, fallback), ResolveDefault(options.Value.DefaultNarrativeProfileId, enabled, fallback));
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
}
