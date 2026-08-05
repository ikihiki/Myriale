using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Data;

public enum ProgressionReceiptStatus { Pending, WaitingConfiguration, Completed, Failed }

public static class ProgressionReceiptStatusValues
{
    public static string ToWireValue(this ProgressionReceiptStatus value) => value switch
    {
        ProgressionReceiptStatus.Pending => "pending",
        ProgressionReceiptStatus.WaitingConfiguration => "waiting-configuration",
        ProgressionReceiptStatus.Completed => "completed",
        ProgressionReceiptStatus.Failed => "failed",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };

    public static ProgressionReceiptStatus Parse(string value) => value switch
    {
        "pending" => ProgressionReceiptStatus.Pending,
        "waiting-configuration" => ProgressionReceiptStatus.WaitingConfiguration,
        "completed" => ProgressionReceiptStatus.Completed,
        "failed" => ProgressionReceiptStatus.Failed,
        _ => throw new InvalidOperationException($"Unknown progression receipt status '{value}'."),
    };
}

public sealed record ProgressionModuleSnapshot(
    string ModuleId,
    string ModuleVersion,
    string ModuleDigest,
    string ConfigurationJson,
    string ContextJson,
    int RandomValueCount)
{
    public bool IsComplete => !string.IsNullOrWhiteSpace(ModuleId)
        && !string.IsNullOrWhiteSpace(ModuleVersion)
        && ModuleDigest.Length == 64
        && !string.IsNullOrWhiteSpace(ConfigurationJson)
        && !string.IsNullOrWhiteSpace(ContextJson)
        && RandomValueCount >= 0;
}

public sealed class SessionProgressionTransitionReceipt
{
    public const string MissingSnapshotErrorCode = "module_snapshot_missing";
    public const string MissingSnapshotErrorMessage = "進行遷移にModule snapshotが設定されていません。";

    [Key, MaxLength(40)] public string Id { get; private set; } = string.Empty;
    [Required, MaxLength(40)] public string SessionId { get; private set; } = string.Empty;
    [Required, MaxLength(40)] public string SourceSignalId { get; private set; } = string.Empty;
    [Required, MaxLength(80)] public string TransitionId { get; private set; } = string.Empty;
    [Required, MaxLength(80)] public string FromNodeId { get; private set; } = string.Empty;
    [Required, MaxLength(80)] public string ToNodeId { get; private set; } = string.Empty;
    [Required, MaxLength(32)] public ProgressionReceiptStatus Status { get; private set; } = ProgressionReceiptStatus.Pending;
    [MaxLength(160)] public string? ModuleId { get; private set; }
    [MaxLength(80)] public string? ModuleVersion { get; private set; }
    [MaxLength(64)] public string? ModuleDigest { get; private set; }
    public string? ModuleConfigurationJson { get; private set; }
    public string? ModuleContextJson { get; private set; }
    public int ModuleRandomValueCount { get; private set; }
    [MaxLength(40)] public string? ModuleTurnId { get; private set; }
    public long Revision { get; private set; }
    public int AttemptCount { get; private set; }
    [MaxLength(40)] public string? LeaseId { get; private set; }
    public DateTimeOffset? LeaseExpiresAt { get; private set; }
    public bool IsRetryable { get; private set; } = true;
    public string? ErrorCode { get; private set; }
    public string? ErrorMessage { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public Session Session { get; private set; } = null!;
    public SessionNarrativeSignal SourceSignal { get; private set; } = null!;
    public ScenarioProgressionTransition Transition { get; private set; } = null!;
    public SessionTurn? ModuleTurn { get; private set; }

    public static SessionProgressionTransitionReceipt Create(
        string id,
        string sessionId,
        string sourceSignalId,
        string transitionId,
        string fromNodeId,
        string toNodeId,
        ProgressionModuleSnapshot? snapshot,
        DateTimeOffset now)
    {
        var receipt = new SessionProgressionTransitionReceipt
        {
            Id = id,
            SessionId = sessionId,
            SourceSignalId = sourceSignalId,
            TransitionId = transitionId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            CreatedAt = now,
            UpdatedAt = now,
        };
        if (snapshot is not null)
        {
            receipt.ModuleId = snapshot.ModuleId;
            receipt.ModuleVersion = snapshot.ModuleVersion;
            receipt.ModuleDigest = snapshot.ModuleDigest;
            receipt.ModuleConfigurationJson = snapshot.ConfigurationJson;
            receipt.ModuleContextJson = snapshot.ContextJson;
            receipt.ModuleRandomValueCount = snapshot.RandomValueCount;
        }
        if (!receipt.HasCompleteSnapshot) receipt.RecordMissingSnapshot(now);
        return receipt;
    }

    public bool HasCompleteSnapshot => ModuleSnapshot is { IsComplete: true };

    public ProgressionModuleSnapshot? ModuleSnapshot => ModuleId is null || ModuleVersion is null || ModuleDigest is null
        || ModuleConfigurationJson is null || ModuleContextJson is null
        ? null
        : new(ModuleId, ModuleVersion, ModuleDigest, ModuleConfigurationJson, ModuleContextJson, ModuleRandomValueCount);

    public bool CanClaim(DateTimeOffset now) => Status != ProgressionReceiptStatus.Completed
        && IsRetryable
        && (LeaseExpiresAt is null || LeaseExpiresAt <= now);

    public void RecordMissingSnapshot(DateTimeOffset now)
    {
        Status = ProgressionReceiptStatus.WaitingConfiguration;
        IsRetryable = false;
        ErrorCode = MissingSnapshotErrorCode;
        ErrorMessage = MissingSnapshotErrorMessage;
        ClearLease();
        UpdatedAt = now;
        Revision++;
    }

    public bool Claim(string leaseId, DateTimeOffset leaseExpiresAt, DateTimeOffset now)
    {
        if (!HasCompleteSnapshot || !CanClaim(now)) return false;
        Status = ProgressionReceiptStatus.Pending;
        Revision++;
        AttemptCount++;
        LeaseId = leaseId;
        LeaseExpiresAt = leaseExpiresAt;
        ErrorCode = null;
        ErrorMessage = null;
        UpdatedAt = now;
        return true;
    }

    public bool Complete(string leaseId, string moduleTurnId, DateTimeOffset now)
    {
        if (!OwnsLease(leaseId)) return false;
        Status = ProgressionReceiptStatus.Completed;
        IsRetryable = false;
        ModuleTurnId = moduleTurnId;
        ClearLease();
        ErrorCode = null;
        ErrorMessage = null;
        UpdatedAt = now;
        CompletedAt = now;
        Revision++;
        return true;
    }

    public bool Fail(string leaseId, string code, string message, bool retryable, DateTimeOffset now)
    {
        if (!OwnsLease(leaseId)) return false;
        Status = ProgressionReceiptStatus.Failed;
        IsRetryable = retryable;
        ClearLease();
        ErrorCode = code;
        ErrorMessage = message;
        UpdatedAt = now;
        Revision++;
        return true;
    }

    public bool Release(string leaseId, DateTimeOffset now)
    {
        if (!OwnsLease(leaseId)) return false;
        Status = ProgressionReceiptStatus.Pending;
        ClearLease();
        UpdatedAt = now;
        Revision++;
        return true;
    }

    private bool OwnsLease(string leaseId) => LeaseId is not null && LeaseId == leaseId;
    private void ClearLease() { LeaseId = null; LeaseExpiresAt = null; }
}
