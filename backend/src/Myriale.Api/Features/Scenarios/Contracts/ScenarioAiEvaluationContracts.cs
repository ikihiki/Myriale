using System.Text.Json;

namespace Myriale.Api.Features.Scenarios.Contracts;

public sealed record CreateScenarioAiEvaluationRunRequest(
    IReadOnlyList<AiProviderProfileId> ProfileIds,
    int Repetitions,
    string? CorpusId,
    string? CorpusVersion,
    JsonElement Config,
    IReadOnlyList<ScenarioAiEvaluationCaseInput> Cases);

public sealed record ScenarioAiEvaluationCaseInput(
    string CaseId,
    string Stage,
    JsonElement Request,
    JsonElement Metadata);

public sealed record ScenarioAiEvaluationRunSummaryResponse(
    ScenarioAiEvaluationRunId Id,
    ScenarioId ScenarioId,
    string Status,
    string CorpusId,
    string CorpusVersion,
    IReadOnlyList<AiProviderProfileId> ProfileIds,
    int Repetitions,
    int CaseCount,
    int AttemptCount,
    int PassedAttemptCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt);

public sealed record ScenarioAiEvaluationRunResponse(
    ScenarioAiEvaluationRunSummaryResponse Summary,
    JsonElement Config,
    IReadOnlyList<ScenarioAiEvaluationCaseResponse> Cases);

public sealed record ScenarioAiEvaluationCaseResponse(
    ScenarioAiEvaluationCaseId Id,
    string CaseId,
    string Stage,
    string CanonicalPayloadHash,
    JsonElement Request,
    JsonElement Metadata,
    IReadOnlyList<ScenarioAiEvaluationAttemptResponse> Attempts);

public sealed record ScenarioAiEvaluationAttemptResponse(
    ScenarioAiEvaluationAttemptId Id,
    AiProviderProfileId ProfileId,
    long ProfileRevision,
    string Model,
    int Repetition,
    string BlindCode,
    string Status,
    bool Passed,
    IReadOnlyList<string> Labels,
    JsonElement Output,
    JsonElement Metadata,
    string? ErrorCode,
    long? InputTokens,
    long? OutputTokens,
    long? LatencyMilliseconds,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt);

public sealed record ScenarioAiEvaluationCorpusManifestResponse(
    string CorpusId,
    string Version,
    string Description,
    IReadOnlyList<ScenarioAiEvaluationCorpusStageResponse> Stages);

public sealed record ScenarioAiEvaluationCorpusStageResponse(string Stage, int PlannedCaseCount, int PlannedRepetitions);
