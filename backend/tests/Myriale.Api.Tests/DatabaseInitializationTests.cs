using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace Myriale.Api.Tests;

public sealed class DatabaseInitializationTests : IDisposable
{
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-database-initialization-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task StartupRecreatesTheDatabaseByDefault()
    {
        await StartApiAsync(recreateOnStartup: true);
        await SetScenarioSummaryAsync("restart-marker");
        await StartApiAsync(recreateOnStartup: true);

        Assert.NotEqual("restart-marker", await GetScenarioSummaryAsync());
    }

    [Fact]
    public async Task FuturePersistentLifecycleCanDisableStartupRecreation()
    {
        await StartApiAsync(recreateOnStartup: true);
        await SetScenarioSummaryAsync("restart-marker");
        await StartApiAsync(recreateOnStartup: false);

        Assert.Equal("restart-marker", await GetScenarioSummaryAsync());
    }

    [Fact]
    public async Task ProductionDefaultsDoNotExposeClientSessionModuleTurnCreation()
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}"));
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var response = await client.PostAsJsonAsync("/api/sessions/SES-UNKNOWN/module-turns", new { });
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task StartupInstallsAndPinsBothDemoModules()
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
                builder.UseSetting("DemoModules:Enabled", "true");
                builder.UseSetting("DemoModules:EnableInTestHost", "true");
            });
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/scenarios/SCN-STAR-LIBRARY");
        response.EnsureSuccessStatusCode();

        await using var connection = new SqliteConnection($"Data Source={dbPath}");
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT COUNT(*)
            FROM ModulePackages p
            JOIN ScenarioProgressionTransitions t ON t.ModuleDigest = p.Digest
            WHERE p.ModuleId = 'com.myriale.star-eater.constellation-door'
              AND p.Version = '1.0.0'
              AND p.IsEnabled = 1
              AND t.Id IN ('SPT-STAR-LIBRARY-DOOR-REACHED', 'SPT-NEON-ARCHIVE-FIREWALL-REACHED')
              AND t.ModuleRandomValueCount = 1
            """;
        Assert.Equal(2L, (long)(await command.ExecuteScalarAsync())!);

        await using var packageCount = connection.CreateCommand();
        packageCount.CommandText = "SELECT COUNT(*) FROM ModulePackages WHERE IsEnabled = 1";
        Assert.Equal(2L, (long)(await packageCount.ExecuteScalarAsync())!);

        await using var battlePackage = connection.CreateCommand();
        battlePackage.CommandText = """
            SELECT COUNT(*)
            FROM ModulePackages p
            JOIN ScenarioProgressionTransitions t ON t.ModuleDigest = p.Digest
            WHERE p.ModuleId = 'com.myriale.rules.turn-battle'
              AND p.Version = '1.0.0'
              AND p.IsEnabled = 1
              AND t.Id = 'SPT-STAR-LIBRARY-GUARDIAN-AWAKENED'
            """;
        Assert.Equal(1L, (long)(await battlePackage.ExecuteScalarAsync())!);

        await using var sharedDigest = connection.CreateCommand();
        sharedDigest.CommandText = """
            SELECT COUNT(DISTINCT ModuleDigest)
            FROM ScenarioProgressionTransitions
            WHERE Id IN ('SPT-STAR-LIBRARY-DOOR-REACHED', 'SPT-NEON-ARCHIVE-FIREWALL-REACHED')
            """;
        Assert.Equal(1L, (long)(await sharedDigest.ExecuteScalarAsync())!);
    }

    private async Task StartApiAsync(bool recreateOnStartup)
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
                builder.UseSetting("Database:RecreateOnStartup", recreateOnStartup.ToString());
            });
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/scenarios/SCN-STAR-LIBRARY");
        response.EnsureSuccessStatusCode();
    }

    private async Task SetScenarioSummaryAsync(string summary)
    {
        await using var connection = new SqliteConnection($"Data Source={dbPath}");
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "UPDATE Scenarios SET Summary = $summary WHERE Id = 'SCN-STAR-LIBRARY'";
        command.Parameters.AddWithValue("$summary", summary);
        Assert.Equal(1, await command.ExecuteNonQueryAsync());
    }

    private async Task<string> GetScenarioSummaryAsync()
    {
        await using var connection = new SqliteConnection($"Data Source={dbPath}");
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Summary FROM Scenarios WHERE Id = 'SCN-STAR-LIBRARY'";
        return (string)(await command.ExecuteScalarAsync())!;
    }

    public void Dispose()
    {
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }
}
