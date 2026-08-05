using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Features.SessionMemory.Application;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Features.SessionArtifacts.Http;

public static class SessionArtifactEndpoints
{
    public static IEndpointRouteBuilder MapSessionArtifactEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/session-artifacts").WithTags("Session Artifacts").RequireAuthorization().RequireCors("MyrialeFrontend");
        group.MapGet("/media/{imageId}", GetMediaAsync);
        group.MapPost("/images/attach", AttachImageAsync).DisableAntiforgery();
        return routes;
    }

    private static async Task<IResult> AttachImageAsync(
        [FromForm] AttachSessionImageRequest request,
        ClaimsPrincipal principal,
        AttachSessionImageUseCase useCase,
        CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (owner is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(
            owner, request.SessionId, request.ExecutionId, request.AttemptId, request.File, request.Checksum,
            request.ModerationDecision, request.ModerationMetadataJson, request.SourceTurnId, request.SourceInputId,
            request.RetainUntil), cancellationToken);
        if (result.Outcome == AttachSessionImageOutcome.Created)
        {
            var image = result.Image!;
            return Results.Created($"/api/session-artifacts/media/{image.ImageId}", new SessionImageAttachmentResponse(
                image.ImageId, image.ArtifactId, $"/api/session-artifacts/media/{image.ImageId}", image.ContentType,
                image.SizeBytes, image.Width, image.Height, image.Checksum, image.ModerationMetadataJson,
                image.CreatedAt, image.RetainUntil));
        }
        return result.Outcome switch
        {
            AttachSessionImageOutcome.NotFound => Results.NotFound(),
            AttachSessionImageOutcome.Invalid => Results.BadRequest(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!)),
            AttachSessionImageOutcome.Conflict => Results.Conflict(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!)),
            _ => throw new ArgumentOutOfRangeException(),
        };
    }

    private static async Task<IResult> GetMediaAsync(
        string imageId,
        ClaimsPrincipal principal,
        GetSessionImageMediaQuery query,
        CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (owner is null) return Results.Unauthorized();
        var media = await query.ExecuteAsync(owner, imageId, cancellationToken);
        return media is null
            ? Results.NotFound()
            : Results.Stream(media.Content, media.ContentType, enableRangeProcessing: true);
    }
}
