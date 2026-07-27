using System.Data;
using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

internal static class DatabaseSchemaUpgrade
{
    public static async Task EnsureScenarioDefinitionStartLocationAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (db.Database.IsNpgsql())
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE \"ScenarioDefinitionVersions\" ADD COLUMN IF NOT EXISTS \"StartLocationCode\" character varying(80) NULL;",
                cancellationToken);
            return;
        }

        if (!db.Database.IsSqlite()) return;
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose) await connection.OpenAsync(cancellationToken);
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA table_info(\"ScenarioDefinitionVersions\");";
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var exists = false;
            while (await reader.ReadAsync(cancellationToken))
            {
                if (string.Equals(reader.GetString(1), "StartLocationCode", StringComparison.Ordinal))
                {
                    exists = true;
                    break;
                }
            }
            await reader.DisposeAsync();
            if (!exists)
                await db.Database.ExecuteSqlRawAsync(
                    "ALTER TABLE \"ScenarioDefinitionVersions\" ADD COLUMN \"StartLocationCode\" TEXT NULL;",
                    cancellationToken);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }
}
