using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class Scenario
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Summary { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Genre { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Tone { get; set; } = string.Empty;

    public string Lore { get; set; } = string.Empty;

    [MaxLength(120)]
    public string AiFreedom { get; set; } = string.Empty;

    public string Hero { get; set; } = string.Empty;

    public string Opening { get; set; } = string.Empty;

    [MaxLength(240)]
    public string IllustrationStyle { get; set; } = string.Empty;

    [MaxLength(240)]
    public string IllustrationMood { get; set; } = string.Empty;

    public string IllustrationNegative { get; set; } = string.Empty;

    public string SampleScene { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = "draft";

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
