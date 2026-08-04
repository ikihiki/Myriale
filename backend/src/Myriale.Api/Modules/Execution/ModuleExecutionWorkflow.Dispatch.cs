using System.Buffers;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Application.ModuleExecutions;
using Myriale.Api.Data;
using Myriale.Api.Modules.Runtime;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Execution;

internal sealed partial class ModuleExecutionWorkflow
{
    public async Task<ModuleExecutionResult> DispatchAsync(
        string ownerId,
        string executionId,
        DispatchModuleExecutionRequest request,
        CancellationToken cancellationToken)
    {
        return await DispatchCoreAsync(ownerId, executionId, request, cancellationToken);
    }

    private async Task<ModuleExecutionResult> DispatchCoreAsync(
        string ownerId,
        string executionId,
        DispatchModuleExecutionRequest request,
        CancellationToken cancellationToken)
    {
            var inputError = ValidateCommon(request.RequestId, 0);
            if (inputError is not null) return inputError;
            if (request.ExpectedRevision < 0 || request.Action.ValueKind == JsonValueKind.Undefined)
                return BadRequest("invalid_request", "ExpectedRevisionとactionを確認してください。");

            var execution = await db.ModuleExecutions
                .SingleOrDefaultAsync(item => item.Id == executionId && item.OwnerId == ownerId, cancellationToken);
            if (execution is null) return new ModuleExecutionResult(ModuleExecutionOutcome.NotFound);
            var randomValueCount = ResolveActionRandomValueCount(execution, request.Action);
            if (randomValueCount < 0 || randomValueCount > _options.MaxRandomValues)
                return BadRequest("invalid_action_random_value_count", "Moduleが要求するホスト乱数の個数が範囲外です。");

            if (!ModuleRequestFingerprint.TryCreate(writer =>
            {
                writer.WriteStartObject();
                writer.WriteString("operation", "dispatch");
                writer.WriteString("executionId", executionId);
                writer.WriteNumber("expectedRevision", request.ExpectedRevision);
                writer.WritePropertyName("action");
                ModuleRequestFingerprint.WriteCanonical(writer, request.Action);
                writer.WriteEndObject();
            }, out var payloadHash))
                return BadRequest("invalid_json", "actionのJSONを正規化できません。");
            var existing = await db.ModuleExecutionRequests.AsNoTracking()
                .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
            if (existing is not null)
            {
                var replay = Replay(existing, payloadHash);
                return existing.Status == ModuleExecutionRequestStatus.Pending && replay.Error?.Code == "request_in_progress"
                    ? await ResumeDispatchAsync(ownerId, existing.Id, payloadHash, cancellationToken)
                    : replay;
            }

            if (execution.Status != ModuleExecutionStatus.Active)
            {
                var inactive = Conflict("execution_not_active", "アクティブではないモジュール実行にはactionを送信できません。", execution);
                return await StoreRejectedReceiptAsync(ownerId, execution, request, payloadHash, inactive, cancellationToken);
            }
            if (execution.Revision != request.ExpectedRevision)
            {
                var conflict = Conflict("revision_conflict", "モジュール実行のrevisionが更新されています。", execution);
                return await StoreRejectedReceiptAsync(ownerId, execution, request, payloadHash, conflict, cancellationToken);
            }

            long? expectedSessionRevision = null;
            if (execution.SessionTurnId is not null)
            {
                expectedSessionRevision = await db.SessionTurns.AsNoTracking()
                    .Where(turn => turn.Id == execution.SessionTurnId)
                    .Select(turn => turn.Session.State.Revision)
                    .SingleAsync(cancellationToken);
            }
            var randomValues = GenerateRandomValues(randomValueCount);
            var receipt = ModuleExecutionRequest.CreateDispatch(
                ownerId, execution.Id, request.RequestId, payloadHash, request.ExpectedRevision,
                expectedSessionRevision, request.Action, randomValues, _json, DateTimeOffset.UtcNow);
            db.ModuleExecutionRequests.Add(receipt);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                db.ChangeTracker.Clear();
                var winner = await db.ModuleExecutionRequests.AsNoTracking()
                    .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
                if (winner is null) throw;
                var replay = Replay(winner, payloadHash);
                return winner.Status == ModuleExecutionRequestStatus.Pending && replay.Error?.Code == "request_in_progress"
                    ? await ResumeDispatchAsync(ownerId, winner.Id, payloadHash, cancellationToken)
                    : replay;
            }

