using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class AiProviderKey
{
    [Key]
    [MaxLength(80)]
    public string Provider { get; set; } = string.Empty;

    [MaxLength(120)]
    public string DisplayName { get; set; } = string.Empty;

    public string Secret { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = "untested";

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? LastValidatedAt { get; set; }
}
