using Microsoft.Extensions.Configuration;
using Aspire.Hosting.Kubernetes;
using Aspire.Hosting.Kubernetes.Resources;
using YamlDotNet.Core;
using YamlDotNet.Core.Events;
using YamlDotNet.Serialization;

var builder = DistributedApplication.CreateBuilder(args);
var isPublishMode = builder.ExecutionContext.IsPublishMode;
var configuration = builder.Configuration;

var postgresConnectionString = ExternalPostgresConnectionString.Resolve(configuration);
var postgres = CreatePostgresResource(builder, postgresConnectionString);

var sourceSha = configuration["FORGE_SOURCE_SHA"] ?? "local";
var chartVersion = configuration["FORGE_CHART_VERSION"] ?? "0.1.0";
var registryEndpoint = configuration["Parameters:registry_endpoint"] ?? "localhost:5000";
var registryRepository = configuration["Parameters:registry_repository"] ?? "myriale";
var forgeIngressClass = configuration["forge:ingressClass"] ?? "traefik";
var forgeIngressValues = "(default (dict) (get (default (dict) .Values.forge) `ingress`))";
var forgeClusterIssuer = $"{{{{ default `letsencrypt-prod` (get {forgeIngressValues} `clusterIssuer`) }}}}";
var forgeMiddleware = $"{{{{ default `kube-system-internal-only@kubernetescrd` (get {forgeIngressValues} `middleware`) }}}}";
var forgeTlsSecretName = $"{{{{ default (printf `%s-tls` .Release.Name) (get {forgeIngressValues} `tlsSecretName`) }}}}";

var registryEndpointParameter = builder.AddParameter(
    "registry-endpoint",
    registryEndpoint.ToLowerInvariant(),
    publishValueAsDefault: true,
    secret: false);
var registryRepositoryParameter = builder.AddParameter(
    "registry-repository",
    registryRepository.ToLowerInvariant(),
    publishValueAsDefault: true,
    secret: false);
var registry = builder.AddContainerRegistry(
    "forge-registry",
    registryEndpointParameter,
    registryRepositoryParameter);

var kubernetes = builder.AddKubernetesEnvironment("kubernetes")
    .WithHelm(helm => helm
        .WithChartName("myriale")
        .WithChartVersion(chartVersion));

if (isPublishMode)
{
    var imagePrefix = $"{registryEndpoint.ToLowerInvariant()}/{registryRepository.ToLowerInvariant()}";

    var mockAi = builder.AddContainer(
            "myriale-mock-ai",
            $"{imagePrefix}/myriale-mock-ai",
            sourceSha)
        .WithDockerfile("../../", "src/Myriale.MockAi/Dockerfile")
        .WithContainerRegistry(registry)
        .WithHttpEndpoint(targetPort: 8080, name: "http");

    var api = builder.AddContainer(
            "myriale-api",
            $"{imagePrefix}/myriale-api",
            sourceSha)
        .WithDockerfile("../../", "src/Myriale.Api/Dockerfile")
        .WithEnvironment("MockAi__BaseUrl", mockAi.GetEndpoint("http"))
        .WaitFor(mockAi)
        .WithContainerRegistry(registry)
        .WithHttpEndpoint(targetPort: 8080, name: "http");

    if (postgres is not null)
    {
        api.WithReference(postgres);
    }

    var frontend = builder.AddContainer(
            "myriale-frontend",
            $"{imagePrefix}/myriale-frontend",
            sourceSha)
        .WithDockerfile("../../../", ".forge/frontend.Dockerfile")
        .WithEnvironment("VITE_MYRIAL_API_BASE_URL", api.GetEndpoint("http"))
        .WaitFor(api)
        .WithEnvironment("VITE_MYRIAL_API_MODE", "proxy")
        .WithHttpEndpoint(targetPort: 5173, name: "vite", isProxied: false)
        .WithContainerRegistry(registry)
        .WithExternalHttpEndpoints();

    frontend.PublishAsKubernetesService(kubernetesResource =>
    {
        kubernetesResource.AdditionalResources.Add(
            new ForgeIngress(
                "{{ default \"myriale.forge.internal.sakuraya.cloud\" (get (default (dict) .Values.forge) \"hostname\") }}",
                forgeIngressClass,
                forgeClusterIssuer,
                forgeMiddleware,
                forgeTlsSecretName));
    });
}
else
{
    var mockAi = builder.AddProject<Projects.Myriale_MockAi>("myriale-mock-ai")
        .WithExternalHttpEndpoints();

    var api = builder.AddProject<Projects.Myriale_Api>("myriale-api")
        .WithReference(mockAi)
        .WaitFor(mockAi)
        .WithExternalHttpEndpoints();

    if (postgres is not null)
    {
        api.WithReference(postgres);
    }

    builder.AddNpmApp("myriale-frontend", "../../../", "dev")
        .WithReference(api)
        .WaitFor(api)
        .WithEnvironment("VITE_MYRIAL_API_MODE", "proxy")
        .WithHttpEndpoint(port: 5173, name: "vite", isProxied: false)
        .WithExternalHttpEndpoints();

    builder.AddNpmApp("myriale-storybook", "../../../", "storybook")
        .WithReference(api)
        .WaitFor(api)
        .WithEnvironment("VITE_MYRIAL_API_MODE", "proxy")
        .WithHttpEndpoint(port: 6006, name: "storybook", isProxied: false)
        .WithExternalHttpEndpoints();
}

