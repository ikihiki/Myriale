using Microsoft.EntityFrameworkCore;

namespace Myriale.Api.Data;

/// <summary>
/// Adopts databases created by the pre-migration PostgreSQL startup path. Those databases used
/// EnsureCreated and therefore contain the legacy schema without an EF migration history row.
/// </summary>
public static class LegacyPostgresSchemaAdopter
{
    private const string InitialMigration = "20260721135220_InitialSessionExecutionArchitecture";

    public static async Task AdoptAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (!db.Database.IsNpgsql()) return;

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" character varying(150) NOT NULL,
                "ProductVersion" character varying(32) NOT NULL,
                CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
            );
            """, cancellationToken);

        var hasLegacySchema = await db.Database
            .SqlQueryRaw<bool>("SELECT to_regclass('\"Sessions\"') IS NOT NULL AS \"Value\"")
            .SingleAsync(cancellationToken);
        if (!hasLegacySchema) return;

        var initialRecorded = await db.Database
            .SqlQueryRaw<bool>($"SELECT EXISTS (SELECT 1 FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" = '{InitialMigration}') AS \"Value\"")
            .SingleAsync(cancellationToken);
        if (initialRecorded) return;

        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "SessionPlayerInputs" ADD COLUMN IF NOT EXISTS "AcceptedSessionRevision" bigint;
            ALTER TABLE "SessionPlayerInputs" ADD COLUMN IF NOT EXISTS "CreatedBy" character varying(450);
            ALTER TABLE "SessionPlayerInputs" ADD COLUMN IF NOT EXISTS "SupersedesInputId" character varying(40);

            UPDATE "SessionPlayerInputs" i
            SET "AcceptedSessionRevision" = GREATEST(s."Revision" - 1, 0),
                "CreatedBy" = s."OwnerId"
            FROM "Sessions" s
            WHERE s."Id" = i."SessionId"
              AND (i."AcceptedSessionRevision" IS NULL OR i."CreatedBy" IS NULL OR i."CreatedBy" = '');

            ALTER TABLE "SessionPlayerInputs" ALTER COLUMN "AcceptedSessionRevision" SET NOT NULL;
            ALTER TABLE "SessionPlayerInputs" ALTER COLUMN "CreatedBy" SET NOT NULL;

            CREATE TABLE IF NOT EXISTS "SessionExecutions" (
                "Id" character varying(40) NOT NULL,
                "SessionId" character varying(40) NOT NULL,
                "Kind" character varying(32) NOT NULL,
                "TriggerType" character varying(32) NOT NULL,
                "TriggerId" character varying(40) NOT NULL,
                "Status" character varying(32) NOT NULL,
                "Revision" bigint NOT NULL,
                "IdempotencyKey" character varying(160) NOT NULL,
                "PayloadHash" character varying(64) NOT NULL,
                "AcceptedHeadTurnId" character varying(40),
                "AcceptedSessionRevision" bigint NOT NULL,
                "PublishPolicy" character varying(32) NOT NULL,
                "Priority" integer NOT NULL,
                "IsRetryable" boolean NOT NULL,
                "AttemptCount" integer NOT NULL,
                "MaxAttempts" integer NOT NULL,
                "NextAttemptAt" timestamp with time zone,
                "LeaseOwner" character varying(120),
                "LeaseToken" character varying(80),
                "LeaseExpiresAt" timestamp with time zone,
                "ErrorCode" character varying(80),
                "UserErrorMessage" character varying(500),
                "TraceParent" character varying(512),
                "SupersededByExecutionId" character varying(40),
                "CreatedAt" timestamp with time zone NOT NULL,
                "QueuedAt" timestamp with time zone NOT NULL,
                "StartedAt" timestamp with time zone,
                "CompletedAt" timestamp with time zone,
                "CancelRequestedAt" timestamp with time zone,
                "DismissedAt" timestamp with time zone,
                CONSTRAINT "PK_SessionExecutions" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_SessionExecutions_Sessions_SessionId" FOREIGN KEY ("SessionId") REFERENCES "Sessions" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "SessionExecutionAttempts" (
                "Id" character varying(40) NOT NULL,
                "ExecutionId" character varying(40) NOT NULL,
                "AttemptNumber" integer NOT NULL,
                "Status" character varying(32) NOT NULL,
                "WorkerId" character varying(120),
                "Provider" character varying(80),
                "Model" character varying(160),
                "ProviderRequestId" character varying(160),
                "StartedAt" timestamp with time zone NOT NULL,
                "CompletedAt" timestamp with time zone,
                "LatencyMilliseconds" bigint,
                "InputTokens" integer,
                "OutputTokens" integer,
                "FinishReason" character varying(80),
                "ErrorCode" character varying(80),
                "ErrorCategory" character varying(80),
                "Retryable" boolean NOT NULL,
                "CorrelationId" character varying(120),
                "TraceId" character varying(64),
                "SpanId" character varying(32),
                "ExceptionChain" character varying(300),
                "RedactedResponseExcerpt" character varying(1000),
                "PromptVersion" character varying(80),
                "ContextHash" character varying(64),
                "ContextSizeBytes" integer,
                CONSTRAINT "PK_SessionExecutionAttempts" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_SessionExecutionAttempts_SessionExecutions_ExecutionId" FOREIGN KEY ("ExecutionId") REFERENCES "SessionExecutions" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "SessionArtifacts" (
                "Id" character varying(40) NOT NULL,
                "SessionId" character varying(40) NOT NULL,
                "ExecutionId" character varying(40) NOT NULL,
                "AttemptId" character varying(40) NOT NULL,
                "Kind" character varying(32) NOT NULL,
                "Status" character varying(32) NOT NULL,
                "ContentType" character varying(160) NOT NULL,
                "StorageKey" character varying(500),
                "Checksum" character varying(64),
                "ContentJson" text,
                "MetadataJson" text,
                "CreatedAt" timestamp with time zone NOT NULL,
                "ValidatedAt" timestamp with time zone,
                "CommittedAt" timestamp with time zone,
                CONSTRAINT "PK_SessionArtifacts" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_SessionArtifacts_SessionExecutionAttempts_AttemptId" FOREIGN KEY ("AttemptId") REFERENCES "SessionExecutionAttempts" ("Id") ON DELETE RESTRICT,
                CONSTRAINT "FK_SessionArtifacts_SessionExecutions_ExecutionId" FOREIGN KEY ("ExecutionId") REFERENCES "SessionExecutions" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "SessionNotes" (
                "Id" character varying(40) NOT NULL,
                "SessionId" character varying(40) NOT NULL,
                "Title" character varying(160) NOT NULL,
                "Body" text NOT NULL,
                "Revision" bigint NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_SessionNotes" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_SessionNotes_Sessions_SessionId" FOREIGN KEY ("SessionId") REFERENCES "Sessions" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "SessionNoteRevisions" (
                "Id" character varying(40) NOT NULL,
                "NoteId" character varying(40) NOT NULL,
                "Revision" bigint NOT NULL,
                "Title" character varying(160) NOT NULL,
                "Body" text NOT NULL,
                "SourceArtifactId" character varying(40),
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_SessionNoteRevisions" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_SessionNoteRevisions_SessionNotes_NoteId" FOREIGN KEY ("NoteId") REFERENCES "SessionNotes" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "SessionNoteProposals" (
                "ArtifactId" character varying(40) NOT NULL,
                "SessionId" character varying(40) NOT NULL,
                "SourceTurnId" character varying(40) NOT NULL,
                "NoteId" character varying(40),
                "ExpectedNoteRevision" bigint NOT NULL,
                "ProposedTitle" character varying(160) NOT NULL,
                "BeforeBody" text NOT NULL,
                "ProposedBody" text NOT NULL,
                "Rationale" character varying(1000) NOT NULL,
                "Status" character varying(32) NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "ReviewedAt" timestamp with time zone,
                CONSTRAINT "PK_SessionNoteProposals" PRIMARY KEY ("ArtifactId"),
                CONSTRAINT "FK_SessionNoteProposals_SessionArtifacts_ArtifactId" FOREIGN KEY ("ArtifactId") REFERENCES "SessionArtifacts" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "SessionImages" (
                "Id" character varying(40) NOT NULL,
                "SessionId" character varying(40) NOT NULL,
                "SourceTurnId" character varying(40),
                "SourceInputId" character varying(40),
                "ArtifactId" character varying(40) NOT NULL,
                "StorageKey" character varying(500) NOT NULL,
                "ContentType" character varying(160) NOT NULL,
                "SizeBytes" bigint NOT NULL,
                "Width" integer NOT NULL,
                "Height" integer NOT NULL,
                "Checksum" character varying(64) NOT NULL,
                "ModerationMetadataJson" text,
                "CreatedAt" timestamp with time zone NOT NULL,
                "RetainUntil" timestamp with time zone,
                CONSTRAINT "PK_SessionImages" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_SessionImages_SessionArtifacts_ArtifactId" FOREIGN KEY ("ArtifactId") REFERENCES "SessionArtifacts" ("Id") ON DELETE CASCADE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_SessionExecutions_SessionId_IdempotencyKey" ON "SessionExecutions" ("SessionId", "IdempotencyKey");
            CREATE INDEX IF NOT EXISTS "IX_SessionExecutions_Status_NextAttemptAt_Priority_QueuedAt" ON "SessionExecutions" ("Status", "NextAttemptAt", "Priority", "QueuedAt");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_SessionExecutionAttempts_ExecutionId_AttemptNumber" ON "SessionExecutionAttempts" ("ExecutionId", "AttemptNumber");
            CREATE INDEX IF NOT EXISTS "IX_SessionArtifacts_AttemptId" ON "SessionArtifacts" ("AttemptId");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_SessionArtifacts_ExecutionId_Kind" ON "SessionArtifacts" ("ExecutionId", "Kind");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_SessionImages_ArtifactId" ON "SessionImages" ("ArtifactId");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_SessionNoteRevisions_NoteId_Revision" ON "SessionNoteRevisions" ("NoteId", "Revision");
            CREATE INDEX IF NOT EXISTS "IX_SessionNotes_SessionId" ON "SessionNotes" ("SessionId");

            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = current_schema() AND table_name = 'SessionPlayerInputs'
                      AND column_name IN ('AcceptedSessionRevision', 'CreatedBy')
                    GROUP BY table_name
                    HAVING COUNT(*) = 2)
                  AND to_regclass('"SessionExecutions"') IS NOT NULL
                  AND to_regclass('"SessionExecutionAttempts"') IS NOT NULL
                  AND to_regclass('"SessionArtifacts"') IS NOT NULL
                THEN
                    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                    VALUES ('20260721135220_InitialSessionExecutionArchitecture', '10.0.9')
                    ON CONFLICT ("MigrationId") DO NOTHING;
                ELSE
                    RAISE EXCEPTION 'legacy session-execution schema adoption incomplete';
                END IF;
            END $$;
            """, cancellationToken);
    }
}
