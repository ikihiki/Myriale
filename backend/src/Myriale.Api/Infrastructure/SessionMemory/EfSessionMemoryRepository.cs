using Microsoft.EntityFrameworkCore;
using Myriale.Api.Application.SessionMemory;
using Myriale.Api.Data;

namespace Myriale.Api.Infrastructure.SessionMemory;

public sealed class EfSessionMemoryRepository(ApplicationDbContext db) : ISessionMemoryRepository
{
    public Task<bool> SessionExistsAsync(string sessionId, string ownerId, CancellationToken cancellationToken) =>
        db.Sessions.AnyAsync(session => session.Id == sessionId && session.OwnerId == ownerId, cancellationToken);

    public async Task<bool> TurnsBelongToSessionAsync(string sessionId, IReadOnlyCollection<string> turnIds, CancellationToken cancellationToken) =>
        turnIds.Count == 0 || await db.SessionTurns.CountAsync(turn => turn.SessionId == sessionId && turnIds.Contains(turn.Id), cancellationToken) == turnIds.Count;

    public Task<SessionNote?> GetNoteAsync(string sessionId, string noteId, string ownerId, CancellationToken cancellationToken) =>
        db.SessionNotes.Include(note => note.TurnReferences)
            .SingleOrDefaultAsync(note => note.Id == noteId && note.SessionId == sessionId && note.Session.OwnerId == ownerId, cancellationToken);

    public Task<SessionNote?> GetNoteAsync(string noteId, CancellationToken cancellationToken) =>
        db.SessionNotes.SingleOrDefaultAsync(note => note.Id == noteId, cancellationToken);

    public Task<SessionNoteProposal?> GetProposalAsync(string artifactId, string ownerId, CancellationToken cancellationToken) =>
        db.SessionNoteProposals.Include(proposal => proposal.Artifact)
            .SingleOrDefaultAsync(proposal => proposal.ArtifactId == artifactId && proposal.Artifact.Execution.Session.OwnerId == ownerId, cancellationToken);

    public void AddNote(SessionNote note) => db.SessionNotes.Add(note);
    public void AddRevision(SessionNoteRevision revision) => db.SessionNoteRevisions.Add(revision);
    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
