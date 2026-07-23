using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace Myriale.Api.Tests;

public sealed class DatabaseInitializationTests : IDisposable
{
    private readonly string dbPath = Path.Combine(Path.GetTempPath(), $"myriale-database-initialization-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task StartupDropsExistingSchemaBeforeCreatingCurrentModel()
    {
        await using (var legacyConnection = new SqliteConnection($"Data Source={dbPath}"))
        {
            await legacyConnection.OpenAsync();
            await using var legacyCommand = legacyConnection.CreateCommand();
            legacyCommand.CommandText = "CREATE TABLE LegacySessions (Id TEXT PRIMARY KEY); INSERT INTO LegacySessions VALUES ('legacy');";
            await legacyCommand.ExecuteNonQueryAsync();
        }

        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}"));
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/scenarios/SCN-STAR-LIBRARY");
        response.EnsureSuccessStatusCode();

        await using var currentConnection = new SqliteConnection($"Data Source={dbPath}");
        await currentConnection.OpenAsync();

        await using var legacyTableCommand = currentConnection.CreateCommand();
        legacyTableCommand.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'LegacySessions'";
        Assert.Equal(0L, (long)(await legacyTableCommand.ExecuteScalarAsync())!);

        await using var currentColumnCommand = currentConnection.CreateCommand();
        currentColumnCommand.CommandText = "SELECT COUNT(*) FROM pragma_table_info('SessionExecutionAttempts') WHERE name = 'ReceivedResult'";
        Assert.Equal(1L, (long)(await currentColumnCommand.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task StartupInstallsAndPinsConstellationDoorDemoModule()
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
              AND t.Id = 'SPT-STAR-LIBRARY-DOOR-REACHED'
              AND t.ModuleRandomValueCount = 1
            """;
        Assert.Equal(1L, (long)(await command.ExecuteScalarAsync())!);
    }

    public void Dispose()
    {
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }
}
