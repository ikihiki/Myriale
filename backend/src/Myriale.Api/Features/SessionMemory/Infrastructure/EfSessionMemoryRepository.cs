using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.SessionMemory.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.SessionMemory.Infrastructure;

public sealed class EfSessionMemoryRepository(ApplicationDbContext db) : ISessionMemoryRepository
{
    public Task<bool> SessionExistsAsync(SessionId sessionId, AccountId ownerId, CancellationToken cancellationToken) =>
        db.Sessions.AnyAsync(session => session.Id == sessionId && session.OwnerId == ownerId, cancellationToken);

    public async Task<bool> TurnsBelongToSessionAsync(SessionId sessionId, IReadOnlyCollection<SessionTurnId> turnIds, CancellationToken cancellationToken) =>
        turnIds.Count == 0 || await db.SessionTurns.CountAsync(turn => turn.SessionId == sessionId && turnIds.Contains(turn.Id), cancellationToken) == turnIds.Count;

    public Task<SessionNote?> GetNoteAsync(SessionId sessionId, SessionNoteId noteId, AccountId ownerId, CancellationToken cancellationToken) =>
        db.SessionNotes.Include(note => note.TurnReferences)
            .SingleOrDefaultAsync(note => note.Id == noteId && note.SessionId == sessionId && note.Session.OwnerId == ownerId, cancellationToken);

    public Task<SessionNote?> GetNoteAsync(SessionNoteId noteId, CancellationToken cancellationToken) =>
        db.SessionNotes.SingleOrDefaultAsync(note => note.Id == noteId, cancellationToken);

    public Task<SessionNoteProposal?> GetProposalAsync(SessionArtifactId artifactId, AccountId ownerId, CancellationToken cancellationToken) =>
        db.SessionNoteProposals.SingleOrDefaultAsync(
            proposal => proposal.ArtifactId == artifactId
                && db.Sessions.Any(session => session.Id == proposal.SessionId && session.OwnerId == ownerId),
            cancellationToken);

    public void AddNote(SessionNote note) => db.SessionNotes.Add(note);
    public void AddRevision(SessionNoteRevision revision) => db.SessionNoteRevisions.Add(revision);
    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
