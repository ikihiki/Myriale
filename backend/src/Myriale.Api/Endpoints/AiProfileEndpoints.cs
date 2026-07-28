using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Endpoints;

public static class AiProfileEndpoints
{
    public static IEndpointRouteBuilder MapAiProfileEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/ai/profiles", async (IAiProfileCatalog catalog, CancellationToken cancellationToken) =>
        {
            var snapshot = await catalog.GetAsync(cancellationToken);
            var profiles = snapshot.Profiles.Values
                .Where(item => item.Selectable)
                .Select(item => new AiProfileResponse(item.Id, item.DisplayName))
                .ToList();
            return Results.Ok(new AiProfilesResponse(
                profiles,
                snapshot.DefaultActionDecisionProfileId,
                snapshot.DefaultNarrativeProfileId));
        })
        .WithTags("AI")
        .RequireAuthorization()
        .RequireCors("MyrialeFrontend");
        return routes;
    }
}
