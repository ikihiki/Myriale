using System.Security.Claims;
using Myriale.Api.Application.SessionMemory;
using Myriale.Api.Contracts;

namespace Myriale.Api.Endpoints;

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
        return routes;
    }

    private static async Task<IResult> GetAsync(
        string sessionId, ClaimsPrincipal principal, SessionMemoryQueryService queries, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var memory = await queries.GetAsync(sessionId, ownerId, cancellationToken);
        return memory is null ? Results.NotFound() : Results.Ok(memory);
    }

    private static async Task<IResult> CreateAsync(
        string sessionId, UpsertSessionLorebookEntryRequest request, ClaimsPrincipal principal,
        CreateSessionNoteUseCase useCase, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(sessionId, ownerId, request), cancellationToken);
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
        string sessionId, string noteId, UpsertSessionLorebookEntryRequest request, ClaimsPrincipal principal,
        UpdateSessionNoteUseCase useCase, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var result = await useCase.ExecuteAsync(new(sessionId, noteId, ownerId, request), cancellationToken);
        return result.Outcome switch
        {
            SessionMemoryCommandOutcome.Success => Results.Ok(result.Note),
            SessionMemoryCommandOutcome.NotFound => Results.NotFound(),
            SessionMemoryCommandOutcome.Invalid => Error(result, Results.BadRequest),
            SessionMemoryCommandOutcome.Conflict => Error(result, Results.Conflict),
            _ => throw new ArgumentOutOfRangeException(),
        };
    }

    private static IResult Error(SessionMemoryCommandResult result, Func<object?, IResult> factory) =>
        factory(new SessionErrorResponse(result.ErrorCode!, result.ErrorMessage!));
}
