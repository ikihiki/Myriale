using Aspire.Hosting.Kubernetes;
using Aspire.Hosting.Kubernetes.Resources;
using YamlDotNet.Core;
using YamlDotNet.Core.Events;
using YamlDotNet.Serialization;

var builder = DistributedApplication.CreateBuilder(args);
var isPublishMode = builder.ExecutionContext.IsPublishMode;
var configuration = builder.Configuration;

var sourceSha = configuration["FORGE_SOURCE_SHA"] ?? "local";
var chartVersion = configuration["FORGE_CHART_VERSION"] ?? "0.1.0";
var registryEndpoint = configuration["Parameters:registry_endpoint"] ?? "localhost:5000";
var registryRepository = configuration["Parameters:registry_repository"] ?? "myriale";
var forgeIngressClass = configuration["forge:ingressClass"] ?? "traefik";

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

    var frontend = builder.AddContainer(
            "myriale-frontend",
            $"{imagePrefix}/myriale-frontend",
            sourceSha)
        .WithDockerfile("../../../", ".forge/frontend.Dockerfile")
        .WithEnvironment("services__myriale-api__http__0", api.GetEndpoint("http"))
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
                forgeIngressClass));
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
    public ForgeIngress(string hostnameTemplate, string ingressClass)
        : base("networking.k8s.io/v1", "Ingress")
    {
        Metadata.Name = "myriale-ingress";
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
