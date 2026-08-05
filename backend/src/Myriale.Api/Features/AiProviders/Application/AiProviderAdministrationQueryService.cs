
namespace Myriale.Api.Features.AiProviders.Application;

public sealed class AiProviderAdministrationQueryService(IAiDeploymentProfileSource deployment, IAiProviderProfileRepository profiles, IAiCredentialRepository credentials, IAiRuntimeCredentialResolver resolver, IActiveAiProviderSettingsReader active)
{
    public async Task<IReadOnlyList<AiAdminProfileResponse>> ListProfilesAsync(CancellationToken ct)
    {
        var all = deployment.GetProfiles().ToDictionary(pair => pair.Key, pair => pair.Value);
        var dbProfiles = await profiles.ListAsync(ct);
        foreach (var p in dbProfiles) all[p.Id] = new(p.Id, p.DisplayName, p.BaseUrl, p.Model, p.CredentialId, p.Enabled, AiProfileDefinitionSource.Database, p.Revision);
        var selected = (await active.GetAsync(ct))?.Provider;
        var result = new List<AiAdminProfileResponse>();
        foreach (var profile in all.Values.OrderBy(x => x.Id.AsPrimitive(), StringComparer.Ordinal))
        {
            var credential = await resolver.ResolveAsync(profile.CredentialId, ct); var validation = await credentials.GetLatestValidationAsync(profile.Id, ct);
            var validForFence = validation is not null && validation.ProfileRevision == profile.Revision && validation.CredentialRevision == (credential?.Revision ?? -1);
            result.Add(new(profile.Id, profile.DisplayName, profile.Adapter, profile.BaseUrl, profile.Model, profile.CredentialId, profile.Enabled, Wire(profile.Source), profile.Revision,
                selected == profile.Id, Wire(credential?.Source ?? AiCredentialSource.None), credential is not null, credential?.Revision ?? 0,
                Wire(validForFence ? validation!.Status : AiCredentialValidationStatus.Untested), validForFence ? validation!.TestedAt : null));
        }
        return result;
    }
    public async Task<IReadOnlyList<AiAdminCredentialResponse>> ListCredentialsAsync(CancellationToken ct)
    {
        var result = new List<AiAdminCredentialResponse>(); var dbProfiles = await profiles.ListAsync(ct); var deploymentProfiles = deployment.GetProfiles().Values;
        foreach (var credential in await credentials.ListAsync(ct))
            result.Add(new(credential.Id, credential.DisplayName, $"••••••••{credential.SecretHint}", Wire(AiCredentialSource.Database), credential.Revision, credential.UpdatedAt,
                dbProfiles.Count(p => p.CredentialId == credential.Id) + deploymentProfiles.Count(p => p.CredentialId == credential.Id)));
        return result;
    }

    private static string Wire<T>(T value) where T : struct, Enum
    {
        var text = value.ToString();
        return char.ToLowerInvariant(text[0]) + text[1..];
    }
}
