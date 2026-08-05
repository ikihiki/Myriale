using System.Security.Claims;
using Myriale.Api.Features.SessionMemory.Application;

namespace Myriale.Api.Features.SessionMemory.Http;

public static class SessionMemoryEndpoints
{
    public static IEndpointRouteBuilder MapSessionMemoryEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/sessions/{sessionId}/memory")
            .WithTags("Session Memory")
            .RequireAuthorization()
            .RequireCors("MyrialeFrontend");
        group.MapGet("/", GetAsync);
        group.MapPost("/lorebook", CreateAsync);
        group.MapPut("/lorebook/{noteId}", UpdateAsync);
        var artifactGroup = routes.MapGroup("/api/session-artifacts")
            .WithTags("Session Artifacts")
            .RequireAuthorization()
            .RequireCors("MyrialeFrontend");
        artifactGroup.MapPost("/note-proposals/{artifactId}/apply", (SessionArtifactId artifactId, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Applied, request, principal, useCase, ct));
        artifactGroup.MapPost("/note-proposals/{artifactId}/edit-apply", (SessionArtifactId artifactId, ReviewSessionNoteProposalRequest request, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Applied, request, principal, useCase, ct));
        artifactGroup.MapPost("/note-proposals/{artifactId}/reject", (SessionArtifactId artifactId, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Rejected, new(0), principal, useCase, ct));
        artifactGroup.MapPost("/note-proposals/{artifactId}/snooze", (SessionArtifactId artifactId, ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken ct) => ReviewAsync(artifactId, SessionNoteProposalStatus.Snoozed, new(0), principal, useCase, ct));
        return routes;
    }

    private static async Task<IResult> GetAsync(
        SessionId sessionId, ClaimsPrincipal principal, SessionMemoryQueryService queries, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var memory = await queries.GetAsync(sessionId, new AccountId(ownerId), cancellationToken);
        return memory is null ? Results.NotFound() : Results.Ok(memory);
    }

    private static async Task<IResult> CreateAsync(
        SessionId sessionId, UpsertSessionLorebookEntryRequest request, ClaimsPrincipal principal,
        CreateSessionNoteUseCase useCase, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(sessionId, new AccountId(ownerId), request), cancellationToken);
        return result.Outcome switch
        {
            SessionMemoryCommandOutcome.Success => Results.Created($"/api/sessions/{sessionId}/memory/lorebook/{result.Note!.Id}", result.Note),
            SessionMemoryCommandOutcome.NotFound => Results.NotFound(),
            SessionMemoryCommandOutcome.Invalid => Error(result, Results.BadRequest),
            SessionMemoryCommandOutcome.Conflict => Error(result, Results.Conflict),
            _ => throw new ArgumentOutOfRangeException(),
        };
    }

    private static async Task<IResult> UpdateAsync(
        SessionId sessionId, SessionNoteId noteId, UpsertSessionLorebookEntryRequest request, ClaimsPrincipal principal,
        UpdateSessionNoteUseCase useCase, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(sessionId, noteId, new AccountId(ownerId), request), cancellationToken);
        return result.Outcome switch
        {
            SessionMemoryCommandOutcome.Success => Results.Ok(result.Note),
            SessionMemoryCommandOutcome.NotFound => Results.NotFound(),
            SessionMemoryCommandOutcome.Invalid => Error(result, Results.BadRequest),
            SessionMemoryCommandOutcome.Conflict => Error(result, Results.Conflict),
            _ => throw new ArgumentOutOfRangeException(),
        };
    }

    private static async Task<IResult> ReviewAsync(
        SessionArtifactId artifactId, SessionNoteProposalStatus status, ReviewSessionNoteProposalRequest request,
        ClaimsPrincipal principal, ReviewSessionNoteProposalUseCase useCase, CancellationToken cancellationToken)
    {
        var owner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (owner is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(artifactId, new AccountId(owner), status, request), cancellationToken);
        return result.Outcome switch
        {
            SessionMemoryCommandOutcome.Success => Results.Ok(result.Proposal),
            SessionMemoryCommandOutcome.NotFound => Results.NotFound(),
            SessionMemoryCommandOutcome.Conflict => Results.Conflict(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!)),
            SessionMemoryCommandOutcome.Invalid => Results.BadRequest(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!)),
            _ => throw new ArgumentOutOfRangeException(),
        };
    }

    private static IResult Error(SessionMemoryCommandResult result, Func<object?, IResult> factory) =>
        factory(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!));
}
