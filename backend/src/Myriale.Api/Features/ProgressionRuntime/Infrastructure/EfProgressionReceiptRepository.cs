using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ProgressionRuntime.Application;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Features.ProgressionRuntime.Infrastructure;

public sealed class EfProgressionReceiptRepository(ApplicationDbContext db) : IProgressionReceiptRepository
{
    public async Task<IReadOnlyList<string>> ListOwnedIdsForNarrativeTurnAsync(
        string ownerId,
        string narrativeTurnId,
        CancellationToken cancellationToken) =>
        await db.SessionProgressionTransitionReceipts.AsNoTracking()
            .Where(receipt => receipt.SourceSignal.NarrativeTurnId == narrativeTurnId && receipt.Session.OwnerId == ownerId)
            .Select(receipt => receipt.Id)
            .ToListAsync(cancellationToken);

    public async Task<ClaimedProgressionReceipt?> TryClaimOwnedAsync(
        string ownerId,
        string receiptId,
        string leaseId,
        DateTimeOffset now,
        DateTimeOffset leaseExpiresAt,
        CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var candidate = await db.SessionProgressionTransitionReceipts.AsNoTracking()
            .Where(item => item.Id == receiptId && item.Session.OwnerId == ownerId)
            .Select(item => new
            {
                item.Id, item.SessionId, item.Revision, item.Status, item.IsRetryable, item.LeaseExpiresAt,
                item.ModuleId, item.ModuleVersion, item.ModuleDigest, item.ModuleConfigurationJson,
                item.ModuleContextJson, item.ModuleRandomValueCount,
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (candidate is null
            || candidate.Status == ProgressionReceiptStatus.Completed
            || !candidate.IsRetryable
            || candidate.LeaseExpiresAt is not null && candidate.LeaseExpiresAt > now)
            return null;

        var snapshot = candidate.ModuleId is null || candidate.ModuleVersion is null || candidate.ModuleDigest is null
            || candidate.ModuleConfigurationJson is null || candidate.ModuleContextJson is null
            ? null
            : new ProgressionModuleSnapshot(candidate.ModuleId, candidate.ModuleVersion, candidate.ModuleDigest,
                candidate.ModuleConfigurationJson, candidate.ModuleContextJson, candidate.ModuleRandomValueCount);
        if (snapshot is not { IsComplete: true })
        {
            await db.SessionProgressionTransitionReceipts
                .Where(item => item.Id == receiptId && item.Revision == candidate.Revision)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(item => item.Status, ProgressionReceiptStatus.WaitingConfiguration)
                    .SetProperty(item => item.IsRetryable, false)
                    .SetProperty(item => item.LeaseId, (string?)null)
                    .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                    .SetProperty(item => item.ErrorCode, SessionProgressionTransitionReceipt.MissingSnapshotErrorCode)
                    .SetProperty(item => item.ErrorMessage, SessionProgressionTransitionReceipt.MissingSnapshotErrorMessage)
                    .SetProperty(item => item.UpdatedAt, now)
                    .SetProperty(item => item.Revision, item => item.Revision + 1), cancellationToken);
            return null;
        }

        var updated = await db.SessionProgressionTransitionReceipts
            .Where(item => item.Id == receiptId && item.Revision == candidate.Revision)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, ProgressionReceiptStatus.Pending)
                .SetProperty(item => item.Revision, item => item.Revision + 1)
                .SetProperty(item => item.AttemptCount, item => item.AttemptCount + 1)
                .SetProperty(item => item.LeaseId, leaseId)
                .SetProperty(item => item.LeaseExpiresAt, leaseExpiresAt)
                .SetProperty(item => item.ErrorCode, (string?)null)
                .SetProperty(item => item.ErrorMessage, (string?)null)
                .SetProperty(item => item.UpdatedAt, now), cancellationToken);
        return updated == 1
            ? new(candidate.Id, candidate.SessionId, leaseId, candidate.Revision + 1, snapshot)
            : null;
    }

    public async Task<bool> CompleteAsync(string receiptId, string leaseId, long revision, string moduleTurnId, DateTimeOffset now, CancellationToken cancellationToken) =>
        await Fenced(receiptId, leaseId, revision)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, ProgressionReceiptStatus.Completed)
                .SetProperty(item => item.IsRetryable, false)
                .SetProperty(item => item.ModuleTurnId, moduleTurnId)
                .SetProperty(item => item.LeaseId, (string?)null)
                .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(item => item.ErrorCode, (string?)null)
                .SetProperty(item => item.ErrorMessage, (string?)null)
                .SetProperty(item => item.UpdatedAt, now)
                .SetProperty(item => item.CompletedAt, now)
                .SetProperty(item => item.Revision, item => item.Revision + 1), cancellationToken) == 1;

    public async Task<bool> FailAsync(string receiptId, string leaseId, long revision, string code, string message, bool retryable, DateTimeOffset now, CancellationToken cancellationToken) =>
        await Fenced(receiptId, leaseId, revision)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, ProgressionReceiptStatus.Failed)
                .SetProperty(item => item.IsRetryable, retryable)
                .SetProperty(item => item.LeaseId, (string?)null)
                .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(item => item.ErrorCode, code)
                .SetProperty(item => item.ErrorMessage, message)
                .SetProperty(item => item.UpdatedAt, now)
                .SetProperty(item => item.Revision, item => item.Revision + 1), cancellationToken) == 1;

    public async Task<bool> ReleaseAsync(string receiptId, string leaseId, long revision, DateTimeOffset now, CancellationToken cancellationToken) =>
        await Fenced(receiptId, leaseId, revision)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, ProgressionReceiptStatus.Pending)
                .SetProperty(item => item.LeaseId, (string?)null)
                .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(item => item.UpdatedAt, now)
                .SetProperty(item => item.Revision, item => item.Revision + 1), cancellationToken) == 1;

    private IQueryable<SessionProgressionTransitionReceipt> Fenced(string receiptId, string leaseId, long revision) =>
        db.SessionProgressionTransitionReceipts
            .Where(item => item.Id == receiptId && item.LeaseId == leaseId && item.Revision == revision);
}
