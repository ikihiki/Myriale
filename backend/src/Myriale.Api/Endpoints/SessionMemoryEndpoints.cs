using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Endpoints;

public static class SessionMemoryEndpoints
{
    private static readonly HashSet<string> Kinds = ["person", "location", "item", "organization", "rule"];
    private static readonly HashSet<string> CanonStatuses = ["canon", "unconfirmed", "rumor"];

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

    private static async Task<IResult> GetAsync(string sessionId, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        if (!await db.Sessions.AsNoTracking().AnyAsync(session => session.Id == sessionId && session.OwnerId == ownerId, cancellationToken))
            return Results.NotFound();

        var notes = await db.SessionNotes.AsNoTracking()
            .Include(note => note.TurnReferences)
            .Where(note => note.SessionId == sessionId)
            .OrderBy(note => note.CreatedAt)
            .ToListAsync(cancellationToken);
        var summaries = await db.SessionSummaries.AsNoTracking()
            .Where(summary => summary.SessionId == sessionId)
            .OrderBy(summary => summary.Version)
            .ToListAsync(cancellationToken);
        return Results.Ok(new SessionMemoryResponse(notes.Select(ToResponse).ToArray(), summaries.Select(ToResponse).ToArray()));
    }

    private static async Task<IResult> CreateAsync(string sessionId, UpsertSessionLorebookEntryRequest request, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        if (!await db.Sessions.AnyAsync(session => session.Id == sessionId && session.OwnerId == ownerId, cancellationToken)) return Results.NotFound();
        var validation = Validate(request);
        if (validation is not null) return validation;
        if (!await TurnsBelongToSessionAsync(sessionId, request.FirstTurnId, request.UpdatedFromTurnId, db, cancellationToken))
            return Results.BadRequest(new SessionErrorResponse("invalid_lorebook_turn", "初出Turnまたは更新元TurnがSessionに属していません。"));
        var now = DateTimeOffset.UtcNow;
        var note = new SessionNote
        {
            Id = $"LOR-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = sessionId, Kind = request.Kind,
            Title = request.DisplayName.Trim(), AliasesJson = JsonSerializer.Serialize(NormalizeAliases(request.Aliases)),
            Body = request.Content.Trim(), CanonStatus = request.CanonStatus, FirstTurnId = request.FirstTurnId,
            UpdatedFromTurnId = request.UpdatedFromTurnId, UpdateSource = "user", Revision = 1, CreatedAt = now, UpdatedAt = now,
        };
        db.SessionNotes.Add(note);
        db.SessionNoteRevisions.Add(new SessionNoteRevision { Id = $"NRV-{Guid.NewGuid():N}".ToUpperInvariant(), Note = note, NoteId = note.Id, Revision = 1, Title = note.Title, Body = note.Body, CreatedAt = now });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/sessions/{sessionId}/memory/lorebook/{note.Id}", ToResponse(note));
    }

