using Myriale.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IHomeDashboardService, DemoHomeDashboardService>();

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

app.UseCors("MyrialeFrontend");

app.MapDefaultEndpoints();

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
