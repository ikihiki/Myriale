using Microsoft.Extensions.Configuration;

namespace Myriale.ServiceDefaults;

public static class ExternalPostgresConnectionString
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
