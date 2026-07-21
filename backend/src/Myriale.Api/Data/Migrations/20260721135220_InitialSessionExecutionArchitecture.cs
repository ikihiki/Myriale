using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Myriale.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialSessionExecutionArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiProviderKeys",
                columns: table => new
                {
                    Provider = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Secret = table.Column<string>(type: "text", nullable: false),
                    SecretHint = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastValidatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiProviderKeys", x => x.Provider);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    Bio = table.Column<string>(type: "text", nullable: false),
                    CanDebugDialogue = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModulePackages",
                columns: table => new
                {
                    Digest = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ModuleId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Version = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ContractVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ManifestJson = table.Column<string>(type: "text", nullable: false),
                    PackageRelativePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpandedRelativePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    LastError = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    InstalledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastScannedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModulePackages", x => x.Digest);
                });

            migrationBuilder.CreateTable(
                name: "Scenarios",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Genre = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Tone = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Lore = table.Column<string>(type: "text", nullable: false),
                    AiFreedom = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    HeroMode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    HeroFreeGenerationAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    Hero = table.Column<string>(type: "text", nullable: false),
                    Opening = table.Column<string>(type: "text", nullable: false),
                    IllustrationStyle = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    IllustrationMood = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    IllustrationNegative = table.Column<string>(type: "text", nullable: false),
                    SampleScene = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scenarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioProgressionNodes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ScenarioId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsInitial = table.Column<bool>(type: "boolean", nullable: false),
                    AllowedNarrativeSignalsJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioProgressionNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionNodes_Scenarios_ScenarioId",
                        column: x => x.ScenarioId,
                        principalTable: "Scenarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioProgressionTransitions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SourceNodeId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SignalCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    TriggerDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    TargetNodeId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ModuleId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    ModuleVersion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ModuleDigest = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ModuleConfigurationJson = table.Column<string>(type: "text", nullable: true),
                    ModuleContextJson = table.Column<string>(type: "text", nullable: true),
                    ModuleRandomValueCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioProgressionTransitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionTransitions_ScenarioProgressionNodes_Sou~",
                        column: x => x.SourceNodeId,
                        principalTable: "ScenarioProgressionNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionTransitions_ScenarioProgressionNodes_Tar~",
                        column: x => x.TargetNodeId,
                        principalTable: "ScenarioProgressionNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ModuleExecutionRequests",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    RequestId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Operation = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExpectedRevision = table.Column<long>(type: "bigint", nullable: true),
                    ExpectedSessionRevision = table.Column<long>(type: "bigint", nullable: true),
                    PayloadHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ActionJson = table.Column<string>(type: "text", nullable: true),
                    RandomValuesJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ResponseJson = table.Column<string>(type: "text", nullable: true),
                    ResponseStatusCode = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleExecutionRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModuleExecutions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    OwnerId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ModuleId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ModuleVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ModuleDigest = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ContractVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CapabilitiesJson = table.Column<string>(type: "text", nullable: false),
                    ConfigurationSchemaVersion = table.Column<int>(type: "integer", nullable: false),
                    StateSchemaVersion = table.Column<int>(type: "integer", nullable: false),
                    ConfigurationJson = table.Column<string>(type: "text", nullable: false),
                    ContextJson = table.Column<string>(type: "text", nullable: false),
                    StateJson = table.Column<string>(type: "text", nullable: false),
                    ViewStateJson = table.Column<string>(type: "text", nullable: false),
                    AvailableActionsJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    OutcomeJson = table.Column<string>(type: "text", nullable: true),
                    ErrorJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    SessionTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModuleOutcomeApplications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ModuleExecutionRequestId = table.Column<long>(type: "bigint", nullable: false),
                    ExpectedSessionRevision = table.Column<long>(type: "bigint", nullable: false),
                    AppliedSessionRevision = table.Column<long>(type: "bigint", nullable: false),
                    EffectCount = table.Column<int>(type: "integer", nullable: false),
                    AppliedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleOutcomeApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModuleOutcomeApplications_ModuleExecutionRequests_ModuleExe~",
                        column: x => x.ModuleExecutionRequestId,
                        principalTable: "ModuleExecutionRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ModuleOutcomeApplications_ModuleExecutions_ExecutionId",
                        column: x => x.ExecutionId,
                        principalTable: "ModuleExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionArtifacts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AttemptId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Checksum = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ContentJson = table.Column<string>(type: "text", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ValidatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CommittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionArtifacts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionImages",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SourceTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    SourceInputId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ArtifactId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: false),
                    Height = table.Column<int>(type: "integer", nullable: false),
                    Checksum = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ModerationMetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RetainUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionImages_SessionArtifacts_ArtifactId",
                        column: x => x.ArtifactId,
                        principalTable: "SessionArtifacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionNoteProposals",
                columns: table => new
                {
                    ArtifactId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SourceTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    NoteId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ExpectedNoteRevision = table.Column<long>(type: "bigint", nullable: false),
                    ProposedTitle = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    BeforeBody = table.Column<string>(type: "text", nullable: false),
                    ProposedBody = table.Column<string>(type: "text", nullable: false),
                    Rationale = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNoteProposals", x => x.ArtifactId);
                    table.ForeignKey(
                        name: "FK_SessionNoteProposals_SessionArtifacts_ArtifactId",
                        column: x => x.ArtifactId,
                        principalTable: "SessionArtifacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionExecutionAttempts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AttemptNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    WorkerId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Provider = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Model = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    ProviderRequestId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LatencyMilliseconds = table.Column<long>(type: "bigint", nullable: true),
                    InputTokens = table.Column<int>(type: "integer", nullable: true),
                    OutputTokens = table.Column<int>(type: "integer", nullable: true),
                    FinishReason = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ErrorCategory = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    Retryable = table.Column<bool>(type: "boolean", nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    TraceId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    SpanId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    ExceptionChain = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    RedactedResponseExcerpt = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PromptVersion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ContextHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ContextSizeBytes = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionExecutionAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionExecutions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TriggerType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TriggerId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    PayloadHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AcceptedHeadTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    AcceptedSessionRevision = table.Column<long>(type: "bigint", nullable: false),
                    PublishPolicy = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsRetryable = table.Column<bool>(type: "boolean", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    MaxAttempts = table.Column<int>(type: "integer", nullable: false),
                    NextAttemptAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LeaseOwner = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    LeaseToken = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    UserErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TraceParent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    SupersededByExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    QueuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelRequestedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DismissedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionNarrativeHandoffs",
                columns: table => new
                {
                    SourceModuleTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SourceSessionRevision = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Revision = table.Column<int>(type: "integer", nullable: false),
                    IsRetryable = table.Column<bool>(type: "boolean", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    LeaseId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastErrorCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    LastErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNarrativeHandoffs", x => x.SourceModuleTurnId);
                });

            migrationBuilder.CreateTable(
                name: "SessionNarrativeSignals",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    NarrativeTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Evidence = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNarrativeSignals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionNoteRevisions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    NoteId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    SourceArtifactId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNoteRevisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionNotes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNotes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionPendingPlayerInputs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    RequestId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    InteractionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PayloadHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AcceptedAfterTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    LeaseId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsRetryable = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionPendingPlayerInputs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionPlayerInputs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    RequestId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    InteractionType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PayloadHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AcceptedAfterTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    AcceptedSessionRevision = table.Column<long>(type: "bigint", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    SupersedesInputId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionPlayerInputs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionProgressionModuleSnapshots",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TransitionId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ModuleId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ModuleVersion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ModuleDigest = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ConfigurationJson = table.Column<string>(type: "text", nullable: false),
                    ContextJson = table.Column<string>(type: "text", nullable: false),
                    RandomValueCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionProgressionModuleSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionProgressionModuleSnapshots_ScenarioProgressionTransi~",
                        column: x => x.TransitionId,
                        principalTable: "ScenarioProgressionTransitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SessionProgressionTransitionReceipts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SourceSignalId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TransitionId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    FromNodeId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ToNodeId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ModuleId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    ModuleVersion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ModuleDigest = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ModuleConfigurationJson = table.Column<string>(type: "text", nullable: true),
                    ModuleContextJson = table.Column<string>(type: "text", nullable: true),
                    ModuleRandomValueCount = table.Column<int>(type: "integer", nullable: false),
                    ModuleTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    LeaseId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsRetryable = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorCode = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionProgressionTransitionReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionProgressionTransitionReceipts_ScenarioProgressionTra~",
                        column: x => x.TransitionId,
                        principalTable: "ScenarioProgressionTransitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionProgressionTransitionReceipts_SessionNarrativeSignal~",
                        column: x => x.SourceSignalId,
                        principalTable: "SessionNarrativeSignals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionProgressStates",
                columns: table => new
                {
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CurrentNodeId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionProgressStates", x => x.SessionId);
                    table.ForeignKey(
                        name: "FK_SessionProgressStates_ScenarioProgressionNodes_CurrentNodeId",
                        column: x => x.CurrentNodeId,
                        principalTable: "ScenarioProgressionNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Sessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    OwnerId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ScenarioId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreationRequestId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    SelectedHero = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    InterpretationEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    HeadTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sessions_Scenarios_ScenarioId",
                        column: x => x.ScenarioId,
                        principalTable: "Scenarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SessionStates",
                columns: table => new
                {
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false),
                    FlagsJson = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionStates", x => x.SessionId);
                    table.ForeignKey(
                        name: "FK_SessionStates_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionTurns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    PreviousTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DialogueSchemaVersion = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ContextSchemaVersion = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ContextComponentIdsJson = table.Column<string>(type: "text", nullable: true),
                    ContextSizeBytes = table.Column<int>(type: "integer", nullable: true),
                    ContextHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    PromptVersion = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    DialogueTurnType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Heading = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    NarrativeBody = table.Column<string>(type: "text", nullable: true),
                    Interpretation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SourceModuleTurnId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    PlayerInputId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    AiProvider = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    AiModel = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    AiResponseId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    AiInputTokens = table.Column<int>(type: "integer", nullable: true),
                    AiOutputTokens = table.Column<int>(type: "integer", nullable: true),
                    AiLatencyMilliseconds = table.Column<long>(type: "bigint", nullable: true),
                    AiAttemptCount = table.Column<int>(type: "integer", nullable: true),
                    AiFinishReason = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    SourceSessionRevision = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionTurns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionTurns_SessionPlayerInputs_PlayerInputId",
                        column: x => x.PlayerInputId,
                        principalTable: "SessionPlayerInputs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionTurns_SessionTurns_PreviousTurnId",
                        column: x => x.PreviousTurnId,
                        principalTable: "SessionTurns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionTurns_SessionTurns_SourceModuleTurnId",
                        column: x => x.SourceModuleTurnId,
                        principalTable: "SessionTurns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionTurns_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleExecutionRequests_ExecutionId",
                table: "ModuleExecutionRequests",
                column: "ExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleExecutionRequests_OwnerId_RequestId",
                table: "ModuleExecutionRequests",
                columns: new[] { "OwnerId", "RequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleExecutions_OwnerId_UpdatedAt",
                table: "ModuleExecutions",
                columns: new[] { "OwnerId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ModuleExecutions_SessionTurnId",
                table: "ModuleExecutions",
                column: "SessionTurnId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleOutcomeApplications_ExecutionId",
                table: "ModuleOutcomeApplications",
                column: "ExecutionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleOutcomeApplications_ModuleExecutionRequestId",
                table: "ModuleOutcomeApplications",
                column: "ModuleExecutionRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModuleOutcomeApplications_SessionId",
                table: "ModuleOutcomeApplications",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_ModulePackages_ModuleId_Version",
                table: "ModulePackages",
                columns: new[] { "ModuleId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionNodes_ScenarioId_Code",
                table: "ScenarioProgressionNodes",
                columns: new[] { "ScenarioId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionTransitions_SourceNodeId_SignalCode",
                table: "ScenarioProgressionTransitions",
                columns: new[] { "SourceNodeId", "SignalCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionTransitions_TargetNodeId",
                table: "ScenarioProgressionTransitions",
                column: "TargetNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionArtifacts_AttemptId",
                table: "SessionArtifacts",
                column: "AttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionArtifacts_ExecutionId_Kind",
                table: "SessionArtifacts",
                columns: new[] { "ExecutionId", "Kind" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionExecutionAttempts_ExecutionId_AttemptNumber",
                table: "SessionExecutionAttempts",
                columns: new[] { "ExecutionId", "AttemptNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionExecutions_SessionId_IdempotencyKey",
                table: "SessionExecutions",
                columns: new[] { "SessionId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionExecutions_Status_NextAttemptAt_Priority_QueuedAt",
                table: "SessionExecutions",
                columns: new[] { "Status", "NextAttemptAt", "Priority", "QueuedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SessionImages_ArtifactId",
                table: "SessionImages",
                column: "ArtifactId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionNarrativeHandoffs_ExecutionId",
                table: "SessionNarrativeHandoffs",
                column: "ExecutionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionNarrativeSignals_NarrativeTurnId_Code",
                table: "SessionNarrativeSignals",
                columns: new[] { "NarrativeTurnId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionNarrativeSignals_SessionId",
                table: "SessionNarrativeSignals",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionNoteRevisions_NoteId_Revision",
                table: "SessionNoteRevisions",
                columns: new[] { "NoteId", "Revision" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionNotes_SessionId",
                table: "SessionNotes",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPendingPlayerInputs_AcceptedAfterTurnId",
                table: "SessionPendingPlayerInputs",
                column: "AcceptedAfterTurnId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPendingPlayerInputs_SessionId_RequestId",
                table: "SessionPendingPlayerInputs",
                columns: new[] { "SessionId", "RequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionPlayerInputs_AcceptedAfterTurnId",
                table: "SessionPlayerInputs",
                column: "AcceptedAfterTurnId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionPlayerInputs_SessionId_RequestId",
                table: "SessionPlayerInputs",
                columns: new[] { "SessionId", "RequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressionModuleSnapshots_SessionId_TransitionId",
                table: "SessionProgressionModuleSnapshots",
                columns: new[] { "SessionId", "TransitionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressionModuleSnapshots_TransitionId",
                table: "SessionProgressionModuleSnapshots",
                column: "TransitionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressionTransitionReceipts_ModuleTurnId",
                table: "SessionProgressionTransitionReceipts",
                column: "ModuleTurnId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressionTransitionReceipts_SessionId",
                table: "SessionProgressionTransitionReceipts",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressionTransitionReceipts_SourceSignalId",
                table: "SessionProgressionTransitionReceipts",
                column: "SourceSignalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressionTransitionReceipts_TransitionId",
                table: "SessionProgressionTransitionReceipts",
                column: "TransitionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionProgressStates_CurrentNodeId",
                table: "SessionProgressStates",
                column: "CurrentNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_HeadTurnId",
                table: "Sessions",
                column: "HeadTurnId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_OwnerId_CreationRequestId",
                table: "Sessions",
                columns: new[] { "OwnerId", "CreationRequestId" },
                unique: true,
                filter: "\"CreationRequestId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_OwnerId_UpdatedAt",
                table: "Sessions",
                columns: new[] { "OwnerId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_ScenarioId",
                table: "Sessions",
                column: "ScenarioId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurns_PlayerInputId",
                table: "SessionTurns",
                column: "PlayerInputId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurns_PreviousTurnId",
                table: "SessionTurns",
                column: "PreviousTurnId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurns_SessionId",
                table: "SessionTurns",
                column: "SessionId",
                unique: true,
                filter: "\"PreviousTurnId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurns_SessionId_Position",
                table: "SessionTurns",
                columns: new[] { "SessionId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurns_SessionId_PreviousTurnId",
                table: "SessionTurns",
                columns: new[] { "SessionId", "PreviousTurnId" },
                unique: true,
                filter: "\"PreviousTurnId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurns_SourceModuleTurnId",
                table: "SessionTurns",
                column: "SourceModuleTurnId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ModuleExecutionRequests_ModuleExecutions_ExecutionId",
                table: "ModuleExecutionRequests",
                column: "ExecutionId",
                principalTable: "ModuleExecutions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ModuleExecutions_SessionTurns_SessionTurnId",
                table: "ModuleExecutions",
                column: "SessionTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ModuleOutcomeApplications_Sessions_SessionId",
                table: "ModuleOutcomeApplications",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionArtifacts_SessionExecutionAttempts_AttemptId",
                table: "SessionArtifacts",
                column: "AttemptId",
                principalTable: "SessionExecutionAttempts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionArtifacts_SessionExecutions_ExecutionId",
                table: "SessionArtifacts",
                column: "ExecutionId",
                principalTable: "SessionExecutions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionExecutionAttempts_SessionExecutions_ExecutionId",
                table: "SessionExecutionAttempts",
                column: "ExecutionId",
                principalTable: "SessionExecutions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionExecutions_Sessions_SessionId",
                table: "SessionExecutions",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNarrativeHandoffs_SessionTurns_SourceModuleTurnId",
                table: "SessionNarrativeHandoffs",
                column: "SourceModuleTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNarrativeSignals_SessionTurns_NarrativeTurnId",
                table: "SessionNarrativeSignals",
                column: "NarrativeTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNarrativeSignals_Sessions_SessionId",
                table: "SessionNarrativeSignals",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNoteRevisions_SessionNotes_NoteId",
                table: "SessionNoteRevisions",
                column: "NoteId",
                principalTable: "SessionNotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionNotes_Sessions_SessionId",
                table: "SessionNotes",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionPendingPlayerInputs_SessionTurns_AcceptedAfterTurnId",
                table: "SessionPendingPlayerInputs",
                column: "AcceptedAfterTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionPendingPlayerInputs_Sessions_SessionId",
                table: "SessionPendingPlayerInputs",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionPlayerInputs_SessionTurns_AcceptedAfterTurnId",
                table: "SessionPlayerInputs",
                column: "AcceptedAfterTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionPlayerInputs_Sessions_SessionId",
                table: "SessionPlayerInputs",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionProgressionModuleSnapshots_Sessions_SessionId",
                table: "SessionProgressionModuleSnapshots",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionProgressionTransitionReceipts_SessionTurns_ModuleTur~",
                table: "SessionProgressionTransitionReceipts",
                column: "ModuleTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionProgressionTransitionReceipts_Sessions_SessionId",
                table: "SessionProgressionTransitionReceipts",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionProgressStates_Sessions_SessionId",
                table: "SessionProgressStates",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Sessions_SessionTurns_HeadTurnId",
                table: "Sessions",
                column: "HeadTurnId",
                principalTable: "SessionTurns",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SessionPlayerInputs_SessionTurns_AcceptedAfterTurnId",
                table: "SessionPlayerInputs");

            migrationBuilder.DropForeignKey(
                name: "FK_Sessions_SessionTurns_HeadTurnId",
                table: "Sessions");

            migrationBuilder.DropTable(
                name: "AiProviderKeys");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "ModuleOutcomeApplications");

            migrationBuilder.DropTable(
                name: "ModulePackages");

            migrationBuilder.DropTable(
                name: "SessionImages");

            migrationBuilder.DropTable(
                name: "SessionNarrativeHandoffs");

            migrationBuilder.DropTable(
                name: "SessionNoteProposals");

            migrationBuilder.DropTable(
                name: "SessionNoteRevisions");

            migrationBuilder.DropTable(
                name: "SessionPendingPlayerInputs");

            migrationBuilder.DropTable(
                name: "SessionProgressionModuleSnapshots");

            migrationBuilder.DropTable(
                name: "SessionProgressionTransitionReceipts");

            migrationBuilder.DropTable(
                name: "SessionProgressStates");

            migrationBuilder.DropTable(
                name: "SessionStates");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "ModuleExecutionRequests");

            migrationBuilder.DropTable(
                name: "SessionArtifacts");

            migrationBuilder.DropTable(
                name: "SessionNotes");

            migrationBuilder.DropTable(
                name: "ScenarioProgressionTransitions");

            migrationBuilder.DropTable(
                name: "SessionNarrativeSignals");

            migrationBuilder.DropTable(
                name: "ModuleExecutions");

            migrationBuilder.DropTable(
                name: "SessionExecutionAttempts");

            migrationBuilder.DropTable(
                name: "ScenarioProgressionNodes");

            migrationBuilder.DropTable(
                name: "SessionExecutions");

            migrationBuilder.DropTable(
                name: "SessionTurns");

            migrationBuilder.DropTable(
                name: "SessionPlayerInputs");

            migrationBuilder.DropTable(
                name: "Sessions");

            migrationBuilder.DropTable(
                name: "Scenarios");
        }
    }
}
