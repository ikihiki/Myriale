using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class AiProviderProfileDefinition
{
    [Key]
    [MaxLength(80)]
    public string Id { get; set; } = string.Empty;

    [MaxLength(120)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Adapter { get; set; } = "openai-compatible";

    [MaxLength(2048)]
    public string BaseUrl { get; set; } = string.Empty;

    [MaxLength(240)]
    public string Model { get; set; } = string.Empty;

    [MaxLength(80)]
    public string CredentialId { get; set; } = string.Empty;

    public bool Enabled { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; }
}
