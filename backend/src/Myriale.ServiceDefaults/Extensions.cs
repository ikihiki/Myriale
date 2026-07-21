using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.ServiceDiscovery;
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Reflection;

namespace Microsoft.Extensions.Hosting;

// Adds common Aspire services: service discovery, resilience, health checks, and OpenTelemetry.
// This project should be referenced by each service project in your solution.
// To learn more about using this project, see https://aka.ms/aspire/service-defaults
public static class Extensions
{
    private const string HealthEndpointPath = "/health";
    private const string AlivenessEndpointPath = "/alive";

    public static TBuilder AddServiceDefaults<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
    {
        builder.ConfigureOpenTelemetry();

        builder.AddDefaultHealthChecks();

        builder.Services.AddServiceDiscovery();

        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            // Turn on resilience by default. Unsafe methods are retried only by the owning application,
            // which prevents duplicate AI generation and other non-idempotent operations.
            http.AddStandardResilienceHandler(options =>
                options.Retry.DisableForUnsafeHttpMethods());

            // Turn on service discovery by default
            http.AddServiceDiscovery();
        });

        // Uncomment the following to restrict the allowed schemes for service discovery.
        // builder.Services.Configure<ServiceDiscoveryOptions>(options =>
        // {
        //     options.AllowedSchemes = ["https"];
        // });

        return builder;
    }

    public static TBuilder ConfigureOpenTelemetry<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
    {
        var resource = CreateResourceBuilder(builder);
        var useOtlpExporter = !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);
        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
            logging.SetResourceBuilder(resource);
            if (useOtlpExporter) logging.AddOtlpExporter();
        });

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resourceBuilder => resourceBuilder
                .AddService(builder.Environment.ApplicationName, serviceVersion: ServiceVersion(builder))
                .AddAttributes(ResourceAttributes(builder)))
            .WithMetrics(metrics =>
            {
                metrics.AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddMeter("Myriale.SessionExecution");
            })
            .WithTracing(tracing =>
            {
                tracing.SetSampler(CreateSampler(builder))
                    .AddSource(builder.Environment.ApplicationName)
                    .AddSource("Myriale.SessionExecution")
                    .AddAspNetCoreInstrumentation(tracing =>
                        // Exclude health check requests from tracing
                        tracing.Filter = context =>
                            !context.Request.Path.StartsWithSegments(HealthEndpointPath)
                            && !context.Request.Path.StartsWithSegments(AlivenessEndpointPath)
                    )
                    .AddHttpClientInstrumentation();
            });

        builder.AddOpenTelemetryExporters();
        return builder;
    }

    private static ResourceBuilder CreateResourceBuilder<TBuilder>(TBuilder builder) where TBuilder : IHostApplicationBuilder =>
        ResourceBuilder.CreateDefault()
            .AddService(builder.Environment.ApplicationName, serviceVersion: ServiceVersion(builder))
            .AddAttributes(ResourceAttributes(builder));

    private static IEnumerable<KeyValuePair<string, object>> ResourceAttributes<TBuilder>(TBuilder builder) where TBuilder : IHostApplicationBuilder
    {
        yield return new("deployment.environment.name", builder.Environment.EnvironmentName);
        var commitSha = builder.Configuration["OpenTelemetry:Resource:GitCommitSha"]
            ?? builder.Configuration["GIT_COMMIT_SHA"]
            ?? builder.Configuration["SOURCE_VERSION"];
        if (!string.IsNullOrWhiteSpace(commitSha)) yield return new("vcs.ref.head.revision", commitSha);
    }

    private static string ServiceVersion<TBuilder>(TBuilder builder) where TBuilder : IHostApplicationBuilder =>
        builder.Configuration["OpenTelemetry:Resource:ServiceVersion"]
        ?? Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
        ?? Assembly.GetEntryAssembly()?.GetName().Version?.ToString()
        ?? "unknown";

    private static Sampler CreateSampler<TBuilder>(TBuilder builder) where TBuilder : IHostApplicationBuilder
    {
        var configured = builder.Configuration["OpenTelemetry:Tracing:Sampler"]?.Trim().ToLowerInvariant();
        var ratio = Math.Clamp(builder.Configuration.GetValue<double?>("OpenTelemetry:Tracing:Ratio")
            ?? (builder.Environment.IsDevelopment() ? 1.0 : 0.1), 0, 1);
        return configured switch
        {
            "always-on" => new AlwaysOnSampler(),
            "always-off" => new AlwaysOffSampler(),
            "trace-id-ratio" or "parent-based-ratio" => new ParentBasedSampler(new TraceIdRatioBasedSampler(ratio)),
            _ when builder.Environment.IsDevelopment() => new AlwaysOnSampler(),
            _ => new ParentBasedSampler(new TraceIdRatioBasedSampler(ratio)),
        };
    }

    private static TBuilder AddOpenTelemetryExporters<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
    {
        var useOtlpExporter = !string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]);

        if (useOtlpExporter)
        {
            builder.Services.AddOpenTelemetry().UseOtlpExporter();
        }

        // Uncomment the following lines to enable the Azure Monitor exporter (requires the Azure.Monitor.OpenTelemetry.AspNetCore package)
        //if (!string.IsNullOrEmpty(builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"]))
        //{
        //    builder.Services.AddOpenTelemetry()
        //       .UseAzureMonitor();
        //}

        return builder;
    }

    public static TBuilder AddDefaultHealthChecks<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
    {
        builder.Services.AddHealthChecks()
            // Add a default liveness check to ensure app is responsive
            .AddCheck("self", () => HealthCheckResult.Healthy(), ["live"]);

        return builder;
    }

    public static WebApplication MapDefaultEndpoints(this WebApplication app)
    {
        // Adding health checks endpoints to applications in non-development environments has security implications.
        // See https://aka.ms/aspire/healthchecks for details before enabling these endpoints in non-development environments.
        if (app.Environment.IsDevelopment())
        {
            // All health checks must pass for app to be considered ready to accept traffic after starting
            app.MapHealthChecks(HealthEndpointPath);

            // Only health checks tagged with the "live" tag must pass for app to be considered alive
            app.MapHealthChecks(AlivenessEndpointPath, new HealthCheckOptions
            {
                Predicate = r => r.Tags.Contains("live")
            });
        }

        return app;
    }
}
