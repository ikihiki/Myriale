using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public static class ScenarioRuleSchemaUpgrade
{
    public static async Task ApplyAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (db.Database.IsSqlite())
        {
            await AddSqliteColumn(db, "ScenarioObjectTypes", "GenericActionRulesJson", "TEXT NOT NULL DEFAULT '[]'", cancellationToken);
            await AddSqliteColumn(db, "ScenarioObjects", "MixinTypeCodesJson", "TEXT NOT NULL DEFAULT '[]'", cancellationToken);
            await AddSqliteColumn(db, "ScenarioObjects", "LocalStateSchemaJson", "TEXT NOT NULL DEFAULT '{}'", cancellationToken);
            await AddSqliteColumn(db, "ScenarioObjects", "LocalDefaultStateJson", "TEXT NOT NULL DEFAULT '{}'", cancellationToken);
            await AddSqliteColumn(db, "ScenarioObjects", "LocalPublicProjectionJson", "TEXT NOT NULL DEFAULT '{}'", cancellationToken);
            await AddSqliteColumn(db, "ScenarioObjects", "LocalActionsJson", "TEXT NOT NULL DEFAULT '[]'", cancellationToken);
            await AddSqliteColumn(db, "ScenarioObjects", "LocalActionRulesJson", "TEXT NOT NULL DEFAULT '[]'", cancellationToken);
            await db.Database.ExecuteSqlRawAsync("""
                UPDATE "ScenarioObjects"
                SET "MixinTypeCodesJson" = json_array((SELECT "Code" FROM "ScenarioObjectTypes" WHERE "Id" = "ScenarioObjects"."ObjectTypeId"))
                WHERE "MixinTypeCodesJson" IN ('[]', '');
                """, cancellationToken);
        }
        else if (db.Database.IsNpgsql())
        {
            await db.Database.ExecuteSqlRawAsync("""
                ALTER TABLE "ScenarioObjectTypes" ADD COLUMN IF NOT EXISTS "GenericActionRulesJson" text NOT NULL DEFAULT '[]';
                ALTER TABLE "ScenarioObjects" ADD COLUMN IF NOT EXISTS "MixinTypeCodesJson" text NOT NULL DEFAULT '[]';
                ALTER TABLE "ScenarioObjects" ADD COLUMN IF NOT EXISTS "LocalStateSchemaJson" text NOT NULL DEFAULT '{}';
                ALTER TABLE "ScenarioObjects" ADD COLUMN IF NOT EXISTS "LocalDefaultStateJson" text NOT NULL DEFAULT '{}';
                ALTER TABLE "ScenarioObjects" ADD COLUMN IF NOT EXISTS "LocalPublicProjectionJson" text NOT NULL DEFAULT '{}';
                ALTER TABLE "ScenarioObjects" ADD COLUMN IF NOT EXISTS "LocalActionsJson" text NOT NULL DEFAULT '[]';
                ALTER TABLE "ScenarioObjects" ADD COLUMN IF NOT EXISTS "LocalActionRulesJson" text NOT NULL DEFAULT '[]';
                UPDATE "ScenarioObjects" AS o SET "MixinTypeCodesJson" = json_build_array(t."Code")::text
                FROM "ScenarioObjectTypes" AS t WHERE t."Id" = o."ObjectTypeId" AND o."MixinTypeCodesJson" IN ('[]', '');
                """, cancellationToken);
        }
    }

    private static async Task AddSqliteColumn(ApplicationDbContext db, string table, string column, string definition, CancellationToken cancellationToken)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        if (command.Connection!.State != System.Data.ConnectionState.Open) await command.Connection.OpenAsync(cancellationToken);
        command.CommandText = $"PRAGMA table_info(\"{table}\")";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) if (string.Equals(reader.GetString(1), column, StringComparison.Ordinal)) return;
        await reader.DisposeAsync();
        command.CommandText = $"ALTER TABLE \"{table}\" ADD COLUMN \"{column}\" {definition}";
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
