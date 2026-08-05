using System.Buffers;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Features.ModulePackages.Application;
using Myriale.Api.Features.ModuleExecutions.Application;
using Myriale.Api.Features.ModulePackages.Infrastructure;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModuleExecutions.Infrastructure;

internal sealed partial class ModuleExecutionWorkflow
{
    public Task<ModuleExecutionResult> InitializeDetachedAsync(
        AccountId ownerId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken) =>
        InitializeCoreAsync(ownerId, null, request, cancellationToken, 0, allowManagedSession: true);

    public Task<ModuleExecutionResult> InitializeSessionTurnAsync(
        AccountId ownerId, SessionId sessionId, InitializeModuleExecutionRequest request,
        SessionTurnInitializationPolicy policy, CancellationToken cancellationToken) =>
        InitializeCoreAsync(ownerId, sessionId, request, cancellationToken, 0,
            allowManagedSession: policy == SessionTurnInitializationPolicy.ScenarioProgression);

    private async Task<ModuleExecutionResult> InitializeCoreAsync(
        AccountId ownerId,
        SessionId? sessionId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken,
        int positionRetryCount,
        bool allowManagedSession)
    {
            var inputError = ValidateCommon(request.RequestId, request.RandomValueCount);
            if (inputError is not null) return inputError;
            if (request.Configuration.ValueKind == JsonValueKind.Undefined
                || request.Context.ValueKind == JsonValueKind.Undefined)
                return BadRequest("invalid_request", "モジュール識別情報、configuration、contextを確認してください。");

            Session? session = null;
            if (sessionId is not null)
            {
                session = await db.Sessions
                    .Include(item => item.State)
                    .Include(item => item.HeadTurn)
                    .SingleOrDefaultAsync(
                        item => item.Id == sessionId && item.OwnerId == ownerId,
                        cancellationToken);
                if (session is null) return new ModuleExecutionResult(ModuleExecutionOutcome.NotFound);
                if (session.Status != SessionStatus.Active)
                    return Conflict("session_not_active", "アクティブではないセッションにModule Turnを追加できません。");
                if (!allowManagedSession && await db.SessionProgressionModuleSnapshots.AsNoTracking()
                        .AnyAsync(snapshot => snapshot.SessionId == sessionId, cancellationToken))
                    return Conflict("scenario_module_turn_managed", "Scenario進行用Module Turnはhostオーケストレーターだけが開始できます。");
            }

            var digest = request.Digest;
            if (!ModuleRequestFingerprint.TryCreate(writer =>
            {
                writer.WriteStartObject();
                writer.WriteString("operation", "initialize");
                if (sessionId is null) writer.WriteNull("sessionId");
                else writer.WriteString("sessionId", sessionId.Value.AsPrimitive());
                writer.WriteString("moduleId", request.ModuleId.AsPrimitive());
                writer.WriteString("version", request.Version.AsPrimitive());
                writer.WriteString("digest", digest.AsPrimitive());
                writer.WritePropertyName("configuration");
                ModuleRequestFingerprint.WriteCanonical(writer, request.Configuration);
                writer.WritePropertyName("context");
                ModuleRequestFingerprint.WriteCanonical(writer, request.Context);
                writer.WriteNumber("randomValueCount", request.RandomValueCount);
                writer.WriteEndObject();
            }, out var payloadHash))
                return BadRequest("invalid_json", "configurationまたはcontextのJSONを正規化できません。");

            var existing = await db.ModuleExecutionRequests.AsNoTracking()
                .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
            if (existing is not null)
            {
                var replay = Replay(existing, payloadHash);
                if (replay.Error?.Code == "idempotency_key_reused") return replay;
                var result = existing.Status == ModuleExecutionRequestStatus.Pending && replay.Error?.Code == "request_in_progress"
                    ? await ResumeInitializationAsync(ownerId, existing.Id, payloadHash, cancellationToken)
                    : replay;
                return await AttachSessionTurnAsync(result, existing.ExecutionId, sessionId, cancellationToken);
            }

            ModulePackageResolution packageResolution;
            try
            {
                packageResolution = await packageCatalog.ResolveAsync(request.ModuleId, request.Version, digest, cancellationToken);
            }
            catch (ArgumentException)
            {
                return RuntimeError(ModuleRuntimeErrorCodes.PackageNotFound, "指定されたモジュールパッケージの識別情報が不正です。");
            }
            if (packageResolution.Availability == ModulePackageAvailability.NotFound)
                return RuntimeError(ModuleRuntimeErrorCodes.PackageNotFound, "指定されたモジュールパッケージは登録されていません。");
            if (packageResolution.Availability == ModulePackageAvailability.Disabled)
                return RuntimeError(ModuleRuntimeErrorCodes.PackageDisabled, "指定されたモジュールパッケージは無効です。");
            if (packageResolution.Availability != ModulePackageAvailability.Available || packageResolution.Package is null)
                return RuntimeError(ModuleRuntimeErrorCodes.PackageUnavailable, "指定されたモジュールパッケージは実行できません。");

            var package = packageResolution.Package;
            var manifest = package.Manifest;
            var packageSnapshot = new ModuleExecutionPackageSnapshot(
                package.ModuleId, package.Version, package.Digest, package.ContractVersion,
                manifest.Capabilities ?? [], manifest.Configuration.SchemaVersion, manifest.Configuration.StateSchemaVersion);
            var now = DateTimeOffset.UtcNow;
            var execution = ModuleExecution.Create(
                NewExecutionId(), ownerId, packageSnapshot, request.Configuration, request.Context, now);
            var randomValues = GenerateRandomValues(request.RandomValueCount);
            var receipt = ModuleExecutionRequest.CreateInitialization(
                ownerId, execution.Id, request.RequestId, payloadHash, session?.State.Revision, randomValues, _json, now);
            SessionTurn? turn = null;
            if (session is not null)
            {
                turn = session.AppendModuleTurn(NewSessionTurnId(), now);
                execution.AttachSessionTurn(turn.Id);
            }
            db.ModuleExecutions.Add(execution);
            db.ModuleExecutionRequests.Add(receipt);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException) when (sessionId is not null)
            {
                db.ChangeTracker.Clear();
                if (positionRetryCount >= 5)
                    return Conflict("session_head_conflict", "Module Turnの直前Turnを確定できませんでした。もう一度実行してください。");
                return await InitializeCoreAsync(ownerId, sessionId, request, cancellationToken, positionRetryCount + 1, allowManagedSession);
            }
            catch (DbUpdateException)
            {
                db.ChangeTracker.Clear();
                var winner = await db.ModuleExecutionRequests.AsNoTracking()
                    .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
                if (winner is null) throw;
                var replay = Replay(winner, payloadHash);
                if (replay.Error?.Code == "idempotency_key_reused") return replay;
                var result = winner.Status == ModuleExecutionRequestStatus.Pending && replay.Error?.Code == "request_in_progress"
                    ? await ResumeInitializationAsync(ownerId, winner.Id, payloadHash, cancellationToken)
                    : replay;
                return await AttachSessionTurnAsync(result, winner.ExecutionId, sessionId, cancellationToken);
            }

