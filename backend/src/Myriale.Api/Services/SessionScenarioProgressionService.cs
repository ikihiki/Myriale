using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules.Execution;

namespace Myriale.Api.Services;

public sealed class SessionScenarioProgressionService(
    ApplicationDbContext db,
    IModuleExecutionService executions,
    ILogger<SessionScenarioProgressionService> logger)
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);

    public async Task EnsureNarrativeTurnAsync(
        string ownerId,
        string narrativeTurnId,
        CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var receiptIds = await db.SessionProgressionTransitionReceipts.AsNoTracking()
            .Where(receipt => receipt.SourceSignal.NarrativeTurnId == narrativeTurnId
                && receipt.Session.OwnerId == ownerId)
            .Select(receipt => receipt.Id)
            .ToListAsync(cancellationToken);
        foreach (var receiptId in receiptIds)
            await EnsureAsync(ownerId, receiptId, cancellationToken);
    }

    public async Task EnsureAsync(string ownerId, string receiptId, CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var now = DateTimeOffset.UtcNow;
        var leaseId = $"PTL-{Guid.NewGuid():N}".ToUpperInvariant();
        var receipt = await db.SessionProgressionTransitionReceipts
            .SingleOrDefaultAsync(item => item.Id == receiptId && item.Session.OwnerId == ownerId, cancellationToken);
        if (receipt is null
            || receipt.Status == "completed"
            || !receipt.IsRetryable
            || receipt.LeaseExpiresAt is not null && receipt.LeaseExpiresAt > now)
            return;
        if (!HasCompleteSnapshot(receipt))
        {
            receipt.Status = "waiting-configuration";
            receipt.IsRetryable = false;
            receipt.ErrorCode = "module_snapshot_missing";
            receipt.ErrorMessage = "進行遷移にModule snapshotが設定されていません。";
            receipt.UpdatedAt = now;
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        receipt.Status = "pending";
        receipt.Revision++;
        receipt.AttemptCount++;
        receipt.LeaseId = leaseId;
        receipt.LeaseExpiresAt = now.Add(LeaseDuration);
        receipt.ErrorCode = null;
        receipt.ErrorMessage = null;
        receipt.UpdatedAt = now;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return;
        }

        InitializeModuleExecutionRequest request;
        try
        {
            request = new InitializeModuleExecutionRequest(
                $"scenario-transition:{receipt.Id}",
                receipt.ModuleId!,
                receipt.ModuleVersion!,
                receipt.ModuleDigest!,
                Parse(receipt.ModuleConfigurationJson!),
                Parse(receipt.ModuleContextJson!),
                receipt.ModuleRandomValueCount);
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "Stored progression Module snapshot is invalid for {ReceiptId}", receiptId);
            await MarkFailedAsync(receiptId, leaseId, "module_snapshot_invalid", "進行遷移のModule snapshotを読み込めません。", false, CancellationToken.None);
            return;
        }

        ModuleExecutionServiceResult result;
        try
        {
            result = await executions.InitializeScenarioSessionTurnAsync(ownerId, receipt.SessionId, request, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await ReleaseClaimAsync(receiptId, leaseId);
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Progression Module initialization failed for {ReceiptId}", receiptId);
            await MarkFailedAsync(receiptId, leaseId, "module_initialization_failed", "進行用Module Turnの開始に失敗しました。", true, CancellationToken.None);
            return;
        }

        if (result.Response is null || result.SessionTurnId is null)
        {
            var code = result.Error?.Code ?? "module_initialization_failed";
            var message = result.Error?.Message ?? "進行用Module Turnの開始に失敗しました。";
            var retryable = result.StatusCode >= 500 || code is "request_in_progress" or "package_unavailable";
            await MarkFailedAsync(receiptId, leaseId, code, message, retryable, cancellationToken);
            return;
        }

        db.ChangeTracker.Clear();
        var completedAt = DateTimeOffset.UtcNow;
        var updated = await db.SessionProgressionTransitionReceipts
            .Where(item => item.Id == receiptId && item.LeaseId == leaseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, "completed")
                .SetProperty(item => item.IsRetryable, false)
                .SetProperty(item => item.ModuleTurnId, result.SessionTurnId)
                .SetProperty(item => item.LeaseId, (string?)null)
                .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(item => item.ErrorCode, (string?)null)
                .SetProperty(item => item.ErrorMessage, (string?)null)
                .SetProperty(item => item.UpdatedAt, completedAt)
                .SetProperty(item => item.CompletedAt, completedAt), cancellationToken);
        if (updated == 0)
            logger.LogInformation("Progression receipt {ReceiptId} was completed by another worker.", receiptId);
    }

    private static bool HasCompleteSnapshot(SessionProgressionTransitionReceipt receipt) =>
        !string.IsNullOrWhiteSpace(receipt.ModuleId)
        && !string.IsNullOrWhiteSpace(receipt.ModuleVersion)
        && receipt.ModuleDigest?.Length == 64
        && !string.IsNullOrWhiteSpace(receipt.ModuleConfigurationJson)
        && !string.IsNullOrWhiteSpace(receipt.ModuleContextJson)
        && receipt.ModuleRandomValueCount >= 0;

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private Task<int> MarkFailedAsync(
        string receiptId,
        string leaseId,
        string code,
        string message,
        bool retryable,
        CancellationToken cancellationToken) =>
        db.SessionProgressionTransitionReceipts
            .Where(item => item.Id == receiptId && item.LeaseId == leaseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, "failed")
                .SetProperty(item => item.IsRetryable, retryable)
                .SetProperty(item => item.LeaseId, (string?)null)
                .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(item => item.ErrorCode, code)
                .SetProperty(item => item.ErrorMessage, message)
                .SetProperty(item => item.UpdatedAt, DateTimeOffset.UtcNow), cancellationToken);

    private Task<int> ReleaseClaimAsync(string receiptId, string leaseId) =>
        db.SessionProgressionTransitionReceipts
            .Where(item => item.Id == receiptId && item.LeaseId == leaseId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.Status, "pending")
                .SetProperty(item => item.LeaseId, (string?)null)
                .SetProperty(item => item.LeaseExpiresAt, (DateTimeOffset?)null)
                .SetProperty(item => item.UpdatedAt, DateTimeOffset.UtcNow), CancellationToken.None);
}
