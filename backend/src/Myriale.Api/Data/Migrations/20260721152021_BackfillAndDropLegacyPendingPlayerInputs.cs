using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Myriale.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class BackfillAndDropLegacyPendingPlayerInputs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "SessionPlayerInputs" (
                    "Id", "SessionId", "RequestId", "Text", "InteractionType", "PayloadHash",
                    "AcceptedAfterTurnId", "AcceptedSessionRevision", "CreatedBy", "SupersedesInputId", "CreatedAt")
                SELECT p."Id", p."SessionId", p."RequestId", p."Text", p."InteractionType", p."PayloadHash",
                    p."AcceptedAfterTurnId", GREATEST(s."Revision" - 1, 0), s."OwnerId", NULL, p."CreatedAt"
                FROM "SessionPendingPlayerInputs" p
                JOIN "Sessions" s ON s."Id" = p."SessionId"
                ON CONFLICT ("SessionId", "RequestId") DO NOTHING;

                INSERT INTO "SessionExecutions" (
                    "Id", "SessionId", "Kind", "TriggerType", "TriggerId", "Status", "Revision",
                    "IdempotencyKey", "PayloadHash", "AcceptedHeadTurnId", "AcceptedSessionRevision",
                    "PublishPolicy", "Priority", "IsRetryable", "AttemptCount", "MaxAttempts",
                    "NextAttemptAt", "LeaseOwner", "LeaseToken", "LeaseExpiresAt", "ErrorCode",
                    "UserErrorMessage", "TraceParent", "SupersededByExecutionId", "CreatedAt", "QueuedAt",
                    "StartedAt", "CompletedAt", "CancelRequestedAt", "DismissedAt")
                SELECT 'EXE-' || md5('legacy-player-input:' || i."Id"), i."SessionId", 'narrative', 'player-input', i."Id",
                    CASE
                        WHEN t."Id" IS NOT NULL THEN 'succeeded'
                        WHEN p."Status" = 'failed' AND NOT p."IsRetryable" AND p."ErrorCode" = 'session_advanced' THEN 'superseded'
                        WHEN p."Status" = 'failed' THEN 'failed'
                        ELSE 'queued'
                    END,
                    COALESCE(p."Revision", 0) + 1, i."RequestId", i."PayloadHash", i."AcceptedAfterTurnId",
                    i."AcceptedSessionRevision", 'required', 0,
                    CASE WHEN t."Id" IS NOT NULL THEN FALSE ELSE COALESCE(p."IsRetryable", TRUE) END,
                    CASE WHEN t."Id" IS NOT NULL THEN GREATEST(COALESCE(t."AiAttemptCount", 1), 1)
                         ELSE COALESCE(p."AttemptCount", 0) END,
                    GREATEST(3, COALESCE(p."AttemptCount", 0) + CASE WHEN p."Status" IS DISTINCT FROM 'failed' THEN 1 ELSE 0 END),
                    NULL, NULL, NULL, NULL,
                    LEFT(COALESCE(p."ErrorCode", CASE WHEN t."Id" IS NULL AND p."Status" = 'pending' AND p."AttemptCount" > 0 THEN 'legacy_worker_stopped' END), 80),
                    LEFT(p."ErrorMessage", 500), NULL, NULL,
                    i."CreatedAt", i."CreatedAt",
                    CASE WHEN t."Id" IS NOT NULL OR COALESCE(p."AttemptCount", 0) > 0 THEN i."CreatedAt" END,
                    CASE WHEN t."Id" IS NOT NULL THEN t."CreatedAt" WHEN p."Status" = 'failed' THEN p."UpdatedAt" END,
                    NULL, NULL
                FROM "SessionPlayerInputs" i
                LEFT JOIN "SessionPendingPlayerInputs" p ON p."Id" = i."Id"
                LEFT JOIN "SessionTurns" t ON t."PlayerInputId" = i."Id"
                WHERE NOT EXISTS (
                    SELECT 1 FROM "SessionExecutions" e
                    WHERE e."SessionId" = i."SessionId" AND e."IdempotencyKey" = i."RequestId")
                ON CONFLICT ("SessionId", "IdempotencyKey") DO NOTHING;

                INSERT INTO "SessionExecutionAttempts" (
                    "Id", "ExecutionId", "AttemptNumber", "Status", "WorkerId", "Provider", "Model",
                    "ProviderRequestId", "StartedAt", "CompletedAt", "LatencyMilliseconds", "InputTokens",
                    "OutputTokens", "FinishReason", "ErrorCode", "ErrorCategory", "Retryable")
                SELECT 'ATT-' || md5('legacy-player-input:' || i."Id"), e."Id", GREATEST(e."AttemptCount", 1),
                    CASE WHEN t."Id" IS NOT NULL THEN 'succeeded'
                         WHEN e."Status" = 'superseded' THEN 'superseded' ELSE 'failed' END,
                    'legacy-migration', t."AiProvider", t."AiModel", t."AiResponseId",
                    i."CreatedAt", COALESCE(t."CreatedAt", e."CompletedAt", i."CreatedAt"),
                    t."AiLatencyMilliseconds", t."AiInputTokens", t."AiOutputTokens", t."AiFinishReason",
                    e."ErrorCode", 'legacy-migration', e."IsRetryable"
                FROM "SessionPlayerInputs" i
                JOIN "SessionExecutions" e ON e."SessionId" = i."SessionId" AND e."IdempotencyKey" = i."RequestId"
                LEFT JOIN "SessionTurns" t ON t."PlayerInputId" = i."Id"
                WHERE e."AttemptCount" > 0
                ON CONFLICT ("ExecutionId", "AttemptNumber") DO NOTHING;

                INSERT INTO "SessionArtifacts" (
                    "Id", "SessionId", "ExecutionId", "AttemptId", "Kind", "Status", "ContentType",
                    "StorageKey", "Checksum", "ContentJson", "MetadataJson", "CreatedAt", "ValidatedAt", "CommittedAt")
                SELECT 'ART-' || md5('legacy-player-input:' || i."Id"), i."SessionId", e."Id", a."Id",
                    'narrative-text', 'committed', 'application/json', NULL, NULL,
                    jsonb_build_object(
                        'SchemaVersion', t."DialogueSchemaVersion", 'TurnType', t."DialogueTurnType",
                        'Heading', t."Heading", 'Body', t."NarrativeBody", 'Signals', '[]'::jsonb,
                        'Interpretation', t."Interpretation")::text,
                    jsonb_build_object('Provider', t."AiProvider", 'Model', t."AiModel", 'ResponseId', t."AiResponseId")::text,
                    t."CreatedAt", t."CreatedAt", t."CreatedAt"
                FROM "SessionPlayerInputs" i
                JOIN "SessionTurns" t ON t."PlayerInputId" = i."Id"
                JOIN "SessionExecutions" e ON e."SessionId" = i."SessionId" AND e."IdempotencyKey" = i."RequestId"
                JOIN "SessionExecutionAttempts" a ON a."ExecutionId" = e."Id"
                    AND a."AttemptNumber" = GREATEST(e."AttemptCount", 1)
                ON CONFLICT ("ExecutionId", "Kind") DO NOTHING;

                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM "SessionPendingPlayerInputs" p
                        LEFT JOIN "SessionPlayerInputs" i ON i."SessionId" = p."SessionId" AND i."RequestId" = p."RequestId"
                        LEFT JOIN "SessionExecutions" e ON e."SessionId" = p."SessionId" AND e."IdempotencyKey" = p."RequestId"
                        WHERE i."Id" IS NULL OR e."Id" IS NULL)
                    THEN
                        RAISE EXCEPTION 'legacy player-input backfill incomplete';
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM "SessionPlayerInputs" i
                        JOIN "SessionTurns" t ON t."PlayerInputId" = i."Id"
                        JOIN "SessionExecutions" e ON e."SessionId" = i."SessionId" AND e."IdempotencyKey" = i."RequestId"
                        LEFT JOIN "SessionArtifacts" a ON a."ExecutionId" = e."Id" AND a."Kind" = 'narrative-text'
                        WHERE a."Id" IS NULL)
                    THEN
                        RAISE EXCEPTION 'legacy narrative artifact backfill incomplete';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropTable(
                name: "SessionPendingPlayerInputs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SessionPendingPlayerInputs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AcceptedAfterTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    InteractionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsRetryable = table.Column<bool>(type: "boolean", nullable: false),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LeaseId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    PayloadHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RequestId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionPendingPlayerInputs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionPendingPlayerInputs_SessionTurns_AcceptedAfterTurnId",
                        column: x => x.AcceptedAfterTurnId,
                        principalTable: "SessionTurns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionPendingPlayerInputs_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionPendingPlayerInputs_AcceptedAfterTurnId",
                table: "SessionPendingPlayerInputs",
                column: "AcceptedAfterTurnId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPendingPlayerInputs_SessionId_RequestId",
                table: "SessionPendingPlayerInputs",
                columns: new[] { "SessionId", "RequestId" },
                unique: true);
        }
    }
}
