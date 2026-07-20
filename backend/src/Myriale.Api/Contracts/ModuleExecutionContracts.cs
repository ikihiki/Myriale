using System.Text.Json;
using Myriale.ModuleSdk;

namespace Myriale.Api.Contracts;

public sealed record InitializeModuleExecutionRequest(
    string RequestId,
    string ModuleId,
    string Version,
    string Digest,
    JsonElement Configuration,
    JsonElement Context,
    int RandomValueCount = 0);

public sealed record DispatchModuleExecutionRequest(
    string RequestId,
    long ExpectedRevision,
    JsonElement Action,
    int RandomValueCount = 0);

public sealed record ModuleExecutionPackageResponse(
    string ModuleId,
    string Version,
    string Digest,
    string ContractVersion,
    int ConfigurationSchemaVersion,
    int StateSchemaVersion);

public sealed record ModuleExecutionResponse(
    string Id,
    ModuleExecutionPackageResponse Package,
    string Status,
    long Revision,
    JsonElement ViewState,
    IReadOnlyList<ModuleAvailableAction> AvailableActions,
    ModuleOutcome? Outcome,
    ModuleError? Error,
    IReadOnlyList<ModuleEvent> UiEvents,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CompletedAt);

public sealed record ModuleExecutionErrorResponse(
    string Code,
    string Message,
    long? CurrentRevision = null,
    ModuleExecutionResponse? Execution = null,
    long? CurrentSessionRevision = null);
