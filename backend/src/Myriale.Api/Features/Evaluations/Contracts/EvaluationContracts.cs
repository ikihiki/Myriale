using System.Text.Json;

namespace Myriale.Api.Features.Evaluations.Contracts;

public sealed record CreateEvaluationSessionRequest(string Title, string? Purpose, IReadOnlyList<string>? Tags, string? Sensitivity,
    string? RetentionPolicy, JsonElement Config, JsonElement Rubric, JsonElement ReviewPolicy, string? IdempotencyKey);
public sealed record UpdateEvaluationSessionRequest(long Revision, string? Title, string? Purpose, IReadOnlyList<string>? Tags,
    JsonElement? Config, JsonElement? Rubric, JsonElement? ReviewPolicy);
public sealed record AddFixedEvaluationSituationRequest(string StableKey, string Stage, JsonElement Request, JsonElement Expectations,
    string? CorpusKey, string? CorpusVersion, string? CorpusCaseKey, string? Sensitivity);
public sealed record QuoteEvaluationSituationRequest(string StableKey, string Stage, SessionId SessionId, SessionTurnId TurnId,
    SessionAiInteractionId InteractionId, JsonElement Expectations, string? Sensitivity);
public sealed record AddEvaluationCandidateRequest(string CandidateKey, AiProviderProfileId ProfileId, int Repetitions,
    AiGenerationOverrides? GenerationOverrides, int? MaxInvocations);
public sealed record CreateEvaluationReviewBatchRequest(IReadOnlyList<AccountId> ReviewerIds, int RequiredReviewsPerOutput,
    string? RubricVersion, DateTimeOffset? Deadline);
public sealed record SaveBlindJudgmentRequest(long AssignmentRevision, string CriterionKey, decimal? Score, bool? Verdict,
    IReadOnlyList<string>? Tags, string? Comment, decimal? Confidence);

public sealed record EvaluationSessionSummaryResponse(EvaluationSessionId Id, string Title, string Purpose, IReadOnlyList<string> Tags,
    string Sensitivity, string Status, long Revision, int SituationCount, int CandidateCount, int PlannedAttemptCount,
    int TerminalAttemptCount, int SucceededAttemptCount, int FailedAttemptCount, int ReviewedItemCount, bool IdentitiesRevealed,
    DateTimeOffset CreatedAt, DateTimeOffset? CompletedAt);
public sealed record EvaluationSessionResponse(EvaluationSessionSummaryResponse Summary, JsonElement Config, JsonElement Rubric,
    JsonElement ReviewPolicy, IReadOnlyList<EvaluationSituationResponse> Situations, IReadOnlyList<EvaluationCandidateResponse> Candidates);
public sealed record EvaluationSituationResponse(EvaluationSituationId Id, string StableKey, int Revision, string Stage, string SourceKind,
    JsonElement Request, JsonElement Expectations, string RequestHash, string SourceBundleHash, JsonElement Citation);
public sealed record EvaluationCandidateResponse(EvaluationCandidateId Id, string CandidateKey, string BlindCode,
    AiProviderProfileId ProfileId, long ProfileRevision, string Provider, string Adapter, string Model, int Repetitions, bool IsActive);
public sealed record EvaluationExecutionResponse(EvaluationSessionSummaryResponse Session, IReadOnlyList<EvaluationAttemptResponse> Attempts);
public sealed record EvaluationAttemptResponse(EvaluationAttemptId Id, EvaluationSituationId SituationId, EvaluationCandidateId CandidateId,
    int Repetition, string Status, int InvocationCount, string? ErrorCode, DateTimeOffset? StartedAt, DateTimeOffset? CompletedAt,
    IReadOnlyList<EvaluationInvocationSummaryResponse> Invocations);
public sealed record EvaluationInvocationSummaryResponse(EvaluationModelInvocationId Id, int Number, string Status, string? ErrorCode,
    DateTimeOffset StartedAt, DateTimeOffset? CompletedAt);
public sealed record EvaluationRawInvocationResponse(EvaluationModelInvocationId Id, EvaluationAttemptId AttemptId, string Status,
    JsonElement RequestEnvelope, string? SentPrompt, string? RawResponse, string? RawError, JsonElement? ParsedOutput,
    JsonElement? Validation, string ProfileSnapshotJson, string GenerationConfigJson, string? Provider, string? Model,
    string? ProviderRequestId, string? FinishReason, int? InputTokens, int? OutputTokens, long? LatencyMilliseconds,
    string? ErrorCode, string? ErrorCategory, bool Retryable, DateTimeOffset StartedAt, DateTimeOffset? CompletedAt);
public sealed record EvaluationJudgmentResponse(EvaluationMachineJudgmentId Id, EvaluationAttemptId AttemptId,
    EvaluationModelInvocationId InvocationId, string JudgeKey, string JudgeVersion, string CriterionKey, bool Passed,
    decimal? Score, decimal? Confidence, IReadOnlyList<string> Labels, string Rationale, DateTimeOffset CreatedAt);
public sealed record BlindReviewAssignmentResponse(string OpaqueCode, string Status, long Revision, JsonElement Rubric,
    IReadOnlyList<BlindReviewItemResponse> Items);
public sealed record BlindReviewItemResponse(EvaluationReviewItemId Id, string CandidateCode, string Stage,
    JsonElement Situation, JsonElement Response, int DisplayOrder, IReadOnlyList<BlindHumanJudgmentResponse> Judgments);
public sealed record BlindHumanJudgmentResponse(EvaluationHumanJudgmentId Id, string CriterionKey, decimal? Score, bool? Verdict,
    IReadOnlyList<string> Tags, string Comment, decimal? Confidence, int Revision, DateTimeOffset SubmittedAt);
public sealed record EvaluationResultsResponse(EvaluationSessionId SessionId, string Status, int AggregateRevision,
    IReadOnlyList<EvaluationCandidateResultResponse> Candidates, IReadOnlyList<EvaluationJudgmentResponse> MachineJudgments,
    int HumanJudgmentCount, JsonElement? Aggregate);
public sealed record EvaluationCandidateResultResponse(EvaluationCandidateId CandidateId, string CandidateKey, string DisplayIdentity,
    int AttemptCount, int SucceededCount, int PassedCount, decimal PassRate, long? InputTokens, long? OutputTokens, long? LatencyMilliseconds);
public sealed record EvaluationCorpusManifestResponse(string CorpusId, string Version, string Description,
    IReadOnlyList<EvaluationCorpusCaseResponse> Cases);
public sealed record EvaluationCorpusCaseResponse(string CaseId, string Stage, JsonElement Request, JsonElement Expectations);
public sealed record EvaluationErrorResponse(string Error, string Code);
