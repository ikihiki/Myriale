using System.Text.RegularExpressions;

namespace Myriale.Api.Services;

public static class SessionExecutionDiagnostics
{
    public static string Redact(string value)
    {
        var redacted = Regex.Replace(value, "(?i)(authorization|api[-_ ]?key|cookie)\\s*[:=]\\s*[^,;\\s]+", "$1=[REDACTED]");
        return redacted.Length <= 1000 ? redacted : redacted[..1000];
    }
}
