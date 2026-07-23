using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class AiProviderRuntimeSettings
{
    public const string DefaultId = "default";

    [Key]
    [MaxLength(32)]
    public string Id { get; set; } = DefaultId;

    [MaxLength(80)]
    public string ActiveProvider { get; set; } = "openai";

    public DateTimeOffset UpdatedAt { get; set; }
}
