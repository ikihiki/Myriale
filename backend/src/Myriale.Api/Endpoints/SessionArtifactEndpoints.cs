using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.SessionMemory;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

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
        ApplicationDbContext db,
        ISessionObjectStorage storage,
        SessionImageValidator validator,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (owner is null) return Results.Unauthorized();
        var execution = await db.SessionExecutions
            .Include(item => item.Attempts)
            .Include(item => item.Artifacts)
            .SingleOrDefaultAsync(item => item.Id == request.ExecutionId
                && item.SessionId == request.SessionId
                && item.Session.OwnerId == owner, cancellationToken);
        if (execution is null) return Results.NotFound();
        if (execution.Kind != SessionExecutionKinds.Image)
            return Results.BadRequest(new SessionErrorResponse("image_execution_required", "画像Executionを指定してください。"));
        if (execution.Artifacts.Any(item => item.Kind == "image"))
            return Results.Conflict(new SessionErrorResponse("image_already_attached", "このExecutionには画像が添付済みです。"));
        var attempt = execution.Attempts.SingleOrDefault(item => item.Id == request.AttemptId);
        if (attempt is null)
            return Results.BadRequest(new SessionErrorResponse("image_attempt_invalid", "Executionに属するAttemptを指定してください。"));

        ValidatedSessionImage validated;
        using (var validationActivity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.artifact.validate"))
        {
            validationActivity?.SetTag("myriale.execution.kind", execution.Kind);
            validationActivity?.SetTag("myriale.artifact.kind", "image");
            try
            {
                validated = await validator.ValidateAsync(request.File, request.Checksum, request.ModerationDecision, request.ModerationMetadataJson, cancellationToken);
            }
            catch (SessionImageValidationException exception)
            {
                validationActivity?.SetStatus(ActivityStatusCode.Error, exception.Code);
                return Results.BadRequest(new SessionErrorResponse(exception.Code, exception.Message));
            }
        }

        var now = DateTimeOffset.UtcNow;
        var artifactId = $"ART-{Guid.NewGuid():N}".ToUpperInvariant();
        var imageId = $"IMG-{Guid.NewGuid():N}".ToUpperInvariant();
        var storageKey = $"sessions/{request.SessionId}/images/{artifactId}.png";
        using var persistActivity = SessionExecutionTelemetry.ActivitySource.StartActivity("session.artifact.persist");
        persistActivity?.SetTag("myriale.execution.kind", execution.Kind);
        persistActivity?.SetTag("myriale.artifact.kind", "image");
        using var logScope = loggerFactory.CreateLogger("Myriale.SessionArtifacts").BeginScope(new Dictionary<string, object?>
        {
            ["SessionId"] = request.SessionId,
            ["ExecutionId"] = request.ExecutionId,
            ["AttemptId"] = request.AttemptId,
            ["ArtifactId"] = artifactId,
            ["TraceId"] = persistActivity?.TraceId.ToString(),
            ["SpanId"] = persistActivity?.SpanId.ToString(),
        });
        await using var content = new MemoryStream(validated.Content, writable: false);
        await storage.PutAsync(storageKey, content, validated.ContentType, cancellationToken);
        try
        {
            var artifact = new SessionArtifact
            {
                Id = artifactId,
                SessionId = request.SessionId,
                ExecutionId = execution.Id,
                AttemptId = attempt.Id,
                Kind = "image",
                Status = "committed",
                ContentType = validated.ContentType,
                StorageKey = storageKey,
                Checksum = validated.Checksum,
                MetadataJson = validated.ModerationMetadataJson,
                CreatedAt = now,
                ValidatedAt = now,
                CommittedAt = now,
            };
            var image = new SessionImage
            {
                Id = imageId,
                SessionId = request.SessionId,
                SourceTurnId = request.SourceTurnId,
                SourceInputId = request.SourceInputId,
                ArtifactId = artifactId,
                StorageKey = storageKey,
                ContentType = validated.ContentType,
                SizeBytes = validated.SizeBytes,
                Width = validated.Width,
                Height = validated.Height,
                Checksum = validated.Checksum,
                ModerationMetadataJson = validated.ModerationMetadataJson,
                CreatedAt = now,
                RetainUntil = request.RetainUntil,
            };
            db.SessionArtifacts.Add(artifact);
            db.SessionImages.Add(image);
            await db.SaveChangesAsync(cancellationToken);
            SessionExecutionTelemetry.ArtifactCommitted.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, "committed"));
            SessionExecutionTelemetry.ArtifactSize.Record(validated.SizeBytes, SessionExecutionTelemetry.Tags(execution.Kind, "committed"));
            return Results.Created($"/api/session-artifacts/media/{imageId}", new SessionImageAttachmentResponse(
                imageId, artifactId, $"/api/session-artifacts/media/{imageId}", validated.ContentType, validated.SizeBytes,
                validated.Width, validated.Height, validated.Checksum, validated.ModerationMetadataJson, now, request.RetainUntil));
        }
        catch
        {
            await storage.DeleteAsync(storageKey, CancellationToken.None);
            throw;
        }
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

    private static async Task<IResult> GetMediaAsync(string imageId, ClaimsPrincipal principal, ApplicationDbContext db, ISessionObjectStorage storage, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        var image = await db.SessionImages.AsNoTracking().SingleOrDefaultAsync(item => item.Id == imageId && item.Artifact.Execution.Session.OwnerId == owner, cancellationToken);
        if (image is null) return Results.NotFound();
        var stored = await storage.OpenReadAsync(image.StorageKey, cancellationToken);
        return stored is null ? Results.NotFound() : Results.Stream(stored.Content, stored.ContentType, enableRangeProcessing: true);
    }
}