            var initialized = await RunInitializationAsync(execution, receipt, randomValues, cancellationToken);
            return turn is null ? initialized : initialized with { SessionTurnId = turn.Id };
    }


    private async Task<ModuleExecutionResult> ResumeInitializationAsync(
        AccountId ownerId,
        ModuleExecutionRequestId receiptId,
        string payloadHash,
        CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var receipt = await db.ModuleExecutionRequests
            .SingleAsync(item => item.Id == receiptId && item.OwnerId == ownerId, cancellationToken);
        if (receipt.PayloadHash != payloadHash) return Replay(receipt, payloadHash);
        if (receipt.Status != ModuleExecutionRequestStatus.Pending) return Replay(receipt, payloadHash);
        var execution = await db.ModuleExecutions.SingleAsync(item => item.Id == receipt.ExecutionId && item.OwnerId == ownerId, cancellationToken);
        var randomValues = JsonSerializer.Deserialize<uint[]>(receipt.RandomValuesJson, _json) ?? [];
        return await RunInitializationAsync(execution, receipt, randomValues, cancellationToken);
    }

    private async Task<ModuleExecutionResult> RunInitializationAsync(
        ModuleExecution execution,
        ModuleExecutionRequest receipt,
        IReadOnlyList<uint> randomValues,
        CancellationToken cancellationToken)
    {
        try
        {
            var identity = new ModulePackageIdentity(execution.ModuleId.AsPrimitive(), execution.ModuleVersion.AsPrimitive(), execution.ModuleDigest.AsPrimitive());
            var configuration = Parse(execution.ConfigurationJson);
            var validation = await runtime.ValidateConfigAsync(
                identity,
                new ModuleValidationRequest($"{receipt.RequestId}:validate", configuration),
                cancellationToken);
            if (!validation.IsValid)
            {
                var validationError = new ModuleError(
                    "invalid_configuration",
                    "モジュール設定が検証エラーを返しました。",
                    JsonSerializer.SerializeToElement(validation.Issues, _json));
execution.FailInitialization(validationError, _json, DateTimeOffset.UtcNow);
                var invalid = new ModuleExecutionResult(
                    ModuleExecutionOutcome.Unprocessable,
                    Error: new ModuleExecutionErrorResponse("invalid_configuration", validationError.Message, execution.Revision, ToResponse(execution, validationError, [])));
                CompleteReceipt(receipt, invalid, false);
                return await FinalizeInitializationAsync(receipt, invalid, cancellationToken);
            }

            var result = await runtime.InitializeAsync(
                identity,
                new ModuleInitializationRequest(
                    receipt.RequestId,
                    configuration,
                    ParseBinding(execution.ContextJson),
                    randomValues),
                cancellationToken);
            if (result.Status == ModuleExecutionStatuses.Completed)
            {
                var effectResult = await effects.PrepareAsync(execution, receipt, result.Outcome, cancellationToken);
                if (!effectResult.IsSuccess)
                    return await RejectInitializationEffectsAsync(execution, receipt, effectResult, cancellationToken);
            }
            ApplyInitialization(execution, result);
            if (result.Status == ModuleExecutionStatuses.Completed)
                await handoffs.ExecuteAsync(execution, result.Outcome, cancellationToken);
            var response = ToResponse(execution, result.Error, []);
            var serviceResult = new ModuleExecutionResult(ModuleExecutionOutcome.Created, response);
            CompleteReceipt(receipt, serviceResult, true);
            return await FinalizeInitializationAsync(receipt, serviceResult, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (ModuleRuntimeException exception)
        {
execution.FailInitialization(new ModuleError(exception.Code, exception.Message), _json, DateTimeOffset.UtcNow);
            var errorResult = RuntimeError(exception.Code, exception.Message, execution);
            CompleteReceipt(receipt, errorResult, false);
            return await FinalizeInitializationAsync(receipt, errorResult, cancellationToken);
        }
    }

    private async Task<ModuleExecutionResult> RejectInitializationEffectsAsync(
        ModuleExecution execution,
        ModuleExecutionRequest receipt,
        SessionOutcomeEffectResult effectResult,
        CancellationToken cancellationToken)
    {
        var error = new ModuleError(effectResult.Code!, effectResult.Message!);
execution.FailInitialization(error, _json, DateTimeOffset.UtcNow);
        var rejected = EffectError(effectResult, execution);
        CompleteReceipt(receipt, rejected, false);
        return await FinalizeInitializationAsync(receipt, rejected, cancellationToken);
    }

    private async Task<ModuleExecutionResult> FinalizeInitializationAsync(
        ModuleExecutionRequest receipt,
        ModuleExecutionResult result,
        CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            db.ChangeTracker.Clear();
            var winner = await db.ModuleExecutionRequests.AsNoTracking()
                .SingleAsync(item => item.Id == receipt.Id, cancellationToken);
            if (winner.Status != ModuleExecutionRequestStatus.Pending) return Replay(winner, receipt.PayloadHash);
            var currentSessionRevision = await GetCurrentSessionRevisionAsync(winner.ExecutionId, cancellationToken);
            if (currentSessionRevision is not null && await IsSessionAdvancedAsync(winner.ExecutionId, cancellationToken))
            {
                var currentExecution = await db.ModuleExecutions.SingleAsync(item => item.Id == winner.ExecutionId, cancellationToken);
                var trackedReceipt = await db.ModuleExecutionRequests.SingleAsync(item => item.Id == winner.Id, cancellationToken);
                return await RejectInitializationEffectsAsync(
                    currentExecution,
                    trackedReceipt,
                    SessionOutcomeEffectResult.Advanced(currentSessionRevision.Value),
                    cancellationToken);
            }
            if (winner.ExpectedSessionRevision is not null
                && currentSessionRevision is not null
                && currentSessionRevision != winner.ExpectedSessionRevision)
            {
                var currentExecution = await db.ModuleExecutions.SingleAsync(item => item.Id == winner.ExecutionId, cancellationToken);
                var trackedReceipt = await db.ModuleExecutionRequests.SingleAsync(item => item.Id == winner.Id, cancellationToken);
                return await RejectInitializationEffectsAsync(
                    currentExecution,
                    trackedReceipt,
                    SessionOutcomeEffectResult.Conflict(currentSessionRevision.Value),
                    cancellationToken);
            }
            return new ModuleExecutionResult(
                ModuleExecutionOutcome.Conflict,
                Error: new ModuleExecutionErrorResponse("request_in_progress", "同じRequestIdの処理が進行中です。"),
                Replayed: true);
        }
    }

}
