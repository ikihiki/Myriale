using System.Text.Json;
using System.Text.Json.Serialization;

namespace Myriale.ModuleSdk;

public static class ModuleExecutionStatuses
{
    public const string Active = "active";
    public const string Completed = "completed";
    public const string Failed = "failed";
}

public sealed record ModuleValidationResult(
    IReadOnlyList<ModuleValidationIssue> Issues)
{
    [JsonIgnore]
    public bool IsValid => Issues.All(issue => issue.Severity != ModuleValidationSeverity.Error);
}

public sealed record ModuleValidationIssue(
    string Path,
    string Code,
    string Message,
    ModuleValidationSeverity Severity);

public enum ModuleValidationSeverity
{
    Information,
    Warning,
    Error
}

public sealed record ModuleInitializationResult(
    string Status,
    JsonElement State,
    JsonElement ViewState,
    IReadOnlyList<ModuleAvailableAction> AvailableActions,
    ModuleOutcome? Outcome = null,
    ModuleError? Error = null);

public sealed record ModuleTransitionResult(
    string Status,
    long Revision,
    JsonElement State,
    JsonElement ViewState,
    IReadOnlyList<ModuleAvailableAction> AvailableActions,
    IReadOnlyList<ModuleEvent> UiEvents,
    ModuleOutcome? Outcome = null,
    ModuleError? Error = null);

public sealed record ModuleAvailableAction(
    string Id,
    string Label,
    bool Enabled,
    string? DisabledReason = null,
    int RandomValueCount = 0);

public sealed record ModuleEvent(
    string Type,
    JsonElement Payload);

public sealed record ModuleOutcome(
    string Category,
    string Code,
    string Title,
    string Summary,
    IReadOnlyList<ModuleFact> PublicFacts,
    IReadOnlyList<ModuleEffect> Effects,
    IReadOnlyList<ModuleEvent> EmittedEvents,
    IReadOnlyList<string> NarrativeHints,
    IReadOnlyList<string> ForbiddenNarrativeFacts);

public sealed record ModuleFact(
    string Type,
    string Text);

public sealed record ModuleError(
    string Code,
    string Message,
    JsonElement? Details = null);
