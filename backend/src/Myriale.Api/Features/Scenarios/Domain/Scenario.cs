using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Scenarios.Domain;

public sealed class Scenario
{
    internal Scenario() { }

    [Key]
    public string Id { get; internal set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public ScenarioTitle Title { get; internal set; } = new("Untitled");

    [MaxLength(2000)]
    public string Summary { get; internal set; } = string.Empty;

    [MaxLength(80)]
    public string Genre { get; internal set; } = string.Empty;

    [MaxLength(120)]
    public string Tone { get; internal set; } = string.Empty;

    public string Lore { get; internal set; } = string.Empty;

    [MaxLength(120)]
    public string AiFreedom { get; internal set; } = string.Empty;

    [MaxLength(20)]
    public HeroMode HeroMode { get; internal set; } = HeroMode.Free;

    public bool HeroFreeGenerationAllowed { get; internal set; }

    public string Hero { get; internal set; } = string.Empty;

    public string Opening { get; internal set; } = string.Empty;

    [MaxLength(240)]
    public IllustrationPrompt IllustrationStyle { get; internal set; } = new("");

    [MaxLength(240)]
    public IllustrationPrompt IllustrationMood { get; internal set; } = new("");

    public IllustrationPrompt IllustrationNegative { get; internal set; } = new("");

    public string SampleScene { get; internal set; } = string.Empty;

    [MaxLength(40)]
    public ScenarioPublicationStatus Status { get; internal set; } = ScenarioPublicationStatus.Draft;

    [Required]
    public string AuthorId { get; internal set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; internal set; }

    public DateTimeOffset UpdatedAt { get; internal set; }

    /// <summary>Optimistic concurrency token for Scenario writes.</summary>
    public int Revision { get; internal set; }

    /// <summary>Atomically allocates monotonically increasing definition versions.</summary>
    public int DefinitionVersionCounter { get; internal set; }
    public static Scenario Create(string id, string authorId, ScenarioTitle title, DateTimeOffset now) => new()
    {
        Id = id,
        AuthorId = authorId,
        Title = title,
        Status = ScenarioPublicationStatus.Draft,
        CreatedAt = now,
        UpdatedAt = now,
    };

    public void Edit(ScenarioTitle title, string summary, string genre, string tone, string lore, string aiFreedom,
        HeroMode heroMode, bool heroFreeGenerationAllowed, string hero, string opening, IllustrationPrompt illustrationStyle,
        IllustrationPrompt illustrationMood, IllustrationPrompt illustrationNegative, string sampleScene, DateTimeOffset now)
    {
        Title = title; Summary = summary; Genre = genre; Tone = tone; Lore = lore; AiFreedom = aiFreedom; HeroMode = heroMode;
        HeroFreeGenerationAllowed = heroMode == HeroMode.Select && heroFreeGenerationAllowed; Hero = hero; Opening = opening;
        IllustrationStyle = illustrationStyle; IllustrationMood = illustrationMood; IllustrationNegative = illustrationNegative;
        SampleScene = sampleScene; UpdatedAt = now; Revision++;
    }

    public int AllocateDefinitionVersion(DateTimeOffset now)
    {
        UpdatedAt = now;
        Revision++;
        return ++DefinitionVersionCounter;
    }

    public void Publish(DateTimeOffset now) { Status = ScenarioPublicationStatus.Published; UpdatedAt = now; Revision++; }
}
