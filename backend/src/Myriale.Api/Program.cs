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
builder.Services.AddHostedService<AiLeaseRecoveryWorker>();
builder.Services.AddScoped<OpenAiCompatibleTextProvider>();
builder.Services.AddScoped<IAiTextProvider>(services => services.GetRequiredService<OpenAiCompatibleTextProvider>());
builder.Services.AddScoped<MockAiNarrativeGenerator>();
builder.Services.AddScoped<ProviderNarrativeGenerator>();
builder.Services.AddScoped<INarrativeGenerator>(services =>
    string.Equals(builder.Configuration["AiProvider:Provider"], "mock", StringComparison.OrdinalIgnoreCase)
        ? services.GetRequiredService<MockAiNarrativeGenerator>()
        : services.GetRequiredService<ProviderNarrativeGenerator>());
builder.Services.AddScoped<IActionRecommendationGenerator>(services => (IActionRecommendationGenerator)services.GetRequiredService<INarrativeGenerator>());
builder.Services.AddScoped<SessionNarrativeHandoffService>();
builder.Services.AddScoped<SessionScenarioProgressionService>();
builder.Services.AddOptions<NarrativeContextOptions>()
    .Bind(builder.Configuration.GetSection(NarrativeContextOptions.SectionName))
    .Validate(options => options.RecentTurnsTokenBudget >= 0, "RecentTurnsTokenBudget must not be negative.")
    .ValidateOnStart();
builder.Services.AddSingleton<INarrativeRecentTurnSelector, NarrativeRecentTurnSelector>();
builder.Services.AddSingleton<INarrativeTokenEstimator, Utf8NarrativeTokenEstimator>();
builder.Services.AddSingleton<INarrativePromptBuilder, NarrativePromptBuilder>();
builder.Services.AddScoped<INarrativeContextBuilder, NarrativeContextBuilder>();
builder.Services.AddScoped<SessionNarrativeTurnService>();
builder.Services.AddSingleton<IHomeDashboardService, DemoHomeDashboardService>();
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
builder.Services.AddHttpClient("OpenAiCompatible");
builder.Services.AddHttpClient("MockAi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MockAi:BaseUrl"] ?? "https+http://myriale-mock-ai");
});

var accountConnectionString = builder.Configuration.GetConnectionString("MyrialeAccounts")
    ?? ExternalPostgresConnectionString.Resolve(builder.Configuration)
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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    if (db.Database.IsNpgsql())
    {
        db.Database.ExecuteSqlRaw("""
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public AUTHORIZATION CURRENT_USER;
            """);
    }
    else
    {
        db.Database.EnsureDeleted();
    }

    db.Database.EnsureCreated();
    await ScenarioSeedData.SeedAsync(db);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    await AccountSeedData.SeedAsync(userManager, app.Configuration);
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
app.MapModuleExecutionEndpoints();
app.MapModuleUiEndpoints();
app.MapAiAdminEndpoints();

app.MapGet("/api/home/dashboard", async (
        IHomeDashboardService homeDashboardService,
        CancellationToken cancellationToken) =>
    {
        var dashboard = await homeDashboardService.GetDashboardAsync(cancellationToken);
        return Results.Ok(dashboard);
    })
    .WithName("GetHomeDashboard")
    .WithSummary("Returns the data required to render the home dashboard.")
    .RequireCors("MyrialeFrontend");

app.Run();

static bool IsPostgresConnectionString(string connectionString) =>
    connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

public partial class Program;
