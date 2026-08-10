using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Myriale.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiCredentials",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    DisplayName = table.Column<string>(maxLength: 120, nullable: false),
                    ProtectedSecret = table.Column<string>(nullable: false),
                    SecretHint = table.Column<string>(maxLength: 16, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiCredentials", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiProviderProfiles",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    DisplayName = table.Column<string>(maxLength: 120, nullable: false),
                    Adapter = table.Column<string>(nullable: false),
                    BaseUrl = table.Column<string>(maxLength: 2048, nullable: false),
                    Model = table.Column<string>(maxLength: 240, nullable: false),
                    SystemPrompt = table.Column<string>(maxLength: 20000, nullable: false),
                    CredentialId = table.Column<string>(nullable: false),
                    Enabled = table.Column<bool>(nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiProviderProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiProviderProfileValidations",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ProfileId = table.Column<string>(nullable: false),
                    ProfileRevision = table.Column<long>(nullable: false),
                    CredentialId = table.Column<string>(nullable: false),
                    CredentialRevision = table.Column<long>(nullable: false),
                    Status = table.Column<string>(nullable: false),
                    ErrorCode = table.Column<string>(maxLength: 80, nullable: true),
                    TestedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiProviderProfileValidations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiProviderRuntimeSettings",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 32, nullable: false),
                    ActiveProvider = table.Column<string>(maxLength: 80, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiProviderRuntimeSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    Name = table.Column<string>(maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    DisplayName = table.Column<string>(nullable: false),
                    Bio = table.Column<string>(nullable: false),
                    CanDebugDialogue = table.Column<bool>(nullable: false),
                    WithdrawnAt = table.Column<DateTimeOffset>(nullable: true),
                    UserName = table.Column<string>(maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(maxLength: 256, nullable: true),
                    Email = table.Column<string>(maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(nullable: false),
                    PasswordHash = table.Column<string>(nullable: true),
                    SecurityStamp = table.Column<string>(nullable: true),
                    ConcurrencyStamp = table.Column<string>(nullable: true),
                    PhoneNumber = table.Column<string>(nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(nullable: false),
                    TwoFactorEnabled = table.Column<bool>(nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(nullable: true),
                    LockoutEnabled = table.Column<bool>(nullable: false),
                    AccessFailedCount = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationAggregates",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    Revision = table.Column<int>(nullable: false),
                    AlgorithmKey = table.Column<string>(maxLength: 80, nullable: false),
                    AlgorithmVersion = table.Column<string>(maxLength: 40, nullable: false),
                    SourceWatermark = table.Column<string>(maxLength: 64, nullable: false),
                    IncludedAttemptCount = table.Column<int>(nullable: false),
                    IncludedMachineJudgmentCount = table.Column<int>(nullable: false),
                    IncludedHumanJudgmentCount = table.Column<int>(nullable: false),
                    SummaryJson = table.Column<string>(nullable: false),
                    CalculatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationAggregates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationHumanJudgments",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    ItemId = table.Column<string>(maxLength: 40, nullable: false),
                    ReviewerId = table.Column<string>(maxLength: 450, nullable: false),
                    CriterionKey = table.Column<string>(maxLength: 120, nullable: false),
                    Score = table.Column<decimal>(nullable: true),
                    Verdict = table.Column<bool>(nullable: true),
                    TagsJson = table.Column<string>(nullable: false),
                    Comment = table.Column<string>(nullable: false),
                    Confidence = table.Column<decimal>(nullable: true),
                    Revision = table.Column<int>(nullable: false),
                    SupersedesJudgmentId = table.Column<string>(maxLength: 40, nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationHumanJudgments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationReviewBatches",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    RubricVersion = table.Column<string>(maxLength: 40, nullable: false),
                    RequiredReviewsPerOutput = table.Column<int>(nullable: false),
                    ReviewerPoolJson = table.Column<string>(nullable: false),
                    PolicyJson = table.Column<string>(nullable: false),
                    Deadline = table.Column<DateTimeOffset>(nullable: true),
                    Status = table.Column<string>(maxLength: 24, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    ClosedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationReviewBatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationSessions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    OwnerId = table.Column<string>(maxLength: 450, nullable: false),
                    CreatedById = table.Column<string>(maxLength: 450, nullable: false),
                    Title = table.Column<string>(maxLength: 160, nullable: false),
                    Purpose = table.Column<string>(maxLength: 2000, nullable: false),
                    TagsJson = table.Column<string>(nullable: false),
                    Sensitivity = table.Column<string>(maxLength: 32, nullable: false),
                    RetentionPolicy = table.Column<string>(maxLength: 80, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    IdempotencyKey = table.Column<string>(maxLength: 160, nullable: true),
                    CanonicalPayloadHash = table.Column<string>(maxLength: 64, nullable: true),
                    CorpusKey = table.Column<string>(maxLength: 80, nullable: true),
                    CorpusVersion = table.Column<string>(maxLength: 40, nullable: true),
                    ConfigJson = table.Column<string>(nullable: false),
                    RubricJson = table.Column<string>(nullable: false),
                    ReviewPolicyJson = table.Column<string>(nullable: false),
                    PlannedAttemptCount = table.Column<int>(nullable: false),
                    TerminalAttemptCount = table.Column<int>(nullable: false),
                    SucceededAttemptCount = table.Column<int>(nullable: false),
                    FailedAttemptCount = table.Column<int>(nullable: false),
                    ReviewedItemCount = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    QueuedAt = table.Column<DateTimeOffset>(nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(nullable: true),
                    MachineCompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    ReviewOpenedAt = table.Column<DateTimeOffset>(nullable: true),
                    ReviewClosedAt = table.Column<DateTimeOffset>(nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    CancelRequestedAt = table.Column<DateTimeOffset>(nullable: true),
                    ArchivedAt = table.Column<DateTimeOffset>(nullable: true),
                    IdentitiesRevealed = table.Column<bool>(nullable: false),
                    IdentitiesRevealedById = table.Column<string>(maxLength: 450, nullable: true),
                    IdentitiesRevealedAt = table.Column<DateTimeOffset>(nullable: true),
                    CurrentAggregateRevision = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModulePackages",
                columns: table => new
                {
                    Digest = table.Column<string>(maxLength: 64, nullable: false),
                    ModuleId = table.Column<string>(maxLength: 200, nullable: false),
                    Version = table.Column<string>(maxLength: 64, nullable: false),
                    ContractVersion = table.Column<string>(maxLength: 32, nullable: false),
                    DisplayName = table.Column<string>(maxLength: 200, nullable: false),
                    Description = table.Column<string>(maxLength: 2000, nullable: false),
                    ManifestJson = table.Column<string>(nullable: false),
                    Format = table.Column<string>(nullable: false),
                    Status = table.Column<string>(nullable: false),
                    LastError = table.Column<string>(maxLength: 2000, nullable: true),
                    IsEnabled = table.Column<bool>(nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    InstalledAt = table.Column<DateTimeOffset>(nullable: false),
                    LastScannedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModulePackages", x => x.Digest);
                });

            migrationBuilder.CreateTable(
                name: "Scenarios",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    Title = table.Column<string>(maxLength: 160, nullable: false),
                    Summary = table.Column<string>(maxLength: 2000, nullable: false),
                    Genre = table.Column<string>(maxLength: 80, nullable: false),
                    Tone = table.Column<string>(maxLength: 120, nullable: false),
                    Lore = table.Column<string>(nullable: false),
                    AiFreedom = table.Column<string>(maxLength: 120, nullable: false),
                    HeroMode = table.Column<string>(maxLength: 20, nullable: false),
                    HeroFreeGenerationAllowed = table.Column<bool>(nullable: false),
                    Hero = table.Column<string>(nullable: false),
                    Opening = table.Column<string>(nullable: false),
                    IllustrationStyle = table.Column<string>(maxLength: 240, nullable: false),
                    IllustrationMood = table.Column<string>(maxLength: 240, nullable: false),
                    IllustrationNegative = table.Column<string>(nullable: false),
                    SampleScene = table.Column<string>(nullable: false),
                    Status = table.Column<string>(maxLength: 40, nullable: false),
                    AuthorId = table.Column<string>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false),
                    Revision = table.Column<int>(nullable: false),
                    DefinitionVersionCounter = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scenarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<string>(nullable: false),
                    ClaimType = table.Column<string>(nullable: true),
                    ClaimValue = table.Column<string>(nullable: true)
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
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(nullable: false),
                    ClaimType = table.Column<string>(nullable: true),
                    ClaimValue = table.Column<string>(nullable: true)
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
                    LoginProvider = table.Column<string>(nullable: false),
                    ProviderKey = table.Column<string>(nullable: false),
                    ProviderDisplayName = table.Column<string>(nullable: true),
                    UserId = table.Column<string>(nullable: false)
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
                    UserId = table.Column<string>(nullable: false),
                    RoleId = table.Column<string>(nullable: false)
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
                    UserId = table.Column<string>(nullable: false),
                    LoginProvider = table.Column<string>(nullable: false),
                    Name = table.Column<string>(nullable: false),
                    Value = table.Column<string>(nullable: true)
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
                name: "EvaluationReviewAssignments",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    BatchId = table.Column<string>(maxLength: 40, nullable: false),
                    OpaqueCode = table.Column<string>(maxLength: 64, nullable: false),
                    ReviewerId = table.Column<string>(maxLength: 450, nullable: false),
                    Status = table.Column<string>(maxLength: 24, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationReviewAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationReviewAssignments_EvaluationReviewBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "EvaluationReviewBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationCandidates",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    CandidateKey = table.Column<string>(maxLength: 120, nullable: false),
                    BlindCode = table.Column<string>(maxLength: 24, nullable: false),
                    ProfileId = table.Column<string>(maxLength: 80, nullable: false),
                    ProfileRevision = table.Column<long>(nullable: false),
                    ProfileSource = table.Column<string>(maxLength: 32, nullable: false),
                    Provider = table.Column<string>(maxLength: 80, nullable: false),
                    Adapter = table.Column<string>(maxLength: 80, nullable: false),
                    Model = table.Column<string>(maxLength: 240, nullable: false),
                    ProfileDescriptorJson = table.Column<string>(nullable: false),
                    ProfileDescriptorHash = table.Column<string>(maxLength: 64, nullable: false),
                    GenerationOverridesJson = table.Column<string>(nullable: false),
                    RetryPolicyJson = table.Column<string>(nullable: false),
                    Repetitions = table.Column<int>(nullable: false),
                    MaxInvocations = table.Column<int>(nullable: false),
                    IsActive = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationCandidates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationCandidates_EvaluationSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "EvaluationSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationSituations",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    StableKey = table.Column<string>(maxLength: 120, nullable: false),
                    Revision = table.Column<int>(nullable: false),
                    Stage = table.Column<string>(maxLength: 32, nullable: false),
                    SourceKind = table.Column<string>(maxLength: 32, nullable: false),
                    RequestJson = table.Column<string>(nullable: false),
                    ExpectationsJson = table.Column<string>(nullable: false),
                    RequestVersion = table.Column<string>(maxLength: 40, nullable: false),
                    PromptVersion = table.Column<string>(maxLength: 40, nullable: false),
                    ResponseSchemaVersion = table.Column<string>(maxLength: 40, nullable: false),
                    CanonicalizationVersion = table.Column<string>(maxLength: 40, nullable: false),
                    RequestHash = table.Column<string>(maxLength: 64, nullable: false),
                    SourceBundleHash = table.Column<string>(maxLength: 64, nullable: false),
                    Sensitivity = table.Column<string>(maxLength: 32, nullable: false),
                    ImportedById = table.Column<string>(maxLength: 450, nullable: false),
                    ImportedAt = table.Column<DateTimeOffset>(nullable: false),
                    CorpusKey = table.Column<string>(maxLength: 80, nullable: true),
                    CorpusVersion = table.Column<string>(maxLength: 40, nullable: true),
                    CorpusCaseKey = table.Column<string>(maxLength: 120, nullable: true),
                    SourceScenarioId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceDefinitionVersionId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceSessionId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceExecutionId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceAttemptId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceRuleStepId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceInteractionId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceSessionRevision = table.Column<long>(nullable: true),
                    CitationJson = table.Column<string>(nullable: false),
                    SupersedesSituationId = table.Column<string>(maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationSituations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationSituations_EvaluationSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "EvaluationSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioDefinitionVersions",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    ScenarioId = table.Column<string>(nullable: false),
                    Version = table.Column<int>(nullable: false),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    SchemaVersion = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false),
                    PublishedAt = table.Column<DateTimeOffset>(nullable: true),
                    Revision = table.Column<int>(nullable: false),
                    StartLocationCode = table.Column<string>(maxLength: 80, nullable: false),
                    ScenarioTitle = table.Column<string>(nullable: false),
                    ScenarioSummary = table.Column<string>(maxLength: 2000, nullable: false),
                    ScenarioGenre = table.Column<string>(maxLength: 80, nullable: false),
                    ScenarioTone = table.Column<string>(maxLength: 120, nullable: false),
                    ScenarioLore = table.Column<string>(nullable: false),
                    ScenarioAiFreedom = table.Column<string>(maxLength: 120, nullable: false),
                    ScenarioHeroMode = table.Column<string>(maxLength: 20, nullable: false),
                    ScenarioHeroFreeGenerationAllowed = table.Column<bool>(nullable: false),
                    ScenarioHero = table.Column<string>(nullable: false),
                    ScenarioOpening = table.Column<string>(nullable: false),
                    ScenarioIllustrationStyle = table.Column<string>(maxLength: 240, nullable: false),
                    ScenarioIllustrationMood = table.Column<string>(maxLength: 240, nullable: false),
                    ScenarioIllustrationNegative = table.Column<string>(nullable: false),
                    ScenarioSampleScene = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioDefinitionVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioDefinitionVersions_Scenarios_ScenarioId",
                        column: x => x.ScenarioId,
                        principalTable: "Scenarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationReviewItems",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    AssignmentId = table.Column<string>(maxLength: 40, nullable: false),
                    AttemptId = table.Column<string>(maxLength: 40, nullable: false),
                    OpaqueCandidateCode = table.Column<string>(maxLength: 24, nullable: false),
                    DisplayOrder = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationReviewItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationReviewItems_EvaluationReviewAssignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "EvaluationReviewAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationAttempts",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    SituationId = table.Column<string>(maxLength: 40, nullable: false),
                    CandidateId = table.Column<string>(maxLength: 40, nullable: false),
                    Repetition = table.Column<int>(nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    InvocationCount = table.Column<int>(nullable: false),
                    NextAttemptAt = table.Column<DateTimeOffset>(nullable: true),
                    LeaseOwner = table.Column<string>(maxLength: 120, nullable: true),
                    LeaseToken = table.Column<string>(maxLength: 80, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(nullable: true),
                    ErrorCode = table.Column<string>(maxLength: 80, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationAttempts_EvaluationCandidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "EvaluationCandidates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EvaluationAttempts_EvaluationSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "EvaluationSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EvaluationAttempts_EvaluationSituations_SituationId",
                        column: x => x.SituationId,
                        principalTable: "EvaluationSituations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioLocations",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    DefinitionVersionId = table.Column<string>(nullable: false),
                    Code = table.Column<string>(maxLength: 80, nullable: false),
                    Name = table.Column<string>(maxLength: 160, nullable: false),
                    Description = table.Column<string>(nullable: false),
                    AuthoringDataJson = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioLocations_ScenarioDefinitionVersions_DefinitionVersionId",
                        column: x => x.DefinitionVersionId,
                        principalTable: "ScenarioDefinitionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioObjectTypes",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    DefinitionVersionId = table.Column<string>(nullable: false),
                    Code = table.Column<string>(maxLength: 80, nullable: false),
                    Name = table.Column<string>(maxLength: 160, nullable: false),
                    Description = table.Column<string>(nullable: false),
                    SchemaVersion = table.Column<int>(nullable: false),
                    StateSchemaJson = table.Column<string>(nullable: false),
                    DefaultStateJson = table.Column<string>(nullable: false),
                    PublicProjectionJson = table.Column<string>(nullable: false),
                    ProfileSchemaJson = table.Column<string>(nullable: false),
                    ProfileDefaultsJson = table.Column<string>(nullable: false),
                    GenericActionRulesJson = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioObjectTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioObjectTypes_ScenarioDefinitionVersions_DefinitionVersionId",
                        column: x => x.DefinitionVersionId,
                        principalTable: "ScenarioDefinitionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioProgressionNodes",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 80, nullable: false),
                    DefinitionVersionId = table.Column<string>(nullable: false),
                    Code = table.Column<string>(maxLength: 80, nullable: false),
                    IsInitial = table.Column<bool>(nullable: false),
                    AllowedNarrativeSignalsJson = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioProgressionNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionNodes_ScenarioDefinitionVersions_DefinitionVersionId",
                        column: x => x.DefinitionVersionId,
                        principalTable: "ScenarioDefinitionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationModelInvocations",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    AttemptId = table.Column<string>(maxLength: 40, nullable: false),
                    InvocationNumber = table.Column<int>(nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    LeaseToken = table.Column<string>(maxLength: 80, nullable: false),
                    AttemptRevision = table.Column<long>(nullable: false),
                    RequestEnvelopeJson = table.Column<string>(nullable: false),
                    SentPrompt = table.Column<string>(nullable: true),
                    RawResponse = table.Column<string>(nullable: true),
                    RawError = table.Column<string>(nullable: true),
                    ParsedOutputJson = table.Column<string>(nullable: true),
                    ValidationJson = table.Column<string>(nullable: true),
                    ResponseSchemaHash = table.Column<string>(maxLength: 64, nullable: true),
                    ProfileSnapshotJson = table.Column<string>(nullable: false),
                    GenerationConfigJson = table.Column<string>(nullable: false),
                    Provider = table.Column<string>(maxLength: 80, nullable: true),
                    Model = table.Column<string>(maxLength: 240, nullable: true),
                    ProviderRequestId = table.Column<string>(maxLength: 160, nullable: true),
                    FinishReason = table.Column<string>(maxLength: 80, nullable: true),
                    InputTokens = table.Column<int>(nullable: true),
                    OutputTokens = table.Column<int>(nullable: true),
                    QueueLatencyMilliseconds = table.Column<long>(nullable: true),
                    TimeToFirstTokenMilliseconds = table.Column<long>(nullable: true),
                    GenerationLatencyMilliseconds = table.Column<long>(nullable: true),
                    EndToEndLatencyMilliseconds = table.Column<long>(nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    ExpiredAt = table.Column<DateTimeOffset>(nullable: true),
                    CorrelationId = table.Column<string>(maxLength: 120, nullable: true),
                    ErrorCode = table.Column<string>(maxLength: 80, nullable: true),
                    ErrorCategory = table.Column<string>(maxLength: 80, nullable: true),
                    Retryable = table.Column<bool>(nullable: false),
                    RequestHash = table.Column<string>(maxLength: 64, nullable: false),
                    PromptHash = table.Column<string>(maxLength: 64, nullable: true),
                    RawResultHash = table.Column<string>(maxLength: 64, nullable: true),
                    OutputHash = table.Column<string>(maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationModelInvocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationModelInvocations_EvaluationAttempts_AttemptId",
                        column: x => x.AttemptId,
                        principalTable: "EvaluationAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioObjects",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    DefinitionVersionId = table.Column<string>(nullable: false),
                    Code = table.Column<string>(maxLength: 80, nullable: false),
                    Name = table.Column<string>(maxLength: 160, nullable: false),
                    ProfileMarkdown = table.Column<string>(nullable: false),
                    LocationId = table.Column<string>(nullable: false),
                    InitialStateOverrideJson = table.Column<string>(nullable: false),
                    MixinTypeCodesJson = table.Column<string>(nullable: false),
                    LocalStateSchemaJson = table.Column<string>(nullable: false),
                    LocalDefaultStateJson = table.Column<string>(nullable: false),
                    LocalPublicProjectionJson = table.Column<string>(nullable: false),
                    LocalProfileSchemaJson = table.Column<string>(nullable: false),
                    LocalProfileDefaultsJson = table.Column<string>(nullable: false),
                    ProfileValuesJson = table.Column<string>(nullable: false),
                    LocalActionsJson = table.Column<string>(nullable: false),
                    ActionRuleMutationsJson = table.Column<string>(nullable: false),
                    IsGlobal = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioObjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioObjects_ScenarioDefinitionVersions_DefinitionVersionId",
                        column: x => x.DefinitionVersionId,
                        principalTable: "ScenarioDefinitionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScenarioObjects_ScenarioLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "ScenarioLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioObjectTypeActions",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    ObjectTypeId = table.Column<string>(nullable: false),
                    Code = table.Column<string>(maxLength: 80, nullable: false),
                    Label = table.Column<string>(maxLength: 160, nullable: false),
                    Description = table.Column<string>(nullable: false),
                    ArgumentSchemaJson = table.Column<string>(nullable: false),
                    AvailabilityConditionJson = table.Column<string>(nullable: false),
                    Visibility = table.Column<string>(maxLength: 20, nullable: false),
                    ExecutionMode = table.Column<string>(maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioObjectTypeActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioObjectTypeActions_ScenarioObjectTypes_ObjectTypeId",
                        column: x => x.ObjectTypeId,
                        principalTable: "ScenarioObjectTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ScenarioProgressionTransitions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 80, nullable: false),
                    DefinitionVersionId = table.Column<string>(nullable: false),
                    SourceNodeId = table.Column<string>(maxLength: 80, nullable: false),
                    SignalCode = table.Column<string>(maxLength: 80, nullable: false),
                    TriggerDescription = table.Column<string>(maxLength: 1000, nullable: false),
                    TargetNodeId = table.Column<string>(maxLength: 80, nullable: false),
                    ModuleId = table.Column<string>(maxLength: 160, nullable: true),
                    ModuleVersion = table.Column<string>(maxLength: 80, nullable: true),
                    ModuleDigest = table.Column<string>(maxLength: 64, nullable: true),
                    ModuleConfigurationJson = table.Column<string>(nullable: true),
                    ModuleContextJson = table.Column<string>(nullable: true),
                    ModuleRandomValueCount = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScenarioProgressionTransitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionTransitions_ScenarioDefinitionVersions_DefinitionVersionId",
                        column: x => x.DefinitionVersionId,
                        principalTable: "ScenarioDefinitionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionTransitions_ScenarioProgressionNodes_SourceNodeId",
                        column: x => x.SourceNodeId,
                        principalTable: "ScenarioProgressionNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScenarioProgressionTransitions_ScenarioProgressionNodes_TargetNodeId",
                        column: x => x.TargetNodeId,
                        principalTable: "ScenarioProgressionNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationMachineJudgments",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    AttemptId = table.Column<string>(maxLength: 40, nullable: false),
                    InvocationId = table.Column<string>(maxLength: 40, nullable: false),
                    OutputHash = table.Column<string>(maxLength: 64, nullable: false),
                    JudgeKey = table.Column<string>(maxLength: 80, nullable: false),
                    JudgeVersion = table.Column<string>(maxLength: 40, nullable: false),
                    CriterionKey = table.Column<string>(maxLength: 120, nullable: false),
                    Passed = table.Column<bool>(nullable: false),
                    Score = table.Column<decimal>(nullable: true),
                    Confidence = table.Column<decimal>(nullable: true),
                    LabelsJson = table.Column<string>(nullable: false),
                    Rationale = table.Column<string>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationMachineJudgments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationMachineJudgments_EvaluationModelInvocations_InvocationId",
                        column: x => x.InvocationId,
                        principalTable: "EvaluationModelInvocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ModuleExecutionRequests",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false).Annotation("Sqlite:Autoincrement", true).Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<string>(maxLength: 450, nullable: false),
                    ExecutionId = table.Column<string>(maxLength: 40, nullable: false),
                    RequestId = table.Column<string>(maxLength: 128, nullable: false),
                    Operation = table.Column<string>(maxLength: 20, nullable: false),
                    ExpectedRevision = table.Column<long>(nullable: true),
                    ExpectedSessionRevision = table.Column<long>(nullable: true),
                    PayloadHash = table.Column<string>(maxLength: 64, nullable: false),
                    ActionJson = table.Column<string>(nullable: true),
                    RandomValuesJson = table.Column<string>(nullable: false),
                    Status = table.Column<string>(maxLength: 20, nullable: false),
                    ResponseJson = table.Column<string>(nullable: true),
                    ResponseStatusCode = table.Column<int>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleExecutionRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModuleExecutions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    OwnerId = table.Column<string>(maxLength: 450, nullable: false),
                    ModuleId = table.Column<string>(maxLength: 200, nullable: false),
                    ModuleVersion = table.Column<string>(maxLength: 64, nullable: false),
                    ModuleDigest = table.Column<string>(maxLength: 64, nullable: false),
                    ContractVersion = table.Column<string>(maxLength: 32, nullable: false),
                    CapabilitiesJson = table.Column<string>(nullable: false),
                    ConfigurationSchemaVersion = table.Column<int>(nullable: false),
                    StateSchemaVersion = table.Column<int>(nullable: false),
                    ConfigurationJson = table.Column<string>(nullable: false),
                    ContextJson = table.Column<string>(nullable: false),
                    StateJson = table.Column<string>(nullable: false),
                    ViewStateJson = table.Column<string>(nullable: false),
                    AvailableActionsJson = table.Column<string>(nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    OutcomeJson = table.Column<string>(nullable: true),
                    ErrorJson = table.Column<string>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    SessionTurnId = table.Column<string>(maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModuleOutcomeApplications",
                columns: table => new
                {
                    Id = table.Column<long>(nullable: false).Annotation("Sqlite:Autoincrement", true).Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExecutionId = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    ModuleExecutionRequestId = table.Column<long>(nullable: false),
                    ExpectedSessionRevision = table.Column<long>(nullable: false),
                    AppliedSessionRevision = table.Column<long>(nullable: false),
                    EffectCount = table.Column<int>(nullable: false),
                    AppliedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleOutcomeApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModuleOutcomeApplications_ModuleExecutionRequests_ModuleExecutionRequestId",
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
                name: "SessionAiInteractions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(maxLength: 40, nullable: false),
                    AttemptId = table.Column<string>(maxLength: 40, nullable: false),
                    Sequence = table.Column<int>(nullable: false),
                    Stage = table.Column<string>(maxLength: 32, nullable: false),
                    AiProfileId = table.Column<string>(maxLength: 80, nullable: false),
                    Provider = table.Column<string>(maxLength: 80, nullable: true),
                    Model = table.Column<string>(maxLength: 160, nullable: true),
                    ProviderRequestId = table.Column<string>(maxLength: 160, nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: false),
                    LatencyMilliseconds = table.Column<long>(nullable: true),
                    InputTokens = table.Column<int>(nullable: true),
                    OutputTokens = table.Column<int>(nullable: true),
                    FinishReason = table.Column<string>(maxLength: 80, nullable: true),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    ErrorCode = table.Column<string>(maxLength: 80, nullable: true),
                    ErrorMessage = table.Column<string>(maxLength: 500, nullable: true),
                    SentPrompt = table.Column<string>(nullable: true),
                    ReceivedResult = table.Column<string>(nullable: true),
                    ValidationResult = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionAiInteractions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionArtifacts",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(maxLength: 40, nullable: false),
                    AttemptId = table.Column<string>(maxLength: 40, nullable: false),
                    Kind = table.Column<string>(maxLength: 32, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    Schema = table.Column<string>(maxLength: 64, nullable: false),
                    ContentType = table.Column<string>(maxLength: 160, nullable: false),
                    StorageKey = table.Column<string>(maxLength: 500, nullable: true),
                    Checksum = table.Column<string>(maxLength: 64, nullable: false),
                    PayloadJson = table.Column<string>(nullable: true),
                    MetadataJson = table.Column<string>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    ValidatedAt = table.Column<DateTimeOffset>(nullable: true),
                    CommittedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionArtifacts", x => x.Id);
                    table.CheckConstraint("CK_SessionArtifacts_Backing", "(\"PayloadJson\" IS NOT NULL AND \"StorageKey\" IS NULL) OR (\"PayloadJson\" IS NULL AND \"StorageKey\" IS NOT NULL)");
                    table.CheckConstraint("CK_SessionArtifacts_Committed", "\"Status\" <> 'committed' OR (\"ValidatedAt\" IS NOT NULL AND \"CommittedAt\" IS NOT NULL)");
                    table.CheckConstraint("CK_SessionArtifacts_KindSchema", "(\"Kind\" = 'rule-action-step' AND \"Schema\" = 'rule-action-step.v1') OR (\"Kind\" = 'post-state-narrative' AND \"Schema\" = 'post-state-narrative.v1') OR (\"Kind\" = 'narrative-text' AND \"Schema\" = 'narrative-text.v1') OR (\"Kind\" = 'note-patch' AND \"Schema\" = 'note-patch.v1') OR (\"Kind\" = 'image' AND \"Schema\" = 'image.v1')");
                });

            migrationBuilder.CreateTable(
                name: "SessionImages",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    SourceTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    SourceInputId = table.Column<string>(maxLength: 40, nullable: true),
                    ArtifactId = table.Column<string>(maxLength: 40, nullable: false),
                    StorageKey = table.Column<string>(maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(maxLength: 160, nullable: false),
                    SizeBytes = table.Column<long>(nullable: false),
                    Width = table.Column<int>(nullable: false),
                    Height = table.Column<int>(nullable: false),
                    Checksum = table.Column<string>(maxLength: 64, nullable: false),
                    ModerationMetadataJson = table.Column<string>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    RetainUntil = table.Column<DateTimeOffset>(nullable: true)
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
                    ArtifactId = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    SourceTurnId = table.Column<string>(maxLength: 40, nullable: false),
                    NoteId = table.Column<string>(maxLength: 40, nullable: true),
                    ExpectedNoteRevision = table.Column<long>(nullable: false),
                    ProposedTitle = table.Column<string>(maxLength: 160, nullable: false),
                    BeforeBody = table.Column<string>(nullable: false),
                    ProposedBody = table.Column<string>(nullable: false),
                    Rationale = table.Column<string>(maxLength: 1000, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    ReviewedAt = table.Column<DateTimeOffset>(nullable: true)
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
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(maxLength: 40, nullable: false),
                    AttemptNumber = table.Column<int>(nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    WorkerId = table.Column<string>(maxLength: 120, nullable: true),
                    Provider = table.Column<string>(maxLength: 80, nullable: true),
                    Model = table.Column<string>(maxLength: 160, nullable: true),
                    ProviderRequestId = table.Column<string>(maxLength: 160, nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    LatencyMilliseconds = table.Column<long>(nullable: true),
                    InputTokens = table.Column<int>(nullable: true),
                    OutputTokens = table.Column<int>(nullable: true),
                    FinishReason = table.Column<string>(maxLength: 80, nullable: true),
                    ErrorCode = table.Column<string>(maxLength: 80, nullable: true),
                    ErrorCategory = table.Column<string>(maxLength: 80, nullable: true),
                    Retryable = table.Column<bool>(nullable: false),
                    CorrelationId = table.Column<string>(maxLength: 120, nullable: true),
                    TraceId = table.Column<string>(maxLength: 64, nullable: true),
                    SpanId = table.Column<string>(maxLength: 32, nullable: true),
                    ExceptionChain = table.Column<string>(maxLength: 300, nullable: true),
                    RedactedResponseExcerpt = table.Column<string>(maxLength: 1000, nullable: true),
                    SentPrompt = table.Column<string>(nullable: true),
                    ReceivedResult = table.Column<string>(nullable: true),
                    ValidationResult = table.Column<string>(nullable: true),
                    PromptVersion = table.Column<string>(maxLength: 80, nullable: true),
                    ContextHash = table.Column<string>(maxLength: 64, nullable: true),
                    ContextSizeBytes = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionExecutionAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionExecutions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    Kind = table.Column<string>(maxLength: 32, nullable: false),
                    TriggerType = table.Column<string>(maxLength: 32, nullable: false),
                    TriggerId = table.Column<string>(maxLength: 40, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    Stage = table.Column<string>(maxLength: 40, nullable: true),
                    SchemaVersion = table.Column<int>(nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    IdempotencyKey = table.Column<string>(maxLength: 160, nullable: false),
                    PayloadHash = table.Column<string>(maxLength: 64, nullable: false),
                    ActionDecisionAiProfileId = table.Column<string>(maxLength: 80, nullable: true),
                    NarrativeAiProfileId = table.Column<string>(maxLength: 80, nullable: true),
                    AcceptedHeadTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    AcceptedSessionRevision = table.Column<long>(nullable: false),
                    PublishPolicy = table.Column<string>(maxLength: 32, nullable: false),
                    Priority = table.Column<int>(nullable: false),
                    IsRetryable = table.Column<bool>(nullable: false),
                    AttemptCount = table.Column<int>(nullable: false),
                    MaxAttempts = table.Column<int>(nullable: false),
                    NextAttemptAt = table.Column<DateTimeOffset>(nullable: true),
                    LeaseOwner = table.Column<string>(maxLength: 120, nullable: true),
                    LeaseToken = table.Column<string>(maxLength: 80, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(nullable: true),
                    ErrorCode = table.Column<string>(maxLength: 80, nullable: true),
                    UserErrorMessage = table.Column<string>(maxLength: 500, nullable: true),
                    TraceParent = table.Column<string>(maxLength: 512, nullable: true),
                    SupersededByExecutionId = table.Column<string>(maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    QueuedAt = table.Column<DateTimeOffset>(nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    CancelRequestedAt = table.Column<DateTimeOffset>(nullable: true),
                    DismissedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionNarrativeSignals",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    NarrativeTurnId = table.Column<string>(maxLength: 40, nullable: false),
                    Code = table.Column<string>(maxLength: 80, nullable: false),
                    Evidence = table.Column<string>(maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNarrativeSignals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionNoteRevisions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    NoteId = table.Column<string>(maxLength: 40, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    Title = table.Column<string>(maxLength: 160, nullable: false),
                    Body = table.Column<string>(nullable: false),
                    SourceArtifactId = table.Column<string>(maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNoteRevisions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionNotes",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    Kind = table.Column<string>(maxLength: 32, nullable: false),
                    Title = table.Column<string>(maxLength: 160, nullable: false),
                    AliasesJson = table.Column<string>(nullable: false),
                    Body = table.Column<string>(nullable: false),
                    CanonStatus = table.Column<string>(maxLength: 24, nullable: false),
                    FirstTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    UpdatedFromTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    UpdateSource = table.Column<string>(maxLength: 24, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionNotes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionObjectStates",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    ScenarioObjectId = table.Column<string>(nullable: false),
                    LocationId = table.Column<string>(nullable: false),
                    StateJson = table.Column<string>(nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionObjectStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionObjectStates_ScenarioLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "ScenarioLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionObjectStates_ScenarioObjects_ScenarioObjectId",
                        column: x => x.ScenarioObjectId,
                        principalTable: "ScenarioObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SessionPlayerInputs",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    RequestId = table.Column<string>(maxLength: 120, nullable: false),
                    Text = table.Column<string>(maxLength: 4000, nullable: false),
                    InteractionType = table.Column<string>(maxLength: 32, nullable: false),
                    PayloadHash = table.Column<string>(maxLength: 64, nullable: false),
                    AcceptedAfterTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    AcceptedSessionRevision = table.Column<long>(nullable: false),
                    CreatedBy = table.Column<string>(maxLength: 450, nullable: false),
                    SupersedesInputId = table.Column<string>(maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionPlayerInputs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessionProgressionModuleSnapshots",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    TransitionId = table.Column<string>(maxLength: 80, nullable: false),
                    ModuleId = table.Column<string>(maxLength: 160, nullable: false),
                    ModuleVersion = table.Column<string>(maxLength: 80, nullable: false),
                    ModuleDigest = table.Column<string>(maxLength: 64, nullable: false),
                    ConfigurationJson = table.Column<string>(nullable: false),
                    ContextJson = table.Column<string>(nullable: false),
                    RandomValueCount = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionProgressionModuleSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionProgressionModuleSnapshots_ScenarioProgressionTransitions_TransitionId",
                        column: x => x.TransitionId,
                        principalTable: "ScenarioProgressionTransitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SessionProgressionTransitionReceipts",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    SourceSignalId = table.Column<string>(maxLength: 40, nullable: false),
                    TransitionId = table.Column<string>(maxLength: 80, nullable: false),
                    FromNodeId = table.Column<string>(maxLength: 80, nullable: false),
                    ToNodeId = table.Column<string>(maxLength: 80, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    ModuleId = table.Column<string>(maxLength: 160, nullable: true),
                    ModuleVersion = table.Column<string>(maxLength: 80, nullable: true),
                    ModuleDigest = table.Column<string>(maxLength: 64, nullable: true),
                    ModuleConfigurationJson = table.Column<string>(nullable: true),
                    ModuleContextJson = table.Column<string>(nullable: true),
                    ModuleRandomValueCount = table.Column<int>(nullable: false),
                    ModuleTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    Revision = table.Column<long>(nullable: false),
                    AttemptCount = table.Column<int>(nullable: false),
                    LeaseId = table.Column<string>(maxLength: 40, nullable: true),
                    LeaseExpiresAt = table.Column<DateTimeOffset>(nullable: true),
                    IsRetryable = table.Column<bool>(nullable: false),
                    ErrorCode = table.Column<string>(nullable: true),
                    ErrorMessage = table.Column<string>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionProgressionTransitionReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionProgressionTransitionReceipts_ScenarioProgressionTransitions_TransitionId",
                        column: x => x.TransitionId,
                        principalTable: "ScenarioProgressionTransitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionProgressionTransitionReceipts_SessionNarrativeSignals_SourceSignalId",
                        column: x => x.SourceSignalId,
                        principalTable: "SessionNarrativeSignals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionProgressStates",
                columns: table => new
                {
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    CurrentNodeId = table.Column<string>(maxLength: 80, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
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
                name: "SessionRuleActionSteps",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    ExecutionId = table.Column<string>(maxLength: 40, nullable: false),
                    PlayerInputId = table.Column<string>(maxLength: 40, nullable: false),
                    ScenarioDefinitionVersionId = table.Column<string>(nullable: false),
                    Stage = table.Column<string>(maxLength: 40, nullable: false),
                    SchemaVersion = table.Column<int>(nullable: false),
                    PreSessionRevision = table.Column<long>(nullable: false),
                    PostSessionRevision = table.Column<long>(nullable: true),
                    ObjectRevisionsJson = table.Column<string>(nullable: false),
                    ActionSnapshotJson = table.Column<string>(nullable: false),
                    DecisionJson = table.Column<string>(nullable: true),
                    SelectedRuleId = table.Column<string>(nullable: true),
                    ResolutionPlanJson = table.Column<string>(nullable: true),
                    EntityStateTransitionJson = table.Column<string>(nullable: true),
                    AppliedEffectsJson = table.Column<string>(nullable: true),
                    PublicPostStateJson = table.Column<string>(nullable: true),
                    FactsJson = table.Column<string>(nullable: true),
                    EventsJson = table.Column<string>(nullable: true),
                    NarrativeHintsJson = table.Column<string>(nullable: true),
                    ForbiddenNarrativeFactsJson = table.Column<string>(nullable: true),
                    ExtensionReceiptJson = table.Column<string>(nullable: true),
                    EnumeratedAt = table.Column<DateTimeOffset>(nullable: true),
                    SelectedAt = table.Column<DateTimeOffset>(nullable: true),
                    ResolvedAt = table.Column<DateTimeOffset>(nullable: true),
                    ExtensionCompletedAt = table.Column<DateTimeOffset>(nullable: true),
                    AppliedAt = table.Column<DateTimeOffset>(nullable: true),
                    NarrativePublishedAt = table.Column<DateTimeOffset>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionRuleActionSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionRuleActionSteps_SessionExecutions_ExecutionId",
                        column: x => x.ExecutionId,
                        principalTable: "SessionExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionRuleActionSteps_SessionPlayerInputs_PlayerInputId",
                        column: x => x.PlayerInputId,
                        principalTable: "SessionPlayerInputs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Sessions",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    OwnerId = table.Column<string>(maxLength: 450, nullable: false),
                    ScenarioId = table.Column<string>(maxLength: 40, nullable: false),
                    ScenarioDefinitionVersionId = table.Column<string>(nullable: true),
                    CurrentLocationId = table.Column<string>(nullable: true),
                    CreationRequestId = table.Column<string>(maxLength: 120, nullable: true),
                    CreationPayloadHash = table.Column<string>(maxLength: 64, nullable: true),
                    SelectedHero = table.Column<string>(maxLength: 1000, nullable: false),
                    Status = table.Column<string>(maxLength: 32, nullable: false),
                    InterpretationEnabled = table.Column<bool>(nullable: false),
                    HeadTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    Revision = table.Column<long>(nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sessions_ScenarioDefinitionVersions_ScenarioDefinitionVersionId",
                        column: x => x.ScenarioDefinitionVersionId,
                        principalTable: "ScenarioDefinitionVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Sessions_ScenarioLocations_CurrentLocationId",
                        column: x => x.CurrentLocationId,
                        principalTable: "ScenarioLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    Revision = table.Column<long>(nullable: false),
                    FlagsJson = table.Column<string>(nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(nullable: false)
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
                name: "SessionSummaries",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    FromTurnId = table.Column<string>(maxLength: 40, nullable: false),
                    ToTurnId = table.Column<string>(maxLength: 40, nullable: false),
                    FromPosition = table.Column<int>(nullable: false),
                    ToPosition = table.Column<int>(nullable: false),
                    Version = table.Column<int>(nullable: false),
                    Confidence = table.Column<string>(maxLength: 24, nullable: false),
                    CurrentLocation = table.Column<string>(nullable: false),
                    CharactersJson = table.Column<string>(nullable: false),
                    ObjectivesJson = table.Column<string>(nullable: false),
                    CluesJson = table.Column<string>(nullable: false),
                    InventoryJson = table.Column<string>(nullable: false),
                    ModuleResultsJson = table.Column<string>(nullable: false),
                    Body = table.Column<string>(nullable: false),
                    GeneratedAt = table.Column<DateTimeOffset>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionSummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionSummaries_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionTurns",
                columns: table => new
                {
                    Id = table.Column<string>(maxLength: 40, nullable: false),
                    SessionId = table.Column<string>(maxLength: 40, nullable: false),
                    Position = table.Column<int>(nullable: false),
                    PreviousTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    Kind = table.Column<string>(maxLength: 32, nullable: false),
                    DialogueSchemaVersion = table.Column<string>(maxLength: 40, nullable: true),
                    ContextSchemaVersion = table.Column<string>(maxLength: 40, nullable: true),
                    ContextComponentIdsJson = table.Column<string>(nullable: true),
                    ContextSizeBytes = table.Column<int>(nullable: true),
                    ContextHash = table.Column<string>(maxLength: 64, nullable: true),
                    PromptVersion = table.Column<string>(maxLength: 40, nullable: true),
                    DialogueTurnType = table.Column<string>(maxLength: 32, nullable: true),
                    Heading = table.Column<string>(maxLength: 120, nullable: true),
                    NarrativeBody = table.Column<string>(nullable: true),
                    Interpretation = table.Column<string>(maxLength: 500, nullable: true),
                    SourceModuleTurnId = table.Column<string>(maxLength: 40, nullable: true),
                    PlayerInputId = table.Column<string>(maxLength: 40, nullable: true),
                    AiProvider = table.Column<string>(maxLength: 40, nullable: true),
                    AiModel = table.Column<string>(maxLength: 160, nullable: true),
                    AiResponseId = table.Column<string>(maxLength: 160, nullable: true),
                    AiInputTokens = table.Column<int>(nullable: true),
                    AiOutputTokens = table.Column<int>(nullable: true),
                    AiLatencyMilliseconds = table.Column<long>(nullable: true),
                    AiAttemptCount = table.Column<int>(nullable: true),
                    AiFinishReason = table.Column<string>(maxLength: 80, nullable: true),
                    SourceSessionRevision = table.Column<long>(nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(nullable: false)
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

            migrationBuilder.CreateTable(
                name: "SessionTurnLorebookReferences",
                columns: table => new
                {
                    TurnId = table.Column<string>(maxLength: 40, nullable: false),
                    NoteId = table.Column<string>(maxLength: 40, nullable: false),
                    Reason = table.Column<string>(maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionTurnLorebookReferences", x => new { x.TurnId, x.NoteId });
                    table.ForeignKey(
                        name: "FK_SessionTurnLorebookReferences_SessionNotes_NoteId",
                        column: x => x.NoteId,
                        principalTable: "SessionNotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionTurnLorebookReferences_SessionTurns_TurnId",
                        column: x => x.TurnId,
                        principalTable: "SessionTurns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiProviderProfileValidations_ProfileId_TestedAt",
                table: "AiProviderProfileValidations",
                columns: new[] { "ProfileId", "TestedAt" });

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
                name: "IX_EvaluationAggregates_SessionId_Revision",
                table: "EvaluationAggregates",
                columns: new[] { "SessionId", "Revision" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationAttempts_CandidateId",
                table: "EvaluationAttempts",
                column: "CandidateId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationAttempts_SessionId",
                table: "EvaluationAttempts",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationAttempts_SituationId_CandidateId_Repetition",
                table: "EvaluationAttempts",
                columns: new[] { "SituationId", "CandidateId", "Repetition" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationAttempts_Status_NextAttemptAt_CreatedAt",
                table: "EvaluationAttempts",
                columns: new[] { "Status", "NextAttemptAt", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationCandidates_SessionId_BlindCode",
                table: "EvaluationCandidates",
                columns: new[] { "SessionId", "BlindCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationCandidates_SessionId_CandidateKey",
                table: "EvaluationCandidates",
                columns: new[] { "SessionId", "CandidateKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationHumanJudgments_ItemId_ReviewerId_CriterionKey_Revision",
                table: "EvaluationHumanJudgments",
                columns: new[] { "ItemId", "ReviewerId", "CriterionKey", "Revision" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationMachineJudgments_InvocationId_JudgeKey_JudgeVersion_CriterionKey",
                table: "EvaluationMachineJudgments",
                columns: new[] { "InvocationId", "JudgeKey", "JudgeVersion", "CriterionKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationModelInvocations_AttemptId_InvocationNumber",
                table: "EvaluationModelInvocations",
                columns: new[] { "AttemptId", "InvocationNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationReviewAssignments_BatchId",
                table: "EvaluationReviewAssignments",
                column: "BatchId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationReviewAssignments_OpaqueCode",
                table: "EvaluationReviewAssignments",
                column: "OpaqueCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationReviewBatches_SessionId_CreatedAt",
                table: "EvaluationReviewBatches",
                columns: new[] { "SessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationReviewItems_AssignmentId_AttemptId",
                table: "EvaluationReviewItems",
                columns: new[] { "AssignmentId", "AttemptId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationSessions_OwnerId_CreatedAt",
                table: "EvaluationSessions",
                columns: new[] { "OwnerId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationSessions_OwnerId_IdempotencyKey",
                table: "EvaluationSessions",
                columns: new[] { "OwnerId", "IdempotencyKey" },
                unique: true,
                filter: "\"IdempotencyKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationSituations_SessionId_RequestHash",
                table: "EvaluationSituations",
                columns: new[] { "SessionId", "RequestHash" });

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationSituations_SessionId_StableKey_Revision",
                table: "EvaluationSituations",
                columns: new[] { "SessionId", "StableKey", "Revision" },
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
                name: "IX_ScenarioDefinitionVersions_ScenarioId",
                table: "ScenarioDefinitionVersions",
                column: "ScenarioId",
                unique: true,
                filter: "\"Status\" = 'Draft'");

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioDefinitionVersions_ScenarioId_Version",
                table: "ScenarioDefinitionVersions",
                columns: new[] { "ScenarioId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioLocations_DefinitionVersionId_Code",
                table: "ScenarioLocations",
                columns: new[] { "DefinitionVersionId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioObjects_DefinitionVersionId_Code",
                table: "ScenarioObjects",
                columns: new[] { "DefinitionVersionId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioObjects_LocationId",
                table: "ScenarioObjects",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioObjectTypeActions_ObjectTypeId_Code",
                table: "ScenarioObjectTypeActions",
                columns: new[] { "ObjectTypeId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioObjectTypes_DefinitionVersionId_Code",
                table: "ScenarioObjectTypes",
                columns: new[] { "DefinitionVersionId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionNodes_DefinitionVersionId_Code",
                table: "ScenarioProgressionNodes",
                columns: new[] { "DefinitionVersionId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionTransitions_DefinitionVersionId_SourceNodeId_SignalCode",
                table: "ScenarioProgressionTransitions",
                columns: new[] { "DefinitionVersionId", "SourceNodeId", "SignalCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionTransitions_SourceNodeId",
                table: "ScenarioProgressionTransitions",
                column: "SourceNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_ScenarioProgressionTransitions_TargetNodeId",
                table: "ScenarioProgressionTransitions",
                column: "TargetNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAiInteractions_AttemptId_Stage",
                table: "SessionAiInteractions",
                columns: new[] { "AttemptId", "Stage" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionAiInteractions_ExecutionId",
                table: "SessionAiInteractions",
                column: "ExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionAiInteractions_SessionId_StartedAt_Sequence",
                table: "SessionAiInteractions",
                columns: new[] { "SessionId", "StartedAt", "Sequence" });

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
                name: "IX_SessionObjectStates_LocationId",
                table: "SessionObjectStates",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionObjectStates_ScenarioObjectId",
                table: "SessionObjectStates",
                column: "ScenarioObjectId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionObjectStates_SessionId_ScenarioObjectId",
                table: "SessionObjectStates",
                columns: new[] { "SessionId", "ScenarioObjectId" },
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
                name: "IX_SessionRuleActionSteps_ExecutionId",
                table: "SessionRuleActionSteps",
                column: "ExecutionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionRuleActionSteps_PlayerInputId",
                table: "SessionRuleActionSteps",
                column: "PlayerInputId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionRuleActionSteps_SessionId",
                table: "SessionRuleActionSteps",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_CurrentLocationId",
                table: "Sessions",
                column: "CurrentLocationId");

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
                name: "IX_Sessions_ScenarioDefinitionVersionId",
                table: "Sessions",
                column: "ScenarioDefinitionVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_ScenarioId",
                table: "Sessions",
                column: "ScenarioId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionSummaries_SessionId_Version",
                table: "SessionSummaries",
                columns: new[] { "SessionId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionTurnLorebookReferences_NoteId",
                table: "SessionTurnLorebookReferences",
                column: "NoteId");

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
                name: "FK_SessionAiInteractions_SessionExecutionAttempts_AttemptId",
                table: "SessionAiInteractions",
                column: "AttemptId",
                principalTable: "SessionExecutionAttempts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionAiInteractions_SessionExecutions_ExecutionId",
                table: "SessionAiInteractions",
                column: "ExecutionId",
                principalTable: "SessionExecutions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionAiInteractions_Sessions_SessionId",
                table: "SessionAiInteractions",
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
                name: "FK_SessionObjectStates_Sessions_SessionId",
                table: "SessionObjectStates",
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
                name: "FK_SessionProgressionTransitionReceipts_SessionTurns_ModuleTurnId",
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
                name: "FK_SessionRuleActionSteps_Sessions_SessionId",
                table: "SessionRuleActionSteps",
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
                name: "AiCredentials");

            migrationBuilder.DropTable(
                name: "AiProviderProfiles");

            migrationBuilder.DropTable(
                name: "AiProviderProfileValidations");

            migrationBuilder.DropTable(
                name: "AiProviderRuntimeSettings");

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
                name: "EvaluationAggregates");

            migrationBuilder.DropTable(
                name: "EvaluationHumanJudgments");

            migrationBuilder.DropTable(
                name: "EvaluationMachineJudgments");

            migrationBuilder.DropTable(
                name: "EvaluationReviewItems");

            migrationBuilder.DropTable(
                name: "ModuleOutcomeApplications");

            migrationBuilder.DropTable(
                name: "ModulePackages");

            migrationBuilder.DropTable(
                name: "ScenarioObjectTypeActions");

            migrationBuilder.DropTable(
                name: "SessionAiInteractions");

            migrationBuilder.DropTable(
                name: "SessionImages");

            migrationBuilder.DropTable(
                name: "SessionNoteProposals");

            migrationBuilder.DropTable(
                name: "SessionNoteRevisions");

            migrationBuilder.DropTable(
                name: "SessionObjectStates");

            migrationBuilder.DropTable(
                name: "SessionProgressionModuleSnapshots");

            migrationBuilder.DropTable(
                name: "SessionProgressionTransitionReceipts");

            migrationBuilder.DropTable(
                name: "SessionProgressStates");

            migrationBuilder.DropTable(
                name: "SessionRuleActionSteps");

            migrationBuilder.DropTable(
                name: "SessionStates");

            migrationBuilder.DropTable(
                name: "SessionSummaries");

            migrationBuilder.DropTable(
                name: "SessionTurnLorebookReferences");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "EvaluationModelInvocations");

            migrationBuilder.DropTable(
                name: "EvaluationReviewAssignments");

            migrationBuilder.DropTable(
                name: "ModuleExecutionRequests");

            migrationBuilder.DropTable(
                name: "ScenarioObjectTypes");

            migrationBuilder.DropTable(
                name: "SessionArtifacts");

            migrationBuilder.DropTable(
                name: "ScenarioObjects");

            migrationBuilder.DropTable(
                name: "ScenarioProgressionTransitions");

            migrationBuilder.DropTable(
                name: "SessionNarrativeSignals");

            migrationBuilder.DropTable(
                name: "SessionNotes");

            migrationBuilder.DropTable(
                name: "EvaluationAttempts");

            migrationBuilder.DropTable(
                name: "EvaluationReviewBatches");

            migrationBuilder.DropTable(
                name: "ModuleExecutions");

            migrationBuilder.DropTable(
                name: "SessionExecutionAttempts");

            migrationBuilder.DropTable(
                name: "ScenarioProgressionNodes");

            migrationBuilder.DropTable(
                name: "EvaluationCandidates");

            migrationBuilder.DropTable(
                name: "EvaluationSituations");

            migrationBuilder.DropTable(
                name: "SessionExecutions");

            migrationBuilder.DropTable(
                name: "EvaluationSessions");

            migrationBuilder.DropTable(
                name: "SessionTurns");

            migrationBuilder.DropTable(
                name: "SessionPlayerInputs");

            migrationBuilder.DropTable(
                name: "Sessions");

            migrationBuilder.DropTable(
                name: "ScenarioLocations");

            migrationBuilder.DropTable(
                name: "ScenarioDefinitionVersions");

            migrationBuilder.DropTable(
                name: "Scenarios");
        }
    }
}
