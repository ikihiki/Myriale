using Myriale.Api.Contracts;
using Myriale.Api.Services;

namespace Myriale.Api.Endpoints;

public static class AiProfileEndpoints
{
    public static IEndpointRouteBuilder MapAiProfileEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/ai/profiles", (AiProfileCatalog catalog) =>
        {
            var profiles = catalog.GetSelectableProfiles()
                .Select(item => new AiProfileResponse(item.Id, item.DisplayName))
                .ToList();
            return Results.Ok(new AiProfilesResponse(
                profiles,
                catalog.ResolveActionDecisionProfileId(null),
                catalog.ResolveNarrativeProfileId(null)));
        })
        .WithTags("AI")
        .RequireAuthorization()
        .RequireCors("MyrialeFrontend");
        return routes;
    }
}
