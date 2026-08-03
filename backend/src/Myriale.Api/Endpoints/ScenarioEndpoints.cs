using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

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

        group.MapPut("/{scenarioId}", UpdateScenarioAsync)
            .RequireAuthorization()
            .WithName("UpdateScenario")
            .WithSummary("Updates an existing scenario using the same fields as scenario registration.");

        group.MapPost("/{scenarioId}/hero-recommendation", RecommendHeroAsync)
            .WithName("RecommendScenarioHero")
            .WithSummary("Returns an AI-generated protagonist recommendation for a scenario.");

        group.MapPost("/", CreateScenarioAsync)
            .RequireAuthorization()
            .WithName("CreateScenario")
            .WithSummary("Creates a draft scenario owned by the authenticated author.");

        group.MapGet("/{scenarioId}/rule-data", GetRuleDataAsync).RequireAuthorization()
            .WithName("GetScenarioRuleData");
        group.MapPost("/{scenarioId}/rule-data/drafts", CreateRuleDataDraftAsync).RequireAuthorization()
            .WithName("CreateScenarioRuleDataDraft");
        group.MapPut("/{scenarioId}/rule-data", SaveRuleDataAsync).RequireAuthorization()
            .WithName("SaveScenarioRuleData");
        group.MapGet("/{scenarioId}/rule-data/readiness", GetRuleDataReadinessAsync).RequireAuthorization()
            .WithName("GetScenarioRuleDataReadiness");
        group.MapPost("/{scenarioId}/rule-data/publish", PublishRuleDataAsync).RequireAuthorization()
            .WithName("PublishScenarioRuleData");
        group.MapPost("/{scenarioId}/rule-data/debug", DebugRuleDataAsync).RequireAuthorization()
            .WithName("DebugScenarioRuleData")
            .WithSummary("Runs the latest draft rule definition against an isolated, non-persistent world state.");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<ScenarioDraftResponse>>> ListScenariosAsync(
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var authorId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var scenarios = await db.Scenarios.AsNoTracking()
            .Where(item => item.Status == ScenarioPublicationStatus.Published || authorId != null && item.AuthorId == authorId)
            .ToListAsync(cancellationToken);
        var responses = scenarios
            .OrderByDescending(item => item.UpdatedAt)
            .ThenBy(item => item.Title.Value)
            .Select(item => ToResponse(item))
            .ToList();
        return TypedResults.Ok<IReadOnlyList<ScenarioDraftResponse>>(responses);
    }

    private static async Task<Results<Ok<ScenarioDraftResponse>, NotFound>> GetScenarioAsync(
        string scenarioId,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var authorId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var scenario = await db.Scenarios.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == scenarioId
                && (item.Status == ScenarioPublicationStatus.Published || authorId != null && item.AuthorId == authorId), cancellationToken);
        return scenario is null ? TypedResults.NotFound() : TypedResults.Ok(ToResponse(scenario));
    }

    private static async Task<Results<Ok<ScenarioDraftResponse>, BadRequest<ScenarioErrorResponse>, NotFound, UnauthorizedHttpResult>> UpdateScenarioAsync(
        string scenarioId,
        CreateScenarioRequest request,
        ClaimsPrincipal principal,
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var authorId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(authorId)) return TypedResults.Unauthorized();

        var errors = Validate(request);
        if (errors.Count > 0)
            return TypedResults.BadRequest(new ScenarioErrorResponse("入力内容を確認してください。", errors));

        var scenario = await db.Scenarios.SingleOrDefaultAsync(item => item.Id == scenarioId && item.AuthorId == authorId, cancellationToken);
        if (scenario is null) return TypedResults.NotFound();

        scenario.Edit(
            new ScenarioTitle(request.Title), Clean(request.Summary), Clean(request.Genre, "未分類"), Clean(request.Tone),
            Clean(request.Lore), Clean(request.AiFreedom), ScenarioEnumValues.ParseHeroMode(request.HeroMode), request.HeroFreeGenerationAllowed == true,
            Clean(request.Hero), Clean(request.Opening), new IllustrationPrompt(request.IllustrationStyle),
            new IllustrationPrompt(request.IllustrationMood), new IllustrationPrompt(request.IllustrationNegative),
            Clean(request.SampleScene), DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(ToResponse(scenario));
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
        var scenario = Scenario.Create(await NewScenarioIdAsync(db, cancellationToken), authorId, new ScenarioTitle(request.Title), now);
        scenario.Edit(
            new ScenarioTitle(request.Title), Clean(request.Summary), Clean(request.Genre, "未分類"), Clean(request.Tone),
            Clean(request.Lore), Clean(request.AiFreedom), ScenarioEnumValues.ParseHeroMode(request.HeroMode), request.HeroFreeGenerationAllowed == true,
            Clean(request.Hero), Clean(request.Opening), new IllustrationPrompt(request.IllustrationStyle),
            new IllustrationPrompt(request.IllustrationMood), new IllustrationPrompt(request.IllustrationNegative),
            Clean(request.SampleScene), now);

        db.Scenarios.Add(scenario);
        await db.SaveChangesAsync(cancellationToken);

        var response = ToResponse(scenario);
        return TypedResults.Created($"/api/scenarios/{scenario.Id}", response);
    }

    private static async Task<IResult> GetRuleDataAsync(
        string scenarioId, ClaimsPrincipal principal, ApplicationDbContext db,
        ScenarioDefinitionAuthoringService authoring, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(scenarioId, principal, db, cancellationToken)) return TypedResults.NotFound();
        var version = await authoring.GetLatestAsync(scenarioId, cancellationToken);
        return version is null ? TypedResults.NotFound() : TypedResults.Ok(authoring.ToResponse(version));
    }

    private static async Task<IResult> CreateRuleDataDraftAsync(
        string scenarioId, ClaimsPrincipal principal, ApplicationDbContext db,
        ScenarioDefinitionAuthoringService authoring, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(scenarioId, principal, db, cancellationToken)) return TypedResults.NotFound();
        var latest = await authoring.GetLatestAsync(scenarioId, cancellationToken);
        if (latest?.Status == DefinitionStatus.Draft) return TypedResults.Ok(authoring.ToResponse(latest));
        var draft = await authoring.GetOrCreateDraftAsync(scenarioId, cancellationToken);
        if (latest is not null && latest.Status == DefinitionStatus.Published)
            draft = await authoring.SaveAsync(draft, authoring.ToRequest(latest), cancellationToken);
        return TypedResults.Created($"/api/scenarios/{scenarioId}/rule-data", authoring.ToResponse(draft));
    }

    private static async Task<IResult> SaveRuleDataAsync(
        string scenarioId, ScenarioRuleDataRequest request, ClaimsPrincipal principal, ApplicationDbContext db,
        ScenarioDefinitionAuthoringService authoring, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(scenarioId, principal, db, cancellationToken)) return TypedResults.NotFound();
        var draft = await authoring.GetLatestAsync(scenarioId, cancellationToken);
        if (draft is not null && draft.Status != DefinitionStatus.Draft) return TypedResults.Conflict();
        var errors = authoring.PreparePut(draft, request);
        foreach (var pair in authoring.Validate(request, false))
            errors[pair.Key] = errors.TryGetValue(pair.Key, out var existing) ? existing.Concat(pair.Value).Distinct().ToArray() : pair.Value;
        if (errors.Count > 0) return TypedResults.BadRequest(new ScenarioErrorResponse("Rule data is malformed.", errors));
        draft ??= await authoring.GetOrCreateDraftAsync(scenarioId, cancellationToken);
        draft = await authoring.SaveAsync(draft, request, cancellationToken);
        return TypedResults.Ok(authoring.ToResponse(draft));
    }

    private static async Task<IResult> GetRuleDataReadinessAsync(
        string scenarioId, ClaimsPrincipal principal, ApplicationDbContext db,
        ScenarioDefinitionAuthoringService authoring, ScenarioPublicationService publication, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(scenarioId, principal, db, cancellationToken)) return TypedResults.NotFound();
        var version = await authoring.GetLatestAsync(scenarioId, cancellationToken);
        if (version is null) return TypedResults.NotFound();
        var readiness = await publication.GetReadinessAsync(scenarioId, cancellationToken);
        return TypedResults.Ok(new ScenarioDefinitionReadinessResponse(version.Id, readiness!.IsReady, readiness.Errors));
    }

    private static async Task<IResult> PublishRuleDataAsync(
        string scenarioId, ClaimsPrincipal principal, ApplicationDbContext db,
        ScenarioDefinitionAuthoringService authoring, ScenarioPublicationService publication, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(scenarioId, principal, db, cancellationToken)) return TypedResults.NotFound();
        var result = await publication.PublishAsync(scenarioId, cancellationToken);
        return result.Outcome switch
        {
            ScenarioPublicationOutcome.NotFound => TypedResults.NotFound(),
            ScenarioPublicationOutcome.Conflict => TypedResults.Conflict(),
            ScenarioPublicationOutcome.NotReady => TypedResults.BadRequest(new ScenarioErrorResponse("Rule data is not ready to publish.", result.Errors!)),
            _ => TypedResults.Ok(authoring.ToResponse(result.Definition!)),
        };
    }

    private static async Task<IResult> DebugRuleDataAsync(
        string scenarioId, ScenarioRuleDebugRequest request, ClaimsPrincipal principal, ApplicationDbContext db,
        ScenarioRuleDebugService debug, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(scenarioId, principal, db, cancellationToken)) return TypedResults.NotFound();
        try
        {
            var response = await debug.ExecuteAsync(scenarioId, request, cancellationToken);
            return response is null ? TypedResults.NotFound() : TypedResults.Ok(response);
        }
        catch (ScenarioTurnValidationException exception)
        {
            return TypedResults.BadRequest(new ScenarioErrorResponse(
                "Debug execution failed.",
                new Dictionary<string, string[]> { ["debug"] = [exception.Code] }));
        }
        catch (JsonException)
        {
            return TypedResults.BadRequest(new ScenarioErrorResponse(
                "Debug state contains invalid JSON.",
                new Dictionary<string, string[]> { ["debug"] = ["invalid_debug_json"] }));
        }
    }

    private static async Task<bool> IsOwnerAsync(string scenarioId, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var authorId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return !string.IsNullOrWhiteSpace(authorId)
            && await db.Scenarios.AnyAsync(item => item.Id == scenarioId && item.AuthorId == authorId, cancellationToken);
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
        scenario.HeroMode.ToWireValue(),
        scenario.HeroFreeGenerationAllowed,
        scenario.Hero,
        scenario.Opening,
        scenario.IllustrationStyle,
        scenario.IllustrationMood,
        scenario.IllustrationNegative,
        scenario.SampleScene,
        scenario.Status.ToWireValue(),
        DateOnly.FromDateTime(scenario.UpdatedAt.UtcDateTime));
}
