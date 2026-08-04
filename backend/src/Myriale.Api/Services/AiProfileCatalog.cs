using Microsoft.Extensions.Options;
using Myriale.Api.Application.AiProviders;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed record AiProfileDescriptor(
    string Id,
    string DisplayName,
    string BaseUrl,
    string Model,
    string CredentialId,
    bool Enabled,
    AiProfileDefinitionSource Source,
    long Revision,
    bool Selectable = true)
{
    public string Adapter => "openai-compatible";
}

public sealed record AiProfileCatalogSnapshot(IReadOnlyDictionary<string, AiProfileDescriptor> Profiles, string DefaultActionDecisionProfileId, string DefaultNarrativeProfileId);
public interface IAiProfileCatalog
{
    Task<AiProfileCatalogSnapshot> GetAsync(CancellationToken cancellationToken);
    Task<AiProfileDescriptor> ResolveAsync(string profileId, CancellationToken cancellationToken);
    Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken cancellationToken);
    Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken cancellationToken);
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

public interface IAiDeploymentProfileSource { IReadOnlyDictionary<string, AiProfileDescriptor> GetProfiles(); }
public sealed class OptionsAiDeploymentProfileSource(IOptions<AiProviderDeploymentOptions> options) : IAiDeploymentProfileSource
{
    public IReadOnlyDictionary<string, AiProfileDescriptor> GetProfiles()
    {
        var result = new Dictionary<string, AiProfileDescriptor>(StringComparer.OrdinalIgnoreCase);
        foreach (var pair in options.Value.Profiles)
        {
            var profile = AiProviderProfile.Create(pair.Key, pair.Value.DisplayName, pair.Value.BaseUrl, pair.Value.Model,
                string.IsNullOrWhiteSpace(pair.Value.CredentialId) ? pair.Key : pair.Value.CredentialId, pair.Value.Enabled, DateTimeOffset.UnixEpoch);
            result[profile.Id.Value] = new(profile.Id.Value, profile.DisplayName, profile.BaseUrl, profile.Model, profile.CredentialId.Value, profile.Enabled, AiProfileDefinitionSource.Deployment, 0);
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
        var combined = new Dictionary<string, AiProfileDescriptor>(deployment.GetProfiles(), StringComparer.OrdinalIgnoreCase);
        foreach (var profile in await profiles.ListAsync(cancellationToken))
            combined[profile.Id.Value] = new(profile.Id.Value, profile.DisplayName, profile.BaseUrl, profile.Model, profile.CredentialId.Value, profile.Enabled, AiProfileDefinitionSource.Database, profile.Revision);
        var enabled = combined.Values.Where(x => x.Enabled).OrderBy(x => x.Id, StringComparer.Ordinal).ToDictionary(x => x.Id, StringComparer.OrdinalIgnoreCase);
        if (enabled.Count == 0) throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, "Selectable AI profiles are not configured.", false);
        var fallback = enabled.Keys.First();
        return new(enabled, ResolveDefault(options.Value.DefaultActionDecisionProfileId, enabled, fallback), ResolveDefault(options.Value.DefaultNarrativeProfileId, enabled, fallback));
    }
    public async Task<AiProfileDescriptor> ResolveAsync(string profileId, CancellationToken cancellationToken)
    {
        var id = new AiProviderProfileId(profileId).Value;
        var snapshot = await GetAsync(cancellationToken);
        return snapshot.Profiles.TryGetValue(id, out var profile) ? profile : throw new AiProviderException(AiProviderErrorCodes.ProviderUnavailable, $"AI profile '{id}' is not configured.", false);
    }
    public async Task<string> ResolveActionDecisionProfileIdAsync(string? requested, CancellationToken ct) => await ResolveRequestedAsync(requested, (await GetAsync(ct)).DefaultActionDecisionProfileId, ct);
    public async Task<string> ResolveNarrativeProfileIdAsync(string? requested, CancellationToken ct) => await ResolveRequestedAsync(requested, (await GetAsync(ct)).DefaultNarrativeProfileId, ct);
    private async Task<string> ResolveRequestedAsync(string? requested, string fallback, CancellationToken ct) { var id = string.IsNullOrWhiteSpace(requested) ? fallback : requested; return (await ResolveAsync(id, ct)).Id; }
    private static string ResolveDefault(string? candidate, IReadOnlyDictionary<string, AiProfileDescriptor> enabled, string fallback) => !string.IsNullOrWhiteSpace(candidate) && enabled.ContainsKey(candidate) ? new AiProviderProfileId(candidate).Value : fallback;
}
