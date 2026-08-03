using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public sealed class Scenario
{
    [Key]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public ScenarioTitle Title { get; set; } = new("Untitled");

    [MaxLength(2000)]
    public string Summary { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Genre { get; set; } = string.Empty;

    [MaxLength(120)]
    public string Tone { get; set; } = string.Empty;

    public string Lore { get; set; } = string.Empty;

    [MaxLength(120)]
    public string AiFreedom { get; set; } = string.Empty;

    [MaxLength(20)]
    public HeroPolicy HeroMode { get; set; } = HeroPolicy.Free;

    public bool HeroFreeGenerationAllowed { get; set; }

    public string Hero { get; set; } = string.Empty;

    public string Opening { get; set; } = string.Empty;

    [MaxLength(240)]
    public IllustrationPrompt IllustrationStyle { get; set; } = new("");

    [MaxLength(240)]
    public IllustrationPrompt IllustrationMood { get; set; } = new("");

    public IllustrationPrompt IllustrationNegative { get; set; } = new("");

    public string SampleScene { get; set; } = string.Empty;

    [MaxLength(40)]
    public ScenarioPublicationStatus Status { get; set; } = ScenarioPublicationStatus.Draft;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
    public static Scenario Create(string id, string authorId, ScenarioTitle title, DateTimeOffset now) => new()
    {
        Id = id, AuthorId = authorId, Title = title, Status = ScenarioPublicationStatus.Draft, CreatedAt = now, UpdatedAt = now,
    };

    public void Edit(ScenarioTitle title, string summary, string genre, string tone, string lore, string aiFreedom,
        HeroPolicy heroPolicy, bool heroFreeGenerationAllowed, string hero, string opening, IllustrationPrompt illustrationStyle,
        IllustrationPrompt illustrationMood, IllustrationPrompt illustrationNegative, string sampleScene, DateTimeOffset now)
    {
        Title = title; Summary = summary; Genre = genre; Tone = tone; Lore = lore; AiFreedom = aiFreedom; HeroMode = heroPolicy;
        HeroFreeGenerationAllowed = heroPolicy == HeroPolicy.Select && heroFreeGenerationAllowed; Hero = hero; Opening = opening;
        IllustrationStyle = illustrationStyle; IllustrationMood = illustrationMood; IllustrationNegative = illustrationNegative;
        SampleScene = sampleScene; UpdatedAt = now;
    }

    public void Publish(DateTimeOffset now) { Status = ScenarioPublicationStatus.Published; UpdatedAt = now; }
}
