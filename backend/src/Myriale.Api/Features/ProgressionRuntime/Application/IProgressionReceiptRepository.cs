
namespace Myriale.Api.Features.ProgressionRuntime.Application;

public sealed record ClaimedProgressionReceipt(
    string Id,
    string SessionId,
    string LeaseId,
    long Revision,
    ProgressionModuleSnapshot Snapshot);

public interface IProgressionReceiptRepository
{
    Task<IReadOnlyList<string>> ListOwnedIdsForNarrativeTurnAsync(
        string ownerId,
        string narrativeTurnId,
        CancellationToken cancellationToken);

    Task<ClaimedProgressionReceipt?> TryClaimOwnedAsync(
        string ownerId,
        string receiptId,
        string leaseId,
        DateTimeOffset now,
        DateTimeOffset leaseExpiresAt,
        CancellationToken cancellationToken);

    Task<bool> CompleteAsync(string receiptId, string leaseId, long revision, string moduleTurnId, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> FailAsync(string receiptId, string leaseId, long revision, string code, string message, bool retryable, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> ReleaseAsync(string receiptId, string leaseId, long revision, DateTimeOffset now, CancellationToken cancellationToken);
}
