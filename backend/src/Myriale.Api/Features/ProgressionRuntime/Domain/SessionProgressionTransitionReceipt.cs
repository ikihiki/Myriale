using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.ProgressionRuntime.Domain;

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
    ModulePackageModuleId ModuleId,
    ModulePackageVersion ModuleVersion,
    ModulePackageDigest ModuleDigest,
    string ConfigurationJson,
    string ContextJson,
    int RandomValueCount)
{
    public bool IsComplete => !ModuleId.Equals(default)
        && !ModuleVersion.Equals(default)
        && ModuleDigest.AsPrimitive().Length == 64
        && !string.IsNullOrWhiteSpace(ConfigurationJson)
        && !string.IsNullOrWhiteSpace(ContextJson)
        && RandomValueCount >= 0;
}

public sealed class SessionProgressionTransitionReceipt
{
    public const string MissingSnapshotErrorCode = "module_snapshot_missing";
    public const string MissingSnapshotErrorMessage = "進行遷移にModule snapshotが設定されていません。";

    [Key, MaxLength(40)] public SessionProgressionTransitionReceiptId Id { get; private set; }
    [Required, MaxLength(40)] public SessionId SessionId { get; private set; }
    [Required, MaxLength(40)] public SessionNarrativeSignalId SourceSignalId { get; private set; }
    [Required, MaxLength(80)] public ScenarioProgressionTransitionId TransitionId { get; private set; }
    [Required, MaxLength(80)] public ScenarioProgressionNodeId FromNodeId { get; private set; }
    [Required, MaxLength(80)] public ScenarioProgressionNodeId ToNodeId { get; private set; }
    [Required, MaxLength(32)] public ProgressionReceiptStatus Status { get; private set; } = ProgressionReceiptStatus.Pending;
    [MaxLength(160)] public ModulePackageModuleId? ModuleId { get; private set; }
    [MaxLength(80)] public ModulePackageVersion? ModuleVersion { get; private set; }
    [MaxLength(64)] public ModulePackageDigest? ModuleDigest { get; private set; }
    public string? ModuleConfigurationJson { get; private set; }
    public string? ModuleContextJson { get; private set; }
    public int ModuleRandomValueCount { get; private set; }
    [MaxLength(40)] public SessionTurnId? ModuleTurnId { get; private set; }
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
        SessionProgressionTransitionReceiptId id,
        SessionId sessionId,
        SessionNarrativeSignalId sourceSignalId,
        ScenarioProgressionTransitionId transitionId,
        ScenarioProgressionNodeId fromNodeId,
        ScenarioProgressionNodeId toNodeId,
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
        : new(ModuleId.Value, ModuleVersion.Value, ModuleDigest.Value, ModuleConfigurationJson, ModuleContextJson, ModuleRandomValueCount);

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

    public bool Complete(string leaseId, SessionTurnId moduleTurnId, DateTimeOffset now)
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
