using System.Text.Json;

namespace Myriale.ModuleSdk;

public sealed record ModuleValidationRequest(
    string RequestId,
    JsonElement Configuration);

/// <summary>
/// Immutable host-selected context for the Object action binding that invoked the extension.
/// A module can inspect this context, but cannot select a different Object, action, module, or progression target.
/// </summary>
public sealed record ModuleObjectActionContext(
    string ObjectId,
    string ObjectTypeId,
    string ActionId,
    JsonElement Arguments,
    JsonElement ObjectState);

public sealed record ModuleInitializationRequest(
    string RequestId,
    JsonElement Configuration,
    ModuleObjectActionContext Binding,
    IReadOnlyList<uint> RandomValues);

public sealed record ModuleDispatchRequest(
    string RequestId,
    long ExpectedRevision,
    JsonElement Configuration,
    ModuleObjectActionContext Binding,
    JsonElement State,
    JsonElement Action,
    IReadOnlyList<uint> RandomValues);
