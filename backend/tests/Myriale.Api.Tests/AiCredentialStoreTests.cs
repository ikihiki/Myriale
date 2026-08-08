using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.AiProviders.Infrastructure;

namespace Myriale.Api.Tests;

public sealed class AiCredentialStoreTests
{
    [Fact]
    public async Task DeploymentCredentialOverridesEncryptedDatabaseCredential()
    {
        await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);
        await db.Database.OpenConnectionAsync(); await db.Database.EnsureCreatedAsync();
        var repository = new EfAiCredentialRepository(db); var protector = new FakeProtector();
        repository.Add(AiCredential.Create(new AiCredentialId("shared"), "DB", protector.Protect("database-secret"), "cret", DateTimeOffset.UtcNow)); await repository.SaveAsync(default);
        var deployment = new ConfigurationAiDeploymentCatalogSource(
            Options.Create(new AiProviderDeploymentOptions { Credentials = new() { ["shared"] = new() { Secret = "deployment-secret" } } }),
            Options.Create(new AiProviderCatalogOptions()));
        var resolver = new AiRuntimeCredentialResolver(deployment, repository, protector);
        var result = await resolver.ResolveAsync(new AiCredentialId("shared"), default);
        Assert.Equal("deployment-secret", result!.Secret); Assert.Equal(AiCredentialSource.Deployment, result.Source); Assert.Equal(0, result.Revision);
    }
    [Fact]
    public async Task CatalogJsonCredentialOverridesEncryptedDatabaseCredential()
    {
        await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);
        await db.Database.OpenConnectionAsync();
        await db.Database.EnsureCreatedAsync();
        var repository = new EfAiCredentialRepository(db);
        var protector = new FakeProtector();
        repository.Add(AiCredential.Create(new AiCredentialId("future"), "DB", protector.Protect("database-secret"), "cret", DateTimeOffset.UtcNow));
        await repository.SaveAsync(default);
        var deployment = new ConfigurationAiDeploymentCatalogSource(
            Options.Create(new AiProviderDeploymentOptions()),
            Options.Create(new AiProviderCatalogOptions
            {
                CatalogJson = """
                    {
                      "profiles": [{
                        "id": "future-profile",
                        "displayName": "Future",
                        "adapter": "openai-compatible",
                        "baseUrl": "https://future.test/v1",
                        "model": "future-model",
                        "credentialId": "future"
                      }],
                      "credentials": { "future": { "secret": "catalog-secret" } }
                    }
                    """
            }));

        var result = await new AiRuntimeCredentialResolver(deployment, repository, protector)
            .ResolveAsync(new AiCredentialId("future"), default);

        Assert.Equal("catalog-secret", result!.Secret);
        Assert.Equal(AiCredentialSource.Deployment, result.Source);
        Assert.Equal(0, result.Revision);
    }

    private sealed class FakeProtector : IAiSecretProtector { public string Protect(string secret) => "protected:" + secret; public string Unprotect(string secret) => secret[10..]; }
}
