using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class AiCredentialStoreTests
{
    [Fact]
    public async Task EnvironmentCredentialOverridesEncryptedDatabaseCredential()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"myriale-ai-credential-{Guid.NewGuid():N}.db");
        var keyPath = Path.Combine(Path.GetTempPath(), $"myriale-ai-keyring-{Guid.NewGuid():N}");
        Directory.CreateDirectory(keyPath);
        try
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite($"Data Source={databasePath}")
                .Options;
            await using var db = new ApplicationDbContext(options);
            await db.Database.EnsureCreatedAsync();
            var protection = DataProtectionProvider.Create(new DirectoryInfo(keyPath));
            var databaseStore = new DataProtectionAiCredentialStore(db, protection, new ConfigurationBuilder().Build());
            await databaseStore.SaveAsync("runpod", "Runpod", "database-secret", default);

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["AiProvider:ApiKey"] = "vault-secret"
                })
                .Build();
            var vaultBackedStore = new DataProtectionAiCredentialStore(db, protection, configuration);

            Assert.Equal("vault-secret", await vaultBackedStore.GetAsync("runpod", default));
        }
        finally
        {
            if (File.Exists(databasePath)) File.Delete(databasePath);
            if (Directory.Exists(keyPath)) Directory.Delete(keyPath, recursive: true);
        }
    }
}
