
namespace Myriale.Api.Features.SessionMemory.Application;

public interface ISessionMemoryRepository
{
    Task<bool> SessionExistsAsync(SessionId sessionId, AccountId ownerId, CancellationToken cancellationToken);
    Task<bool> TurnsBelongToSessionAsync(SessionId sessionId, IReadOnlyCollection<SessionTurnId> turnIds, CancellationToken cancellationToken);
    Task<SessionNote?> GetNoteAsync(SessionId sessionId, SessionNoteId noteId, AccountId ownerId, CancellationToken cancellationToken);
    Task<SessionNote?> GetNoteAsync(SessionNoteId noteId, CancellationToken cancellationToken);
    Task<SessionNoteProposal?> GetProposalAsync(SessionArtifactId artifactId, AccountId ownerId, CancellationToken cancellationToken);
    void AddNote(SessionNote note);
    void AddRevision(SessionNoteRevision revision);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
