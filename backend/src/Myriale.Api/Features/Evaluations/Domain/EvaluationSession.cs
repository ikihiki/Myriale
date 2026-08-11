using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Evaluations.Domain;

public enum EvaluationSessionStatus { Draft, Ready, Queued, Running, AwaitingHumanReview, Aggregating, Completed, CompletedWithErrors, CancelRequested, Cancelled, Failed, Archived }
public enum EvaluationStage { Action, Narrative, EntityState }
public enum EvaluationSituationSourceKind { Fixture, Corpus, SessionQuote }
public enum EvaluationAttemptStatus { Queued, Running, RetryWait, Succeeded, Failed, Cancelled, Skipped }
public enum EvaluationInvocationStatus { Started, Succeeded, Failed, Cancelled, Expired, UnknownOutcome }
public enum EvaluationReviewStatus { Open, Closed }
public enum EvaluationAssignmentStatus { Draft, Submitted, Locked, Reassigned }

public static class EvaluationValues
{
    public static string Wire(this EvaluationStage value) => value switch { EvaluationStage.Action => "action", EvaluationStage.Narrative => "narrative", _ => "entityState" };
    public static EvaluationStage ParseStage(string value) => value.Trim().ToLowerInvariant() switch { "action" => EvaluationStage.Action, "narrative" => EvaluationStage.Narrative, "entitystate" or "entity-state" or "state" => EvaluationStage.EntityState, _ => throw new EvaluationValidationException("invalid_stage") };
    public static string Wire<T>(this T value) where T : struct, Enum { var text = value.ToString(); return char.ToLowerInvariant(text[0]) + text[1..]; }
}

public sealed class EvaluationValidationException(string code) : Exception(code) { public string Code { get; } = code; }

