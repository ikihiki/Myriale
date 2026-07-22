using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class DataProtectionAiCredentialStore(ApplicationDbContext db, IDataProtectionProvider protection, IConfiguration configuration) : IAiCredentialStore
{
    private readonly IDataProtector _protector = protection.CreateProtector("Myriale.AiProviderCredentials.v1");
    public async Task SaveAsync(string provider, string displayName, string secret, CancellationToken cancellationToken)
    {
        var row = await db.AiProviderKeys.FindAsync([provider], cancellationToken);
        if (row is null) { row = new AiProviderKey { Provider = provider }; db.Add(row); }
        row.DisplayName = displayName;
        row.Secret = _protector.Protect(secret);
        row.SecretHint = LastFour(secret);
        row.Status = "saved";
        row.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }
    public async Task<string?> GetAsync(string provider, CancellationToken cancellationToken)
    {
        var configured = configuration[$"AiProvider:Providers:{provider}:ApiKey"];
        if (string.IsNullOrWhiteSpace(configured)
            && string.Equals(configuration["AiProvider:Provider"], provider, StringComparison.OrdinalIgnoreCase))
            configured = configuration["AiProvider:ApiKey"];
        if (!string.IsNullOrWhiteSpace(configured)) return configured;

        var encrypted = await db.AiProviderKeys.AsNoTracking().Where(x => x.Provider == provider).Select(x => x.Secret).SingleOrDefaultAsync(cancellationToken);
        return string.IsNullOrWhiteSpace(encrypted) ? null : _protector.Unprotect(encrypted);
    }
    public async Task DeleteAsync(string provider, CancellationToken cancellationToken)
    {
        var row = await db.AiProviderKeys.FindAsync([provider], cancellationToken);
        if (row is not null) { db.Remove(row); await db.SaveChangesAsync(cancellationToken); }
    }
    public string Mask(string secret) => string.IsNullOrEmpty(secret) ? "未設定" : $"••••••••{LastFour(secret)}";
    private static string LastFour(string secret) => secret.Length <= 4 ? secret : secret[^4..];
}
