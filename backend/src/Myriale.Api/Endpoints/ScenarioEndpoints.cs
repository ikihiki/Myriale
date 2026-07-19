using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Endpoints;

public static class ScenarioEndpoints
{
    public static RouteGroupBuilder MapScenarioEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/scenarios")
            .WithTags("Scenarios")
            .RequireCors("MyrialeFrontend");

        group.MapPost("/", CreateScenarioAsync)
            .RequireAuthorization()
            .WithName("CreateScenario")
            .WithSummary("Creates a draft scenario owned by the authenticated author.");

        return group;
    }

    private static async Task<Results<Created<ScenarioDraftResponse>, BadRequest<ScenarioErrorResponse>, UnauthorizedHttpResult>> CreateScenarioAsync(
        CreateScenarioRequest request,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var authorId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(authorId)) return TypedResults.Unauthorized();

        var errors = Validate(request);
        if (errors.Count > 0)
        {
            return TypedResults.BadRequest(new ScenarioErrorResponse("入力内容を確認してください。", errors));
        }

        var now = DateTimeOffset.UtcNow;
        var scenario = new Scenario
        {
            Id = await NewScenarioIdAsync(db, cancellationToken),
            Title = request.Title.Trim(),
            Summary = Clean(request.Summary),
            Genre = Clean(request.Genre, "未分類"),
            Tone = Clean(request.Tone),
            Lore = Clean(request.Lore),
            AiFreedom = Clean(request.AiFreedom),
            HeroMode = NormalizeHeroMode(request.HeroMode),
            HeroFreeGenerationAllowed = request.HeroMode == "select" && request.HeroFreeGenerationAllowed == true,
            Hero = Clean(request.Hero),
            Opening = Clean(request.Opening),
            IllustrationStyle = Clean(request.IllustrationStyle),
            IllustrationMood = Clean(request.IllustrationMood),
            IllustrationNegative = Clean(request.IllustrationNegative),
            SampleScene = Clean(request.SampleScene),
            Status = "draft",
            AuthorId = authorId,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.Scenarios.Add(scenario);
        await db.SaveChangesAsync(cancellationToken);

        var response = ToResponse(scenario);
        return TypedResults.Created($"/api/scenarios/{scenario.Id}", response);
    }

    private static Dictionary<string, string[]> Validate(CreateScenarioRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors["title"] = ["シナリオタイトルを入力してください。"];
        if (request.Title?.Trim().Length > 160) errors["title"] = ["シナリオタイトルは160文字以内で入力してください。"];
        if (request.Summary?.Length > 2000) errors["summary"] = ["概要は2000文字以内で入力してください。"];
        if (request.HeroMode is not null && request.HeroMode is not ("fixed" or "select" or "free")) errors["heroMode"] = ["主人公の扱いを選択してください。"];
        if (request.HeroMode is "fixed" or "select" && string.IsNullOrWhiteSpace(request.Hero)) errors["hero"] = ["固定または選択式では主人公データを入力してください。"];
        return errors;
    }

    private static string Clean(string? value, string fallback = "") => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static string NormalizeHeroMode(string? value) => value is "fixed" or "select" or "free" ? value : "free";

    private static async Task<string> NewScenarioIdAsync(ApplicationDbContext db, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var id = $"SCN-{Guid.NewGuid():N}"[..12].ToUpperInvariant();
            if (!await db.Scenarios.AnyAsync(scenario => scenario.Id == id, cancellationToken)) return id;
        }

        return $"SCN-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
    }

    private static ScenarioDraftResponse ToResponse(Scenario scenario) => new(
        scenario.Id,
        scenario.Title,
        scenario.Summary,
        scenario.Genre,
        scenario.Tone,
        scenario.Lore,
        scenario.AiFreedom,
        scenario.HeroMode,
        scenario.HeroFreeGenerationAllowed,
        scenario.Hero,
        scenario.Opening,
        scenario.IllustrationStyle,
        scenario.IllustrationMood,
        scenario.IllustrationNegative,
        scenario.SampleScene,
        scenario.Status,
        DateOnly.FromDateTime(scenario.UpdatedAt.UtcDateTime));
}
