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
