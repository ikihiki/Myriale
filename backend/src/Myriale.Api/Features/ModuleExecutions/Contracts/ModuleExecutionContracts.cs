using Myriale.Api.Architecture;
using System.Text.Json;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModuleExecutions.Contracts;

public sealed record InitializeModuleExecutionRequest(
    string RequestId,
    ModulePackageModuleId ModuleId,
    ModulePackageVersion Version,
    ModulePackageDigest Digest,
    JsonElement Configuration,
    JsonElement Context,
    int RandomValueCount = 0);

public sealed record DispatchModuleExecutionRequest(
    string RequestId,
    long ExpectedRevision,
    JsonElement Action);

public sealed record ModuleExecutionPackageResponse(
    ModulePackageModuleId ModuleId,
    ModulePackageVersion Version,
    ModulePackageDigest Digest,
    string ContractVersion,
    int ConfigurationSchemaVersion,
    int StateSchemaVersion);

[CrossSliceContract]
public sealed record ModuleExecutionResponse(
    ModuleExecutionId Id,
    ModuleExecutionPackageResponse Package,
    ModuleExecutionStatus Status,
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
