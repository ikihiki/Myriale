using System.Security.Claims;

namespace Myriale.Api.Features.AiProviders.Http;

public static class AiPlaygroundEndpoints
{
    public static RouteGroupBuilder MapAiPlaygroundEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/admin/ai-playground")
            .WithTags("Admin AI Playground")
            .RequireCors("MyrialeFrontend")
            .RequireAuthorization("AiAdministration");
        group.MapGet("", GetAsync);
        group.MapPut("", PutAsync);
        return group;
    }

    private static async Task<IResult> GetAsync(
        ClaimsPrincipal principal,
        AiPlaygroundDocumentService service,
        CancellationToken cancellationToken)
    {
        var ownerAccountId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerAccountId)) return Results.Unauthorized();
        return Map(await service.GetAsync(ownerAccountId, cancellationToken));
    }

    private static async Task<IResult> PutAsync(
        PutAiPlaygroundDocumentRequest request,
        ClaimsPrincipal principal,
        AiPlaygroundDocumentService service,
        CancellationToken cancellationToken)
    {
        var ownerAccountId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerAccountId)) return Results.Unauthorized();
        return Map(await service.PutAsync(ownerAccountId, request.Document, request.ExpectedRevision, cancellationToken));
    }

    private static IResult Map(AiPlaygroundDocumentResult result) => result.Outcome switch
    {
        AiPlaygroundDocumentOutcome.Success => Results.Ok(result.Value),
        AiPlaygroundDocumentOutcome.NotFound => Results.NotFound(),
        AiPlaygroundDocumentOutcome.ValidationFailed => Results.BadRequest(Error(result.Error)),
        AiPlaygroundDocumentOutcome.Conflict => Results.Conflict(Error(result.Error)),
        _ => Results.Problem(statusCode: StatusCodes.Status500InternalServerError),
    };

    private static AiAdminErrorResponse Error(string? message) =>
        new(message ?? "AI Playground request failed.", new Dictionary<string, string[]>());
}
