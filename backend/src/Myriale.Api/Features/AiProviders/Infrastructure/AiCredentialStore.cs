using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.AiProviders.Application;

namespace Myriale.Api.Features.AiProviders.Infrastructure;

public sealed record ResolvedAiCredential(string Secret, AiCredentialSource Source, long Revision, string MaskedSecret);
public interface IAiRuntimeCredentialResolver { Task<ResolvedAiCredential?> ResolveAsync(AiCredentialId credentialId, CancellationToken cancellationToken); }
public interface IAiSecretProtector { string Protect(string secret); string Unprotect(string protectedSecret); }
public sealed class DataProtectionAiSecretProtector(IDataProtectionProvider protection) : IAiSecretProtector
{
    private readonly IDataProtector _protector = protection.CreateProtector("Myriale.AiProviderCredentials.v2");
    public string Protect(string secret) => _protector.Protect(secret);
    public string Unprotect(string protectedSecret) => _protector.Unprotect(protectedSecret);
}
public sealed class AiRuntimeCredentialResolver(IOptions<AiProviderDeploymentOptions> deployment, IAiCredentialRepository repository, IAiSecretProtector protector) : IAiRuntimeCredentialResolver
{
    public async Task<ResolvedAiCredential?> ResolveAsync(AiCredentialId credentialId, CancellationToken cancellationToken)
    {
        if (deployment.Value.Credentials.TryGetValue(credentialId.AsPrimitive(), out var configured) && !string.IsNullOrWhiteSpace(configured.Secret))
            return new(configured.Secret, AiCredentialSource.Deployment, 0, Mask(configured.Secret));
        var credential = await repository.LoadAsync(credentialId, cancellationToken);
        return credential is null ? null : new(protector.Unprotect(credential.ProtectedSecret), AiCredentialSource.Database, credential.Revision, MaskHint(credential.SecretHint));
    }
    public static string Hint(string secret) => secret.Length <= 4 ? secret : secret[^4..];
    public static string Mask(string secret) => string.IsNullOrEmpty(secret) ? "未設定" : MaskHint(Hint(secret));
    private static string MaskHint(string hint) => $"••••••••{hint}";
}
