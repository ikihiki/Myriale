using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using Myriale.ModuleSdk;

namespace Myriale.Api.Data;

[JsonConverter(typeof(JsonStringEnumConverter<ModuleExecutionStatus>))]
public enum ModuleExecutionStatus { Initializing, Active, Completed, Failed }

public static class ModuleExecutionStatusValues
{
    public static string ToWireValue(this ModuleExecutionStatus value) => value switch
    {
        ModuleExecutionStatus.Initializing => "initializing",
        ModuleExecutionStatus.Active => "active",
        ModuleExecutionStatus.Completed => "completed",
        ModuleExecutionStatus.Failed => "failed",
        _ => throw new ArgumentOutOfRangeException(nameof(value)),
    };

    public static ModuleExecutionStatus Parse(string value) => value switch
    {
        "initializing" => ModuleExecutionStatus.Initializing,
        ModuleExecutionStatuses.Active => ModuleExecutionStatus.Active,
        ModuleExecutionStatuses.Completed => ModuleExecutionStatus.Completed,
        ModuleExecutionStatuses.Failed => ModuleExecutionStatus.Failed,
        _ => throw new InvalidOperationException($"Unknown module execution status '{value}'."),
    };

    public static bool IsTerminal(this ModuleExecutionStatus value) => value is ModuleExecutionStatus.Completed or ModuleExecutionStatus.Failed;
}

public sealed record ModuleExecutionPackageSnapshot(
    string ModuleId,
    string Version,
    string Digest,
    string ContractVersion,
    IReadOnlyList<string> Capabilities,
    int ConfigurationSchemaVersion,
    int StateSchemaVersion);

public sealed class ModuleExecution
{
    [Key, MaxLength(40)] public string Id { get; internal set; } = string.Empty;
    [Required, MaxLength(450)] public string OwnerId { get; internal set; } = string.Empty;
    [Required, MaxLength(200)] public string ModuleId { get; internal set; } = string.Empty;
    [Required, MaxLength(64)] public string ModuleVersion { get; internal set; } = string.Empty;
    [Required, MaxLength(64)] public string ModuleDigest { get; internal set; } = string.Empty;
    [Required, MaxLength(32)] public string ContractVersion { get; internal set; } = string.Empty;
    [Required] public string CapabilitiesJson { get; internal set; } = "[]";
    public int ConfigurationSchemaVersion { get; internal set; }
    public int StateSchemaVersion { get; internal set; }
    [Required] public string ConfigurationJson { get; internal set; } = string.Empty;
    [Required] public string ContextJson { get; internal set; } = string.Empty;
    [Required] public string StateJson { get; internal set; } = "{}";
    [Required] public string ViewStateJson { get; internal set; } = "{}";
    [Required] public string AvailableActionsJson { get; internal set; } = "[]";
    [Required, MaxLength(32)] public ModuleExecutionStatus Status { get; internal set; } = ModuleExecutionStatus.Initializing;
    public long Revision { get; internal set; } = -1;
    public string? OutcomeJson { get; internal set; }
    public string? ErrorJson { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset UpdatedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    [MaxLength(40)] public string? SessionTurnId { get; internal set; }
    public ModuleOutcomeApplication? OutcomeApplication { get; internal set; }
    public ICollection<ModuleExecutionRequest> Requests { get; internal set; } = [];
    public SessionTurn? SessionTurn { get; internal set; }

    public static ModuleExecution Create(
        string id, string ownerId, ModuleExecutionPackageSnapshot package,
        JsonElement configuration, JsonElement context, DateTimeOffset now) => new()
    {
        Id = id, OwnerId = ownerId, ModuleId = package.ModuleId, ModuleVersion = package.Version,
        ModuleDigest = package.Digest, ContractVersion = package.ContractVersion,
        CapabilitiesJson = JsonSerializer.Serialize(package.Capabilities, ModuleJsonSerializerOptions.Create()),
        ConfigurationSchemaVersion = package.ConfigurationSchemaVersion,
        StateSchemaVersion = package.StateSchemaVersion,
        ConfigurationJson = configuration.GetRawText(), ContextJson = context.GetRawText(),
        Status = ModuleExecutionStatus.Initializing, Revision = -1, CreatedAt = now, UpdatedAt = now,
    };

    public void AttachSessionTurn(string sessionTurnId)
    {
        if (SessionTurnId is not null && SessionTurnId != sessionTurnId) throw new InvalidOperationException("Module execution already belongs to another session turn.");
        SessionTurnId = sessionTurnId;
    }

    public void CompleteInitialization(ModuleInitializationResult result, JsonSerializerOptions json, DateTimeOffset now)
    {
        if (Status != ModuleExecutionStatus.Initializing || Revision != -1) throw new InvalidOperationException("Initialization has already completed.");
        Apply(ModuleExecutionStatusValues.Parse(result.Status), 0, result.State, result.ViewState, result.AvailableActions, result.Outcome, result.Error, json, now);
    }

    public void FailInitialization(ModuleError error, JsonSerializerOptions json, DateTimeOffset now)
    {
        if (Status != ModuleExecutionStatus.Initializing || Revision != -1) throw new InvalidOperationException("Initialization has already completed.");
        Apply(ModuleExecutionStatus.Failed, 0, default, default, [], null, error, json, now, preserveState: true);
    }

    public void AcceptDispatch(long expectedRevision)
    {
        if (Status != ModuleExecutionStatus.Active) throw new InvalidOperationException("Only active executions accept actions.");
        if (Revision != expectedRevision) throw new ModuleExecutionRevisionConflictException(expectedRevision, Revision);
    }

    public void CompleteDispatch(ModuleTransitionResult transition, JsonSerializerOptions json, DateTimeOffset now)
    {
        AcceptDispatch(transition.Revision - 1);
        Apply(ModuleExecutionStatusValues.Parse(transition.Status), transition.Revision, transition.State, transition.ViewState,
            transition.AvailableActions, transition.Outcome, transition.Error, json, now);
    }

    private void Apply(ModuleExecutionStatus status, long revision, JsonElement state, JsonElement viewState,
        IReadOnlyList<ModuleAvailableAction> actions, ModuleOutcome? outcome, ModuleError? error,
        JsonSerializerOptions json, DateTimeOffset now, bool preserveState = false)
    {
        if (Status.IsTerminal()) throw new InvalidOperationException("Terminal module executions cannot transition.");
        Status = status; Revision = revision;
        if (!preserveState) { StateJson = state.GetRawText(); ViewStateJson = viewState.GetRawText(); AvailableActionsJson = JsonSerializer.Serialize(actions, json); }
        OutcomeJson = outcome is null ? null : JsonSerializer.Serialize(outcome, json);
        ErrorJson = error is null ? null : JsonSerializer.Serialize(error, json);
        UpdatedAt = now; CompletedAt = status.IsTerminal() ? now : null;
    }
}

public sealed class ModuleExecutionRevisionConflictException(long expected, long actual)
    : Exception($"ModuleExecution revision conflict. Expected {expected}, actual {actual}.")
{
    public long ExpectedRevision { get; } = expected;
    public long ActualRevision { get; } = actual;
}
