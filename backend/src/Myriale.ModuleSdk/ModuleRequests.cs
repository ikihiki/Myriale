using System.Text.Json;

namespace Myriale.ModuleSdk;

public sealed record ModuleValidationRequest(
    string RequestId,
    JsonElement Configuration);

public sealed record ModuleInitializationRequest(
    string RequestId,
    JsonElement Configuration,
    JsonElement Context,
    IReadOnlyList<uint> RandomValues);

public sealed record ModuleDispatchRequest(
    string RequestId,
    long ExpectedRevision,
    JsonElement Configuration,
    JsonElement Context,
    JsonElement State,
    JsonElement Action,
    IReadOnlyList<uint> RandomValues);