builder.Build().Run();

static IResourceBuilder<IResourceWithConnectionString>? CreatePostgresResource(
    IDistributedApplicationBuilder builder,
    string? connectionString)
{
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return null;
    }

    builder.Configuration["ConnectionStrings:MyrialeAccounts"] = connectionString;
    return builder.AddConnectionString("MyrialeAccounts", "ConnectionStrings__MyrialeAccounts");
}

internal static class ExternalPostgresConnectionString
{
    public static string? Resolve(IConfiguration configuration)
    {
        var direct = FirstValue(configuration,
            "ConnectionStrings:MyrialeAccounts",
            "POSTGRES_CONNECTION_STRING",
            "POSTGRES_URL",
            "DATABASE_URL",
            "PGURL");

        if (!string.IsNullOrWhiteSpace(direct))
        {
            return NormalizeDirectConnectionString(direct);
        }

        var host = FirstValue(configuration, "POSTGRES_HOST", "PGHOST", "CNPG_HOST");
        var database = FirstValue(configuration, "POSTGRES_DB", "PGDATABASE", "CNPG_DATABASE");
        var username = FirstValue(configuration, "POSTGRES_USER", "PGUSER", "CNPG_USER", "CNPG_USERNAME");
        var password = FirstValue(configuration, "POSTGRES_PASSWORD", "PGPASSWORD", "CNPG_PASSWORD");

        if (string.IsNullOrWhiteSpace(host)
            || string.IsNullOrWhiteSpace(database)
            || string.IsNullOrWhiteSpace(username)
            || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var port = FirstValue(configuration, "POSTGRES_PORT", "PGPORT", "CNPG_PORT") ?? "5432";
        var sslMode = FirstValue(configuration, "POSTGRES_SSLMODE", "PGSSLMODE", "CNPG_SSLMODE");
        var connectionString = $"Host={Quote(host)};Port={Quote(port)};Database={Quote(database)};Username={Quote(username)};Password={Quote(password)}";

        return string.IsNullOrWhiteSpace(sslMode)
            ? connectionString
            : $"{connectionString};SSL Mode={Quote(sslMode)}";
    }

    private static string NormalizeDirectConnectionString(string connectionString)
    {
        if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var uri)
            || (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
        {
            return connectionString;
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var database = uri.AbsolutePath.Trim('/');
        var normalized = $"Host={Quote(uri.Host)};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={Quote(Uri.UnescapeDataString(database))};Username={Quote(Uri.UnescapeDataString(userInfo[0]))}";
        if (userInfo.Length == 2)
        {
            normalized += $";Password={Quote(Uri.UnescapeDataString(userInfo[1]))}";
        }

        var sslMode = uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(pair => pair.Split('=', 2))
            .FirstOrDefault(pair => pair.Length == 2 && pair[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase))?
            .ElementAtOrDefault(1);
        return string.IsNullOrWhiteSpace(sslMode)
            ? normalized
            : $"{normalized};SSL Mode={Quote(Uri.UnescapeDataString(sslMode))}";
    }

    private static string? FirstValue(IConfiguration configuration, params string[] keys)
    {
        foreach (var key in keys)
        {
            var value = configuration[key] ?? Environment.GetEnvironmentVariable(key);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }

    private static string Quote(string value) => $"\"{value.Replace("\\", "\\\\").Replace("\"", "\\\"")}\"";
}

internal sealed class HelmTemplateValue : IYamlConvertible
{
    private readonly string value;