    private static async Task<IResult> UpdateAsync(string sessionId, string noteId, UpsertSessionLorebookEntryRequest request, ClaimsPrincipal principal, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var ownerId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ownerId is null) return Results.Unauthorized();
        var note = await db.SessionNotes.Include(item => item.TurnReferences)
            .SingleOrDefaultAsync(item => item.Id == noteId && item.SessionId == sessionId && item.Session.OwnerId == ownerId, cancellationToken);
        if (note is null) return Results.NotFound();
        var validation = Validate(request);
        if (validation is not null) return validation;
        if (request.ExpectedRevision is null || request.ExpectedRevision != note.Revision)
            return Results.Conflict(new SessionErrorResponse("note_revision_conflict", "Lorebook entryが更新されています。再読み込みしてください。"));
        if (!await TurnsBelongToSessionAsync(sessionId, request.FirstTurnId, request.UpdatedFromTurnId, db, cancellationToken))
            return Results.BadRequest(new SessionErrorResponse("invalid_lorebook_turn", "初出Turnまたは更新元TurnがSessionに属していません。"));
        note.Kind = request.Kind; note.Title = request.DisplayName.Trim(); note.AliasesJson = JsonSerializer.Serialize(NormalizeAliases(request.Aliases));
        note.Body = request.Content.Trim(); note.CanonStatus = request.CanonStatus; note.FirstTurnId = request.FirstTurnId;
        note.UpdatedFromTurnId = request.UpdatedFromTurnId; note.UpdateSource = "user"; note.Revision++; note.UpdatedAt = DateTimeOffset.UtcNow;
        db.SessionNoteRevisions.Add(new SessionNoteRevision { Id = $"NRV-{Guid.NewGuid():N}".ToUpperInvariant(), Note = note, NoteId = note.Id, Revision = note.Revision, Title = note.Title, Body = note.Body, CreatedAt = note.UpdatedAt });
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToResponse(note));
    }

    private static IResult? Validate(UpsertSessionLorebookEntryRequest request)
    {
        if (!Kinds.Contains(request.Kind)) return Results.BadRequest(new SessionErrorResponse("invalid_lorebook_kind", "Lorebook種別はperson/location/item/organization/ruleから選択してください。"));
        if (!CanonStatuses.Contains(request.CanonStatus)) return Results.BadRequest(new SessionErrorResponse("invalid_canon_status", "Canon statusはcanon/unconfirmed/rumorから選択してください。"));
        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Trim().Length > 160) return Results.BadRequest(new SessionErrorResponse("invalid_lorebook_name", "表示名を160文字以内で指定してください。"));
        if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Trim().Length > 8000) return Results.BadRequest(new SessionErrorResponse("invalid_lorebook_content", "内容を8000文字以内で指定してください。"));
        if (NormalizeAliases(request.Aliases).Count > 20) return Results.BadRequest(new SessionErrorResponse("invalid_lorebook_aliases", "別名は20件以内で指定してください。"));
        return null;
    }

    private static IReadOnlyList<string> NormalizeAliases(IReadOnlyList<string>? aliases) =>
        (aliases ?? []).Select(alias => alias.Trim()).Where(alias => alias.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

    private static async Task<bool> TurnsBelongToSessionAsync(string sessionId, string? firstTurnId, string? updatedFromTurnId, ApplicationDbContext db, CancellationToken cancellationToken)
    {
        var ids = new[] { firstTurnId, updatedFromTurnId }.OfType<string>().Distinct().ToArray();
        return ids.Length == 0 || await db.SessionTurns.CountAsync(turn => turn.SessionId == sessionId && ids.Contains(turn.Id), cancellationToken) == ids.Length;
    }

    internal static SessionLorebookEntryResponse ToResponse(SessionNote note) => new(
        note.Id, note.Kind, note.Title, JsonSerializer.Deserialize<IReadOnlyList<string>>(note.AliasesJson) ?? [], note.Body,
        note.CanonStatus, note.FirstTurnId, note.UpdatedFromTurnId, note.UpdateSource, note.Revision, note.CreatedAt, note.UpdatedAt,
        note.TurnReferences.Select(reference => reference.TurnId).Order().ToArray());

    internal static SessionSummaryResponse ToResponse(SessionSummary summary) => new(
        summary.Id, summary.FromTurnId, summary.ToTurnId, summary.FromPosition, summary.ToPosition, summary.Version, summary.Confidence,
        summary.CurrentLocation, DeserializeList(summary.CharactersJson), DeserializeList(summary.ObjectivesJson), DeserializeList(summary.CluesJson),
        DeserializeList(summary.InventoryJson), DeserializeList(summary.ModuleResultsJson), summary.Body, summary.GeneratedAt);

    private static IReadOnlyList<string> DeserializeList(string json) => JsonSerializer.Deserialize<IReadOnlyList<string>>(json) ?? [];
}
