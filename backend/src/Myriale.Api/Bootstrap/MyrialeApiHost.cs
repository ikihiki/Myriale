using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Myriale.Api.Features.Accounts;
using Myriale.Api.Features.Accounts.Infrastructure;
using Myriale.Api.Features.AiProviders;
using Myriale.Api.Features.AiProviders.Infrastructure;
using Myriale.Api.Features.Dashboard;
using Myriale.Api.Features.Evaluations;
using Myriale.Api.Features.ModuleExecutions;
using Myriale.Api.Features.ModuleExecutions.Infrastructure;
using Myriale.Api.Features.ModulePackages;
using Myriale.Api.Features.ModulePackages.Infrastructure;
using Myriale.Api.Features.ModuleUi;
using Myriale.Api.Features.ModuleUi.Infrastructure;
using Myriale.Api.Features.ModuleHandoffs;
using Myriale.Api.Features.NarrativeGeneration;
using Myriale.Api.Features.ProgressionRuntime;
using Myriale.Api.Features.Scenarios;
using Myriale.Api.Features.ScenarioTurns;
using Myriale.Api.Features.SessionArtifacts;
using Myriale.Api.Features.SessionArtifacts.Infrastructure;
using Myriale.Api.Features.SessionExecutions;
using Myriale.Api.Features.SessionMemory;
using Myriale.Api.Features.Sessions;
using Myriale.Api.Infrastructure.Persistence;
using Myriale.ServiceDefaults;

namespace Myriale.Api.Bootstrap;

public static class MyrialeApiHost
{
    public static async Task RunAsync(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.AddServiceDefaults();
        builder.Services.AddOpenApi();
        builder.Services.AddAiProvidersFeature(builder.Configuration);
        builder.Services.AddNarrativeGenerationFeature(builder.Configuration);
        builder.Services.AddDashboardFeature();
        builder.Services.AddEvaluationsFeature(builder.Configuration);
        builder.Services.AddSessionMemoryFeature();
        builder.Services.AddSessionArtifactsFeature(builder.Configuration);
        builder.Services.AddModulePackagesFeature(builder.Configuration);
        builder.Services.AddModuleExecutionsFeature(builder.Configuration);
        builder.Services.AddModuleUiFeature();
        builder.Services.AddScenariosFeature();
        builder.Services.AddSessionsFeature();
        builder.Services.AddSessionExecutionsFeature(builder.Configuration);
        builder.Services.AddScenarioTurnsFeature();
        builder.Services.AddProgressionRuntimeFeature();
        builder.Services.AddModuleHandoffsFeature();

        var isTestHost = string.Equals(
            System.Reflection.Assembly.GetEntryAssembly()?.GetName().Name,
            "testhost",
            StringComparison.OrdinalIgnoreCase);
        var accountConnectionString = builder.Configuration.GetConnectionString("MyrialeAccounts")
            ?? (isTestHost ? null : ExternalPostgresConnectionString.Resolve(builder.Configuration))
            ?? "Data Source=myriale-accounts.db";
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
        {
            // Converted ValueGeneratedOnAdd long IDs trigger a false SQLite pending-model warning; migration conformance is tested explicitly.
            options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
            if (IsPostgresConnectionString(accountConnectionString))
                options.UseNpgsql(accountConnectionString);
            else
                options.UseSqlite(accountConnectionString);
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
            options.AddPolicy("EvaluationRawAudit", policy =>
                policy.RequireAssertion(context => context.User.HasClaim("myriale:admin", "true") || context.User.HasClaim("myriale:evaluation-raw-audit", "true")));
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

        if (app.Environment.IsDevelopment()) app.MapOpenApi();

        await InitializeDatabaseAsync(app, isTestHost);

        app.UseCors("MyrialeFrontend");
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapDefaultEndpoints();
        app.MapAiProvidersFeature();
        app.MapNarrativeGenerationFeature();
        app.MapDashboardFeature();
        app.MapAccountsFeature();
        app.MapEvaluationsFeature();
        app.MapScenariosFeature();
        app.MapModulePackagesFeature();
        app.MapSessionsFeature();
        app.MapSessionExecutionsFeature();
        app.MapSessionMemoryFeature();
        app.MapSessionArtifactsFeature();
        app.MapModuleExecutionsFeature();
        app.MapModuleUiFeature();

        await app.RunAsync();
    }

    private static async Task InitializeDatabaseAsync(WebApplication app, bool isTestHost)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var reset = app.Configuration.GetValue<bool>("Database:ResetOnStartup");
        if (reset && !app.Configuration.GetValue<bool>("Database:ConfirmResetDataLoss"))
            throw new InvalidOperationException("Database reset requires Database:ConfirmResetDataLoss=true.");
        if (reset)
        {
            if (db.Database.IsNpgsql())
                await db.Database.ExecuteSqlRawAsync("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
            else
                await db.Database.EnsureDeletedAsync();
        }
        await db.Database.MigrateAsync();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var developmentSeedUser = await AccountSeedData.SeedAsync(userManager, app.Configuration);
        var useTestScenarioFixtures = isTestHost && app.Configuration.GetValue("TestScenarioFixtures:Enabled", true);
        if (useTestScenarioFixtures) await ScenarioTestFixtureData.CreateAsync(db);
        else await ScenarioSeedData.SeedAsync(db, developmentSeedUser?.Id);
        if (app.Configuration.GetValue<bool>("DemoModules:Enabled") && (!isTestHost || app.Configuration.GetValue<bool>("DemoModules:EnableInTestHost")))
            await DemoModuleSeedData.SeedAsync(db, scope.ServiceProvider.GetRequiredService<InstallModulePackageCommand>(), scope.ServiceProvider.GetRequiredService<EnableModulePackageCommand>(), scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>());
        if (app.Configuration.GetValue<bool>("SessionArtifactFixture:Enabled") && (!isTestHost || app.Configuration.GetValue<bool>("SessionArtifactFixture:EnableInTestHost")))
            await SessionArtifactFixtureSeedData.SeedAsync(db, scope.ServiceProvider.GetRequiredService<ISessionObjectStorage>(), scope.ServiceProvider.GetRequiredService<ISessionArtifactWriter>(), app.Configuration);
    }

    private static bool IsPostgresConnectionString(string connectionString) =>
        connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase)
        || connectionString.StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
        || connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);
}
