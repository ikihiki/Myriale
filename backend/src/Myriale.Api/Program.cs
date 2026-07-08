using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Data;
using Myriale.Api.Endpoints;
using Myriale.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IHomeDashboardService, DemoHomeDashboardService>();
builder.Services.AddHttpClient("MockAi", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MockAi:BaseUrl"] ?? "http://myriale-mock-ai");
});

var accountConnectionString = builder.Configuration.GetConnectionString("MyrialeAccounts")
    ?? "Data Source=myriale-accounts.db";
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(accountConnectionString));
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
builder.Services.AddAuthorization();
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

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Scenarios" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_Scenarios" PRIMARY KEY,
            "Title" TEXT NOT NULL,
            "Summary" TEXT NOT NULL,
            "Genre" TEXT NOT NULL,
            "Tone" TEXT NOT NULL,
            "Lore" TEXT NOT NULL,
            "AiFreedom" TEXT NOT NULL,
            "Hero" TEXT NOT NULL,
            "Opening" TEXT NOT NULL,
            "IllustrationStyle" TEXT NOT NULL,
            "IllustrationMood" TEXT NOT NULL,
            "IllustrationNegative" TEXT NOT NULL,
            "SampleScene" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "AuthorId" TEXT NOT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NOT NULL
        );
        """);
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "AiProviderKeys" (
            "Provider" TEXT NOT NULL CONSTRAINT "PK_AiProviderKeys" PRIMARY KEY,
            "DisplayName" TEXT NOT NULL,
            "Secret" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "UpdatedAt" TEXT NOT NULL,
            "LastValidatedAt" TEXT NULL
        );
        """);
}

app.UseCors("MyrialeFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultEndpoints();
app.MapAccountEndpoints();

app.MapScenarioEndpoints();
app.MapScenarioAiEndpoints();
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

public partial class Program;
