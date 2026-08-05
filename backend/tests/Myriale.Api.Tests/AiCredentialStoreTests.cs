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
        repository.Add(AiCredential.Create("shared", "DB", protector.Protect("database-secret"), "cret", DateTimeOffset.UtcNow)); await repository.SaveAsync(default);
        var deployment = Options.Create(new AiProviderDeploymentOptions { Credentials = new() { ["shared"] = new() { Secret = "deployment-secret" } } });
        var resolver = new AiRuntimeCredentialResolver(deployment, repository, protector);
        var result = await resolver.ResolveAsync("shared", default);
        Assert.Equal("deployment-secret", result!.Secret); Assert.Equal(AiCredentialSource.Deployment, result.Source); Assert.Equal(0, result.Revision);
    }
    private sealed class FakeProtector : IAiSecretProtector { public string Protect(string secret) => "protected:" + secret; public string Unprotect(string secret) => secret[10..]; }
}
