using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Myriale.Api.Features.ModuleExecutions.Domain;

public enum ModuleExecutionRequestOperation { Initialize, Dispatch }
public enum ModuleExecutionRequestStatus { Pending, Succeeded, Rejected }

public sealed class ModuleExecutionRequest
{
    public ModuleExecutionRequestId Id { get; internal set; }
    [Required, MaxLength(450)] public AccountId OwnerId { get; internal set; }
    [Required, MaxLength(40)] public ModuleExecutionId ExecutionId { get; internal set; }
    [Required, MaxLength(128)] public string RequestId { get; internal set; } = string.Empty;
    [Required, MaxLength(20)] public ModuleExecutionRequestOperation Operation { get; internal set; }
    public long? ExpectedRevision { get; internal set; }
    public long? ExpectedSessionRevision { get; internal set; }
    [Required, MaxLength(64)] public string PayloadHash { get; internal set; } = string.Empty;
    public string? ActionJson { get; internal set; }
    [Required] public string RandomValuesJson { get; internal set; } = "[]";
    [Required, MaxLength(20)] public ModuleExecutionRequestStatus Status { get; internal set; } = ModuleExecutionRequestStatus.Pending;
    public string? ResponseJson { get; internal set; }
    public int? ResponseStatusCode { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    public ModuleOutcomeApplication? OutcomeApplication { get; internal set; }
    public ModuleExecution Execution { get; internal set; } = null!;

    public static ModuleExecutionRequest CreateInitialization(AccountId ownerId, ModuleExecutionId executionId, string requestId,
        string payloadHash, long? expectedSessionRevision, IReadOnlyList<uint> randomValues, JsonSerializerOptions json, DateTimeOffset now) => new()
    {
        OwnerId = ownerId, ExecutionId = executionId, RequestId = requestId, Operation = ModuleExecutionRequestOperation.Initialize,
        PayloadHash = payloadHash, ExpectedSessionRevision = expectedSessionRevision,
        RandomValuesJson = JsonSerializer.Serialize(randomValues, json), CreatedAt = now,
    };

    public static ModuleExecutionRequest CreateDispatch(AccountId ownerId, ModuleExecutionId executionId, string requestId,
        string payloadHash, long expectedRevision, long? expectedSessionRevision, JsonElement action,
        IReadOnlyList<uint> randomValues, JsonSerializerOptions json, DateTimeOffset now) => new()
    {
        OwnerId = ownerId, ExecutionId = executionId, RequestId = requestId, Operation = ModuleExecutionRequestOperation.Dispatch,
        PayloadHash = payloadHash, ExpectedRevision = expectedRevision, ExpectedSessionRevision = expectedSessionRevision,
        ActionJson = action.GetRawText(), RandomValuesJson = JsonSerializer.Serialize(randomValues, json), CreatedAt = now,
    };

    public bool Matches(string payloadHash) => string.Equals(PayloadHash, payloadHash, StringComparison.Ordinal);
    public void Complete(string responseJson, int responseStatusCode, DateTimeOffset now)
    {
        if (Status != ModuleExecutionRequestStatus.Pending) throw new InvalidOperationException("Receipt is already closed.");
        Status = ModuleExecutionRequestStatus.Succeeded; ResponseJson = responseJson; ResponseStatusCode = responseStatusCode; CompletedAt = now;
    }
    public void Reject(string responseJson, int responseStatusCode, DateTimeOffset now)
    {
        if (Status != ModuleExecutionRequestStatus.Pending) throw new InvalidOperationException("Receipt is already closed.");
        Status = ModuleExecutionRequestStatus.Rejected; ResponseJson = responseJson; ResponseStatusCode = responseStatusCode; CompletedAt = now;
    }
}
