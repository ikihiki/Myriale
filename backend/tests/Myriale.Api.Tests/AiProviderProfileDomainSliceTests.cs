using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.AiProviders;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Infrastructure.AiProviders;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class AiProviderProfileDomainSliceTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-08-04T12:00:00Z");

    [Fact]
    public void AggregatesValidateEncapsulateAndIncrementRevision()
    {
        var profile = AiProviderProfile.Create("Acme.Main", "Acme", "https://acme.test/v1/", "model", "Shared", true, Now);
        Assert.Equal("acme.main", profile.Id.AsPrimitive()); Assert.Equal("https://acme.test/v1", profile.BaseUrl); Assert.Equal(1, profile.Revision);
        profile.Update("Acme 2", "https://acme.test/v2", "model-2", "shared", 1, Now.AddMinutes(1)); Assert.Equal(2, profile.Revision);
        Assert.Throws<AiRevisionConflictException>(() => profile.Disable(1, Now));
        var credential = AiCredential.Create("shared", "Shared", "protected", "1234", Now); credential.Replace("Shared 2", "protected-2", "5678", 1, Now.AddMinutes(1)); Assert.Equal(2, credential.Revision);
        Assert.Throws<ArgumentException>(() => AiProviderProfile.Create("bad id", "Bad", "https://bad.test", "model", "cred", true, Now));
        foreach (var type in new[] { typeof(AiProviderProfile), typeof(AiCredential), typeof(AiProviderProfileValidation) })
            Assert.DoesNotContain(type.GetProperties(), property => property.SetMethod?.IsPublic == true);
    }

    [Fact]
    public void RevisionsAreEfConcurrencyTokensAndAdminEndpointsDoNotUseDbContext()
    {
        using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options);
        Assert.True(db.Model.FindEntityType(typeof(AiProviderProfile))!.FindProperty(nameof(AiProviderProfile.Revision))!.IsConcurrencyToken);
        Assert.True(db.Model.FindEntityType(typeof(AiCredential))!.FindProperty(nameof(AiCredential.Revision))!.IsConcurrencyToken);
        Assert.All(typeof(AiAdminEndpoints).GetMethods(BindingFlags.NonPublic | BindingFlags.Static), method => Assert.DoesNotContain(method.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext)));
    }

    [Fact]
    public void LegacyContractsOptionsAndSecretDescriptorAreAbsent()
    {
        var assembly = typeof(AiProviderProfile).Assembly;
        Assert.Null(assembly.GetType("Myriale.Api.Data.AiProviderKey"));
        Assert.Null(assembly.GetType("Myriale.Api.Data.AiProviderProfileDefinition"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.IAiCredentialStore"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.IAiProviderSelectionStore"));
        Assert.Null(typeof(AiProfileDescriptor).GetProperty("ApiKey"));
        var forbidden = new[] { "Provider", "Model", "BaseUrl", "ApiKey", "Providers", "Profiles", "CatalogJson" };
        Assert.DoesNotContain(typeof(AiProviderOptions).GetProperties(), property => forbidden.Contains(property.Name));
    }

    [Fact]
    public async Task DatabaseProfileOverridesDeploymentDefinitionButDeploymentCredentialOverridesDatabaseSecret()
    {
        await using var db = await OpenDatabaseAsync();
        var profileRepo = new EfAiProviderProfileRepository(db); var credentialRepo = new EfAiCredentialRepository(db);
        profileRepo.Add(AiProviderProfile.Create("same", "Database", "https://db.test/v1", "db-model", "shared", true, Now));
        credentialRepo.Add(AiCredential.Create("shared", "DB", "protected:db-secret", "cret", Now)); await profileRepo.SaveAsync(default);
        var deploymentOptions = Microsoft.Extensions.Options.Options.Create(new AiProviderDeploymentOptions
        {
            Profiles = new() { ["same"] = new() { DisplayName = "Deployment", BaseUrl = "https://deployment.test/v1", Model = "deployment-model", CredentialId = "shared" } },
            Credentials = new() { ["shared"] = new() { Secret = "deployment-secret" } }
        });
        var source = new OptionsAiDeploymentProfileSource(deploymentOptions);
        var catalog = new AiProfileCatalog(source, profileRepo, Microsoft.Extensions.Options.Options.Create(new AiProviderOptions()));
        var resolved = await catalog.ResolveAsync("same", default); Assert.Equal("Database", resolved.DisplayName); Assert.Equal(AiProfileDefinitionSource.Database, resolved.Source);
        var credential = await new AiRuntimeCredentialResolver(deploymentOptions, credentialRepo, new Protector()).ResolveAsync("shared", default);
        Assert.Equal("deployment-secret", credential!.Secret); Assert.Equal(AiCredentialSource.Deployment, credential.Source);
    }

    [Fact]
    public async Task ConcurrentCreateAndStaleUpdateBecomeConflict()
    {
        var path = Path.Combine(Path.GetTempPath(), $"ai-profile-{Guid.NewGuid():N}.db");
        try
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite($"Data Source={path}").Options;
            await using (var setup = new ApplicationDbContext(options)) await setup.Database.EnsureCreatedAsync();
            await using var db1 = new ApplicationDbContext(options); await using var db2 = new ApplicationDbContext(options);
            var r1 = new EfAiProviderProfileRepository(db1); var r2 = new EfAiProviderProfileRepository(db2);
            r1.Add(AiProviderProfile.Create("same", "One", "https://one.test", "model", "cred", true, Now));
            r2.Add(AiProviderProfile.Create("same", "Two", "https://two.test", "model", "cred", true, Now));
            Assert.True(await r1.SaveAsync(default)); Assert.False(await r2.SaveAsync(default));
            await using var db3 = new ApplicationDbContext(options); await using var db4 = new ApplicationDbContext(options);
            var a = new EfAiProviderProfileRepository(db3); var b = new EfAiProviderProfileRepository(db4); var p1 = await a.LoadAsync(new("same"), default); var p2 = await b.LoadAsync(new("same"), default);
            p1!.Update("First", "https://one.test", "m1", "cred", 1, Now); p2!.Update("Second", "https://two.test", "m2", "cred", 1, Now);
            Assert.True(await a.SaveAsync(default)); Assert.False(await b.SaveAsync(default));
        }
        finally { if (File.Exists(path)) File.Delete(path); }
    }

    private static async Task<ApplicationDbContext> OpenDatabaseAsync() { var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options); await db.Database.OpenConnectionAsync(); await db.Database.EnsureCreatedAsync(); return db; }
    private sealed class Protector : IAiSecretProtector { public string Protect(string secret) => "protected:" + secret; public string Unprotect(string protectedSecret) => protectedSecret[10..]; }
}
