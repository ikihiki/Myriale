using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.AiProviders.Domain;

public sealed class AiProviderRuntimeSettings
{
    public const string DefaultId = "default";

    [Key]
    [MaxLength(32)]
    public string Id { get; private set; } = DefaultId;

    [MaxLength(80)]
    public AiProviderProfileId ActiveProvider { get; private set; }

    public long Revision { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private AiProviderRuntimeSettings() { }

    public static AiProviderRuntimeSettings Create(AiProviderProfileId provider, DateTimeOffset activatedAt)
    {
        var settings = new AiProviderRuntimeSettings();
        settings.ActivateInitial(provider, activatedAt);
        return settings;
    }

    public bool Activate(AiProviderProfileId provider, DateTimeOffset activatedAt)
    {
        if (ActiveProvider == provider) return false;
        ActiveProvider = provider;
        UpdatedAt = activatedAt;
        Revision++;
        return true;
    }

    private void ActivateInitial(AiProviderProfileId provider, DateTimeOffset activatedAt)
    {
        ActiveProvider = provider;
        UpdatedAt = activatedAt;
        Revision = 1;
    }

}
