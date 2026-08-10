using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Evaluations.Domain;

public sealed class EvaluationModelInvocation
{
    [Key, MaxLength(40)] public EvaluationModelInvocationId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationAttemptId AttemptId { get; internal set; }
    public int InvocationNumber { get; internal set; }
    [Required, MaxLength(32)] public EvaluationInvocationStatus Status { get; internal set; } = EvaluationInvocationStatus.Started;
    [Required, MaxLength(80)] public string LeaseToken { get; internal set; } = string.Empty;
    public long AttemptRevision { get; internal set; }
    public string RequestEnvelopeJson { get; internal set; } = "{}";
    public string? SentPrompt { get; internal set; }
    public string? RawResponse { get; internal set; }
    public string? RawError { get; internal set; }
    public string? ParsedOutputJson { get; internal set; }
    public string? ValidationJson { get; internal set; }
    [MaxLength(64)] public string? ResponseSchemaHash { get; internal set; }
    public string ProfileSnapshotJson { get; internal set; } = "{}";
    public string GenerationConfigJson { get; internal set; } = "{}";
    [MaxLength(80)] public string? Provider { get; internal set; }
    [MaxLength(240)] public string? Model { get; internal set; }
    [MaxLength(160)] public string? ProviderRequestId { get; internal set; }
    [MaxLength(80)] public string? FinishReason { get; internal set; }
    public int? InputTokens { get; internal set; }
    public int? OutputTokens { get; internal set; }
    public long? QueueLatencyMilliseconds { get; internal set; }
    public long? TimeToFirstTokenMilliseconds { get; internal set; }
    public long? GenerationLatencyMilliseconds { get; internal set; }
    public long? EndToEndLatencyMilliseconds { get; internal set; }
    public DateTimeOffset StartedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    public DateTimeOffset? ExpiredAt { get; internal set; }
    [MaxLength(120)] public string? CorrelationId { get; internal set; }
    [MaxLength(80)] public string? ErrorCode { get; internal set; }
    [MaxLength(80)] public string? ErrorCategory { get; internal set; }
    public bool Retryable { get; internal set; }
    [Required, MaxLength(64)] public string RequestHash { get; internal set; } = string.Empty;
    [MaxLength(64)] public string? PromptHash { get; internal set; }
    [MaxLength(64)] public string? RawResultHash { get; internal set; }
    [MaxLength(64)] public string? OutputHash { get; internal set; }
    public EvaluationAttempt Attempt { get; internal set; } = null!;
    public ICollection<EvaluationMachineJudgment> MachineJudgments { get; internal set; } = [];
}

public sealed class EvaluationMachineJudgment
{
    [Key, MaxLength(40)] public EvaluationMachineJudgmentId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSessionId SessionId { get; internal set; }
    [Required, MaxLength(40)] public EvaluationAttemptId AttemptId { get; internal set; }
    [Required, MaxLength(40)] public EvaluationModelInvocationId InvocationId { get; internal set; }
    [Required, MaxLength(64)] public string OutputHash { get; internal set; } = string.Empty;
    [Required, MaxLength(80)] public string JudgeKey { get; internal set; } = string.Empty;
    [Required, MaxLength(40)] public string JudgeVersion { get; internal set; } = string.Empty;
    [Required, MaxLength(120)] public string CriterionKey { get; internal set; } = string.Empty;
    public bool Passed { get; internal set; }
    public decimal? Score { get; internal set; }
    public decimal? Confidence { get; internal set; }
    public string LabelsJson { get; internal set; } = "[]";
    public string Rationale { get; internal set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; internal set; }
    public EvaluationModelInvocation Invocation { get; internal set; } = null!;
}

public sealed class EvaluationReviewBatch
{
    [Key, MaxLength(40)] public EvaluationReviewBatchId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSessionId SessionId { get; internal set; }
    [Required, MaxLength(40)] public string RubricVersion { get; internal set; } = "1";
    public int RequiredReviewsPerOutput { get; internal set; } = 1;
    public string ReviewerPoolJson { get; internal set; } = "[]";
    public string PolicyJson { get; internal set; } = "{}";
    public DateTimeOffset? Deadline { get; internal set; }
    [Required, MaxLength(24)] public EvaluationReviewStatus Status { get; internal set; } = EvaluationReviewStatus.Open;
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? ClosedAt { get; internal set; }
    public ICollection<EvaluationReviewAssignment> Assignments { get; internal set; } = [];
}

public sealed class EvaluationReviewAssignment
{
    [Key, MaxLength(40)] public EvaluationReviewAssignmentId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationReviewBatchId BatchId { get; internal set; }
    [Required, MaxLength(64)] public string OpaqueCode { get; internal set; } = string.Empty;
    [Required, MaxLength(450)] public AccountId ReviewerId { get; internal set; }
    [Required, MaxLength(24)] public EvaluationAssignmentStatus Status { get; internal set; } = EvaluationAssignmentStatus.Draft;
    public long Revision { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? SubmittedAt { get; internal set; }
    public EvaluationReviewBatch Batch { get; internal set; } = null!;
    public ICollection<EvaluationReviewItem> Items { get; internal set; } = [];
}

public sealed class EvaluationReviewItem
{
    [Key, MaxLength(40)] public EvaluationReviewItemId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationReviewAssignmentId AssignmentId { get; internal set; }
    [Required, MaxLength(40)] public EvaluationAttemptId AttemptId { get; internal set; }
    [Required, MaxLength(24)] public string OpaqueCandidateCode { get; internal set; } = string.Empty;
    public int DisplayOrder { get; internal set; }
    public EvaluationReviewAssignment Assignment { get; internal set; } = null!;
}

public sealed class EvaluationHumanJudgment
{
    [Key, MaxLength(40)] public EvaluationHumanJudgmentId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationReviewItemId ItemId { get; internal set; }
    [Required, MaxLength(450)] public AccountId ReviewerId { get; internal set; }
    [Required, MaxLength(120)] public string CriterionKey { get; internal set; } = string.Empty;
    public decimal? Score { get; internal set; }
    public bool? Verdict { get; internal set; }
    public string TagsJson { get; internal set; } = "[]";
    public string Comment { get; internal set; } = string.Empty;
    public decimal? Confidence { get; internal set; }
    public int Revision { get; internal set; } = 1;
    [MaxLength(40)] public EvaluationHumanJudgmentId? SupersedesJudgmentId { get; internal set; }
    public DateTimeOffset SubmittedAt { get; internal set; }
}

public sealed class EvaluationAggregate
{
    [Key, MaxLength(40)] public EvaluationAggregateId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSessionId SessionId { get; internal set; }
    public int Revision { get; internal set; }
    [Required, MaxLength(80)] public string AlgorithmKey { get; internal set; } = "evaluation-summary";
    [Required, MaxLength(40)] public string AlgorithmVersion { get; internal set; } = "1";
    [Required, MaxLength(64)] public string SourceWatermark { get; internal set; } = string.Empty;
    public int IncludedAttemptCount { get; internal set; }
    public int IncludedMachineJudgmentCount { get; internal set; }
    public int IncludedHumanJudgmentCount { get; internal set; }
    public string SummaryJson { get; internal set; } = "{}";
    public DateTimeOffset CalculatedAt { get; internal set; }
}
