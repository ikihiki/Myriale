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

public sealed record SessionInspectionMetadata(SessionId Id, string Status, long Revision, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record ScenarioInspectionMetadata(ScenarioId Id, string Title, ScenarioDefinitionVersionId? DefinitionVersionId);
public sealed record TurnInspectionMetadata(SessionTurnId Id, int Position, string Kind, string? Heading, string? NarrativeBody, DateTimeOffset CreatedAt);
public sealed record PlayerInputInspection(SessionPlayerInputId Id, string Text, string InteractionType, DateTimeOffset AcceptedAt);

public sealed record ExecutionInspection(
    SessionExecutionId Id,
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
    SessionAiInteractionId Id,
    int AttemptNumber,
    int Sequence,
    string Stage,
    AiProviderProfileId AiProfileId,
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
    SessionRuleActionStepId StepId,
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
