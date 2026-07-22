using System.Text.Json;

namespace Myriale.Api.Services;

public static class DevelopmentErrorDetails
{
    public static string? From(IHostEnvironment environment, Exception exception)
    {
        if (!environment.IsDevelopment()) return null;

        var details = new List<string>();
        for (var current = exception; current is not null; current = current.InnerException)
        {
            var detail = $"{current.GetType().Name}: {current.Message}";
            if (current is JsonException json)
                detail += $" Path={json.Path ?? "<root>"}; Line={json.LineNumber?.ToString() ?? "?"}; Byte={json.BytePositionInLine?.ToString() ?? "?"}.";
            if (current is AiProviderException provider && !string.IsNullOrWhiteSpace(provider.ProviderResponseExcerpt))
                detail += $" ProviderResponse={provider.ProviderResponseExcerpt}";
            details.Add(detail);
        }
        return string.Join(" -> ", details);
    }

    public static string Message(IHostEnvironment environment, string fallback, Exception exception)
    {
        var details = From(environment, exception);
        return details is null ? fallback : $"{fallback} {details}";
    }
}