    public HelmTemplateValue(string value) => this.value = value;

    public void Read(IParser parser, Type type, ObjectDeserializer nestedObjectDeserializer)
    {
        throw new NotSupportedException();
    }

    public void Write(IEmitter emitter, ObjectSerializer nestedObjectSerializer)
    {
        emitter.Emit(new Scalar(null, null, value, ScalarStyle.Plain, true, false));
    }
}

internal sealed class ForgeIngress : BaseKubernetesResource
{
    public ForgeIngress(
        string hostnameTemplate,
        string ingressClass,
        string clusterIssuerTemplate,
        string middlewareTemplate,
        string tlsSecretNameTemplate)
        : base("networking.k8s.io/v1", "Ingress")
    {
        Metadata.Name = "myriale-ingress";
        Metadata.Annotations.Add("cert-manager.io/cluster-issuer", clusterIssuerTemplate);
        Metadata.Annotations.Add(
            "traefik.ingress.kubernetes.io/router.middlewares",
            middlewareTemplate);
        Spec = new ForgeIngressSpec
        {
            IngressClassName = ingressClass,
            Rules =
            [
                new ForgeIngressRule
                {
                    Host = new HelmTemplateValue(hostnameTemplate),
                    Http = new ForgeHttpRule
                    {
                        Paths =
                        [
                            new ForgeIngressPath
                            {
                                Path = "/",
                                PathType = "Prefix",
                                Backend = new ForgeIngressBackend
                                {
                                    Service = new ForgeIngressService
                                    {
                                        Name = "myriale-frontend-service",
                                        Port = new ForgeIngressPort { Name = "vite" }
                                    }
                                }
                            }
                        ]
                    }
                }
            ],
            Tls =
            [
                new ForgeIngressTls
                {
                    Hosts = [new HelmTemplateValue(hostnameTemplate)],
                    SecretName = new HelmTemplateValue(tlsSecretNameTemplate)
                }
            ]
        };
    }

    [YamlMember(Alias = "spec")]
    public ForgeIngressSpec Spec { get; }
}

internal sealed class ForgeIngressSpec
{
    [YamlMember(Alias = "ingressClassName")]
    public string IngressClassName { get; init; } = string.Empty;

    [YamlMember(Alias = "rules")]
    public List<ForgeIngressRule> Rules { get; init; } = [];

    [YamlMember(Alias = "tls")]
    public List<ForgeIngressTls> Tls { get; init; } = [];
}

internal sealed class ForgeIngressTls
{
    [YamlMember(Alias = "hosts")]
    public List<HelmTemplateValue> Hosts { get; init; } = [];

    [YamlMember(Alias = "secretName")]
    public HelmTemplateValue SecretName { get; init; } = new("");
}

internal sealed class ForgeIngressRule
{
    [YamlMember(Alias = "host")]
    public HelmTemplateValue Host { get; init; } = new("");

    [YamlMember(Alias = "http")]
    public ForgeHttpRule Http { get; init; } = new();
}

internal sealed class ForgeHttpRule
{
    [YamlMember(Alias = "paths")]
    public List<ForgeIngressPath> Paths { get; init; } = [];
}

internal sealed class ForgeIngressPath
{
    [YamlMember(Alias = "path")]
    public string Path { get; init; } = string.Empty;

    [YamlMember(Alias = "pathType")]
    public string PathType { get; init; } = string.Empty;

    [YamlMember(Alias = "backend")]
    public ForgeIngressBackend Backend { get; init; } = new();
}

internal sealed class ForgeIngressBackend
{
    [YamlMember(Alias = "service")]
    public ForgeIngressService Service { get; init; } = new();
}

internal sealed class ForgeIngressService
{
    [YamlMember(Alias = "name")]
    public string Name { get; init; } = string.Empty;

    [YamlMember(Alias = "port")]
    public ForgeIngressPort Port { get; init; } = new();
}

internal sealed class ForgeIngressPort
{
    [YamlMember(Alias = "name")]
    public string Name { get; init; } = string.Empty;
}
