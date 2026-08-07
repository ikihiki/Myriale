using System.Text.Json;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.Api.Features.AiProviders.Infrastructure;

namespace Myriale.Api.Tests;

public sealed class AiProviderProfileDomainSliceTests
{
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-08-04T12:00:00Z");

    [Fact]
    public void AggregatesValidateEncapsulateAndIncrementRevision()
    {
        var profile = AiProviderProfile.Create(new AiProviderProfileId("Acme.Main"), "Acme", "https://acme.test/v1/", "model", new AiCredentialId("Shared"), true, Now);
        Assert.Equal("acme.main", profile.Id.AsPrimitive()); Assert.Equal("https://acme.test/v1", profile.BaseUrl); Assert.Equal(1, profile.Revision);
        profile.Update("Acme 2", "https://acme.test/v2", "model-2", new AiCredentialId("shared"), 1, Now.AddMinutes(1)); Assert.Equal(2, profile.Revision);
        Assert.Throws<AiRevisionConflictException>(() => profile.Disable(1, Now));
        var credential = AiCredential.Create(new AiCredentialId("shared"), "Shared", "protected", "1234", Now); credential.Replace("Shared 2", "protected-2", "5678", 1, Now.AddMinutes(1)); Assert.Equal(2, credential.Revision);
        Assert.Throws<ArgumentException>(() => AiProviderProfile.Create(new AiProviderProfileId("bad id"), "Bad", "https://bad.test", "model", new AiCredentialId("cred"), true, Now));
        foreach (var type in new[] { typeof(AiProviderProfile), typeof(AiCredential), typeof(AiProviderProfileValidation) })
            Assert.DoesNotContain(type.GetProperties(), property => property.SetMethod?.IsPublic == true);
    }

    [Fact]
    public void ValidationUsesTypedGuidIdentifierWithGuidJsonShape()
    {
        var validation = AiProviderProfileValidation.Record(
            new AiProviderProfileId("profile"), 1, new AiCredentialId("credential"), 1,
            AiCredentialValidationStatus.Valid, null, Now);

        Assert.IsType<AiProviderProfileValidationId>(validation.Id);
        Assert.Equal(validation.Id.AsPrimitive().ToString("D"), JsonSerializer.Deserialize<string>(JsonSerializer.Serialize(validation.Id)));
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
        profileRepo.Add(AiProviderProfile.Create(new AiProviderProfileId("same"), "Database", "https://db.test/v1", "db-model", new AiCredentialId("shared"), true, Now));
        credentialRepo.Add(AiCredential.Create(new AiCredentialId("shared"), "DB", "protected:db-secret", "cret", Now)); await profileRepo.SaveAsync(default);
        var deploymentOptions = Microsoft.Extensions.Options.Options.Create(new AiProviderDeploymentOptions
        {
            Profiles = new() { ["same"] = new() { DisplayName = "Deployment", BaseUrl = "https://deployment.test/v1", Model = "deployment-model", CredentialId = "shared" } },
            Credentials = new() { ["shared"] = new() { Secret = "deployment-secret" } }
        });
        var source = new ConfigurationAiDeploymentCatalogSource(
            deploymentOptions,
            Microsoft.Extensions.Options.Options.Create(new AiProviderCatalogOptions()));
        var catalog = new AiProfileCatalog(source, profileRepo, Microsoft.Extensions.Options.Options.Create(new AiProviderOptions()));
        var resolved = await catalog.ResolveAsync(new AiProviderProfileId("same"), default); Assert.Equal("Database", resolved.DisplayName); Assert.Equal(AiProfileDefinitionSource.Database, resolved.Source);
        var credential = await new AiRuntimeCredentialResolver(source, credentialRepo, new Protector()).ResolveAsync(new AiCredentialId("shared"), default);
        Assert.Equal("deployment-secret", credential!.Secret); Assert.Equal(AiCredentialSource.Deployment, credential.Source);
    }

    [Fact]
    public async Task CatalogJsonAddsArbitraryProfilesCredentialsAndDefaultSelections()
    {
        await using var db = await OpenDatabaseAsync();
        var source = new ConfigurationAiDeploymentCatalogSource(
            Microsoft.Extensions.Options.Options.Create(new AiProviderDeploymentOptions
            {
                Credentials = new() { ["shared"] = new() { Secret = "structured-secret" } }
            }),
            Microsoft.Extensions.Options.Options.Create(new AiProviderCatalogOptions
            {
                CatalogJson = """
                    {
                      "defaultActionDecisionProfileId": "future-fast",
                      "defaultNarrativeProfileId": "future-story",
                      "profiles": {
                        "future-fast": {
                          "displayName": "Future Fast",
                          "adapter": "openai-compatible",
                          "baseUrl": "https://future.example/v1",
                          "model": "future/fast",
                          "credentialId": "shared",
                          "apiKey": "catalog-secret"
                        },
                        "future-story": {
                          "displayName": "Future Story",
                          "adapter": "openai-compatible",
                          "baseUrl": "https://story.example/v1",
                          "model": "future/story",
                          "credentialId": "shared"
                        }
                      }
                    }
                    """
            }));
        var snapshot = source.GetSnapshot();
        var catalog = new AiProfileCatalog(
            source,
            new EfAiProviderProfileRepository(db),
            Microsoft.Extensions.Options.Options.Create(new AiProviderOptions()));
        var resolved = await catalog.GetAsync(default);

        Assert.Equal(2, snapshot.Profiles.Count);
        Assert.Equal("catalog-secret", snapshot.Credentials[new AiCredentialId("shared")]);
        Assert.Equal(new AiProviderProfileId("future-fast"), resolved.DefaultActionDecisionProfileId);
        Assert.Equal(new AiProviderProfileId("future-story"), resolved.DefaultNarrativeProfileId);
        Assert.All(resolved.Profiles.Values, profile => Assert.Equal(AiProfileDefinitionSource.Deployment, profile.Source));
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
            r1.Add(AiProviderProfile.Create(new AiProviderProfileId("same"), "One", "https://one.test", "model", new AiCredentialId("cred"), true, Now));
            r2.Add(AiProviderProfile.Create(new AiProviderProfileId("same"), "Two", "https://two.test", "model", new AiCredentialId("cred"), true, Now));
            Assert.True(await r1.SaveAsync(default)); Assert.False(await r2.SaveAsync(default));
            await using var db3 = new ApplicationDbContext(options); await using var db4 = new ApplicationDbContext(options);
            var a = new EfAiProviderProfileRepository(db3); var b = new EfAiProviderProfileRepository(db4); var p1 = await a.LoadAsync(new("same"), default); var p2 = await b.LoadAsync(new("same"), default);
            p1!.Update("First", "https://one.test", "m1", new AiCredentialId("cred"), 1, Now); p2!.Update("Second", "https://two.test", "m2", new AiCredentialId("cred"), 1, Now);
            Assert.True(await a.SaveAsync(default)); Assert.False(await b.SaveAsync(default));
        }
        finally { if (File.Exists(path)) File.Delete(path); }
    }

    private static async Task<ApplicationDbContext> OpenDatabaseAsync() { var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlite("Data Source=:memory:").Options); await db.Database.OpenConnectionAsync(); await db.Database.EnsureCreatedAsync(); return db; }
    private sealed class Protector : IAiSecretProtector { public string Protect(string secret) => "protected:" + secret; public string Unprotect(string protectedSecret) => protectedSecret[10..]; }
}
