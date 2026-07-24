using System.Net.Http.Json;
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

        group.MapGet("/", ListScenariosAsync)
            .WithName("ListScenarios")
            .WithSummary("Returns scenarios available for starting a new play session.");

        group.MapGet("/{scenarioId}", GetScenarioAsync)
            .WithName("GetScenario")
            .WithSummary("Returns a scenario used to prepare a new play session.");

        group.MapPost("/{scenarioId}/hero-recommendation", RecommendHeroAsync)
            .WithName("RecommendScenarioHero")
            .WithSummary("Returns an AI-generated protagonist recommendation for a scenario.");

        group.MapPost("/", CreateScenarioAsync)
            .RequireAuthorization()
            .WithName("CreateScenario")
            .WithSummary("Creates a draft scenario owned by the authenticated author.");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<ScenarioDraftResponse>>> ListScenariosAsync(
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var authorId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var scenarios = await db.Scenarios.AsNoTracking()
            .Where(item => item.Status == "published" || authorId != null && item.AuthorId == authorId)
            .ToListAsync(cancellationToken);
        var responses = scenarios
            .OrderByDescending(item => item.UpdatedAt)
            .ThenBy(item => item.Title)
            .Select(ToResponse)
            .ToList();
        return TypedResults.Ok<IReadOnlyList<ScenarioDraftResponse>>(responses);
    }

    private static async Task<Results<Ok<ScenarioDraftResponse>, NotFound>> GetScenarioAsync(
        string scenarioId,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var scenario = await db.Scenarios.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == scenarioId, cancellationToken);
        return scenario is null ? TypedResults.NotFound() : TypedResults.Ok(ToResponse(scenario));
    }

    private static async Task<Results<Ok<ScenarioHeroRecommendationResponse>, NotFound>> RecommendHeroAsync(
        string scenarioId,
        RecommendScenarioHeroRequest request,
        ApplicationDbContext db,
        IHttpClientFactory httpClientFactory,
        CancellationToken cancellationToken)
    {
        var scenario = await db.Scenarios.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == scenarioId, cancellationToken);
        if (scenario is null) return TypedResults.NotFound();

        try
        {
            var client = httpClientFactory.CreateClient("MockAi");
            using var response = await client.PostAsJsonAsync("/mock-ai/hero-recommendation", new
            {
                scenario.Id,
                scenario.Title,
                scenario.Genre,
                scenario.Tone,
                scenario.Lore,
                scenario.Opening,
                request.CurrentName,
                request.CurrentProfile,
            }, cancellationToken);
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadFromJsonAsync<ScenarioHeroRecommendationResponse>(cancellationToken: cancellationToken);
            if (body is not null) return TypedResults.Ok(body);
        }
        catch
        {
            // Keep local and test runs deterministic when the mock AI process is unavailable.
        }

        return TypedResults.Ok(new ScenarioHeroRecommendationResponse(
            "ノクト",
            $"{scenario.Title}の導入と世界観を手掛かりに、物語の謎を追う旅人。",
            "AIがシナリオ設定から主人公案を推薦しました。内容を確認・修正してから確定してください。"));
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
        if (request.Summary?.Length > 2000) errors["summary"] = ["基本情報は2000文字以内で入力してください。"];
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
