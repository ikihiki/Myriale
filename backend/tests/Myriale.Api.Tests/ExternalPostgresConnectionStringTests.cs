using Microsoft.Extensions.Configuration;
using Myriale.ServiceDefaults;

namespace Myriale.Api.Tests;

public sealed class ExternalPostgresConnectionStringTests
{
    [Fact]
    public void Resolve_NormalizesCloudNativePgUri()
    {
        var configuration = Configuration(new Dictionary<string, string?>
        {
            ["POSTGRES_URL"] = "postgresql://app:p%40ss@myriale-postgres-rw:5432/myriale?sslmode=require"
        });

        var connectionString = ExternalPostgresConnectionString.Resolve(configuration);

        Assert.Equal(
            "Host=\"myriale-postgres-rw\";Port=5432;Database=\"myriale\";Username=\"app\";Password=\"p@ss\";SSL Mode=\"require\"",
            connectionString);
    }

    [Fact]
    public void Resolve_BuildsConnectionStringFromCloudNativePgFields()
    {
        var configuration = Configuration(new Dictionary<string, string?>
        {
            ["CNPG_HOST"] = "myriale-postgres-rw",
            ["CNPG_DATABASE"] = "myriale",
            ["CNPG_USERNAME"] = "app",
            ["CNPG_PASSWORD"] = "secret",
            ["CNPG_SSLMODE"] = "require"
        });

        var connectionString = ExternalPostgresConnectionString.Resolve(configuration);

        Assert.Equal(
            "Host=\"myriale-postgres-rw\";Port=\"5432\";Database=\"myriale\";Username=\"app\";Password=\"secret\";SSL Mode=\"require\"",
            connectionString);
    }

    private static IConfiguration Configuration(IDictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();
}
