using Myriale.Api.Features.Scenarios;
using Myriale.Api.Features.ModuleUi;
using Myriale.Api.Features.ModuleExecutions;
using Myriale.Api.Features.SessionArtifacts;
using Myriale.Api.Features.SessionMemory;
using Myriale.Api.Features.NarrativeGeneration;
using Myriale.Api.Features.Dashboard;
using Myriale.Api.Features.Accounts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.Accounts.Application;
using Myriale.Api.Features.AiProviders.Application;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Application.ProgressionRuntime;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.Api.Application.ModuleHandoffs;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Application.SessionExecutions;
using Myriale.Api.Application.ScenarioTurns;
using Myriale.Api.Features.Scenarios.Application;
using Myriale.Api.Features.SessionMemory.Application;
using Myriale.Api.Application.Sessions;
using Myriale.Api.Features.SessionArtifacts.Infrastructure;
using Myriale.Api.Infrastructure.Sessions;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Features.Scenarios.Domain;
using Myriale.Api.Features.Accounts.Infrastructure;
using Myriale.Api.Features.AiProviders.Infrastructure;
using Myriale.Api.Features.ModulePackages.Infrastructure;
using Myriale.Api.Infrastructure.ProgressionRuntime;
using Myriale.Api.Features.ModuleExecutions.Infrastructure;
using Myriale.Api.Infrastructure.SessionExecutions;
using Myriale.Api.Features.Scenarios.Infrastructure;
using Myriale.Api.Features.SessionMemory.Infrastructure;
using Myriale.Api.Infrastructure.ModuleHandoffs;
using Myriale.Api.Infrastructure.ScenarioTurns;
using Myriale.Api.Features.AiProviders;
using Myriale.Api.Features.ModulePackages;
using Myriale.Api.Features.ModuleExecutions.Infrastructure;
using Myriale.Api.Features.ModulePackages.Infrastructure;
using Myriale.Api.Features.ModuleUi.Infrastructure;
using Myriale.Api.Services;
using Myriale.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddOpenApi();
builder.Services.AddAiProvidersFeature(builder.Configuration);
builder.Services.AddNarrativeGenerationFeature(builder.Configuration);
builder.Services.AddDashboardFeature();
builder.Services.AddSessionMemoryFeature();
builder.Services.AddSessionArtifactsFeature(builder.Configuration);
builder.Services.AddModulePackagesFeature(builder.Configuration);
builder.Services.AddModuleExecutionsFeature(builder.Configuration);
builder.Services.AddModuleUiFeature();
builder.Services.AddScenariosFeature();
builder.Services.AddScoped<IModuleHandoffEnqueuePort, EfModuleHandoffEnqueuePort>();
builder.Services.AddScoped<EnqueueModuleHandoffCommand>();
builder.Services.AddDataProtection();
builder.Services.AddScoped<IProgressionReceiptRepository, EfProgressionReceiptRepository>();
builder.Services.AddScoped<EnsureProgressionReceiptCommand>();
builder.Services.AddScoped<IProgressionReceiptCommand>(services => services.GetRequiredService<EnsureProgressionReceiptCommand>());
builder.Services.AddScoped<EnsureProgressionSignalCommand>();
builder.Services.AddSingleton<ScenarioRuleJsonCodec>();
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
builder.Services.AddAccountsFeature(builder.Environment);

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
app.MapAiProvidersFeature();
app.MapNarrativeGenerationFeature();
app.MapDashboardFeature();
app.MapAccountsFeature();

app.MapScenariosFeature();
app.MapModulePackagesFeature();
app.MapSessionEndpoints();
app.MapSessionExecutionEndpoints();
app.MapSessionMemoryFeature();
app.MapSessionArtifactsFeature();
app.MapModuleExecutionsFeature();
app.MapModuleUiFeature();



app.Run();

static bool IsPostgresConnectionString(string connectionString) =>
    connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

public partial class Program;
