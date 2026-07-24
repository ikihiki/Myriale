using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
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
    .Validate(options => options.Provider is "mock" or "openai" or "runpod", "Provider must be mock, openai, or runpod.")
    .Validate(options => options.TimeoutSeconds > 0 && options.MaxOutputTokens > 0 && options.MaxAttempts > 0, "AI provider limits must be positive.")
    .Validate(options => options.SessionRequestsPerMinute > 0
        && options.UserRequestsPerMinute > 0
        && options.MaxTokensPerSession > 0
        && options.LeaseRecoveryIntervalSeconds > 0, "AI quota and recovery limits must be positive.")
    .ValidateOnStart();
builder.Services.AddScoped<IAiCredentialStore, DataProtectionAiCredentialStore>();
builder.Services.AddScoped<IAiProviderSelectionStore, DbAiProviderSelectionStore>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<OpenAiCompatibleTextProvider>();
builder.Services.AddScoped<IAiTextProvider>(services => services.GetRequiredService<OpenAiCompatibleTextProvider>());
builder.Services.AddScoped<MockAiNarrativeGenerator>();
builder.Services.AddScoped<ProviderNarrativeGenerator>();
builder.Services.AddScoped<INarrativeGenerator>(services =>
    string.Equals(builder.Configuration["AiProvider:Provider"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<IScenarioTurnAi>(services =>
    string.Equals(builder.Configuration["AiProvider:Provider"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<IActionRecommendationGenerator>(services =>
    string.Equals(builder.Configuration["AiProvider:Provider"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<SessionScenarioProgressionService>();
builder.Services.AddScoped<ScenarioDefinitionAuthoringService>();
builder.Services.AddScoped<ScenarioRuleEvaluator>();
builder.Services.AddScoped<ScenarioPublicProjector>();
builder.Services.AddScoped<ScenarioActionEnumerator>();
builder.Services.AddScoped<ScenarioEffectApplier>();
builder.Services.AddScoped<IScenarioExtensionAdapter, ScenarioModuleExtensionAdapter>();
builder.Services.AddScoped<SessionInputService>();
builder.Services.AddScoped<ISessionExecutionQueue, SessionExecutionQueue>();
builder.Services.AddScoped<SessionExecutionFinalizer>();
builder.Services.AddScoped<ISessionExecutionHandler, ScenarioTurnExecutionHandler>();
builder.Services.AddScoped<ISessionExecutionHandler, ModuleHandoffExecutionHandler>();
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
builder.Services.AddScoped<IPlaySessionListingService, PlaySessionListingService>();
builder.Services.AddScoped<IHomeDashboardService, DemoHomeDashboardService>();
builder.Services.Configure<ModulePackageOptions>(builder.Configuration.GetSection(ModulePackageOptions.SectionName));
builder.Services.Configure<ModuleRuntimeOptions>(builder.Configuration.GetSection(ModuleRuntimeOptions.SectionName));
builder.Services.Configure<ModuleExecutionOptions>(builder.Configuration.GetSection(ModuleExecutionOptions.SectionName));
builder.Services.AddScoped<IModulePackageService, ModulePackageService>();
builder.Services.AddScoped<IModulePackageRuntimeCatalog, ModulePackageRuntimeCatalog>();
builder.Services.AddScoped<IModuleRuntime, DotNetModuleRuntime>();
builder.Services.AddSingleton<ModuleAssemblyCache>();
builder.Services.AddSingleton<ModuleRuntimeInvocationGate>();
builder.Services.AddScoped<SessionOutcomeEffectService>();
builder.Services.AddScoped<IModuleExecutionService, ModuleExecutionService>();
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

    if (app.Configuration.GetValue("Database:RecreateOnStartup", true))
    {
        if (db.Database.IsNpgsql())
        {
            await db.Database.ExecuteSqlRawAsync("""
                DO $$
                DECLARE schema_to_drop text;
                BEGIN
                    FOR schema_to_drop IN
                        SELECT schema_name
                        FROM information_schema.schemata
                        WHERE schema_name <> 'information_schema'
                          AND schema_name NOT LIKE 'pg_%'
                    LOOP
                        EXECUTE format('DROP SCHEMA %I CASCADE', schema_to_drop);
                    END LOOP;
                END $$;
                CREATE SCHEMA public;
                """);
        }
        else
        {
            await db.Database.EnsureDeletedAsync();
        }
    }

    await db.Database.EnsureCreatedAsync();
    if (isTestHost)
    {
        if (app.Configuration.GetValue("TestScenarioFixtures:Enabled", true))
        {
            await ScenarioTestFixtureData.CreateAsync(db);
        }
    }
    else
    {
        await ScenarioSeedData.SeedAsync(db);
    }
    if (app.Configuration.GetValue<bool>("DemoModules:Enabled")
        && (!isTestHost || app.Configuration.GetValue<bool>("DemoModules:EnableInTestHost")))
    {
        await DemoModuleSeedData.SeedAsync(
            db,
            scope.ServiceProvider.GetRequiredService<IModulePackageService>(),
            scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>());
    }

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    await AccountSeedData.SeedAsync(userManager, app.Configuration);
    if (app.Configuration.GetValue<bool>("SessionArtifactFixture:Enabled")
        && (!isTestHost || app.Configuration.GetValue<bool>("SessionArtifactFixture:EnableInTestHost")))
    {
        await SessionArtifactFixtureSeedData.SeedAsync(
            db,
            scope.ServiceProvider.GetRequiredService<ISessionObjectStorage>(),
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
