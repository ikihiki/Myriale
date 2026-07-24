using System.Text.Json;

namespace Myriale.Api.Contracts;

public sealed record ScenarioRuleDataRequest(
    int SchemaVersion,
    IReadOnlyList<ScenarioLocationInput> Locations,
    IReadOnlyList<ScenarioObjectTypeInput> ObjectTypes,
    IReadOnlyList<ScenarioObjectInput> Objects);

public sealed record ScenarioLocationInput(string Code, string Name, string? Description, JsonElement AuthoringData);

public sealed record ScenarioObjectTypeInput(
    string Code,
    string Name,
    string? Description,
    int SchemaVersion,
    JsonElement StateSchema,
    JsonElement DefaultState,
    JsonElement PublicProjection,
    IReadOnlyList<ScenarioObjectTypeActionInput> Actions);

public sealed record ScenarioObjectTypeActionInput(
    string Code,
    string Label,
    string? Description,
    JsonElement ArgumentSchema,
    JsonElement AvailabilityCondition,
    string Visibility,
    string ExecutionMode);

public sealed record ScenarioObjectInput(
    string Code,
    string Name,
    string ObjectTypeCode,
    string LocationCode,
    JsonElement InitialStateOverride,
    bool IsGlobal,
    IReadOnlyList<ScenarioObjectActionRuleInput> ActionRules);

public sealed record ScenarioObjectActionRuleInput(
    string ActionCode,
    JsonElement Condition,
    int Priority,
    string? AuthoringNote,
    JsonElement Effects,
    ScenarioModuleBindingInput? ModuleBinding);

public sealed record ScenarioModuleBindingInput(
    string ModuleId,
    string Version,
    string Digest,
    JsonElement Configuration);

public sealed record ScenarioRuleDataResponse(
    string ScenarioId,
    string DefinitionVersionId,
    int Version,
    string Status,
    int SchemaVersion,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<ScenarioLocationInput> Locations,
    IReadOnlyList<ScenarioObjectTypeInput> ObjectTypes,
    IReadOnlyList<ScenarioObjectInput> Objects);

public sealed record ScenarioDefinitionReadinessResponse(
    string DefinitionVersionId,
    bool Ready,
    IReadOnlyDictionary<string, string[]> Errors);
