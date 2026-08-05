using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Myriale.Api.Tests;

public sealed class RouteCharacterizationTests : IDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"myriale-route-tests-{Guid.NewGuid():N}.db");
    private readonly WebApplicationFactory<Program> _factory;

    public RouteCharacterizationTests() => _factory = new WebApplicationFactory<Program>()
        .WithWebHostBuilder(builder => builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={_dbPath}"));

    [Fact]
    public void CurrentHttpRouteSurfaceMatchesWaveZeroBaseline()
    {
        _ = _factory.CreateClient();
        var routes = _factory.Services.GetServices<EndpointDataSource>()
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .Select(Describe)
            .OrderBy(value => value, StringComparer.Ordinal)
            .ToArray();

        var baselinePath = Path.Combine(AppContext.BaseDirectory, "Architecture", "Baselines", "routes.txt");
        var expected = File.ReadAllLines(baselinePath);
        Assert.Equal(expected, routes);
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }

    private static string Describe(RouteEndpoint endpoint)
    {
        var methodMetadata = endpoint.Metadata.GetMetadata<HttpMethodMetadata>();
        IEnumerable<string> methods = methodMetadata is null ? ["*"] : methodMetadata.HttpMethods.Order(StringComparer.Ordinal);
        var name = endpoint.Metadata.GetMetadata<IEndpointNameMetadata>()?.EndpointName ?? "-";
        var authorization = endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>();
        var auth = authorization.Count == 0
            ? "anonymous"
            : string.Join(',', authorization.Select(data => string.IsNullOrEmpty(data.Policy) ? "authenticated" : data.Policy).Distinct(StringComparer.Ordinal));
        var cors = endpoint.Metadata.GetMetadata<IEnableCorsAttribute>()?.PolicyName ?? "-";
        return $"{string.Join(',', methods)} {endpoint.RoutePattern.RawText} | name={name} | auth={auth} | cors={cors}";
    }
}
