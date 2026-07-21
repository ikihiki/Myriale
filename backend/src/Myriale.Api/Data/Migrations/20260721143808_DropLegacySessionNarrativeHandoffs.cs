using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myriale.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacySessionNarrativeHandoffs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "SessionExecutions" (
                    "Id", "SessionId", "Kind", "TriggerType", "TriggerId", "Status", "Revision",
                    "IdempotencyKey", "PayloadHash", "AcceptedHeadTurnId", "AcceptedSessionRevision",
                    "PublishPolicy", "Priority", "IsRetryable", "AttemptCount", "MaxAttempts",
                    "NextAttemptAt", "LeaseOwner", "LeaseToken", "LeaseExpiresAt", "ErrorCode",
                    "UserErrorMessage", "TraceParent", "SupersededByExecutionId", "CreatedAt", "QueuedAt",
                    "StartedAt", "CompletedAt", "CancelRequestedAt", "DismissedAt")
                SELECT 'EXE-' || md5('legacy-module-handoff:' || h."SourceModuleTurnId"), h."SessionId",
                    'module-handoff', 'module-outcome', h."SourceModuleTurnId", 'queued', h."Revision" + 1,
                    'module-handoff:' || h."ExecutionId",
                    md5('legacy-module-handoff:' || h."ExecutionId") || md5('legacy-module-handoff:2:' || h."ExecutionId"),
                    h."SourceModuleTurnId", h."SourceSessionRevision", 'required', 0, h."IsRetryable",
                    h."AttemptCount", GREATEST(3, h."AttemptCount" + 1), NULL, NULL, NULL, NULL,
                    LEFT(h."LastErrorCode", 80), LEFT(h."LastErrorMessage", 500), NULL, NULL,
                    h."CreatedAt", h."CreatedAt", CASE WHEN h."AttemptCount" > 0 THEN h."CreatedAt" END,
                    NULL, NULL, NULL
                FROM "SessionNarrativeHandoffs" h
                WHERE NOT EXISTS (
                    SELECT 1 FROM "SessionExecutions" e
                    WHERE e."SessionId" = h."SessionId"
                      AND e."IdempotencyKey" = 'module-handoff:' || h."ExecutionId")
                ON CONFLICT ("SessionId", "IdempotencyKey") DO NOTHING;

                UPDATE "SessionExecutions" e
                SET "Status" = CASE
                        WHEN h."Status" = 'completed' AND nt."Id" IS NOT NULL THEN 'succeeded'
                        WHEN h."Status" = 'failed' AND NOT h."IsRetryable" AND h."LastErrorCode" = 'session_advanced' THEN 'superseded'
                        WHEN h."Status" = 'failed' THEN 'failed'
                        ELSE 'queued'
                    END,
                    "Revision" = GREATEST(e."Revision", h."Revision" + 1),
                    "TriggerType" = 'module-outcome',
                    "TriggerId" = h."SourceModuleTurnId",
                    "AcceptedHeadTurnId" = h."SourceModuleTurnId",
                    "AcceptedSessionRevision" = h."SourceSessionRevision",
                    "IsRetryable" = CASE WHEN h."Status" = 'completed' THEN FALSE ELSE h."IsRetryable" END,
                    "AttemptCount" = GREATEST(e."AttemptCount", h."AttemptCount"),
                    "MaxAttempts" = GREATEST(e."MaxAttempts", 3, h."AttemptCount" + CASE WHEN h."Status" = 'pending' THEN 1 ELSE 0 END),
                    "NextAttemptAt" = NULL,
                    "LeaseOwner" = NULL,
                    "LeaseToken" = NULL,
                    "LeaseExpiresAt" = NULL,
                    "ErrorCode" = LEFT(h."LastErrorCode", 80),
                    "UserErrorMessage" = LEFT(h."LastErrorMessage", 500),
                    "StartedAt" = CASE WHEN h."AttemptCount" > 0 THEN COALESCE(e."StartedAt", h."CreatedAt") ELSE e."StartedAt" END,
                    "CompletedAt" = CASE WHEN h."Status" IN ('completed', 'failed') THEN COALESCE(h."CompletedAt", h."UpdatedAt") ELSE NULL END
                FROM "SessionNarrativeHandoffs" h
                LEFT JOIN "SessionTurns" nt ON nt."SourceModuleTurnId" = h."SourceModuleTurnId"
                WHERE e."SessionId" = h."SessionId"
                  AND e."IdempotencyKey" = 'module-handoff:' || h."ExecutionId";

                INSERT INTO "SessionExecutionAttempts" (
                    "Id", "ExecutionId", "AttemptNumber", "Status", "WorkerId", "Provider", "Model",
                    "ProviderRequestId", "StartedAt", "CompletedAt", "LatencyMilliseconds", "InputTokens",
                    "OutputTokens", "FinishReason", "ErrorCode", "ErrorCategory", "Retryable")
                SELECT 'ATT-' || md5('legacy-module-handoff:' || h."SourceModuleTurnId"), e."Id",
                    GREATEST(e."AttemptCount", 1),
                    CASE WHEN nt."Id" IS NOT NULL THEN 'succeeded'
                         WHEN e."Status" = 'superseded' THEN 'superseded' ELSE 'failed' END,
                    'legacy-migration', nt."AiProvider", nt."AiModel", nt."AiResponseId",
                    h."CreatedAt", COALESCE(nt."CreatedAt", e."CompletedAt", h."UpdatedAt"),
                    nt."AiLatencyMilliseconds", nt."AiInputTokens", nt."AiOutputTokens", nt."AiFinishReason",
                    e."ErrorCode", 'legacy-migration', e."IsRetryable"
                FROM "SessionNarrativeHandoffs" h
                JOIN "SessionExecutions" e ON e."SessionId" = h."SessionId"
                    AND e."IdempotencyKey" = 'module-handoff:' || h."ExecutionId"
                LEFT JOIN "SessionTurns" nt ON nt."SourceModuleTurnId" = h."SourceModuleTurnId"
                WHERE e."AttemptCount" > 0 OR nt."Id" IS NOT NULL
                ON CONFLICT ("ExecutionId", "AttemptNumber") DO NOTHING;

                INSERT INTO "SessionArtifacts" (
                    "Id", "SessionId", "ExecutionId", "AttemptId", "Kind", "Status", "ContentType",
                    "StorageKey", "Checksum", "ContentJson", "MetadataJson", "CreatedAt", "ValidatedAt", "CommittedAt")
                SELECT 'ART-' || md5('legacy-module-handoff:' || h."SourceModuleTurnId"), h."SessionId", e."Id", a."Id",
                    'narrative-text', 'committed', 'application/json', NULL, NULL,
                    jsonb_build_object('Body', nt."NarrativeBody")::text,
                    jsonb_build_object('Provider', nt."AiProvider", 'Model', nt."AiModel", 'ResponseId', nt."AiResponseId")::text,
                    nt."CreatedAt", nt."CreatedAt", nt."CreatedAt"
                FROM "SessionNarrativeHandoffs" h
                JOIN "SessionTurns" nt ON nt."SourceModuleTurnId" = h."SourceModuleTurnId"
                JOIN "SessionExecutions" e ON e."SessionId" = h."SessionId"
                    AND e."IdempotencyKey" = 'module-handoff:' || h."ExecutionId"
                JOIN "SessionExecutionAttempts" a ON a."ExecutionId" = e."Id"
                    AND a."AttemptNumber" = GREATEST(e."AttemptCount", 1)
                ON CONFLICT ("ExecutionId", "Kind") DO NOTHING;

                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM "SessionNarrativeHandoffs" h
                        LEFT JOIN "SessionExecutions" e ON e."SessionId" = h."SessionId"
                            AND e."IdempotencyKey" = 'module-handoff:' || h."ExecutionId"
                        WHERE e."Id" IS NULL)
                    THEN
                        RAISE EXCEPTION 'legacy module-handoff backfill incomplete';
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM "SessionNarrativeHandoffs" h
                        JOIN "SessionTurns" nt ON nt."SourceModuleTurnId" = h."SourceModuleTurnId"
                        JOIN "SessionExecutions" e ON e."SessionId" = h."SessionId"
                            AND e."IdempotencyKey" = 'module-handoff:' || h."ExecutionId"
                        LEFT JOIN "SessionArtifacts" a ON a."ExecutionId" = e."Id" AND a."Kind" = 'narrative-text'
                        WHERE a."Id" IS NULL)
                    THEN
                        RAISE EXCEPTION 'legacy module-handoff artifact backfill incomplete';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropTable(
                name: "SessionNarrativeHandoffs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SessionNarrativeHandoffs",
                columns: table => new
                {
                    SourceModuleTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    IsRetryable = table.Column<bool>(type: "boolean", nullable: false),
                    LastErrorCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    LastErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LeaseId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SourceSessionRevision = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNarrativeHandoffs", x => x.SourceModuleTurnId);
                    table.ForeignKey(
                        name: "FK_SessionNarrativeHandoffs_SessionTurns_SourceModuleTurnId",
                        column: x => x.SourceModuleTurnId,
                        principalTable: "SessionTurns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionNarrativeHandoffs_ExecutionId",
                table: "SessionNarrativeHandoffs",
                column: "ExecutionId",
                unique: true);
        }
    }
}
