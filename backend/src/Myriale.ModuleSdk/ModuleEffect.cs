using System.Text.Json;

namespace Myriale.ModuleSdk;

public sealed record ModuleEffect(
    string Type,
    JsonElement Payload);
