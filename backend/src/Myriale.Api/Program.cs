using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Modules;
using Myriale.Api.Services;
using Myriale.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IHomeDashboardService, DemoHomeDashboardService>();
builder.Services.Configure<ModulePackageOptions>(builder.Configuration.GetSection(ModulePackageOptions.SectionName));
builder.Services.AddScoped<IModulePackageService, ModulePackageService>();
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
}

app.UseCors("MyrialeFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultEndpoints();
app.MapAccountEndpoints();

app.MapScenarioEndpoints();
app.MapScenarioAiEndpoints();
app.MapModuleAdminEndpoints();
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
