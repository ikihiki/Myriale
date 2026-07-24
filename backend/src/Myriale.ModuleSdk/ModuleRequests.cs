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

[method: System.Text.Json.Serialization.JsonConstructor]
public sealed record ModuleInitializationRequest(
    string RequestId,
    JsonElement Configuration,
    ModuleObjectActionContext Binding,
    IReadOnlyList<uint> RandomValues)
{
    [Obsolete("Use the Object-action binding constructor. Unbound host calls are rejected by the runtime.")]
    public ModuleInitializationRequest(string requestId, JsonElement configuration, JsonElement context, IReadOnlyList<uint> randomValues)
        : this(requestId, configuration, ModuleObjectActionContextAdapter.FromUnboundHostContext(context), randomValues) { }
}

[method: System.Text.Json.Serialization.JsonConstructor]
public sealed record ModuleDispatchRequest(
    string RequestId,
    long ExpectedRevision,
    JsonElement Configuration,
    ModuleObjectActionContext Binding,
    JsonElement State,
    JsonElement Action,
    IReadOnlyList<uint> RandomValues)
{
    [Obsolete("Use the Object-action binding constructor. Unbound host calls are rejected by the runtime.")]
    public ModuleDispatchRequest(string requestId, long expectedRevision, JsonElement configuration, JsonElement context, JsonElement state, JsonElement action, IReadOnlyList<uint> randomValues)
        : this(requestId, expectedRevision, configuration, ModuleObjectActionContextAdapter.FromUnboundHostContext(context), state, action, randomValues) { }
}

internal static class ModuleObjectActionContextAdapter
{
    public static ModuleObjectActionContext FromUnboundHostContext(JsonElement context)
    {
        var empty = JsonSerializer.SerializeToElement(new { });
        return new ModuleObjectActionContext(
            ReadIdentifier(context, "objectId"),
            ReadIdentifier(context, "objectTypeId"),
            ReadIdentifier(context, "actionId"),
            context.ValueKind == JsonValueKind.Object && context.TryGetProperty("arguments", out var arguments) ? arguments.Clone() : empty,
            context.ValueKind == JsonValueKind.Object && context.TryGetProperty("objectState", out var state) ? state.Clone() : empty);
    }

    private static string ReadIdentifier(JsonElement context, string property) =>
        context.ValueKind == JsonValueKind.Object
        && context.TryGetProperty(property, out var value)
        && value.ValueKind == JsonValueKind.String
        && !string.IsNullOrWhiteSpace(value.GetString())
            ? value.GetString()!
            : string.Empty;
}
