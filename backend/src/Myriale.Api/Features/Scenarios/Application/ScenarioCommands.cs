using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Features.Scenarios.Application;

public sealed record CreateScenarioCommand(string AuthorId, CreateScenarioRequest Request);
public sealed record UpdateScenarioCommand(string ScenarioId, string AuthorId, CreateScenarioRequest Request);
public enum ScenarioCommandOutcome { Success, NotFound, Invalid, Conflict }
public sealed record ScenarioCommandResult(ScenarioCommandOutcome Outcome, ScenarioDraftResponse? Scenario = null, IReadOnlyDictionary<string, string[]>? Errors = null);

public sealed class CreateScenarioUseCase(ApplicationDbContext db)
{
    public async Task<ScenarioCommandResult> ExecuteAsync(CreateScenarioCommand command, CancellationToken cancellationToken)
    {
        var errors = ScenarioRequestValidator.Validate(command.Request);
        if (errors.Count > 0) return new(ScenarioCommandOutcome.Invalid, Errors: errors);
        var now = DateTimeOffset.UtcNow;
        var scenario = Scenario.Create($"SCN-{Guid.NewGuid():N}"[..12].ToUpperInvariant(), command.AuthorId, new ScenarioTitle(command.Request.Title), now);
        ScenarioRequestValidator.Apply(scenario, command.Request, now);
        db.Scenarios.Add(scenario);
        await db.SaveChangesAsync(cancellationToken);
        return new(ScenarioCommandOutcome.Success, ScenarioRequestValidator.ToResponse(scenario));
    }
}

public sealed class UpdateScenarioUseCase(ApplicationDbContext db)
{
    public async Task<ScenarioCommandResult> ExecuteAsync(UpdateScenarioCommand command, CancellationToken cancellationToken)
    {
        var errors = ScenarioRequestValidator.Validate(command.Request);
        if (errors.Count > 0) return new(ScenarioCommandOutcome.Invalid, Errors: errors);
        var scenario = await db.Scenarios.SingleOrDefaultAsync(x => x.Id == command.ScenarioId && x.AuthorId == command.AuthorId, cancellationToken);
        if (scenario is null) return new(ScenarioCommandOutcome.NotFound);
        ScenarioRequestValidator.Apply(scenario, command.Request, DateTimeOffset.UtcNow);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return new(ScenarioCommandOutcome.Conflict); }
        return new(ScenarioCommandOutcome.Success, ScenarioRequestValidator.ToResponse(scenario));
    }
}

internal static class ScenarioRequestValidator
{
    public static Dictionary<string, string[]> Validate(CreateScenarioRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors["title"] = ["シナリオタイトルを入力してください。"];
        if (request.Title?.Trim().Length > 160) errors["title"] = ["シナリオタイトルは160文字以内で入力してください。"];
        if (request.Summary?.Length > 2000) errors["summary"] = ["基本情報は2000文字以内で入力してください。"];
        if (request.HeroMode is not null && request.HeroMode is not ("fixed" or "select" or "free")) errors["heroMode"] = ["主人公の扱いを選択してください。"];
        if (request.HeroMode is "fixed" or "select" && string.IsNullOrWhiteSpace(request.Hero)) errors["hero"] = ["固定または選択式では主人公データを入力してください。"];
        return errors;
    }

    public static void Apply(Scenario scenario, CreateScenarioRequest request, DateTimeOffset now) => scenario.Edit(
        new ScenarioTitle(request.Title), Clean(request.Summary), Clean(request.Genre, "未分類"), Clean(request.Tone), Clean(request.Lore),
        Clean(request.AiFreedom), ScenarioEnumValues.ParseHeroMode(request.HeroMode), request.HeroFreeGenerationAllowed == true,
        Clean(request.Hero), Clean(request.Opening), new IllustrationPrompt(request.IllustrationStyle), new IllustrationPrompt(request.IllustrationMood),
        new IllustrationPrompt(request.IllustrationNegative), Clean(request.SampleScene), now);

    public static ScenarioDraftResponse ToResponse(Scenario x) => new(x.Id, x.Title, x.Summary, x.Genre, x.Tone, x.Lore, x.AiFreedom,
        x.HeroMode.ToWireValue(), x.HeroFreeGenerationAllowed, x.Hero, x.Opening, x.IllustrationStyle, x.IllustrationMood,
        x.IllustrationNegative, x.SampleScene, x.Status.ToWireValue(), DateOnly.FromDateTime(x.UpdatedAt.UtcDateTime));

    private static string Clean(string? value, string fallback = "") => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}
