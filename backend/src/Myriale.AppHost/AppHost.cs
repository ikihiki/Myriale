using Microsoft.Extensions.Configuration;
using Aspire.Hosting.Kubernetes;
using Aspire.Hosting.Kubernetes.Resources;
using Myriale.ServiceDefaults;
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
    else
    {
        api.PublishAsKubernetesService(kubernetesResource =>
        {
            var apiContainer = kubernetesResource.Workload?.PodTemplate.Spec.Containers
                .Single(container => container.Name == "myriale-api")
                ?? throw new InvalidOperationException("The Myriale API container was not generated.");
            apiContainer.Env.Add(new EnvVarV1
            {
                Name = "POSTGRES_URL",
                ValueFrom = new EnvVarSourceV1
                {
                    SecretKeyRef = new SecretKeySelectorV1
                    {
                        Name = "myriale-postgres-app",
                        Key = "uri"
                    }
                }
            });
            kubernetesResource.AdditionalResources.Add(new CloudNativePgCluster());
        });
    }

    var frontend = builder.AddContainer(
            "myriale-frontend",
            $"{imagePrefix}/myriale-frontend",
            sourceSha)
        .WithDockerfile("../../../", ".forge/frontend.Dockerfile")
        .WithEnvironment("MYRIALE_API_PROXY_TARGET", api.GetEndpoint("http"))
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

internal sealed class CloudNativePgCluster : BaseKubernetesResource
{
    public CloudNativePgCluster()
        : base("postgresql.cnpg.io/v1", "Cluster")
    {
        Metadata.Name = "myriale-postgres";
        Spec = new CloudNativePgClusterSpec
        {
            Instances = 1,
            Bootstrap = new CloudNativePgBootstrap
            {
                Initdb = new CloudNativePgInitdb
                {
                    Database = "myriale",
                    Owner = "app"
                }
            },
            Storage = new CloudNativePgStorage
            {
                Size = new HelmTemplateValue("{{ if eq (default `stable` (get (default (dict) .Values.forge) `environment`)) `preview` }}1Gi{{ else }}8Gi{{ end }}")
            }
        };
    }

    public CloudNativePgClusterSpec Spec { get; }
}

internal sealed class CloudNativePgClusterSpec
{
    public int Instances { get; init; }

    public CloudNativePgBootstrap Bootstrap { get; init; } = new();

    public CloudNativePgStorage Storage { get; init; } = new();
}

internal sealed class CloudNativePgBootstrap
{
    public CloudNativePgInitdb Initdb { get; init; } = new();
}

internal sealed class CloudNativePgInitdb
{
    public string Database { get; init; } = string.Empty;

    public string Owner { get; init; } = string.Empty;
}

internal sealed class CloudNativePgStorage
{
    public HelmTemplateValue Size { get; init; } = new("1Gi");
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