            return await RunDispatchAsync(execution, receipt, randomValues, cancellationToken);
    }


    private async Task<ModuleExecutionResult> ResumeDispatchAsync(
        string ownerId,
        long receiptId,
        string payloadHash,
        CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var receipt = await db.ModuleExecutionRequests
            .SingleAsync(item => item.Id == receiptId && item.OwnerId == ownerId, cancellationToken);
        if (receipt.PayloadHash != payloadHash) return Replay(receipt, payloadHash);
        if (receipt.Status != ModuleExecutionRequestStatus.Pending) return Replay(receipt, payloadHash);
        var execution = await db.ModuleExecutions.SingleAsync(item => item.Id == receipt.ExecutionId && item.OwnerId == ownerId, cancellationToken);
        if (execution.Status != ModuleExecutionStatus.Active || execution.Revision != receipt.ExpectedRevision)
        {
            var conflict = Conflict(
                execution.Status == ModuleExecutionStatus.Active ? "revision_conflict" : "execution_not_active",
                "保留中のactionを現在のモジュール実行へ適用できません。",
                execution);
            CompleteReceipt(receipt, conflict, false);
            await db.SaveChangesAsync(cancellationToken);
            return conflict;
        }
        var randomValues = JsonSerializer.Deserialize<uint[]>(receipt.RandomValuesJson, _json) ?? [];
        return await RunDispatchAsync(execution, receipt, randomValues, cancellationToken);
    }

    private async Task<ModuleExecutionResult> RunDispatchAsync(
        ModuleExecution execution,
        ModuleExecutionRequest receipt,
        IReadOnlyList<uint> randomValues,
        CancellationToken cancellationToken)
    {
        try
        {
            var transition = await runtime.DispatchAsync(
                new ModulePackageIdentity(execution.ModuleId, execution.ModuleVersion, execution.ModuleDigest),
                new ModuleDispatchRequest(
                    receipt.RequestId,
                    receipt.ExpectedRevision!.Value,
                    Parse(execution.ConfigurationJson),
                    ParseBinding(execution.ContextJson),
                    Parse(execution.StateJson),
                    Parse(receipt.ActionJson!),
                    randomValues),
                cancellationToken);

            if (transition.Status == ModuleExecutionStatuses.Completed)
            {
                var effectResult = await effects.PrepareAsync(execution, receipt, transition.Outcome, cancellationToken);
                if (!effectResult.IsSuccess)
                {
                    var rejected = EffectError(effectResult, execution);
                    CompleteReceipt(receipt, rejected, false);
                    await db.SaveChangesAsync(cancellationToken);
                    return rejected;
                }
            }

            ModuleExecutionResponse response;
            if (transition.Status == ModuleExecutionStatuses.Failed)
            {
                response = ToResponse(execution, transition.Error, transition.UiEvents);
            }
            else
            {
                ApplyTransition(execution, transition);
                if (transition.Status == ModuleExecutionStatuses.Completed)
                    await handoffs.ExecuteAsync(execution, transition.Outcome, cancellationToken);
                response = ToResponse(execution, null, transition.UiEvents);
            }
            var accepted = new ModuleExecutionResult(ModuleExecutionOutcome.Success, response);
            CompleteReceipt(receipt, accepted, true);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
                return accepted;
            }
            catch (DbUpdateConcurrencyException)
            {
                db.ChangeTracker.Clear();
                var winner = await db.ModuleExecutionRequests.AsNoTracking()
                    .SingleAsync(item => item.Id == receipt.Id, cancellationToken);
                if (winner.Status != ModuleExecutionRequestStatus.Pending) return Replay(winner, receipt.PayloadHash);
                var current = await db.ModuleExecutions.AsNoTracking()
                    .SingleAsync(item => item.Id == execution.Id, cancellationToken);
                var trackedReceipt = await db.ModuleExecutionRequests.SingleAsync(item => item.Id == receipt.Id, cancellationToken);
                var currentSessionRevision = await GetCurrentSessionRevisionAsync(execution.Id, cancellationToken);
                var sessionAdvanced = currentSessionRevision is not null
                    && await IsSessionAdvancedAsync(execution.Id, cancellationToken);
                var conflict = sessionAdvanced
                    ? EffectError(SessionOutcomeEffectResult.Advanced(currentSessionRevision!.Value), current)
                    : trackedReceipt.ExpectedSessionRevision is not null
                        && currentSessionRevision is not null
                        && currentSessionRevision != trackedReceipt.ExpectedSessionRevision
                            ? EffectError(SessionOutcomeEffectResult.Conflict(currentSessionRevision.Value), current)
                            : Conflict("revision_conflict", "別のactionが先に受理されました。", current);
                CompleteReceipt(trackedReceipt, conflict, false);
                await db.SaveChangesAsync(cancellationToken);
                return conflict;
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (ModuleRuntimeException exception)
        {
            var rejected = RuntimeError(exception.Code, exception.Message, execution);
            CompleteReceipt(receipt, rejected, false);
            await db.SaveChangesAsync(cancellationToken);
            return rejected;
        }
    }

}
