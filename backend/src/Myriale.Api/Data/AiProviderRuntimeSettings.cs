using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class AiProviderRuntimeSettings
{
    public const string DefaultId = "default";

    [Key]
    [MaxLength(32)]
    public string Id { get; private set; } = DefaultId;

    [MaxLength(80)]
    public string ActiveProvider { get; private set; } = string.Empty;

    public long Revision { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private AiProviderRuntimeSettings() { }

    public static AiProviderRuntimeSettings Create(string provider, DateTimeOffset activatedAt)
    {
        var settings = new AiProviderRuntimeSettings();
        settings.ActivateInitial(provider, activatedAt);
        return settings;
    }

    public bool Activate(string provider, DateTimeOffset activatedAt)
    {
        provider = Normalize(provider);
        if (string.Equals(ActiveProvider, provider, StringComparison.Ordinal)) return false;
        ActiveProvider = provider;
        UpdatedAt = activatedAt;
        Revision++;
        return true;
    }

    private void ActivateInitial(string provider, DateTimeOffset activatedAt)
    {
        ActiveProvider = Normalize(provider);
        UpdatedAt = activatedAt;
        Revision = 1;
    }

    private static string Normalize(string provider)
    {
        var normalized = provider?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > 80)
            throw new ArgumentException("AI profile ID must be between 1 and 80 characters.", nameof(provider));
        return normalized;
    }
}
