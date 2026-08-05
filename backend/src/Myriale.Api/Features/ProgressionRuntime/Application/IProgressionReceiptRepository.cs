
namespace Myriale.Api.Features.ProgressionRuntime.Application;

public sealed record ClaimedProgressionReceipt(
    SessionProgressionTransitionReceiptId Id,
    SessionId SessionId,
    string LeaseId,
    long Revision,
    ProgressionModuleSnapshot Snapshot);

public interface IProgressionReceiptRepository
{
    Task<IReadOnlyList<SessionProgressionTransitionReceiptId>> ListOwnedIdsForNarrativeTurnAsync(
        AccountId ownerId,
        SessionTurnId narrativeTurnId,
        CancellationToken cancellationToken);

    Task<ClaimedProgressionReceipt?> TryClaimOwnedAsync(
        AccountId ownerId,
        SessionProgressionTransitionReceiptId receiptId,
        string leaseId,
        DateTimeOffset now,
        DateTimeOffset leaseExpiresAt,
        CancellationToken cancellationToken);

    Task<bool> CompleteAsync(SessionProgressionTransitionReceiptId receiptId, string leaseId, long revision, SessionTurnId moduleTurnId, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> FailAsync(SessionProgressionTransitionReceiptId receiptId, string leaseId, long revision, string code, string message, bool retryable, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> ReleaseAsync(SessionProgressionTransitionReceiptId receiptId, string leaseId, long revision, DateTimeOffset now, CancellationToken cancellationToken);
}
