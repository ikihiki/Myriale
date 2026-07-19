using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

public static class DatabaseSchemaInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        var created = await db.Database.EnsureCreatedAsync(cancellationToken);
        if (created) return;

        var sql = db.Database.IsNpgsql() ? PostgreSql : Sqlite;
        await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
    }

    private const string Sqlite = """
        CREATE TABLE IF NOT EXISTS ModulePackages (
            Digest TEXT NOT NULL CONSTRAINT PK_ModulePackages PRIMARY KEY,
            ModuleId TEXT NOT NULL,
            Version TEXT NOT NULL,
            ContractVersion TEXT NOT NULL,
            DisplayName TEXT NOT NULL,
            Description TEXT NOT NULL,
            ManifestJson TEXT NOT NULL,
            PackageRelativePath TEXT NOT NULL,
            ExpandedRelativePath TEXT NOT NULL,
            Status TEXT NOT NULL,
            LastError TEXT NULL,
            IsEnabled INTEGER NOT NULL,
            InstalledAt TEXT NOT NULL,
            LastScannedAt TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS IX_ModulePackages_ModuleId_Version ON ModulePackages (ModuleId, Version);
        """;

    private const string PostgreSql = """
        CREATE TABLE IF NOT EXISTS "ModulePackages" (
            "Digest" character varying(64) NOT NULL,
            "ModuleId" character varying(200) NOT NULL,
            "Version" character varying(64) NOT NULL,
            "ContractVersion" character varying(32) NOT NULL,
            "DisplayName" character varying(200) NOT NULL,
            "Description" character varying(2000) NOT NULL,
            "ManifestJson" text NOT NULL,
            "PackageRelativePath" character varying(500) NOT NULL,
            "ExpandedRelativePath" character varying(500) NOT NULL,
            "Status" character varying(32) NOT NULL,
            "LastError" character varying(2000),
            "IsEnabled" boolean NOT NULL,
            "InstalledAt" timestamp with time zone NOT NULL,
            "LastScannedAt" timestamp with time zone NOT NULL,
            CONSTRAINT "PK_ModulePackages" PRIMARY KEY ("Digest")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ModulePackages_ModuleId_Version" ON "ModulePackages" ("ModuleId", "Version");
        """;
}
