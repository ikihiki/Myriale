using System.Buffers;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Myriale.Api.Application.ModulePackages;
using Myriale.Api.Contracts;
using Myriale.Api.Application.ModuleExecutions;
using Myriale.Api.Application.ModuleHandoffs;
using Myriale.Api.Data;
using Myriale.Api.Modules.Runtime;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Execution;

internal sealed partial class ModuleExecutionWorkflow : IModuleExecutionWorkflow
{
    private readonly ApplicationDbContext db;
    private readonly IModulePackageCatalog packageCatalog;
    private readonly IModuleRuntime runtime;
    private readonly SessionOutcomeEffectService effects;
    private readonly ILogger<ModuleExecutionWorkflow> logger;
    private readonly IModuleExecutionProjection projection;
    private readonly EnqueueModuleHandoffCommand handoffs;
    private readonly ModuleExecutionOptions _options;
    private readonly JsonSerializerOptions _json = ModuleJsonSerializerOptions.Create();

    public ModuleExecutionWorkflow(ApplicationDbContext db, IModulePackageCatalog packageCatalog, IModuleRuntime runtime, SessionOutcomeEffectService effects,
        IOptions<ModuleExecutionOptions> options, ILogger<ModuleExecutionWorkflow> logger, IModuleExecutionProjection projection,
        EnqueueModuleHandoffCommand handoffs)
    {
        this.db = db; this.packageCatalog = packageCatalog; this.runtime = runtime; this.effects = effects; this.logger = logger; this.projection = projection; this.handoffs = handoffs;
        _options = options.Value;
    }

