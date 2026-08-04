using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.Accounts;
using Myriale.Api.Application.AiProviders;
using Myriale.Api.Application.ModulePackages;
using Myriale.Api.Application.ProgressionRuntime;
using Myriale.Api.Application.ModuleExecutions;
using Myriale.Api.Application.ModuleHandoffs;
using Myriale.Api.Application.SessionArtifacts;
using Myriale.Api.Application.SessionExecutions;
using Myriale.Api.Application.ScenarioTurns;
using Myriale.Api.Application.Scenarios;
using Myriale.Api.Application.SessionMemory;
using Myriale.Api.Application.Sessions;
using Myriale.Api.Infrastructure.SessionArtifacts;
using Myriale.Api.Infrastructure.Sessions;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Domain.Scenarios;
using Myriale.Api.Infrastructure.Accounts;
using Myriale.Api.Infrastructure.AiProviders;
using Myriale.Api.Infrastructure.ModulePackages;
using Myriale.Api.Infrastructure.ProgressionRuntime;
using Myriale.Api.Infrastructure.ModuleExecutions;
using Myriale.Api.Infrastructure.SessionExecutions;
using Myriale.Api.Infrastructure.Scenarios;
using Myriale.Api.Infrastructure.SessionMemory;
using Myriale.Api.Infrastructure.ModuleHandoffs;
using Myriale.Api.Infrastructure.ScenarioTurns;
using Myriale.Api.Modules;
using Myriale.Api.Modules.Execution;
using Myriale.Api.Modules.Runtime;
using Myriale.Api.Modules.UI;
using Myriale.Api.Services;
using Myriale.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddOpenApi();
builder.Services.AddDataProtection();
builder.Services.AddOptions<AiProviderOptions>()
    .Bind(builder.Configuration.GetSection(AiProviderOptions.SectionName))
    // Profile definitions may come entirely from the database, so startup must not require
    // appsettings or Vault catalog entries to exist before administrators register the first profile.
    .Validate(options => options.TimeoutSeconds > 0 && options.MaxOutputTokens > 0 && options.MaxAttempts > 0, "AI provider limits must be positive.")
    .Validate(options => options.SessionRequestsPerMinute > 0
        && options.UserRequestsPerMinute > 0
        && options.MaxTokensPerSession > 0
        && options.LeaseRecoveryIntervalSeconds > 0, "AI quota and recovery limits must be positive.")
    .ValidateOnStart();
builder.Services.AddOptions<AiProviderDeploymentOptions>()
    .Bind(builder.Configuration.GetSection(AiProviderDeploymentOptions.SectionName));
builder.Services.AddOptions<AiRuntimeOptions>()
    .Bind(builder.Configuration.GetSection(AiRuntimeOptions.SectionName));
