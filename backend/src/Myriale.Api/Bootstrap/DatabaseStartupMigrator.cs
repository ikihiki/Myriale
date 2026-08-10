using System.Data;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Bootstrap;

internal static class DatabaseStartupMigrator
{
    private const string EfMigrationsHistoryTable = "__EFMigrationsHistory";
    private const string PostgresInitializationLock = "myriale-database-initialization";

    public static async Task InitializeAsync(
        ApplicationDbContext db,
        bool resetOnStartup,
        bool confirmResetDataLoss,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (resetOnStartup && !confirmResetDataLoss)
            throw new InvalidOperationException("Database reset requires Database:ConfirmResetDataLoss=true.");

        if (!db.Database.IsNpgsql())
        {
            await ResetLegacyDatabaseAndMigrateAsync(db, resetOnStartup, logger, cancellationToken);
            return;
        }

        var connection = db.Database.GetDbConnection();
        var closeConnection = connection.State != ConnectionState.Open;
        if (closeConnection) await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_lock(hashtext(current_database()), hashtext('{PostgresInitializationLock}'))",
                cancellationToken);
            try
            {
                await ResetLegacyDatabaseAndMigrateAsync(db, resetOnStartup, logger, cancellationToken);
            }
            finally
            {
                await db.Database.ExecuteSqlRawAsync(
                    $"SELECT pg_advisory_unlock(hashtext(current_database()), hashtext('{PostgresInitializationLock}'))",
                    cancellationToken);
            }
        }
        finally
        {
            if (closeConnection) await db.Database.CloseConnectionAsync();
        }
    }

    private static async Task ResetLegacyDatabaseAndMigrateAsync(
        ApplicationDbContext db,
        bool explicitReset,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var automaticLegacyReset = !explicitReset && await IsPreMigrationDatabaseAsync(db, cancellationToken);
        if (explicitReset || automaticLegacyReset)
        {
            if (automaticLegacyReset)
                logger.LogWarning(
                    "Detected pre-migration Myriale tables without {HistoryTable}; deleting the legacy database/schema before applying InitialCreate.",
                    EfMigrationsHistoryTable);
            else
                logger.LogWarning("Explicit confirmed database reset requested; deleting the database/schema before applying migrations.");
            await ResetDatabaseAsync(db, cancellationToken);
        }

        await db.Database.MigrateAsync(cancellationToken);
    }

    private static async Task<bool> IsPreMigrationDatabaseAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var existingTables = await ReadExistingTablesAsync(db, cancellationToken);
        if (existingTables.Any(table => string.Equals(table.Name, EfMigrationsHistoryTable, StringComparison.Ordinal)))
            return false;

        var defaultSchema = db.Database.IsNpgsql()
            ? await ReadCurrentPostgresSchemaAsync(db, cancellationToken)
            : null;
        var applicationTables = db.Model.GetRelationalModel().Tables
            .Select(table => new DatabaseTable(table.Schema ?? defaultSchema, table.Name))
            .ToArray();

        return existingTables.Any(existing => applicationTables.Any(application =>
            string.Equals(existing.Name, application.Name, StringComparison.Ordinal)
            && (!db.Database.IsNpgsql() || string.Equals(existing.Schema, application.Schema, StringComparison.Ordinal))));
    }

    private static async Task<IReadOnlyList<DatabaseTable>> ReadExistingTablesAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        var closeConnection = connection.State != ConnectionState.Open;
        if (closeConnection) await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = db.Database.IsNpgsql()
                ? """
                  SELECT table_schema, table_name
                  FROM information_schema.tables
                  WHERE table_type = 'BASE TABLE'
                    AND table_schema NOT IN ('pg_catalog', 'information_schema')
                  """
                : "SELECT NULL, name FROM sqlite_master WHERE type = 'table'";
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            var tables = new List<DatabaseTable>();
            while (await reader.ReadAsync(cancellationToken))
                tables.Add(new(reader.IsDBNull(0) ? null : reader.GetString(0), reader.GetString(1)));
            return tables;
        }
        finally
        {
            if (closeConnection) await db.Database.CloseConnectionAsync();
        }
    }

    private static async Task ResetDatabaseAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        if (!db.Database.IsNpgsql())
        {
            await db.Database.EnsureDeletedAsync(cancellationToken);
            return;
        }

        var connection = db.Database.GetDbConnection();
        var closeConnection = connection.State != ConnectionState.Open;
        if (closeConnection) await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            var schema = await ReadCurrentPostgresSchemaAsync(db, cancellationToken);
            var quotedSchema = $"\"{schema.Replace("\"", "\"\"")}\"";
            await using var command = connection.CreateCommand();
            command.CommandText = $"DROP SCHEMA IF EXISTS {quotedSchema} CASCADE; CREATE SCHEMA {quotedSchema};";
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (closeConnection) await db.Database.CloseConnectionAsync();
        }
    }

    private static async Task<string> ReadCurrentPostgresSchemaAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var connection = db.Database.GetDbConnection();
        var closeConnection = connection.State != ConnectionState.Open;
        if (closeConnection) await db.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT current_schema()";
            return (string?)await command.ExecuteScalarAsync(cancellationToken) ?? "public";
        }
        finally
        {
            if (closeConnection) await db.Database.CloseConnectionAsync();
        }
    }

    private sealed record DatabaseTable(string? Schema, string Name);
}