public sealed class EvaluationSession
{
    [Key, MaxLength(40)] public EvaluationSessionId Id { get; internal set; }
    [Required, MaxLength(450)] public AccountId OwnerId { get; internal set; }
    [Required, MaxLength(450)] public AccountId CreatedById { get; internal set; }
    [Required, MaxLength(160)] public string Title { get; internal set; } = string.Empty;
    [MaxLength(2000)] public string Purpose { get; internal set; } = string.Empty;
    public string TagsJson { get; internal set; } = "[]";
    [MaxLength(32)] public string Sensitivity { get; internal set; } = "internal";
    [MaxLength(80)] public string RetentionPolicy { get; internal set; } = "standard";
    [Required, MaxLength(32)] public EvaluationSessionStatus Status { get; internal set; } = EvaluationSessionStatus.Draft;
    public long Revision { get; internal set; }
    [MaxLength(160)] public string? IdempotencyKey { get; internal set; }
    [MaxLength(64)] public string? CanonicalPayloadHash { get; internal set; }
    [MaxLength(80)] public string? CorpusKey { get; internal set; }
    [MaxLength(40)] public string? CorpusVersion { get; internal set; }
    public string ConfigJson { get; internal set; } = "{}";
    public string RubricJson { get; internal set; } = "{}";
    public string ReviewPolicyJson { get; internal set; } = "{}";
    public int PlannedAttemptCount { get; internal set; }
    public int TerminalAttemptCount { get; internal set; }
    public int SucceededAttemptCount { get; internal set; }
    public int FailedAttemptCount { get; internal set; }
    public int ReviewedItemCount { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? QueuedAt { get; internal set; }
    public DateTimeOffset? StartedAt { get; internal set; }
    public DateTimeOffset? MachineCompletedAt { get; internal set; }
    public DateTimeOffset? ReviewOpenedAt { get; internal set; }
    public DateTimeOffset? ReviewClosedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    public DateTimeOffset? CancelRequestedAt { get; internal set; }
    public DateTimeOffset? ArchivedAt { get; internal set; }
    public bool IdentitiesRevealed { get; internal set; }
    [MaxLength(450)] public AccountId? IdentitiesRevealedById { get; internal set; }
    public DateTimeOffset? IdentitiesRevealedAt { get; internal set; }
    public int CurrentAggregateRevision { get; internal set; }
    public ICollection<EvaluationSituation> Situations { get; internal set; } = [];
    public ICollection<EvaluationCandidate> Candidates { get; internal set; } = [];
    public ICollection<EvaluationAttempt> Attempts { get; internal set; } = [];

    public static EvaluationSession Create(EvaluationSessionId id, AccountId ownerId, string title, string purpose, string tagsJson,
        string sensitivity, string retentionPolicy, string configJson, string rubricJson, string reviewPolicyJson, string? idempotencyKey,
        string? payloadHash, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new EvaluationValidationException("title_required");
        return new() { Id = id, OwnerId = ownerId, CreatedById = ownerId, Title = title.Trim(), Purpose = purpose.Trim(), TagsJson = tagsJson,
            Sensitivity = sensitivity, RetentionPolicy = retentionPolicy, ConfigJson = configJson, RubricJson = rubricJson,
            ReviewPolicyJson = reviewPolicyJson, IdempotencyKey = idempotencyKey, CanonicalPayloadHash = payloadHash, CreatedAt = now };
    }

    public void EnsureDraft() { if (Status != EvaluationSessionStatus.Draft) throw new EvaluationValidationException("session_frozen"); }
    public void Start(int attempts, DateTimeOffset now)
    {
        EnsureDraft();
        if (Situations.Count == 0) throw new EvaluationValidationException("situations_required");
        if (Candidates.Count == 0) throw new EvaluationValidationException("candidates_required");
        if (attempts <= 0) throw new EvaluationValidationException("attempts_required");
        Status = EvaluationSessionStatus.Queued; PlannedAttemptCount = attempts; QueuedAt = now; Revision++;
    }
    public void RequestCancel(DateTimeOffset now)
    {
        if (Status is EvaluationSessionStatus.Completed or EvaluationSessionStatus.CompletedWithErrors or EvaluationSessionStatus.Cancelled or EvaluationSessionStatus.Archived) return;
        Status = EvaluationSessionStatus.CancelRequested; CancelRequestedAt = now; Revision++;
    }
    public void Reveal(AccountId actor, DateTimeOffset now)
    {
        if (ReviewClosedAt is null) throw new EvaluationValidationException("review_must_be_closed");
        if (IdentitiesRevealed) return;
        IdentitiesRevealed = true; IdentitiesRevealedById = actor; IdentitiesRevealedAt = now; Revision++;
    }
}

public sealed class EvaluationSituation
{
    [Key, MaxLength(40)] public EvaluationSituationId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSessionId SessionId { get; internal set; }
    [Required, MaxLength(120)] public string StableKey { get; internal set; } = string.Empty;
    public int Revision { get; internal set; } = 1;
    [Required, MaxLength(32)] public EvaluationStage Stage { get; internal set; }
    [Required, MaxLength(32)] public EvaluationSituationSourceKind SourceKind { get; internal set; }
    public string RequestJson { get; internal set; } = "{}";
    public string ExpectationsJson { get; internal set; } = "{}";
    [MaxLength(40)] public string RequestVersion { get; internal set; } = "1";
    [MaxLength(40)] public string PromptVersion { get; internal set; } = "1";
    [MaxLength(40)] public string ResponseSchemaVersion { get; internal set; } = "1";
    [MaxLength(40)] public string CanonicalizationVersion { get; internal set; } = "json-v1";
    [Required, MaxLength(64)] public string RequestHash { get; internal set; } = string.Empty;
    [Required, MaxLength(64)] public string SourceBundleHash { get; internal set; } = string.Empty;
    [MaxLength(32)] public string Sensitivity { get; internal set; } = "internal";
    [MaxLength(450)] public AccountId ImportedById { get; internal set; }
    public DateTimeOffset ImportedAt { get; internal set; }
    [MaxLength(80)] public string? CorpusKey { get; internal set; }
    [MaxLength(40)] public string? CorpusVersion { get; internal set; }
    [MaxLength(120)] public string? CorpusCaseKey { get; internal set; }
    [MaxLength(40)] public ScenarioId? SourceScenarioId { get; internal set; }
    [MaxLength(40)] public ScenarioDefinitionVersionId? SourceDefinitionVersionId { get; internal set; }
    [MaxLength(40)] public SessionId? SourceSessionId { get; internal set; }
    [MaxLength(40)] public SessionTurnId? SourceTurnId { get; internal set; }
    [MaxLength(40)] public SessionExecutionId? SourceExecutionId { get; internal set; }
    [MaxLength(40)] public SessionExecutionAttemptId? SourceAttemptId { get; internal set; }
    [MaxLength(40)] public SessionRuleActionStepId? SourceRuleStepId { get; internal set; }
    [MaxLength(40)] public SessionAiInteractionId? SourceInteractionId { get; internal set; }
    public long? SourceSessionRevision { get; internal set; }
    public string CitationJson { get; internal set; } = "{}";
    [MaxLength(40)] public EvaluationSituationId? SupersedesSituationId { get; internal set; }
    public EvaluationSession Session { get; internal set; } = null!;
}

public sealed class EvaluationCandidate
{
    [Key, MaxLength(40)] public EvaluationCandidateId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSessionId SessionId { get; internal set; }
    [Required, MaxLength(120)] public string CandidateKey { get; internal set; } = string.Empty;
    [Required, MaxLength(24)] public string BlindCode { get; internal set; } = string.Empty;
    [Required, MaxLength(80)] public AiProviderProfileId ProfileId { get; internal set; }
    public long ProfileRevision { get; internal set; }
    [MaxLength(32)] public string ProfileSource { get; internal set; } = string.Empty;
    [MaxLength(80)] public string Provider { get; internal set; } = string.Empty;
    [MaxLength(80)] public string Adapter { get; internal set; } = string.Empty;
    [MaxLength(240)] public string Model { get; internal set; } = string.Empty;
    public string ProfileDescriptorJson { get; internal set; } = "{}";
    [Required, MaxLength(64)] public string ProfileDescriptorHash { get; internal set; } = string.Empty;
    public string GenerationOverridesJson { get; internal set; } = "{}";
    public string RetryPolicyJson { get; internal set; } = "{}";
    public int Repetitions { get; internal set; } = 1;
    public int MaxInvocations { get; internal set; } = 1;
    public bool IsActive { get; internal set; } = true;
    public EvaluationSession Session { get; internal set; } = null!;
}

public sealed class EvaluationAttempt
{
    [Key, MaxLength(40)] public EvaluationAttemptId Id { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSessionId SessionId { get; internal set; }
    [Required, MaxLength(40)] public EvaluationSituationId SituationId { get; internal set; }
    [Required, MaxLength(40)] public EvaluationCandidateId CandidateId { get; internal set; }
    public int Repetition { get; internal set; }
    [Required, MaxLength(32)] public EvaluationAttemptStatus Status { get; internal set; } = EvaluationAttemptStatus.Queued;
    public long Revision { get; internal set; }
    public int InvocationCount { get; internal set; }
    public DateTimeOffset? NextAttemptAt { get; internal set; }
    [MaxLength(120)] public string? LeaseOwner { get; internal set; }
    [MaxLength(80)] public string? LeaseToken { get; internal set; }
    public DateTimeOffset? LeaseExpiresAt { get; internal set; }
    [MaxLength(80)] public string? ErrorCode { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? StartedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    public EvaluationSession Session { get; internal set; } = null!;
    public EvaluationSituation Situation { get; internal set; } = null!;
    public EvaluationCandidate Candidate { get; internal set; } = null!;
    public ICollection<EvaluationModelInvocation> Invocations { get; internal set; } = [];
}
