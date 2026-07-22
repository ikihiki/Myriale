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

    public void Dispose()
    {
        if (File.Exists(dbPath)) File.Delete(dbPath);
    }
}
