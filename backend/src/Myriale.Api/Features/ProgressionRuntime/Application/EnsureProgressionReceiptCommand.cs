using System.Text.Json;
using Myriale.Api.Features.ModuleExecutions.Application.Ports;

using Myriale.Api.Features.ProgressionRuntime.Application.Ports;

namespace Myriale.Api.Features.ProgressionRuntime.Application;

public sealed class EnsureProgressionReceiptCommand(
    IProgressionReceiptRepository repository,
    IModuleExecutionInitializer executions,
    TimeProvider timeProvider,
    ILogger<EnsureProgressionReceiptCommand> logger) : IProgressionReceiptCommand
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);

    public async Task ExecuteForNarrativeTurnAsync(AccountId ownerId, SessionTurnId narrativeTurnId, CancellationToken cancellationToken)
    {
        var receiptIds = await repository.ListOwnedIdsForNarrativeTurnAsync(ownerId, narrativeTurnId, cancellationToken);
        foreach (var receiptId in receiptIds)
            await ExecuteAsync(ownerId, receiptId, cancellationToken);
    }

    public async Task ExecuteAsync(AccountId ownerId, SessionProgressionTransitionReceiptId receiptId, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var leaseId = $"PTL-{Guid.NewGuid():N}".ToUpperInvariant();
        var claim = await repository.TryClaimOwnedAsync(ownerId, receiptId, leaseId, now, now.Add(LeaseDuration), cancellationToken);
        if (claim is null) return;

        InitializeModuleExecutionRequest request;
        try
        {
            request = new InitializeModuleExecutionRequest(
                $"scenario-transition:{claim.Id}",
                claim.Snapshot.ModuleId,
                claim.Snapshot.ModuleVersion,
                claim.Snapshot.ModuleDigest,
                Parse(claim.Snapshot.ConfigurationJson),
                Parse(claim.Snapshot.ContextJson),
                claim.Snapshot.RandomValueCount);
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "Stored progression Module snapshot is invalid for {ReceiptId}", receiptId);
            await repository.FailAsync(receiptId, leaseId, claim.Revision, "module_snapshot_invalid", "進行遷移のModule snapshotを読み込めません。", false, timeProvider.GetUtcNow(), CancellationToken.None);
            return;
        }

        ModuleExecutionInitializationResult result;
        try
        {
            result = await executions.InitializeSessionTurnAsync(ownerId, claim.SessionId, request, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await repository.ReleaseAsync(receiptId, leaseId, claim.Revision, timeProvider.GetUtcNow(), CancellationToken.None);
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Progression Module initialization failed for {ReceiptId}", receiptId);
            await repository.FailAsync(receiptId, leaseId, claim.Revision, "module_initialization_failed", "進行用Module Turnの開始に失敗しました。", true, timeProvider.GetUtcNow(), CancellationToken.None);
            return;
        }

        if (result.ExecutionId is null || result.SessionTurnId is null)
        {
            var code = result.ErrorCode ?? "module_initialization_failed";
            var message = result.ErrorMessage ?? "進行用Module Turnの開始に失敗しました。";
            var retryable = result.Outcome == ModuleExecutionInitializationOutcome.Unavailable || code is "request_in_progress" or "package_unavailable";
            await repository.FailAsync(receiptId, leaseId, claim.Revision, code, message, retryable, timeProvider.GetUtcNow(), cancellationToken);
            return;
        }

        if (!await repository.CompleteAsync(receiptId, leaseId, claim.Revision, result.SessionTurnId.Value, timeProvider.GetUtcNow(), cancellationToken))
            logger.LogInformation("Progression receipt {ReceiptId} rejected completion from a stale lease.", receiptId);
    }

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
