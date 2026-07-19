using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class ModulePackage
{
    [Key, MaxLength(64)]
    public string Digest { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string ModuleId { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string Version { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string ContractVersion { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string ManifestJson { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string PackageRelativePath { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string ExpandedRelativePath { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Status { get; set; } = "installed";

    [MaxLength(2000)]
    public string? LastError { get; set; }

    public bool IsEnabled { get; set; }
    public DateTimeOffset InstalledAt { get; set; }
    public DateTimeOffset LastScannedAt { get; set; }
}
