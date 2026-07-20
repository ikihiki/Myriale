using System.Buffers;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Modules.Runtime;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Execution;

public sealed class ModuleExecutionService(
    ApplicationDbContext db,
    IModuleRuntime runtime,
    SessionOutcomeEffectService effects,
    IOptions<ModuleExecutionOptions> options,
    ILogger<ModuleExecutionService> logger) : IModuleExecutionService
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private readonly ModuleExecutionOptions _options = options.Value;
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();

    public Task<ModuleExecutionServiceResult> InitializeAsync(
        string ownerId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken) =>
        InitializeCoreAsync(ownerId, null, request, cancellationToken, true, 0);

    public Task<ModuleExecutionServiceResult> InitializeSessionTurnAsync(
        string ownerId,
        string sessionId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken) =>
        InitializeCoreAsync(ownerId, sessionId, request, cancellationToken, true, 0);

    private async Task<ModuleExecutionServiceResult> InitializeCoreAsync(
        string ownerId,
        string? sessionId,
        InitializeModuleExecutionRequest request,
        CancellationToken cancellationToken,
        bool acquireGate,
        int positionRetryCount)
    {
        if (acquireGate) await Gate.WaitAsync(cancellationToken);
        try
        {
            var inputError = ValidateCommon(request.RequestId, request.RandomValueCount);
            if (inputError is not null) return inputError;
            if (string.IsNullOrWhiteSpace(request.ModuleId) || string.IsNullOrWhiteSpace(request.Version)
                || request.Digest?.Trim().Length != 64 || request.Configuration.ValueKind == JsonValueKind.Undefined
                || request.Context.ValueKind == JsonValueKind.Undefined)
                return BadRequest("invalid_request", "モジュール識別情報、configuration、contextを確認してください。");

            Session? session = null;
            if (sessionId is not null)
            {
                session = await db.Sessions
                    .Include(item => item.State)
                    .SingleOrDefaultAsync(
                        item => item.Id == sessionId && item.OwnerId == ownerId,
                        cancellationToken);
                if (session is null) return new ModuleExecutionServiceResult(StatusCodes.Status404NotFound);
                if (session.Status != "active")
                    return Conflict("session_not_active", "アクティブではないセッションにModule Turnを追加できません。");
            }

            var digest = request.Digest.Trim().ToLowerInvariant();
            if (!TryFingerprint(writer =>
            {
                writer.WriteStartObject();
                writer.WriteString("operation", "initialize");
                if (sessionId is null) writer.WriteNull("sessionId");
                else writer.WriteString("sessionId", sessionId);
                writer.WriteString("moduleId", request.ModuleId);
                writer.WriteString("version", request.Version);
                writer.WriteString("digest", digest);
                writer.WritePropertyName("configuration");
                WriteCanonical(writer, request.Configuration);
                writer.WritePropertyName("context");
                WriteCanonical(writer, request.Context);
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
                var result = existing.Status == "pending" && replay.Error?.Code == "request_in_progress"
                    ? await ResumeInitializationAsync(ownerId, existing.Id, payloadHash, cancellationToken)
                    : replay;
                return await AttachSessionTurnAsync(result, existing.ExecutionId, sessionId, cancellationToken);
            }

            var package = await db.ModulePackages.AsNoTracking().SingleOrDefaultAsync(item =>
                item.ModuleId == request.ModuleId && item.Version == request.Version && item.Digest == digest,
                cancellationToken);
            if (package is null) return RuntimeError(ModuleRuntimeErrorCodes.PackageNotFound, "指定されたモジュールパッケージは登録されていません。");
            if (!package.IsEnabled) return RuntimeError(ModuleRuntimeErrorCodes.PackageDisabled, "指定されたモジュールパッケージは無効です。");
            if (package.Status != "installed") return RuntimeError(ModuleRuntimeErrorCodes.PackageUnavailable, "指定されたモジュールパッケージは実行できません。");

            ModuleManifest manifest;
            try
            {
                manifest = JsonSerializer.Deserialize<ModuleManifest>(package.ManifestJson, _json)
                    ?? throw new JsonException("Manifest is empty.");
            }
            catch (JsonException exception)
            {
                logger.LogWarning(exception, "Stored manifest could not be read for {Digest}", digest);
                return RuntimeError(ModuleRuntimeErrorCodes.PackageUnavailable, "モジュールマニフェストを読み込めません。");
            }

            var now = DateTimeOffset.UtcNow;
            var execution = new ModuleExecution
            {
                Id = NewExecutionId(),
                OwnerId = ownerId,
                ModuleId = package.ModuleId,
                ModuleVersion = package.Version,
                ModuleDigest = package.Digest,
                CapabilitiesJson = JsonSerializer.Serialize(manifest.Capabilities ?? [], _json),
                ContractVersion = package.ContractVersion,
                ConfigurationSchemaVersion = manifest.Configuration.SchemaVersion,
                StateSchemaVersion = manifest.Configuration.StateSchemaVersion,
                ConfigurationJson = request.Configuration.GetRawText(),
                ContextJson = request.Context.GetRawText(),
                Status = "initializing",
                Revision = -1,
                CreatedAt = now,
                UpdatedAt = now,
            };
            var randomValues = GenerateRandomValues(request.RandomValueCount);
            var receipt = new ModuleExecutionRequest
            {
                OwnerId = ownerId,
                ExecutionId = execution.Id,
                RequestId = request.RequestId,
                ExpectedSessionRevision = session?.State.Revision,
                Operation = "initialize",
                PayloadHash = payloadHash,
                RandomValuesJson = JsonSerializer.Serialize(randomValues, _json),
                CreatedAt = now,
            };
            SessionTurn? turn = null;
            if (session is not null)
            {
                session.NextTurnPosition++;
                turn = new SessionTurn
                {
                    Id = NewSessionTurnId(),
                    SessionId = session.Id,
                    Position = session.NextTurnPosition,
                    Kind = "module",
                    CreatedAt = now,
                    ModuleExecution = execution,
                };
                execution.SessionTurnId = turn.Id;
                session.UpdatedAt = now;
                db.SessionTurns.Add(turn);
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
                    return Conflict("session_turn_position_conflict", "Module Turnの順序を確定できませんでした。もう一度実行してください。");
                return await InitializeCoreAsync(ownerId, sessionId, request, cancellationToken, false, positionRetryCount + 1);
            }
            catch (DbUpdateException)
            {
                db.ChangeTracker.Clear();
                var winner = await db.ModuleExecutionRequests.AsNoTracking()
                    .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
                if (winner is null) throw;
                var replay = Replay(winner, payloadHash);
                if (replay.Error?.Code == "idempotency_key_reused") return replay;
                var result = winner.Status == "pending" && replay.Error?.Code == "request_in_progress"
                    ? await ResumeInitializationAsync(ownerId, winner.Id, payloadHash, cancellationToken)
                    : replay;
                return await AttachSessionTurnAsync(result, winner.ExecutionId, sessionId, cancellationToken);
            }

            var initialized = await RunInitializationAsync(execution, receipt, randomValues, cancellationToken);
            return turn is null ? initialized : initialized with { SessionTurnId = turn.Id };
        }
        finally
        {
            if (acquireGate) Gate.Release();
        }
    }

    public async Task<ModuleExecutionServiceResult> GetAsync(
        string ownerId,
        string executionId,
        CancellationToken cancellationToken)
    {
        var execution = await db.ModuleExecutions.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == executionId && item.OwnerId == ownerId, cancellationToken);
        return execution is null
            ? new ModuleExecutionServiceResult(StatusCodes.Status404NotFound)
            : new ModuleExecutionServiceResult(StatusCodes.Status200OK, ToResponse(execution, null, []));
    }

    public async Task<ModuleExecutionServiceResult> DispatchAsync(
        string ownerId,
        string executionId,
        DispatchModuleExecutionRequest request,
        CancellationToken cancellationToken)
    {
        await Gate.WaitAsync(cancellationToken);
        try
        {
            var inputError = ValidateCommon(request.RequestId, request.RandomValueCount);
            if (inputError is not null) return inputError;
            if (request.ExpectedRevision < 0 || request.Action.ValueKind == JsonValueKind.Undefined)
                return BadRequest("invalid_request", "ExpectedRevisionとactionを確認してください。");

            if (!TryFingerprint(writer =>
            {
                writer.WriteStartObject();
                writer.WriteString("operation", "dispatch");
                writer.WriteString("executionId", executionId);
                writer.WriteNumber("expectedRevision", request.ExpectedRevision);
                writer.WritePropertyName("action");
                WriteCanonical(writer, request.Action);
                writer.WriteNumber("randomValueCount", request.RandomValueCount);
                writer.WriteEndObject();
            }, out var payloadHash))
                return BadRequest("invalid_json", "actionのJSONを正規化できません。");
            var existing = await db.ModuleExecutionRequests.AsNoTracking()
                .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
            if (existing is not null)
            {
                var replay = Replay(existing, payloadHash);
                return existing.Status == "pending" && replay.Error?.Code == "request_in_progress"
                    ? await ResumeDispatchAsync(ownerId, existing.Id, payloadHash, cancellationToken)
                    : replay;
            }

            var execution = await db.ModuleExecutions
                .SingleOrDefaultAsync(item => item.Id == executionId && item.OwnerId == ownerId, cancellationToken);
            if (execution is null) return new ModuleExecutionServiceResult(StatusCodes.Status404NotFound);
            if (execution.Status != ModuleExecutionStatuses.Active)
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
            var randomValues = GenerateRandomValues(request.RandomValueCount);
            var receipt = new ModuleExecutionRequest
            {
                OwnerId = ownerId,
                ExecutionId = execution.Id,
                RequestId = request.RequestId,
                Operation = "dispatch",
                ExpectedSessionRevision = expectedSessionRevision,
                ExpectedRevision = request.ExpectedRevision,
                PayloadHash = payloadHash,
                ActionJson = request.Action.GetRawText(),
                RandomValuesJson = JsonSerializer.Serialize(randomValues, _json),
                CreatedAt = DateTimeOffset.UtcNow,
            };
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
                return winner.Status == "pending" && replay.Error?.Code == "request_in_progress"
                    ? await ResumeDispatchAsync(ownerId, winner.Id, payloadHash, cancellationToken)
                    : replay;
            }

            return await RunDispatchAsync(execution, receipt, randomValues, cancellationToken);
        }
        finally
        {
            Gate.Release();
        }
    }

    private async Task<ModuleExecutionServiceResult> ResumeInitializationAsync(
        string ownerId,
        long receiptId,
        string payloadHash,
        CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var receipt = await db.ModuleExecutionRequests
            .SingleAsync(item => item.Id == receiptId && item.OwnerId == ownerId, cancellationToken);
        if (receipt.PayloadHash != payloadHash) return Replay(receipt, payloadHash);
        if (receipt.Status != "pending") return Replay(receipt, payloadHash);
        var execution = await db.ModuleExecutions.SingleAsync(item => item.Id == receipt.ExecutionId && item.OwnerId == ownerId, cancellationToken);
        var randomValues = JsonSerializer.Deserialize<uint[]>(receipt.RandomValuesJson, _json) ?? [];
        return await RunInitializationAsync(execution, receipt, randomValues, cancellationToken);
    }

    private async Task<ModuleExecutionServiceResult> RunInitializationAsync(
        ModuleExecution execution,
        ModuleExecutionRequest receipt,
        IReadOnlyList<uint> randomValues,
        CancellationToken cancellationToken)
    {
        try
        {
            var identity = new ModulePackageIdentity(execution.ModuleId, execution.ModuleVersion, execution.ModuleDigest);
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
                execution.Status = ModuleExecutionStatuses.Failed;
                execution.Revision = 0;
                execution.ErrorJson = JsonSerializer.Serialize(validationError, _json);
                execution.UpdatedAt = DateTimeOffset.UtcNow;
                execution.CompletedAt = execution.UpdatedAt;
                var invalid = new ModuleExecutionServiceResult(
                    StatusCodes.Status422UnprocessableEntity,
                    Error: new ModuleExecutionErrorResponse("invalid_configuration", validationError.Message, execution.Revision, ToResponse(execution, validationError, [])));
                CompleteReceipt(receipt, invalid, "rejected");
                return await FinalizeInitializationAsync(receipt, invalid, cancellationToken);
            }

            var result = await runtime.InitializeAsync(
                identity,
                new ModuleInitializationRequest(
                    receipt.RequestId,
                    configuration,
                    Parse(execution.ContextJson),
                    randomValues),
                cancellationToken);
            if (result.Status == ModuleExecutionStatuses.Completed)
            {
                var effectResult = await effects.PrepareAsync(execution, receipt, result.Outcome, cancellationToken);
                if (!effectResult.IsSuccess)
                    return await RejectInitializationEffectsAsync(execution, receipt, effectResult, cancellationToken);
            }
            ApplyInitialization(execution, result);
            var response = ToResponse(execution, result.Error, []);
            var serviceResult = new ModuleExecutionServiceResult(
                StatusCodes.Status201Created,
                response,
                Location: $"/api/module-executions/{execution.Id}");
            CompleteReceipt(receipt, serviceResult, "succeeded");
            return await FinalizeInitializationAsync(receipt, serviceResult, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (ModuleRuntimeException exception)
        {
            execution.Status = ModuleExecutionStatuses.Failed;
            execution.Revision = 0;
            execution.ErrorJson = JsonSerializer.Serialize(new ModuleError(exception.Code, exception.Message), _json);
            execution.UpdatedAt = DateTimeOffset.UtcNow;
            execution.CompletedAt = execution.UpdatedAt;
            var errorResult = RuntimeError(exception.Code, exception.Message, execution);
            CompleteReceipt(receipt, errorResult, "rejected");
            return await FinalizeInitializationAsync(receipt, errorResult, cancellationToken);
        }
    }

    private async Task<ModuleExecutionServiceResult> RejectInitializationEffectsAsync(
        ModuleExecution execution,
        ModuleExecutionRequest receipt,
        SessionOutcomeEffectResult effectResult,
        CancellationToken cancellationToken)
    {
        var error = new ModuleError(effectResult.Code!, effectResult.Message!);
        execution.Status = ModuleExecutionStatuses.Failed;
        execution.Revision = 0;
        execution.ErrorJson = JsonSerializer.Serialize(error, _json);
        execution.UpdatedAt = DateTimeOffset.UtcNow;
        execution.CompletedAt = execution.UpdatedAt;
        var rejected = EffectError(effectResult, execution);
        CompleteReceipt(receipt, rejected, "rejected");
        return await FinalizeInitializationAsync(receipt, rejected, cancellationToken);
    }

    private async Task<ModuleExecutionServiceResult> FinalizeInitializationAsync(
        ModuleExecutionRequest receipt,
        ModuleExecutionServiceResult result,
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
            if (winner.Status != "pending") return Replay(winner, receipt.PayloadHash);
            var currentSessionRevision = await GetCurrentSessionRevisionAsync(winner.ExecutionId, cancellationToken);
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
            return new ModuleExecutionServiceResult(
                StatusCodes.Status409Conflict,
                Error: new ModuleExecutionErrorResponse("request_in_progress", "同じRequestIdの処理が進行中です。"),
                Replayed: true);
        }
    }

    private async Task<ModuleExecutionServiceResult> ResumeDispatchAsync(
        string ownerId,
        long receiptId,
        string payloadHash,
        CancellationToken cancellationToken)
    {
        db.ChangeTracker.Clear();
        var receipt = await db.ModuleExecutionRequests
            .SingleAsync(item => item.Id == receiptId && item.OwnerId == ownerId, cancellationToken);
        if (receipt.PayloadHash != payloadHash) return Replay(receipt, payloadHash);
        if (receipt.Status != "pending") return Replay(receipt, payloadHash);
        var execution = await db.ModuleExecutions.SingleAsync(item => item.Id == receipt.ExecutionId && item.OwnerId == ownerId, cancellationToken);
        if (execution.Status != ModuleExecutionStatuses.Active || execution.Revision != receipt.ExpectedRevision)
        {
            var conflict = Conflict(
                execution.Status == ModuleExecutionStatuses.Active ? "revision_conflict" : "execution_not_active",
                "保留中のactionを現在のモジュール実行へ適用できません。",
                execution);
            CompleteReceipt(receipt, conflict, "rejected");
            await db.SaveChangesAsync(cancellationToken);
            return conflict;
        }
        var randomValues = JsonSerializer.Deserialize<uint[]>(receipt.RandomValuesJson, _json) ?? [];
        return await RunDispatchAsync(execution, receipt, randomValues, cancellationToken);
    }

    private async Task<ModuleExecutionServiceResult> RunDispatchAsync(
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
                    Parse(execution.ContextJson),
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
                    CompleteReceipt(receipt, rejected, "rejected");
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
                response = ToResponse(execution, null, transition.UiEvents);
            }
            var accepted = new ModuleExecutionServiceResult(StatusCodes.Status200OK, response);
            CompleteReceipt(receipt, accepted, "succeeded");
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
                if (winner.Status != "pending") return Replay(winner, receipt.PayloadHash);
                var current = await db.ModuleExecutions.AsNoTracking()
                    .SingleAsync(item => item.Id == execution.Id, cancellationToken);
                var trackedReceipt = await db.ModuleExecutionRequests.SingleAsync(item => item.Id == receipt.Id, cancellationToken);
                var currentSessionRevision = await GetCurrentSessionRevisionAsync(execution.Id, cancellationToken);
                var conflict = trackedReceipt.ExpectedSessionRevision is not null
                    && currentSessionRevision is not null
                    && currentSessionRevision != trackedReceipt.ExpectedSessionRevision
                        ? EffectError(SessionOutcomeEffectResult.Conflict(currentSessionRevision.Value), current)
                        : Conflict("revision_conflict", "別のactionが先に受理されました。", current);
                CompleteReceipt(trackedReceipt, conflict, "rejected");
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
            CompleteReceipt(receipt, rejected, "rejected");
            await db.SaveChangesAsync(cancellationToken);
            return rejected;
        }
    }

    private ModuleExecutionServiceResult? ValidateCommon(string requestId, int randomValueCount)
    {
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 128)
            return BadRequest("invalid_request_id", "RequestIdは1文字以上128文字以内で指定してください。");
        if (randomValueCount < 0 || randomValueCount > _options.MaxRandomValues)
            return BadRequest("invalid_random_value_count", $"RandomValueCountは0以上{_options.MaxRandomValues}以下で指定してください。");
        return null;
    }

    private async Task<ModuleExecutionServiceResult> StoreRejectedReceiptAsync(
        string ownerId,
        ModuleExecution execution,
        DispatchModuleExecutionRequest request,
        string payloadHash,
        ModuleExecutionServiceResult result,
        CancellationToken cancellationToken)
    {
        var receipt = new ModuleExecutionRequest
        {
            OwnerId = ownerId,
            ExecutionId = execution.Id,
            RequestId = request.RequestId,
            Operation = "dispatch",
            ExpectedRevision = request.ExpectedRevision,
            PayloadHash = payloadHash,
            ActionJson = request.Action.GetRawText(),
            RandomValuesJson = "[]",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        CompleteReceipt(receipt, result, "rejected");
        db.ModuleExecutionRequests.Add(receipt);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return result;
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            var winner = await db.ModuleExecutionRequests.AsNoTracking()
                .SingleOrDefaultAsync(item => item.OwnerId == ownerId && item.RequestId == request.RequestId, cancellationToken);
            if (winner is null) throw;
            return Replay(winner, payloadHash);
        }
    }

    private async Task<long?> GetCurrentSessionRevisionAsync(string executionId, CancellationToken cancellationToken) =>
        await db.ModuleExecutions.AsNoTracking()
            .Where(execution => execution.Id == executionId && execution.SessionTurn != null)
            .Select(execution => (long?)execution.SessionTurn!.Session.State.Revision)
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<ModuleExecutionServiceResult> AttachSessionTurnAsync(
        ModuleExecutionServiceResult result,
        string executionId,
        string? sessionId,
        CancellationToken cancellationToken)
    {
        if (sessionId is null) return result;
        var turnId = await db.ModuleExecutions.AsNoTracking()
            .Where(execution => execution.Id == executionId && execution.SessionTurn != null && execution.SessionTurn.SessionId == sessionId)
            .Select(execution => execution.SessionTurnId)
            .SingleOrDefaultAsync(cancellationToken);
        return turnId is null
            ? Conflict("session_turn_mismatch", "RequestIdに対応するModule Turnを確認できません。")
            : result with { SessionTurnId = turnId };
    }

    private void ApplyInitialization(ModuleExecution execution, ModuleInitializationResult result)
    {
        execution.Status = result.Status;
        execution.Revision = 0;
        execution.StateJson = result.State.GetRawText();
        execution.ViewStateJson = result.ViewState.GetRawText();
        execution.AvailableActionsJson = JsonSerializer.Serialize(result.AvailableActions, _json);
        execution.OutcomeJson = result.Outcome is null ? null : JsonSerializer.Serialize(result.Outcome, _json);
        execution.ErrorJson = result.Error is null ? null : JsonSerializer.Serialize(result.Error, _json);
        execution.UpdatedAt = DateTimeOffset.UtcNow;
        if (result.Status is ModuleExecutionStatuses.Completed or ModuleExecutionStatuses.Failed)
            execution.CompletedAt = execution.UpdatedAt;
    }

    private void ApplyTransition(ModuleExecution execution, ModuleTransitionResult transition)
    {
        execution.Status = transition.Status;
        execution.Revision = transition.Revision;
        execution.StateJson = transition.State.GetRawText();
        execution.ViewStateJson = transition.ViewState.GetRawText();
        execution.AvailableActionsJson = JsonSerializer.Serialize(transition.AvailableActions, _json);
        execution.OutcomeJson = transition.Outcome is null ? null : JsonSerializer.Serialize(transition.Outcome, _json);
        execution.ErrorJson = null;
        execution.UpdatedAt = DateTimeOffset.UtcNow;
        if (transition.Status == ModuleExecutionStatuses.Completed) execution.CompletedAt = execution.UpdatedAt;
    }

    private ModuleExecutionServiceResult Replay(ModuleExecutionRequest receipt, string payloadHash)
    {
        if (!string.Equals(receipt.PayloadHash, payloadHash, StringComparison.Ordinal))
            return new ModuleExecutionServiceResult(
                StatusCodes.Status409Conflict,
                Error: new ModuleExecutionErrorResponse("idempotency_key_reused", "同じRequestIdが異なる内容で使用されています。"));
        if (receipt.ResponseStatusCode is null || receipt.ResponseJson is null)
            return new ModuleExecutionServiceResult(
                StatusCodes.Status409Conflict,
                Error: new ModuleExecutionErrorResponse("request_in_progress", "同じRequestIdの処理が進行中です。"),
                Replayed: true);
        return receipt.ResponseStatusCode >= 400
            ? new ModuleExecutionServiceResult(receipt.ResponseStatusCode.Value, Error: JsonSerializer.Deserialize<ModuleExecutionErrorResponse>(receipt.ResponseJson, _json), Replayed: true)
            : new ModuleExecutionServiceResult(receipt.ResponseStatusCode.Value, JsonSerializer.Deserialize<ModuleExecutionResponse>(receipt.ResponseJson, _json), Replayed: true, Location: $"/api/module-executions/{receipt.ExecutionId}");
    }

    private void CompleteReceipt(ModuleExecutionRequest receipt, ModuleExecutionServiceResult result, string status)
    {
        receipt.Status = status;
        receipt.ResponseStatusCode = result.StatusCode;
        receipt.ResponseJson = result.Response is not null
            ? JsonSerializer.Serialize(result.Response, _json)
            : JsonSerializer.Serialize(result.Error, _json);
        receipt.CompletedAt = DateTimeOffset.UtcNow;
    }

    private ModuleExecutionServiceResult BadRequest(string code, string message) =>
        new(StatusCodes.Status400BadRequest, Error: new ModuleExecutionErrorResponse(code, message));

    private ModuleExecutionServiceResult Conflict(string code, string message) =>
        new(StatusCodes.Status409Conflict, Error: new ModuleExecutionErrorResponse(code, message));

    private ModuleExecutionServiceResult Conflict(string code, string message, ModuleExecution execution) =>
        new(StatusCodes.Status409Conflict, Error: new ModuleExecutionErrorResponse(code, message, execution.Revision, ToResponse(execution, null, [])));

    private ModuleExecutionServiceResult EffectError(SessionOutcomeEffectResult effectResult, ModuleExecution execution)
    {
        var status = effectResult.Code == "session_revision_conflict"
            ? StatusCodes.Status409Conflict
            : StatusCodes.Status422UnprocessableEntity;
        return new ModuleExecutionServiceResult(
            status,
            Error: new ModuleExecutionErrorResponse(
                effectResult.Code!,
                effectResult.Message!,
                execution.Revision,
                ToResponse(execution, null, []),
                effectResult.CurrentSessionRevision));
    }

    private ModuleExecutionServiceResult RuntimeError(string code, string message, ModuleExecution? execution = null)
    {
        var status = code switch
        {
            ModuleRuntimeErrorCodes.PackageNotFound => StatusCodes.Status404NotFound,
            ModuleRuntimeErrorCodes.PackageDisabled => StatusCodes.Status409Conflict,
            ModuleRuntimeErrorCodes.ContractViolation => StatusCodes.Status422UnprocessableEntity,
            ModuleRuntimeErrorCodes.CapacityExceeded => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status503ServiceUnavailable,
        };
        return new ModuleExecutionServiceResult(status, Error: new ModuleExecutionErrorResponse(code, message, execution?.Revision, execution is null ? null : ToResponse(execution, null, [])));
    }

    private ModuleExecutionResponse ToResponse(
        ModuleExecution execution,
        ModuleError? transientError,
        IReadOnlyList<ModuleEvent> uiEvents) => new(
            execution.Id,
            new ModuleExecutionPackageResponse(
                execution.ModuleId,
                execution.ModuleVersion,
                execution.ModuleDigest,
                execution.ContractVersion,
                execution.ConfigurationSchemaVersion,
                execution.StateSchemaVersion),
            execution.Status,
            execution.Revision,
            Parse(execution.ViewStateJson),
            JsonSerializer.Deserialize<IReadOnlyList<ModuleAvailableAction>>(execution.AvailableActionsJson, _json) ?? [],
            execution.OutcomeJson is null ? null : JsonSerializer.Deserialize<ModuleOutcome>(execution.OutcomeJson, _json),
            transientError ?? (execution.ErrorJson is null ? null : JsonSerializer.Deserialize<ModuleError>(execution.ErrorJson, _json)),
            uiEvents,
            execution.CreatedAt,
            execution.UpdatedAt,
            execution.CompletedAt);

    private static IReadOnlyList<uint> GenerateRandomValues(int count)
    {
        var values = new uint[count];
        if (count == 0) return values;
        var bytes = new byte[count * sizeof(uint)];
        RandomNumberGenerator.Fill(bytes);
        for (var index = 0; index < count; index++) values[index] = BitConverter.ToUInt32(bytes, index * sizeof(uint));
        return values;
    }

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static bool TryFingerprint(Action<Utf8JsonWriter> write, out string fingerprint)
    {
        try
        {
            var buffer = new ArrayBufferWriter<byte>();
            using (var writer = new Utf8JsonWriter(buffer)) write(writer);
            fingerprint = Convert.ToHexString(SHA256.HashData(buffer.WrittenSpan)).ToLowerInvariant();
            return true;
        }
        catch (Exception exception) when (exception is JsonException or FormatException)
        {
            fingerprint = string.Empty;
            return false;
        }
    }

    private static void WriteCanonical(Utf8JsonWriter writer, JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                var properties = value.EnumerateObject().OrderBy(property => property.Name, StringComparer.Ordinal).ToArray();
                if (properties.Select(property => property.Name).Distinct(StringComparer.Ordinal).Count() != properties.Length)
                    throw new JsonException("Duplicate JSON property names are not supported.");
                foreach (var property in properties)
                {
                    writer.WritePropertyName(property.Name);
                    WriteCanonical(writer, property.Value);
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in value.EnumerateArray()) WriteCanonical(writer, item);
                writer.WriteEndArray();
                break;
            case JsonValueKind.String:
                writer.WriteStringValue(value.GetString());
                break;
            case JsonValueKind.Number:
                writer.WriteRawValue(CanonicalizeNumber(value.GetRawText()));
                break;
            case JsonValueKind.True:
                writer.WriteBooleanValue(true);
                break;
            case JsonValueKind.False:
                writer.WriteBooleanValue(false);
                break;
            case JsonValueKind.Null:
                writer.WriteNullValue();
                break;
            default:
                throw new JsonException("Undefined JSON cannot be fingerprinted.");
        }
    }


    private static string CanonicalizeNumber(string raw)
    {
        var negative = raw.Length > 0 && raw[0] == '-';
        var unsigned = negative ? raw[1..] : raw;
        var exponentIndex = unsigned.IndexOfAny(['e', 'E']);
        var significand = exponentIndex < 0 ? unsigned : unsigned[..exponentIndex];
        var exponent = exponentIndex < 0
            ? BigInteger.Zero
            : BigInteger.Parse(unsigned[(exponentIndex + 1)..]);
        var decimalIndex = significand.IndexOf('.');
        var fractionalDigits = decimalIndex < 0 ? 0 : significand.Length - decimalIndex - 1;
        var digits = decimalIndex < 0 ? significand : significand.Remove(decimalIndex, 1);
        digits = digits.TrimStart('0');
        if (digits.Length == 0) return "0";
        exponent -= fractionalDigits;
        var trailingZeros = digits.Length - digits.TrimEnd('0').Length;
        if (trailingZeros > 0)
        {
            digits = digits[..^trailingZeros];
            exponent += trailingZeros;
        }
        return $"{(negative ? "-" : string.Empty)}{digits}e{exponent}";
    }

    private static string NewSessionTurnId() => $"TRN-{Guid.NewGuid():N}".ToUpperInvariant();

    private static string NewExecutionId() => $"MEX-{Guid.NewGuid():N}".ToUpperInvariant();
}
