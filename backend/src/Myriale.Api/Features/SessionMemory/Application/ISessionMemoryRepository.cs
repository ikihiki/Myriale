
namespace Myriale.Api.Features.SessionMemory.Application;

public interface ISessionMemoryRepository
{
    Task<bool> SessionExistsAsync(string sessionId, string ownerId, CancellationToken cancellationToken);
    Task<bool> TurnsBelongToSessionAsync(string sessionId, IReadOnlyCollection<string> turnIds, CancellationToken cancellationToken);
    Task<SessionNote?> GetNoteAsync(string sessionId, string noteId, string ownerId, CancellationToken cancellationToken);
    Task<SessionNote?> GetNoteAsync(string noteId, CancellationToken cancellationToken);
    Task<SessionNoteProposal?> GetProposalAsync(string artifactId, string ownerId, CancellationToken cancellationToken);
    void AddNote(SessionNote note);
    void AddRevision(SessionNoteRevision revision);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
