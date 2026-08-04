using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;

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
    public async Task StartupRejectsPersistentModeUntilMigrationsExist()
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
                builder.UseSetting("Database:RecreateOnStartup", "false");
            });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => factory.CreateClient().GetAsync("/api/scenarios/SCN-STAR-LIBRARY"));
        Assert.Contains("production EF migrations", exception.ToString(), StringComparison.Ordinal);
        Assert.Contains("destructive clean-schema baseline", exception.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task SqliteBaselineContainsTypedLifecycleColumnsAndRequiredIndexes()
    {
        await StartApiAsync(recreateOnStartup: true);
        await using var connection = new SqliteConnection($"Data Source={dbPath}");
        await connection.OpenAsync();

        Assert.Equal("TEXT", await ColumnTypeAsync(connection, "SessionAiInteractions", "Stage"));
        Assert.Equal("TEXT", await ColumnTypeAsync(connection, "SessionAiInteractions", "Status"));
        Assert.Equal("TEXT", await ColumnTypeAsync(connection, "SessionArtifacts", "Kind"));
        Assert.Equal("TEXT", await ColumnTypeAsync(connection, "SessionArtifacts", "Status"));
        Assert.True(await IndexExistsAsync(connection, "IX_SessionTurns_SessionId_Position"));
        Assert.True(await IndexExistsAsync(connection, "IX_SessionPlayerInputs_SessionId_RequestId"));
        Assert.True(await IndexExistsAsync(connection, "IX_SessionExecutions_SessionId_IdempotencyKey"));
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

    private static async Task<string?> ColumnTypeAsync(SqliteConnection connection, string table, string column)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info(\"{table}\")";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            if (string.Equals(reader.GetString(1), column, StringComparison.Ordinal))
                return reader.GetString(2);
        return null;
    }

    private static async Task<bool> IndexExistsAsync(SqliteConnection connection, string index)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND name = $name";
        command.Parameters.AddWithValue("$name", index);
        return (long)(await command.ExecuteScalarAsync())! == 1;
    }

    public void Dispose()
    {
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }
}
