using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed record ScenarioRecommendationContext(string Id, string Title, string Genre, string Tone, string Lore, string Opening);

public sealed class ScenarioQueryService(ApplicationDbContext db)
{
    public async Task<IReadOnlyList<ScenarioDraftResponse>> ListAsync(string? authorId, CancellationToken cancellationToken)
    {
        var rows = await db.Scenarios.AsNoTracking()
            .Where(x => x.Status == ScenarioPublicationStatus.Published || authorId != null && x.AuthorId == authorId)
            .Select(x => new ScenarioRow(x.Id, x.Title, x.Summary, x.Genre, x.Tone, x.Lore, x.AiFreedom, x.HeroMode,
                x.HeroFreeGenerationAllowed, x.Hero, x.Opening, x.IllustrationStyle, x.IllustrationMood, x.IllustrationNegative,
                x.SampleScene, x.Status, x.UpdatedAt)).ToListAsync(cancellationToken);
        return rows.OrderByDescending(x => x.UpdatedAt).ThenBy(x => x.Title.Value).Select(ToResponse).ToList();
    }

    public async Task<ScenarioDraftResponse?> GetAsync(string scenarioId, string? authorId, CancellationToken cancellationToken)
    {
        var row = await db.Scenarios.AsNoTracking()
            .Where(x => x.Id == scenarioId && (x.Status == ScenarioPublicationStatus.Published || authorId != null && x.AuthorId == authorId))
            .Select(x => new ScenarioRow(x.Id, x.Title, x.Summary, x.Genre, x.Tone, x.Lore, x.AiFreedom, x.HeroMode,
                x.HeroFreeGenerationAllowed, x.Hero, x.Opening, x.IllustrationStyle, x.IllustrationMood, x.IllustrationNegative,
                x.SampleScene, x.Status, x.UpdatedAt)).SingleOrDefaultAsync(cancellationToken);
        return row is null ? null : ToResponse(row);
    }

    public async Task<ScenarioRecommendationContext?> GetRecommendationContextAsync(string scenarioId, CancellationToken cancellationToken)
    {
        var row = await db.Scenarios.AsNoTracking().Where(x => x.Id == scenarioId)
            .Select(x => new { x.Id, x.Title, x.Genre, x.Tone, x.Lore, x.Opening }).SingleOrDefaultAsync(cancellationToken);
        return row is null ? null : new(row.Id, row.Title, row.Genre, row.Tone, row.Lore, row.Opening);
    }

    public Task<bool> IsOwnerAsync(string scenarioId, string? authorId, CancellationToken cancellationToken) =>
        string.IsNullOrWhiteSpace(authorId) ? Task.FromResult(false) :
        db.Scenarios.AsNoTracking().AnyAsync(x => x.Id == scenarioId && x.AuthorId == authorId, cancellationToken);

    private static ScenarioDraftResponse ToResponse(ScenarioRow x) => new(x.Id, x.Title, x.Summary, x.Genre, x.Tone, x.Lore, x.AiFreedom,
        x.HeroMode.ToWireValue(), x.HeroFreeGenerationAllowed, x.Hero, x.Opening, x.IllustrationStyle, x.IllustrationMood,
        x.IllustrationNegative, x.SampleScene, x.Status.ToWireValue(), DateOnly.FromDateTime(x.UpdatedAt.UtcDateTime));

    private sealed record ScenarioRow(string Id, ScenarioTitle Title, string Summary, string Genre, string Tone, string Lore, string AiFreedom,
        HeroMode HeroMode, bool HeroFreeGenerationAllowed, string Hero, string Opening, IllustrationPrompt IllustrationStyle,
        IllustrationPrompt IllustrationMood, IllustrationPrompt IllustrationNegative, string SampleScene, ScenarioPublicationStatus Status, DateTimeOffset UpdatedAt);
}