builder.Services.AddSingleton<IAiDeploymentProfileSource, OptionsAiDeploymentProfileSource>();
builder.Services.AddScoped<IAiSecretProtector, DataProtectionAiSecretProtector>();
builder.Services.AddScoped<IAiProviderProfileRepository, EfAiProviderProfileRepository>();
builder.Services.AddScoped<IAiCredentialRepository, EfAiCredentialRepository>();
builder.Services.AddScoped<IAiRuntimeCredentialResolver, AiRuntimeCredentialResolver>();
builder.Services.AddScoped<AiProviderProfileUseCases>();
builder.Services.AddScoped<AiCredentialUseCases>();
builder.Services.AddScoped<AiProviderTestUseCases>();
builder.Services.AddScoped<EfActiveAiProviderSettingsRepository>();
builder.Services.AddScoped<IActiveAiProviderSettingsRepository>(services => services.GetRequiredService<EfActiveAiProviderSettingsRepository>());
builder.Services.AddScoped<IActiveAiProviderSettingsReader>(services => services.GetRequiredService<EfActiveAiProviderSettingsRepository>());
builder.Services.AddScoped<ActiveAiProviderQueryService>();
builder.Services.AddScoped<ActivateAiProviderUseCase>();
builder.Services.AddScoped<AiProviderAdministrationQueryService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<OpenAiCompatibleTextProvider>();
builder.Services.AddScoped<IAiTextProvider>(services => services.GetRequiredService<OpenAiCompatibleTextProvider>());
builder.Services.AddScoped<MockAiNarrativeGenerator>();
builder.Services.AddScoped<ProviderNarrativeGenerator>();
builder.Services.AddScoped<INarrativeGenerator>(services =>
    string.Equals(builder.Configuration["AiRuntime:Mode"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<IScenarioTurnAi>(services =>
    string.Equals(builder.Configuration["AiRuntime:Mode"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<IActionRecommendationGenerator>(services =>
    string.Equals(builder.Configuration["AiRuntime:Mode"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<IProgressionReceiptRepository, EfProgressionReceiptRepository>();
builder.Services.AddScoped<EnsureProgressionReceiptCommand>();
builder.Services.AddScoped<IProgressionReceiptCommand>(services => services.GetRequiredService<EnsureProgressionReceiptCommand>());
builder.Services.AddScoped<EnsureProgressionSignalCommand>();
builder.Services.AddSingleton<ScenarioRuleJsonCodec>();
builder.Services.AddScoped<ISessionMemoryRepository, EfSessionMemoryRepository>();
builder.Services.AddScoped<SessionMemoryQueryService>();
builder.Services.AddScoped<CreateSessionNoteUseCase>();
builder.Services.AddScoped<UpdateSessionNoteUseCase>();
builder.Services.AddScoped<ReviewSessionNoteProposalUseCase>();
builder.Services.AddScoped<IScenarioDefinitionRepository, EfScenarioDefinitionRepository>();
builder.Services.AddScoped<ScenarioDefinitionMapper>();
builder.Services.AddScoped<ScenarioDefinitionValidator>();
builder.Services.AddScoped<ScenarioDefinitionWriter>();
builder.Services.AddScoped<ScenarioDefinitionDraftService>();
builder.Services.AddScoped<ScenarioDefinitionQueryService>();
builder.Services.AddScoped<ScenarioQueryService>();
builder.Services.AddScoped<CreateScenarioUseCase>();
builder.Services.AddScoped<UpdateScenarioUseCase>();
builder.Services.AddScoped<CreateScenarioDefinitionDraftUseCase>();
builder.Services.AddScoped<SaveScenarioDefinitionUseCase>();
builder.Services.AddScoped<PublishScenarioDefinitionUseCase>();
builder.Services.AddScoped<ScenarioDefinitionReadinessPolicy>();
builder.Services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();
builder.Services.AddScoped<IDomainEventHandler<ScenarioDefinitionPublished>, ScenarioDefinitionPublishedLoggingHandler>();
builder.Services.AddScoped<ScenarioRuleEvaluator>();
builder.Services.AddScoped<ScenarioRuleConfigurationResolver>();
builder.Services.AddScoped<ScenarioRuleWorldSnapshotFactory>();
builder.Services.AddScoped<ScenarioPublicProjector>();
builder.Services.AddSingleton<ScenarioActionDecisionModelMapper>();
builder.Services.AddScoped<ScenarioActionEnumerator>();
builder.Services.AddScoped<IScenarioRuleResolutionService, ScenarioRuleResolutionService>();
builder.Services.AddScoped<ScenarioRuleDebugService>();
builder.Services.AddScoped<IScenarioExecutionFence, EfScenarioExecutionFence>();
builder.Services.AddScoped<IScenarioWorldSnapshotQuery, EfScenarioWorldSnapshotQuery>();
builder.Services.AddScoped<IScenarioActionSnapshotRepository, EfScenarioActionSnapshotRepository>();
builder.Services.AddScoped<IScenarioAiInteractionRecorder, EfScenarioAiInteractionRecorder>();
builder.Services.AddScoped<IScenarioAiDecisionService, ScenarioAiDecisionService>();
builder.Services.AddScoped<IScenarioTurnArtifactWriter, ScenarioTurnArtifactWriter>();
builder.Services.AddScoped<IScenarioEffectCommitUnitOfWork, EfScenarioEffectCommitUnitOfWork>();
builder.Services.AddScoped<IScenarioNarrativeGenerationService, ScenarioNarrativeGenerationService>();
builder.Services.AddScoped<IScenarioSessionTurnAppender, ScenarioSessionTurnAppender>();
builder.Services.AddScoped<IScenarioNarrativePublisher, EfScenarioNarrativePublisher>();
builder.Services.AddScoped<IModuleHandoffSourceSnapshotQuery, EfModuleHandoffSourceSnapshotQuery>();
builder.Services.AddSingleton<ModuleHandoffCausalityValidator>();
builder.Services.AddSingleton<ModuleHandoffNarrativeRequestBuilder>();
builder.Services.AddScoped<IModuleHandoffAiInteractionRecorder, EfModuleHandoffAiInteractionRecorder>();
builder.Services.AddScoped<IModuleHandoffNarrativeService, ModuleHandoffNarrativeService>();
builder.Services.AddScoped<IModuleHandoffArtifactWriter, ModuleHandoffArtifactWriter>();
builder.Services.AddScoped<IModuleHandoffSessionTurnAppender, ModuleHandoffSessionTurnAppender>();
builder.Services.AddScoped<IModuleHandoffPublishUnitOfWork, EfModuleHandoffPublishUnitOfWork>();
builder.Services.AddScoped<ModuleHandoffExecutionOrchestrator>();
builder.Services.AddScoped<ScenarioTurnExecutionOrchestrator>();
builder.Services.AddScoped<IScenarioExtensionAdapter, ScenarioModuleExtensionAdapter>();
builder.Services.AddScoped<IAiProfileCatalog, AiProfileCatalog>();
builder.Services.AddScoped<ISessionExecutionRepository, EfSessionExecutionRepository>();
builder.Services.AddScoped<GetSessionExecutionQuery>();
builder.Services.AddScoped<RetrySessionExecutionCommand>();
builder.Services.AddScoped<CancelSessionExecutionCommand>();
builder.Services.AddScoped<DismissSessionExecutionCommand>();
builder.Services.AddScoped<ISessionInputAcceptanceRepository, EfSessionInputAcceptanceRepository>();
builder.Services.AddScoped<ISessionCreationRepository, EfSessionCreationRepository>();
builder.Services.AddScoped<AcceptSessionInputUseCase>();
builder.Services.AddScoped<CreateSessionUseCase>();
builder.Services.AddScoped<ListSessionsQueryService>();
builder.Services.AddScoped<GetSessionDetailQueryService>();
builder.Services.AddScoped<GetSessionTurnQueryService>();
builder.Services.AddScoped<GetSessionTurnInspectionQueryService>();
builder.Services.AddScoped<GetSessionActionRecommendationContextQuery>();
builder.Services.AddScoped<ISessionExecutionOperationsRepository, EfSessionExecutionOperationsRepository>();
builder.Services.AddSingleton<ISessionExecutionJitter, RandomSessionExecutionJitter>();
builder.Services.AddSingleton<ISessionExecutionRetryPolicy, SessionExecutionRetryPolicy>();
builder.Services.AddScoped<ISessionExecutionHandler, ScenarioTurnExecutionHandler>();
builder.Services.AddScoped<ISessionExecutionHandler, ModuleHandoffExecutionHandler>();
builder.Services.AddSingleton(new SessionExecutionWorkerSettings());
builder.Services.AddHostedService<SessionExecutionWorker>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddOptions<SessionExecutionMetricsOptions>()
    .Bind(builder.Configuration.GetSection(SessionExecutionMetricsOptions.SectionName))
    .Validate(options => options.SampleIntervalSeconds > 0 && options.StuckAfterSeconds > 0, "Session execution metric intervals must be positive.")
    .ValidateOnStart();
builder.Services.AddSingleton<SessionExecutionMetricSnapshot>();
builder.Services.AddSingleton<SessionExecutionObservableMetrics>();
builder.Services.AddSingleton<SessionExecutionMetricsSampler>();
builder.Services.AddHostedService(services => services.GetRequiredService<SessionExecutionMetricsSampler>());
builder.Services.AddOptions<SessionImageOptions>()
    .Bind(builder.Configuration.GetSection(SessionImageOptions.SectionName))
    .Validate(options => options.MaxBytes > 0 && options.MaxWidth > 0 && options.MaxHeight > 0
        && options.ReconciliationIntervalMinutes > 0 && options.OrphanGraceMinutes >= 0, "Session image limits must be valid.")
    .ValidateOnStart();
builder.Services.AddScoped<ISessionArtifactWriter, EfSessionArtifactWriter>();
builder.Services.AddScoped<EfSessionArtifactRepository>();
builder.Services.AddScoped<ISessionArtifactRepository>(services => services.GetRequiredService<EfSessionArtifactRepository>());
builder.Services.AddScoped<ISessionArtifactRetentionRepository>(services => services.GetRequiredService<EfSessionArtifactRepository>());
builder.Services.AddScoped<AttachSessionImageUseCase>();
builder.Services.AddScoped<GetSessionImageMediaQuery>();
builder.Services.AddScoped<GetSessionArtifactActivityQuery>();
builder.Services.AddSingleton<ISessionObjectStorage, FileSessionObjectStorage>();
builder.Services.AddSingleton<SessionImageValidator>();
builder.Services.AddScoped<SessionArtifactReconciler>();
builder.Services.AddHostedService<SessionArtifactRetentionWorker>();
builder.Services.AddOptions<NarrativeContextOptions>()
    .Bind(builder.Configuration.GetSection(NarrativeContextOptions.SectionName))
    .Validate(options => options.RecentTurnsTokenBudget >= 0,
        "Narrative recent-turn budget must be non-negative.")
    .ValidateOnStart();
builder.Services.AddSingleton<INarrativeRecentTurnSelector, NarrativeRecentTurnSelector>();
builder.Services.AddSingleton<INarrativeTokenEstimator, Utf8NarrativeTokenEstimator>();

builder.Services.AddScoped<IHomeDashboardService, DemoHomeDashboardService>();
builder.Services.Configure<ModulePackageOptions>(builder.Configuration.GetSection(ModulePackageOptions.SectionName));
builder.Services.Configure<ModuleRuntimeOptions>(builder.Configuration.GetSection(ModuleRuntimeOptions.SectionName));
builder.Services.Configure<ModuleExecutionOptions>(builder.Configuration.GetSection(ModuleExecutionOptions.SectionName));
builder.Services.AddScoped<IModulePackageRepository, EfModulePackageRepository>();
builder.Services.AddScoped<IModulePackageCatalog, EfModulePackageCatalog>();
builder.Services.AddScoped<IModulePackageArtifactStore, FileModulePackageArtifactStore>();
builder.Services.AddScoped<IModulePackageInspector, ModulePackageInspector>();
builder.Services.AddScoped<InstallModulePackageCommand>();
builder.Services.AddScoped<RescanModulePackagesCommand>();
builder.Services.AddScoped<EnableModulePackageCommand>();
builder.Services.AddScoped<DisableModulePackageCommand>();
builder.Services.AddScoped<IModuleRuntime, DotNetModuleRuntime>();
builder.Services.AddSingleton<ModuleAssemblyCache>();
builder.Services.AddSingleton<ModuleRuntimeInvocationGate>();
builder.Services.AddScoped<SessionOutcomeEffectService>();
builder.Services.AddScoped<IModuleExecutionRepository, EfModuleExecutionRepository>();
builder.Services.AddScoped<IModuleExecutionProjection, ModuleExecutionProjection>();
builder.Services.AddScoped<IModuleHandoffEnqueuePort, EfModuleHandoffEnqueuePort>();
builder.Services.AddScoped<EnqueueModuleHandoffCommand>();
builder.Services.AddScoped<IModuleExecutionWorkflow, ModuleExecutionWorkflow>();
builder.Services.AddScoped<InitializeDetachedModuleExecutionCommand>();
builder.Services.AddScoped<InitializeSessionTurnModuleExecutionCommand>();
builder.Services.AddScoped<DispatchModuleExecutionCommand>();
builder.Services.AddScoped<GetModuleExecutionQuery>();
builder.Services.AddScoped<IModuleUiResourceService, ModuleUiResourceService>();
#pragma warning disable EXTEXP0001 // RemoveAllResilienceHandlers is currently marked experimental.
builder.Services.AddHttpClient("OpenAiCompatible")
    // AI requests own their timeout and retry policy so long-running inference is not cut off by
    // the service-default resilience handler's 10-second attempt timeout.
    .RemoveAllResilienceHandlers();
#pragma warning restore EXTEXP0001
builder.Services.AddHttpClient("MockAi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MockAi:BaseUrl"] ?? "https+http://myriale-mock-ai");
});

var isTestHost = string.Equals(System.Reflection.Assembly.GetEntryAssembly()?.GetName().Name, "testhost", StringComparison.OrdinalIgnoreCase);
var accountConnectionString = builder.Configuration.GetConnectionString("MyrialeAccounts")
    ?? (isTestHost ? null : ExternalPostgresConnectionString.Resolve(builder.Configuration))
    ?? "Data Source=myriale-accounts.db";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (IsPostgresConnectionString(accountConnectionString))
    {
        options.UseNpgsql(accountConnectionString);
    }
    else
    {
        options.UseSqlite(accountConnectionString);
    }
});
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ModuleAdministration", policy =>
        policy.RequireClaim("myriale:module-admin", "true"));
    options.AddPolicy("AiAdministration", policy =>
        policy.RequireClaim("myriale:ai-admin", "true"));
    options.AddPolicy("Administration", policy =>
        policy.RequireClaim("myriale:admin", "true"));
});
builder.Services.AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();
builder.Services.AddScoped<IAccountIdentityService, AspNetAccountIdentityService>();
builder.Services.AddScoped<IAccountSecurityStampUpdater, AspNetAccountSecurityStampUpdater>();
builder.Services.AddScoped<RegisterAccountCommand>();
builder.Services.AddScoped<LoginAccountCommand>();
builder.Services.AddScoped<LogoutAccountCommand>();
builder.Services.AddScoped<GetCurrentAccountQuery>();
builder.Services.AddScoped<UpdateAccountProfileCommand>();
builder.Services.AddScoped<RequestAccountPasswordResetCommand>();
builder.Services.AddScoped<ConfirmAccountPasswordResetCommand>();
builder.Services.AddScoped<WithdrawAccountCommand>();
if (builder.Environment.IsDevelopment() || isTestHost)
{
    builder.Services.AddSingleton<DevelopmentAccountPasswordResetTokenTransport>();
    builder.Services.AddSingleton<IAccountPasswordResetTokenTransport>(services => services.GetRequiredService<DevelopmentAccountPasswordResetTokenTransport>());
    builder.Services.AddSingleton<IDevelopmentAccountPasswordResetTokenStore>(services => services.GetRequiredService<DevelopmentAccountPasswordResetTokenTransport>());
}
else
{
    builder.Services.AddSingleton<IAccountPasswordResetTokenTransport, ProductionAccountPasswordResetTokenTransport>();
}
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("MyrialeFrontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();
_ = app.Services.GetRequiredService<SessionExecutionObservableMetrics>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    var recreateOnStartup = app.Configuration.GetValue("Database:RecreateOnStartup", true);
    if (!recreateOnStartup)
        throw new InvalidOperationException(
            "Database:RecreateOnStartup=false is unsupported until production EF migrations and an upgrade/rollback runbook exist. " +
            "Myriale currently requires a destructive clean-schema baseline.");

    if (db.Database.IsNpgsql())
    {
        await db.Database.ExecuteSqlRawAsync("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    }
    else
    {
        await db.Database.EnsureDeletedAsync();
    }

    await db.Database.EnsureCreatedAsync();

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var developmentSeedUser = await AccountSeedData.SeedAsync(userManager, app.Configuration);
    var useTestScenarioFixtures = isTestHost && app.Configuration.GetValue("TestScenarioFixtures:Enabled", true);
    if (useTestScenarioFixtures)
    {
        await ScenarioTestFixtureData.CreateAsync(db);
    }
    else
    {
        await ScenarioSeedData.SeedAsync(db, developmentSeedUser?.Id);
    }
    if (app.Configuration.GetValue<bool>("DemoModules:Enabled")
        && (!isTestHost || app.Configuration.GetValue<bool>("DemoModules:EnableInTestHost")))
    {
        await DemoModuleSeedData.SeedAsync(
            db,
            scope.ServiceProvider.GetRequiredService<InstallModulePackageCommand>(),
            scope.ServiceProvider.GetRequiredService<EnableModulePackageCommand>(),
            scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>());
    }

    if (app.Configuration.GetValue<bool>("SessionArtifactFixture:Enabled")
        && (!isTestHost || app.Configuration.GetValue<bool>("SessionArtifactFixture:EnableInTestHost")))
    {
        await SessionArtifactFixtureSeedData.SeedAsync(
            db,
            scope.ServiceProvider.GetRequiredService<ISessionObjectStorage>(),
            scope.ServiceProvider.GetRequiredService<ISessionArtifactWriter>(),
            app.Configuration);
    }
}

app.UseCors("MyrialeFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultEndpoints();
app.MapAccountEndpoints();

app.MapScenarioEndpoints();
app.MapScenarioAiEndpoints();
app.MapModuleAdminEndpoints();
app.MapSessionEndpoints();
app.MapSessionExecutionEndpoints();
app.MapSessionMemoryEndpoints();
app.MapSessionArtifactEndpoints();
app.MapModuleExecutionEndpoints();
app.MapModuleUiEndpoints();
app.MapAiAdminEndpoints();
app.MapAiProfileEndpoints();

app.MapGet("/api/home/dashboard", async (
        System.Security.Claims.ClaimsPrincipal principal,
        IHomeDashboardService homeDashboardService,
        CancellationToken cancellationToken) =>
    {
        var ownerId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(ownerId)) return Results.Unauthorized();

        var dashboard = await homeDashboardService.GetDashboardAsync(ownerId, cancellationToken);
        return Results.Ok(dashboard);
    })
    .WithName("GetHomeDashboard")
    .WithSummary("Returns the data required to render the current user's home dashboard.")
    .RequireAuthorization()
    .RequireCors("MyrialeFrontend");

app.Run();

static bool IsPostgresConnectionString(string connectionString) =>
    connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

public partial class Program;
