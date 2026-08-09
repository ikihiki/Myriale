using System.ComponentModel.DataAnnotations;

namespace Myriale.Api.Features.Scenarios.Domain;

public enum ScenarioAiEvaluationStage { Action, Narrative, EntityState }
public enum ScenarioAiEvaluationRunStatus { Running, Completed, Failed }
public enum ScenarioAiEvaluationAttemptStatus { Succeeded, Failed }

public sealed class ScenarioAiEvaluationRun
{
    internal ScenarioAiEvaluationRun() { }
    [Key] public ScenarioAiEvaluationRunId Id { get; internal set; }
    public ScenarioId ScenarioId { get; internal set; }
    public Scenario? Scenario { get; internal set; }
    public AccountId CreatedById { get; internal set; }
    [MaxLength(80)] public string CorpusKey { get; internal set; } = string.Empty;
    [MaxLength(40)] public string CorpusVersion { get; internal set; } = string.Empty;
    public string ProfileIdsJson { get; internal set; } = "[]";
    public int Repetitions { get; internal set; }
    public string ConfigJson { get; internal set; } = "{}";
    public ScenarioAiEvaluationRunStatus Status { get; internal set; }
    public DateTimeOffset CreatedAt { get; internal set; }
    public DateTimeOffset? CompletedAt { get; internal set; }
    public List<ScenarioAiEvaluationCase> Cases { get; internal set; } = [];

    public static ScenarioAiEvaluationRun Create(ScenarioAiEvaluationRunId id, ScenarioId scenarioId, AccountId createdById,
        string corpusId, string corpusVersion, string profileIdsJson, int repetitions, string configJson, DateTimeOffset now) => new()
    {
        Id = id, ScenarioId = scenarioId, CreatedById = createdById, CorpusKey = corpusId, CorpusVersion = corpusVersion,
        ProfileIdsJson = profileIdsJson, Repetitions = repetitions, ConfigJson = configJson, Status = ScenarioAiEvaluationRunStatus.Running,
        CreatedAt = now,
    };

    public void Complete(DateTimeOffset now) { Status = ScenarioAiEvaluationRunStatus.Completed; CompletedAt = now; }
    public void Fail(DateTimeOffset now) { Status = ScenarioAiEvaluationRunStatus.Failed; CompletedAt = now; }
}

public sealed class ScenarioAiEvaluationCase
{
    internal ScenarioAiEvaluationCase() { }
    [Key] public ScenarioAiEvaluationCaseId Id { get; internal set; }
    public ScenarioAiEvaluationRunId RunId { get; internal set; }
    public ScenarioAiEvaluationRun? Run { get; internal set; }
    [MaxLength(120)] public string CaseKey { get; internal set; } = string.Empty;
    public ScenarioAiEvaluationStage Stage { get; internal set; }
    [MaxLength(64)] public string CanonicalPayloadHash { get; internal set; } = string.Empty;
    public string RequestJson { get; internal set; } = "{}";
    public string MetadataJson { get; internal set; } = "{}";
    public List<ScenarioAiEvaluationAttempt> Attempts { get; internal set; } = [];

    public static ScenarioAiEvaluationCase Create(ScenarioAiEvaluationCaseId id, ScenarioAiEvaluationRunId runId,
        string externalCaseId, ScenarioAiEvaluationStage stage, string hash, string requestJson, string metadataJson) => new()
    {
        Id = id, RunId = runId, CaseKey = externalCaseId, Stage = stage, CanonicalPayloadHash = hash,
        RequestJson = requestJson, MetadataJson = metadataJson,
    };
}

public sealed class ScenarioAiEvaluationAttempt
{
    internal ScenarioAiEvaluationAttempt() { }
    [Key] public ScenarioAiEvaluationAttemptId Id { get; internal set; }
    public ScenarioAiEvaluationCaseId CaseId { get; internal set; }
    public ScenarioAiEvaluationCase? Case { get; internal set; }
    public AiProviderProfileId ProfileId { get; internal set; }
    public long ProfileRevision { get; internal set; }
    [MaxLength(240)] public string Model { get; internal set; } = string.Empty;
    public int Repetition { get; internal set; }
    [MaxLength(24)] public string BlindCode { get; internal set; } = string.Empty;
    public ScenarioAiEvaluationAttemptStatus Status { get; internal set; }
    public bool Passed { get; internal set; }
    public string LabelsJson { get; internal set; } = "[]";
    public string RequestJson { get; internal set; } = "{}";
    public string OutputJson { get; internal set; } = "{}";
    public string ConfigJson { get; internal set; } = "{}";
    public string MetadataJson { get; internal set; } = "{}";
    public string? SentPrompt { get; internal set; }
    public string? RawResult { get; internal set; }
    [MaxLength(120)] public string? ErrorCode { get; internal set; }
    public long? InputTokens { get; internal set; }
    public long? OutputTokens { get; internal set; }
    public long? LatencyMilliseconds { get; internal set; }
    public DateTimeOffset StartedAt { get; internal set; }
    public DateTimeOffset CompletedAt { get; internal set; }

    public static ScenarioAiEvaluationAttempt Create(ScenarioAiEvaluationAttemptId id, ScenarioAiEvaluationCaseId caseId,
        AiProviderProfileId profileId, long profileRevision, string model, int repetition, string blindCode, string requestJson,
        string configJson, DateTimeOffset startedAt) => new()
    {
        Id = id, CaseId = caseId, ProfileId = profileId, ProfileRevision = profileRevision, Model = model,
        Repetition = repetition, BlindCode = blindCode, RequestJson = requestJson, ConfigJson = configJson, StartedAt = startedAt,
    };

    public void Succeed(bool passed, string labelsJson, string outputJson, string metadataJson, string? sentPrompt,
        string? rawResult, long? inputTokens, long? outputTokens, long? latencyMilliseconds, DateTimeOffset now)
    {
        Status = ScenarioAiEvaluationAttemptStatus.Succeeded; Passed = passed; LabelsJson = labelsJson; OutputJson = outputJson;
        MetadataJson = metadataJson; SentPrompt = sentPrompt; RawResult = rawResult; InputTokens = inputTokens;
        OutputTokens = outputTokens; LatencyMilliseconds = latencyMilliseconds; CompletedAt = now;
    }

    public void Fail(string errorCode, string labelsJson, string metadataJson, DateTimeOffset now)
    {
        Status = ScenarioAiEvaluationAttemptStatus.Failed; Passed = false; ErrorCode = errorCode;
        LabelsJson = labelsJson; MetadataJson = metadataJson; CompletedAt = now;
    }
}
