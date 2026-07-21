using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
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
        group.MapPost("/note-proposals/{artifactId}/apply", (string artifactId, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken ct) => ReviewAsync(artifactId, "applied", request, principal, db, ct));
        group.MapPost("/note-proposals/{artifactId}/edit-apply", (string artifactId, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken ct) => ReviewAsync(artifactId, "applied", request, principal, db, ct));
        group.MapPost("/note-proposals/{artifactId}/reject", (string artifactId, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken ct) => ReviewAsync(artifactId, "rejected", new(0), principal, db, ct));
        group.MapPost("/note-proposals/{artifactId}/snooze", (string artifactId, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken ct) => ReviewAsync(artifactId, "snoozed", new(0), principal, db, ct));
        return routes;
    }

    private static async Task<IResult> ReviewAsync(string artifactId, string status, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        var proposal = await db.SessionNoteProposals.Include(item => item.Artifact).SingleOrDefaultAsync(item => item.ArtifactId == artifactId && item.Artifact.Execution.Session.OwnerId == owner, cancellationToken);
        if (proposal is null) return Results.NotFound();
        if (proposal.Status != "pending" && proposal.Status != "snoozed") return Results.Ok(ToResponse(proposal));
        if (status == "applied")
        {
            SessionNote note;
            if (proposal.NoteId is null)
            {
                if (request.ExpectedNoteRevision != 0) return Results.Conflict(new SessionErrorResponse("note_revision_conflict", "ノートが更新されています。"));
                note = new SessionNote { Id = $"NOT-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = proposal.SessionId, Revision = 1, Title = request.Title?.Trim() ?? proposal.ProposedTitle, Body = request.Body?.Trim() ?? proposal.ProposedBody, CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
                db.SessionNotes.Add(note); proposal.NoteId = note.Id;
            }
            else
            {
                note = await db.SessionNotes.SingleAsync(item => item.Id == proposal.NoteId, cancellationToken);
                if (note.Revision != request.ExpectedNoteRevision || note.Revision != proposal.ExpectedNoteRevision)
                    return Results.Conflict(new SessionErrorResponse("note_revision_conflict", "ノートが更新されています。差分を再確認してください。"));
                note.Revision++; note.Title = request.Title?.Trim() ?? proposal.ProposedTitle; note.Body = request.Body?.Trim() ?? proposal.ProposedBody; note.UpdatedAt = DateTimeOffset.UtcNow;
            }
            db.SessionNoteRevisions.Add(new SessionNoteRevision { Id = $"NRV-{Guid.NewGuid():N}".ToUpperInvariant(), Note = note, NoteId = note.Id, Revision = note.Revision, Title = note.Title, Body = note.Body, SourceArtifactId = proposal.ArtifactId, CreatedAt = DateTimeOffset.UtcNow });
        }
        proposal.Status = status; proposal.ReviewedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToResponse(proposal));
    }

    private static SessionNoteProposalResponse ToResponse(SessionNoteProposal proposal) => new(proposal.ArtifactId, proposal.SourceTurnId, proposal.NoteId, proposal.ExpectedNoteRevision, proposal.ProposedTitle, proposal.BeforeBody, proposal.ProposedBody, proposal.Rationale, proposal.Status, proposal.CreatedAt);

    private static async Task<IResult> GetMediaAsync(string imageId, ClaimsPrincipal principal, ApplicationDbContext db, ISessionObjectStorage storage, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier); if (owner is null) return Results.Unauthorized();
        var image = await db.SessionImages.AsNoTracking().SingleOrDefaultAsync(item => item.Id == imageId && item.Artifact.Execution.Session.OwnerId == owner, cancellationToken);
        if (image is null) return Results.NotFound();
        var stored = await storage.OpenReadAsync(image.StorageKey, cancellationToken);
        return stored is null ? Results.NotFound() : Results.Stream(stored.Content, stored.ContentType, enableRangeProcessing: true);
    }
}
