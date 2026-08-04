using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Myriale.Api.Application.SessionArtifacts;
using Myriale.Api.Application.SessionMemory;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Endpoints;

public static class SessionArtifactEndpoints
{
    public static IEndpointRouteBuilder MapSessionArtifactEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/session-artifacts").WithTags("Session Artifacts").RequireAuthorization().RequireCors("MyrialeFrontend");
        group.MapGet("/media/{imageId}", GetMediaAsync);
        group.MapPost("/images/attach", AttachImageAsync).DisableAntiforgery();
        group.MapPost("/note-proposals/{artifactId}/apply", (string artifactId, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Applied, request, principal, useCase, ct));
        group.MapPost("/note-proposals/{artifactId}/edit-apply", (string artifactId, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Applied, request, principal, useCase, ct));
        group.MapPost("/note-proposals/{artifactId}/reject", (string artifactId, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Rejected, new(0), principal, useCase, ct));
        group.MapPost("/note-proposals/{artifactId}/snooze", (string artifactId, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Snoozed, new(0), principal, useCase, ct));
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

    private static async Task<IResult> ReviewAsync(
        string artifactId, SessionNoteProposalStatus status, ReviewSessionNoteProposalRequest request,
        ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (owner is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(artifactId, owner, status, request), cancellationToken);
        return result.Outcome switch
        {
            SessionMemoryCommandOutcome.Success => Results.Ok(result.Proposal),
            SessionMemoryCommandOutcome.NotFound => Results.NotFound(),
            SessionMemoryCommandOutcome.Conflict => Results.Conflict(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!)),
            SessionMemoryCommandOutcome.Invalid => Results.BadRequest(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!)),
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
