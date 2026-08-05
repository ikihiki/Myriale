using System.Text.Json;

namespace Myriale.Api.Features.Sessions.Contracts;

public sealed record SessionTurnInspectionResponse(
    SessionInspectionMetadata Session,
    ScenarioInspectionMetadata Scenario,
    TurnInspectionMetadata Turn,
    PlayerInputInspection PlayerInput,
    ExecutionInspection Execution,
    IReadOnlyList<SessionAiInteractionInspection> AiInteractions,
    RuleEngineInspection? RuleEngine);

public sealed record SessionInspectionMetadata(string Id, string Status, long Revision, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record ScenarioInspectionMetadata(string Id, string Title, string? DefinitionVersionId);
public sealed record TurnInspectionMetadata(string Id, int Position, string Kind, string? Heading, string? NarrativeBody, DateTimeOffset CreatedAt);
public sealed record PlayerInputInspection(string Id, string Text, string InteractionType, DateTimeOffset AcceptedAt);

public sealed record ExecutionInspection(
    string Id,
    string Kind,
    string Status,
    string? Stage,
    int AttemptCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset QueuedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    long? ElapsedMilliseconds);

public sealed record SessionAiInteractionInspection(
    string Id,
    int AttemptNumber,
    int Sequence,
    string Stage,
    string AiProfileId,
    string? Provider,
    string? Model,
    string? ProviderRequestId,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    long ElapsedMilliseconds,
    long? LatencyMilliseconds,
    int? InputTokens,
    int? OutputTokens,
    string? FinishReason,
    string Status,
    string? ErrorCode,
    string? SentPrompt,
    string? ReceivedResult,
    string? ValidationResult);

public sealed record RuleEngineInspection(
    string StepId,
    string Stage,
    string SchemaVersion,
    long PreSessionRevision,
    long? PostSessionRevision,
    RuleActionSnapshot? ActionSnapshot,
    SessionScenarioTurnSelectedActionResponse? SelectedAction,
    string? SelectedRuleId,
    IReadOnlyList<RuleAppliedEffect> AppliedEffects,
    RulePostState? PostState,
    IReadOnlyList<string> Facts,
    IReadOnlyList<JsonElement> Events,
    IReadOnlyList<string> Hints,
    IReadOnlyList<RuleStateChangeInspection> Changes,
    RuleProcessingTimingInspection Timing);

public sealed record RuleStateChangeInspection(
    string Kind,
    string? TargetId,
    string Path,
    JsonElement? Before,
    JsonElement? After);

public sealed record RuleProcessingTimingInspection(
    DateTimeOffset CreatedAt,
    DateTimeOffset? EnumeratedAt,
    DateTimeOffset? SelectedAt,
    DateTimeOffset? AppliedAt,
    DateTimeOffset? NarrativePublishedAt,
    long? EnumerationElapsedMilliseconds,
    long? SelectionElapsedMilliseconds,
    long? ApplicationElapsedMilliseconds,
    long? NarrativeElapsedMilliseconds,
    long? TotalElapsedMilliseconds);
