using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.SessionMemory.Application;

public sealed class SessionMemoryQueryService(ApplicationDbContext db)
{
    public async Task<SessionMemoryResponse?> GetAsync(SessionId sessionId, AccountId ownerId, CancellationToken cancellationToken)
    {
        if (!await db.Sessions.AsNoTracking().AnyAsync(session => session.Id == sessionId && session.OwnerId == ownerId, cancellationToken))
            return null;

        var notes = (await db.SessionNotes.AsNoTracking().Include(note => note.TurnReferences)
            .Where(note => note.SessionId == sessionId).ToListAsync(cancellationToken))
            .OrderBy(note => note.CreatedAt).Select(SessionMemoryMapper.ToResponse).ToArray();
        var summaries = await db.SessionSummaries.AsNoTracking().Where(summary => summary.SessionId == sessionId)
            .OrderBy(summary => summary.Version).ToListAsync(cancellationToken);
        return new SessionMemoryResponse(notes, summaries.Select(SessionMemoryMapper.ToResponse).ToArray());
    }
}

public static class SessionMemoryMapper
{
    public static SessionLorebookEntryResponse ToResponse(SessionNote note) => new(
        note.Id, note.Kind.ToWireValue(), note.Title, JsonSerializer.Deserialize<IReadOnlyList<string>>(note.AliasesJson) ?? [], note.Body,
        note.CanonStatus.ToWireValue(), note.FirstTurnId, note.UpdatedFromTurnId, note.UpdateSource.ToWireValue(), note.Revision,
        note.CreatedAt, note.UpdatedAt, note.TurnReferences.Select(reference => reference.TurnId).OrderBy(id => id.AsPrimitive(), StringComparer.Ordinal).ToArray());

    public static SessionNoteProposalResponse ToResponse(SessionNoteProposal proposal) => new(
        proposal.ArtifactId, proposal.SourceTurnId, proposal.NoteId, proposal.ExpectedNoteRevision, proposal.ProposedTitle,
        proposal.BeforeBody, proposal.ProposedBody, proposal.Rationale, proposal.Status.ToWireValue(), proposal.CreatedAt);

    public static SessionSummaryResponse ToResponse(SessionSummary summary) => new(
        summary.Id, summary.FromTurnId, summary.ToTurnId, summary.FromPosition, summary.ToPosition, summary.Version, summary.Confidence,
        summary.CurrentLocation, DeserializeList(summary.CharactersJson), DeserializeList(summary.ObjectivesJson), DeserializeList(summary.CluesJson),
        DeserializeList(summary.InventoryJson), DeserializeList(summary.ModuleResultsJson), summary.Body, summary.GeneratedAt);

    private static IReadOnlyList<string> DeserializeList(string json) => JsonSerializer.Deserialize<IReadOnlyList<string>>(json) ?? [];
}