    private ModuleExecutionResult? ValidateCommon(string requestId, int randomValueCount)
    {
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 128)
            return BadRequest("invalid_request_id", "RequestIdは1文字以上128文字以内で指定してください。");
        if (randomValueCount < 0 || randomValueCount > _options.MaxRandomValues)
            return BadRequest("invalid_random_value_count", $"RandomValueCountは0以上{_options.MaxRandomValues}以下で指定してください。");
        return null;
    }

    private async Task<ModuleExecutionResult> StoreRejectedReceiptAsync(
        string ownerId,
        ModuleExecution execution,
        DispatchModuleExecutionRequest request,
        string payloadHash,
        ModuleExecutionResult result,
        CancellationToken cancellationToken)
    {
        var receipt = ModuleExecutionRequest.CreateDispatch(
            ownerId, execution.Id, request.RequestId, payloadHash, request.ExpectedRevision, null,
            request.Action, [], _json, DateTimeOffset.UtcNow);
        CompleteReceipt(receipt, result, false);
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

    private async Task<bool> IsSessionAdvancedAsync(string executionId, CancellationToken cancellationToken) =>
        await db.ModuleExecutions.AsNoTracking()
            .Where(execution => execution.Id == executionId && execution.SessionTurn != null)
            .Select(execution => execution.SessionTurn!.Session.HeadTurnId != execution.SessionTurn.Id)
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<long?> GetCurrentSessionRevisionAsync(string executionId, CancellationToken cancellationToken) =>
        await db.ModuleExecutions.AsNoTracking()
            .Where(execution => execution.Id == executionId && execution.SessionTurn != null)
            .Select(execution => (long?)execution.SessionTurn!.Session.State.Revision)
            .SingleOrDefaultAsync(cancellationToken);

    private async Task<ModuleExecutionResult> AttachSessionTurnAsync(
        ModuleExecutionResult result,
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

    private void ApplyInitialization(ModuleExecution execution, ModuleInitializationResult result) =>
        execution.CompleteInitialization(result, _json, DateTimeOffset.UtcNow);

    private void ApplyTransition(ModuleExecution execution, ModuleTransitionResult transition) =>
        execution.CompleteDispatch(transition, _json, DateTimeOffset.UtcNow);

    private ModuleExecutionResult Replay(ModuleExecutionRequest receipt, string payloadHash)
    {
        if (!string.Equals(receipt.PayloadHash, payloadHash, StringComparison.Ordinal))
            return new ModuleExecutionResult(
                ModuleExecutionOutcome.Conflict,
                Error: new ModuleExecutionErrorResponse("idempotency_key_reused", "同じRequestIdが異なる内容で使用されています。"));
        if (receipt.ResponseStatusCode is null || receipt.ResponseJson is null)
            return new ModuleExecutionResult(
                ModuleExecutionOutcome.Conflict,
                Error: new ModuleExecutionErrorResponse("request_in_progress", "同じRequestIdの処理が進行中です。"),
                Replayed: true);
        return receipt.ResponseStatusCode >= 400
            ? new ModuleExecutionResult(OutcomeFromStatusCode(receipt.ResponseStatusCode.Value), Error: JsonSerializer.Deserialize<ModuleExecutionErrorResponse>(receipt.ResponseJson, _json), Replayed: true)
            : new ModuleExecutionResult(OutcomeFromStatusCode(receipt.ResponseStatusCode.Value), JsonSerializer.Deserialize<ModuleExecutionResponse>(receipt.ResponseJson, _json), Replayed: true);
    }

    private void CompleteReceipt(ModuleExecutionRequest receipt, ModuleExecutionResult result, bool succeeded)
    {
        var responseJson = result.Execution is not null
            ? JsonSerializer.Serialize(result.Execution, _json)
            : JsonSerializer.Serialize(result.Error, _json);
        var statusCode = StatusCodeFor(result.Outcome);
        if (succeeded) receipt.Complete(responseJson, statusCode, DateTimeOffset.UtcNow);
        else receipt.Reject(responseJson, statusCode, DateTimeOffset.UtcNow);
    }

    private ModuleExecutionResult BadRequest(string code, string message) =>
        new(ModuleExecutionOutcome.InvalidRequest, Error: new ModuleExecutionErrorResponse(code, message));

    private ModuleExecutionResult Conflict(string code, string message) =>
        new(ModuleExecutionOutcome.Conflict, Error: new ModuleExecutionErrorResponse(code, message));

    private ModuleExecutionResult Conflict(string code, string message, ModuleExecution execution) =>
        new(ModuleExecutionOutcome.Conflict, Error: new ModuleExecutionErrorResponse(code, message, execution.Revision, ToResponse(execution, null, [])));

    private ModuleExecutionResult EffectError(SessionOutcomeEffectResult effectResult, ModuleExecution execution)
    {
        var status = effectResult.Code is "session_revision_conflict" or "session_advanced"
            ? ModuleExecutionOutcome.Conflict
            : ModuleExecutionOutcome.Unprocessable;
        return new ModuleExecutionResult(
            status,
            Error: new ModuleExecutionErrorResponse(
                effectResult.Code!,
                effectResult.Message!,
                execution.Revision,
                ToResponse(execution, null, []),
                effectResult.CurrentSessionRevision));
    }

    private ModuleExecutionResult RuntimeError(string code, string message, ModuleExecution? execution = null)
    {
        var status = code switch
        {
            ModuleRuntimeErrorCodes.PackageNotFound => ModuleExecutionOutcome.NotFound,
            ModuleRuntimeErrorCodes.PackageDisabled => ModuleExecutionOutcome.Conflict,
            ModuleRuntimeErrorCodes.ContractViolation => ModuleExecutionOutcome.Unprocessable,
            _ => ModuleExecutionOutcome.Unavailable,
        };
        return new ModuleExecutionResult(status, Error: new ModuleExecutionErrorResponse(code, message, execution?.Revision, execution is null ? null : ToResponse(execution, null, [])));
    }

    private ModuleExecutionResponse ToResponse(ModuleExecution execution, ModuleError? transientError, IReadOnlyList<ModuleEvent> uiEvents) =>
        projection.ToResponse(execution, transientError, uiEvents);

    private int ResolveActionRandomValueCount(ModuleExecution execution, JsonElement action)
    {
        if (!action.TryGetProperty("id", out var idValue) || idValue.ValueKind != JsonValueKind.String)
            return 0;
        var actionId = idValue.GetString();
        var availableActions = JsonSerializer.Deserialize<IReadOnlyList<ModuleAvailableAction>>(execution.AvailableActionsJson, _json) ?? [];
        return availableActions.SingleOrDefault(item => item.Id == actionId && item.Enabled)?.RandomValueCount ?? 0;
    }

    private static IReadOnlyList<uint> GenerateRandomValues(int count)
    {
        var values = new uint[count];
        if (count == 0) return values;
        var bytes = new byte[count * sizeof(uint)];
        RandomNumberGenerator.Fill(bytes);
        for (var index = 0; index < count; index++) values[index] = BitConverter.ToUInt32(bytes, index * sizeof(uint));
        return values;
    }

    private ModuleObjectActionContext ParseBinding(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<ModuleObjectActionContext>(json, _json)
                ?? throw new JsonException("Object action binding is empty.");
        }
        catch (JsonException exception)
        {
            throw new ModuleRuntimeException(
                ModuleRuntimeErrorCodes.ContractViolation,
                "Object action bindingを読み込めません。",
                exception);
        }
    }

    private static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static int StatusCodeFor(ModuleExecutionOutcome outcome) => outcome switch
    {
        ModuleExecutionOutcome.Success => 200, ModuleExecutionOutcome.Created => 201, ModuleExecutionOutcome.NotFound => 404,
        ModuleExecutionOutcome.InvalidRequest => 400, ModuleExecutionOutcome.Conflict => 409,
        ModuleExecutionOutcome.Unprocessable => 422, _ => 503,
    };

    private static ModuleExecutionOutcome OutcomeFromStatusCode(int statusCode) => statusCode switch
    {
        200 => ModuleExecutionOutcome.Success, 201 => ModuleExecutionOutcome.Created, 400 => ModuleExecutionOutcome.InvalidRequest,
        404 => ModuleExecutionOutcome.NotFound, 409 => ModuleExecutionOutcome.Conflict, 422 => ModuleExecutionOutcome.Unprocessable,
        _ => ModuleExecutionOutcome.Unavailable,
    };

    private static string NewSessionTurnId() => $"TRN-{Guid.NewGuid():N}".ToUpperInvariant();

    private static string NewExecutionId() => $"MEX-{Guid.NewGuid():N}".ToUpperInvariant();
}
