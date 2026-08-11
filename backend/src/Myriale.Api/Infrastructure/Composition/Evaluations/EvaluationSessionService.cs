using System.Data.Common;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Myriale.Api.Infrastructure.Composition.Evaluations;

public sealed record EvaluationClaim(EvaluationAttemptId AttemptId, EvaluationModelInvocationId InvocationId, string LeaseToken,
    long Revision, EvaluationStage Stage, string RequestJson, string ExpectationsJson, EvaluationCandidate Candidate);

public sealed class EvaluationSessionService(ApplicationDbContext db, IAiProfileCatalog profiles, TimeProvider timeProvider)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private const int MaxAttempts = 10_000;

    public async Task<EvaluationSessionResponse> CreateAsync(AccountId owner, CreateEvaluationSessionRequest input, CancellationToken ct)
    {
        var canonical = Normalize(JsonSerializer.SerializeToElement(input, Json)); var hash = Hash(canonical);
        if (!string.IsNullOrWhiteSpace(input.IdempotencyKey))
        {
            var existing = await db.EvaluationSessions.Include(x => x.Situations).Include(x => x.Candidates)
                .SingleOrDefaultAsync(x => x.OwnerId == owner && x.IdempotencyKey == input.IdempotencyKey.Trim(), ct);
            if (existing is not null)
            {
                if (existing.CanonicalPayloadHash != hash) throw new EvaluationValidationException("idempotency_conflict");
                return Map(existing);
            }
        }
        var entity = EvaluationSession.Create(NewSessionId(), owner, input.Title, input.Purpose ?? "", Serialize(input.Tags ?? []),
            Clean(input.Sensitivity, "internal"), Clean(input.RetentionPolicy, "standard"), Normalize(input.Config), Normalize(input.Rubric),
            Normalize(input.ReviewPolicy), input.IdempotencyKey?.Trim(), hash, timeProvider.GetUtcNow());
        db.EvaluationSessions.Add(entity); await db.SaveChangesAsync(ct); return Map(entity);
    }
    public async Task<IReadOnlyList<EvaluationSessionSummaryResponse>> ListAsync(AccountId owner, bool admin, CancellationToken ct)
    {
        var rows = await db.EvaluationSessions.AsNoTracking().Include(x => x.Situations).Include(x => x.Candidates)
            .Where(x => admin || x.OwnerId == owner).ToListAsync(ct);
        return rows.OrderByDescending(x => x.CreatedAt).Select(MapSummary).ToList();
    }
    public async Task<EvaluationSessionResponse?> GetAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var row = await Owned(id, owner, admin).Include(x => x.Situations).Include(x => x.Candidates).SingleOrDefaultAsync(ct);
        return row is null ? null : Map(row);
    }
    public async Task<EvaluationSessionResponse?> UpdateAsync(AccountId owner, bool admin, EvaluationSessionId id, UpdateEvaluationSessionRequest input, CancellationToken ct)
    {
        var row = await Owned(id, owner, admin).Include(x => x.Situations).Include(x => x.Candidates).SingleOrDefaultAsync(ct); if (row is null) return null;
        row.EnsureDraft(); if (row.Revision != input.Revision) throw new EvaluationValidationException("revision_conflict");
        if (input.Title is not null) { if (string.IsNullOrWhiteSpace(input.Title)) throw new EvaluationValidationException("title_required"); row.Title = input.Title.Trim(); }
        if (input.Purpose is not null) row.Purpose = input.Purpose.Trim(); if (input.Tags is not null) row.TagsJson = Serialize(input.Tags);
        if (input.Config is { } config) row.ConfigJson = Normalize(config); if (input.Rubric is { } rubric) row.RubricJson = Normalize(rubric); if (input.ReviewPolicy is { } policy) row.ReviewPolicyJson = Normalize(policy);
        row.Revision++; await db.SaveChangesAsync(ct); return Map(row);
    }
    public async Task<EvaluationSituationResponse?> AddFixedAsync(AccountId owner, bool admin, EvaluationSessionId id, AddFixedEvaluationSituationRequest input, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).Include(x => x.Situations).SingleOrDefaultAsync(ct); if (session is null) return null; session.EnsureDraft();
        var request = Normalize(input.Request); ValidateRequest(EvaluationValues.ParseStage(input.Stage), request); var expectations = Normalize(input.Expectations);
        var entity = NewSituation(session, input.StableKey, EvaluationValues.ParseStage(input.Stage),
            string.IsNullOrWhiteSpace(input.CorpusKey) ? EvaluationSituationSourceKind.Fixture : EvaluationSituationSourceKind.Corpus,
            request, expectations, owner, input.Sensitivity);
        entity.CorpusKey = input.CorpusKey?.Trim(); entity.CorpusVersion = input.CorpusVersion?.Trim(); entity.CorpusCaseKey = input.CorpusCaseKey?.Trim();
        entity.CitationJson = Serialize(new { corpusKey = entity.CorpusKey, corpusVersion = entity.CorpusVersion, caseKey = entity.CorpusCaseKey });
        session.Situations.Add(entity); await db.SaveChangesAsync(ct); return Map(entity);
    }
    public async Task<EvaluationSituationResponse?> QuoteAsync(AccountId owner, bool admin, EvaluationSessionId id, QuoteEvaluationSituationRequest input, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).Include(x => x.Situations).SingleOrDefaultAsync(ct); if (session is null) return null; session.EnsureDraft();
        var source = await db.SessionAiInteractions.AsNoTracking().Where(x => x.Id == input.InteractionId && x.SessionId == input.SessionId)
            .Select(x => new { Interaction = x, x.Attempt.AttemptNumber, Execution = x.Execution }).SingleOrDefaultAsync(ct);
        var turn = await db.SessionTurns.AsNoTracking().Include(x => x.Session)
            .SingleOrDefaultAsync(x => x.Id == input.TurnId && x.SessionId == input.SessionId, ct);
        if (source is null || turn is null) return null;
        var scenarioAuthor = await db.Scenarios.AsNoTracking().Where(x => x.Id == turn.Session.ScenarioId).Select(x => x.AuthorId).SingleOrDefaultAsync(ct);
        if (!admin && turn.Session.OwnerId != owner && scenarioAuthor != owner) return null;
        var stage = EvaluationValues.ParseStage(input.Stage); var expectedStage = stage switch { EvaluationStage.Action => SessionAiInteractionStage.ActionDecision, EvaluationStage.Narrative => SessionAiInteractionStage.Narrative, _ => SessionAiInteractionStage.EntityStateTransition };
        if (source.Interaction.Stage != expectedStage || string.IsNullOrWhiteSpace(source.Interaction.SentPrompt)) throw new EvaluationValidationException("quoted_prompt_unavailable");
        var request = stage == EvaluationStage.Action
            ? Normalize((JsonSerializer.Deserialize<ModelActionDecisionPromptAudit>(source.Interaction.SentPrompt, Json) ?? throw new EvaluationValidationException("quoted_prompt_invalid")).ModelRequest)
            : Normalize(JsonDocument.Parse(source.Interaction.SentPrompt).RootElement);
        ValidateRequest(stage, request);
        var entity = NewSituation(session, input.StableKey, stage, EvaluationSituationSourceKind.SessionQuote, request, Normalize(input.Expectations), owner, input.Sensitivity);
        entity.SourceScenarioId = turn.Session.ScenarioId; entity.SourceDefinitionVersionId = turn.Session.ScenarioDefinitionVersionId;
        entity.SourceSessionId = input.SessionId; entity.SourceTurnId = input.TurnId; entity.SourceExecutionId = source.Interaction.ExecutionId;
        entity.SourceAttemptId = source.Interaction.AttemptId; entity.SourceInteractionId = source.Interaction.Id; entity.SourceSessionRevision = turn.Session.Revision;
        var step = await db.SessionRuleActionSteps.AsNoTracking().SingleOrDefaultAsync(x => x.ExecutionId == source.Interaction.ExecutionId, ct); entity.SourceRuleStepId = step?.Id;
        entity.CitationJson = Serialize(new { scenarioId = entity.SourceScenarioId, definitionVersionId = entity.SourceDefinitionVersionId, sessionId = entity.SourceSessionId,
            sessionRevision = entity.SourceSessionRevision, turnId = entity.SourceTurnId, executionId = entity.SourceExecutionId, attemptId = entity.SourceAttemptId,
            attemptNumber = source.AttemptNumber, ruleStepId = entity.SourceRuleStepId, interactionId = entity.SourceInteractionId,
            providerRequestId = source.Interaction.ProviderRequestId, sourcePromptHash = Hash(source.Interaction.SentPrompt) });
        entity.SourceBundleHash = Hash(entity.RequestJson + entity.CitationJson); session.Situations.Add(entity); await db.SaveChangesAsync(ct); return Map(entity);
    }
    public async Task<bool?> DeleteSituationAsync(AccountId owner, bool admin, EvaluationSessionId id, EvaluationSituationId situationId, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).SingleOrDefaultAsync(ct); if (session is null) return null; session.EnsureDraft();
        var row = await db.EvaluationSituations.SingleOrDefaultAsync(x => x.Id == situationId && x.SessionId == id, ct); if (row is null) return false;
        db.EvaluationSituations.Remove(row); await db.SaveChangesAsync(ct); return true;
    }
    public async Task<EvaluationCandidateResponse?> AddCandidateAsync(AccountId owner, bool admin, EvaluationSessionId id, AddEvaluationCandidateRequest input, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).Include(x => x.Candidates).SingleOrDefaultAsync(ct); if (session is null) return null; session.EnsureDraft();
        if (input.Repetitions is < 1 or > 100) throw new EvaluationValidationException("invalid_repetitions");
        var profile = await profiles.ResolveAsync(input.ProfileId, ct); var descriptor = Serialize(new { profile.Id, profile.DisplayName, profile.BaseUrl, profile.Model, profile.Enabled, profile.Source, profile.Revision, profile.Adapter, profile.SystemPrompt });
        var candidate = new EvaluationCandidate { Id = NewCandidateId(), SessionId = id, CandidateKey = Required(input.CandidateKey, "candidate_key_required"), BlindCode = BlindCode(),
            ProfileId = profile.Id, ProfileRevision = profile.Revision, ProfileSource = profile.Source.ToString(), Provider = profile.Id.AsPrimitive(), Adapter = profile.Adapter,
            Model = profile.Model, ProfileDescriptorJson = descriptor, ProfileDescriptorHash = Hash(descriptor), GenerationOverridesJson = Serialize(input.GenerationOverrides),
            RetryPolicyJson = Serialize(new { maxInvocations = Math.Clamp(input.MaxInvocations ?? 2, 1, 10) }), Repetitions = input.Repetitions, MaxInvocations = Math.Clamp(input.MaxInvocations ?? 2, 1, 10) };
        session.Candidates.Add(candidate); await db.SaveChangesAsync(ct); return Map(candidate);
    }
    public async Task<EvaluationExecutionResponse?> StartAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).Include(x => x.Situations).Include(x => x.Candidates).Include(x => x.Attempts).SingleOrDefaultAsync(ct); if (session is null) return null;
        if (session.Status != EvaluationSessionStatus.Draft) return await ExecutionAsync(owner, admin, id, ct);
        var count = session.Situations.Count * session.Candidates.Where(x => x.IsActive).Sum(x => x.Repetitions); if (count > MaxAttempts) throw new EvaluationValidationException("session_too_large");
        var now = timeProvider.GetUtcNow(); session.Start(count, now);
        foreach (var situation in session.Situations) foreach (var candidate in session.Candidates.Where(x => x.IsActive)) for (var repetition = 1; repetition <= candidate.Repetitions; repetition++)
            session.Attempts.Add(new EvaluationAttempt { Id = NewAttemptId(), SessionId = id, SituationId = situation.Id, CandidateId = candidate.Id, Repetition = repetition, Status = EvaluationAttemptStatus.Queued, CreatedAt = now });
        await db.SaveChangesAsync(ct); return await ExecutionAsync(owner, admin, id, ct);
    }
    public async Task<EvaluationExecutionResponse?> ExecutionAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).Include(x => x.Situations).Include(x => x.Candidates).SingleOrDefaultAsync(ct); if (session is null) return null;
        var attempts = await db.EvaluationAttempts.AsNoTracking().Where(x => x.SessionId == id).Include(x => x.Invocations).ToListAsync(ct);
        return new(MapSummary(session), attempts.OrderBy(x => x.CreatedAt).Select(Map).ToList());
    }
    public async Task<bool?> CancelAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).SingleOrDefaultAsync(ct); if (session is null) return null; session.RequestCancel(timeProvider.GetUtcNow());
        await db.EvaluationAttempts.Where(x => x.SessionId == id && (x.Status == EvaluationAttemptStatus.Queued || x.Status == EvaluationAttemptStatus.RetryWait))
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, EvaluationAttemptStatus.Cancelled).SetProperty(x => x.CompletedAt, timeProvider.GetUtcNow()), ct);
        await db.SaveChangesAsync(ct); return true;
    }
    public async Task<int?> RetryFailedAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        if (!await Owned(id, owner, admin).AnyAsync(ct)) return null; var now = timeProvider.GetUtcNow();
        var count = await db.EvaluationAttempts.Where(x => x.SessionId == id && x.Status == EvaluationAttemptStatus.Failed)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, EvaluationAttemptStatus.Queued).SetProperty(x => x.NextAttemptAt, (DateTimeOffset?)null).SetProperty(x => x.CompletedAt, (DateTimeOffset?)null).SetProperty(x => x.ErrorCode, (string?)null).SetProperty(x => x.Revision, x => x.Revision + 1), ct);
        await db.EvaluationSessions.Where(x => x.Id == id).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, EvaluationSessionStatus.Queued).SetProperty(x => x.QueuedAt, now), ct); return count;
    }
    public async Task<EvaluationClaim?> ClaimAsync(string workerId, TimeSpan leaseDuration, CancellationToken ct) =>
        (await ClaimBatchAsync(workerId, 1, leaseDuration, ct)).SingleOrDefault();

    public async Task<IReadOnlyList<EvaluationClaim>> ClaimBatchAsync(
        string workerId,
        int maxBatchSize,
        TimeSpan leaseDuration,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(workerId)) throw new ArgumentException("Worker ID is required.", nameof(workerId));
        if (maxBatchSize is < 1 or > 32) throw new ArgumentOutOfRangeException(nameof(maxBatchSize));
        if (leaseDuration <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(leaseDuration));

        var now = timeProvider.GetUtcNow();
        var scanSize = db.Database.IsNpgsql()
            ? maxBatchSize
            : Math.Min(128, Math.Max(32, maxBatchSize * 4));
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var candidates = await LoadClaimCandidatesAsync(now, scanSize, ct);
        var claims = new List<EvaluationClaim>(maxBatchSize);
        var claimedSessions = new HashSet<EvaluationSessionId>();
        var completedSessions = new HashSet<EvaluationSessionId>();

        foreach (var attempt in candidates)
        {
            foreach (var stale in attempt.Invocations.Where(x => x.Status == EvaluationInvocationStatus.Started && x.CompletedAt == null))
            {
                stale.Status = EvaluationInvocationStatus.UnknownOutcome;
                stale.ExpiredAt = now;
                stale.CompletedAt = now;
                stale.ErrorCode = "lease_expired";
                stale.ErrorCategory = "lease";
                stale.Retryable = true;
            }

            if (attempt.InvocationCount >= attempt.Candidate.MaxInvocations)
            {
                attempt.Status = EvaluationAttemptStatus.Failed;
                attempt.ErrorCode = "max_invocations_exhausted";
                attempt.CompletedAt = now;
                ClearLease(attempt);
                completedSessions.Add(attempt.SessionId);
                continue;
            }

            var token = Guid.NewGuid().ToString("N");
            attempt.Status = EvaluationAttemptStatus.Running;
            attempt.LeaseOwner = workerId;
            attempt.LeaseToken = token;
            attempt.LeaseExpiresAt = now + leaseDuration;
            attempt.StartedAt ??= now;
            attempt.NextAttemptAt = null;
            attempt.ErrorCode = null;
            attempt.InvocationCount++;
            attempt.Revision++;
            claimedSessions.Add(attempt.SessionId);

            var invocation = new EvaluationModelInvocation
            {
                Id = NewInvocationId(),
                AttemptId = attempt.Id,
                InvocationNumber = attempt.InvocationCount,
                Status = EvaluationInvocationStatus.Started,
                LeaseToken = token,
                AttemptRevision = attempt.Revision,
                RequestEnvelopeJson = attempt.Situation.RequestJson,
                ProfileSnapshotJson = attempt.Candidate.ProfileDescriptorJson,
                GenerationConfigJson = attempt.Candidate.GenerationOverridesJson,
                Provider = attempt.Candidate.Provider,
                Model = attempt.Candidate.Model,
                StartedAt = now,
                RequestHash = attempt.Situation.RequestHash,
            };
            attempt.Invocations.Add(invocation);
            claims.Add(new(attempt.Id, invocation.Id, token, attempt.Revision, attempt.Situation.Stage,
                attempt.Situation.RequestJson, attempt.Situation.ExpectationsJson, attempt.Candidate));
            if (claims.Count == maxBatchSize) break;
        }

        await db.SaveChangesAsync(ct);
        foreach (var sessionId in claimedSessions)
        {
            await db.EvaluationSessions
                .Where(x => x.Id == sessionId && (x.Status == EvaluationSessionStatus.Queued || x.Status == EvaluationSessionStatus.Ready))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.Status, EvaluationSessionStatus.Running)
                    .SetProperty(x => x.StartedAt, x => x.StartedAt ?? now)
                    .SetProperty(x => x.Revision, x => x.Revision + 1), ct);
        }
        await tx.CommitAsync(ct);
        foreach (var sessionId in completedSessions) await UpdateSessionProgressAsync(sessionId, ct);
        return claims;
    }

    public async Task<bool> HeartbeatAsync(EvaluationClaim claim, TimeSpan duration, CancellationToken ct)
    {
        if (duration <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(duration));
        var now = timeProvider.GetUtcNow();
        var fenced = db.EvaluationAttempts.Where(x => x.Id == claim.AttemptId
            && x.Status == EvaluationAttemptStatus.Running
            && x.LeaseToken == claim.LeaseToken
            && x.Revision == claim.Revision);
        if (!db.Database.IsSqlite())
        {
            return await fenced.Where(x => x.LeaseExpiresAt > now)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.LeaseExpiresAt, now + duration), ct) == 1;
        }

        var attempt = await fenced.SingleOrDefaultAsync(ct);
        if (attempt?.LeaseExpiresAt is null || attempt.LeaseExpiresAt <= now) return false;
        attempt.LeaseExpiresAt = now + duration;
        try
        {
            await db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
    }
    public Task<bool> CompleteSuccessAsync(EvaluationClaim claim, NarrativeGeneration<ModelActionDecisionResult> generation, IEvaluationMachineJudge judge, CancellationToken ct) =>
        CompleteSuccessCoreAsync(claim, JsonSerializer.Serialize(generation.Value, Json), generation.Metadata, generation.SentPrompt, generation.ReceivedResult, judge, ct);
    public Task<bool> CompleteSuccessAsync(EvaluationClaim claim, NarrativeGeneration<PostStateNarrativeResult> generation, IEvaluationMachineJudge judge, CancellationToken ct) =>
        CompleteSuccessCoreAsync(claim, JsonSerializer.Serialize(generation.Value, Json), generation.Metadata, generation.SentPrompt, generation.ReceivedResult, judge, ct);
    public Task<bool> CompleteSuccessAsync(EvaluationClaim claim, NarrativeGeneration<EntityStateTransitionResult> generation, IEvaluationMachineJudge judge, CancellationToken ct) =>
        CompleteSuccessCoreAsync(claim, JsonSerializer.Serialize(generation.Value, Json), generation.Metadata, generation.SentPrompt, generation.ReceivedResult, judge, ct);

    public Task AuditLeaseLostAsync(EvaluationClaim claim, NarrativeGeneration<ModelActionDecisionResult> generation, CancellationToken ct) =>
        RecordStaleSuccessAsync(claim, JsonSerializer.Serialize(generation.Value, Json), generation.Metadata, generation.SentPrompt, generation.ReceivedResult, ct);
    public Task AuditLeaseLostAsync(EvaluationClaim claim, NarrativeGeneration<PostStateNarrativeResult> generation, CancellationToken ct) =>
        RecordStaleSuccessAsync(claim, JsonSerializer.Serialize(generation.Value, Json), generation.Metadata, generation.SentPrompt, generation.ReceivedResult, ct);
    public Task AuditLeaseLostAsync(EvaluationClaim claim, NarrativeGeneration<EntityStateTransitionResult> generation, CancellationToken ct) =>
        RecordStaleSuccessAsync(claim, JsonSerializer.Serialize(generation.Value, Json), generation.Metadata, generation.SentPrompt, generation.ReceivedResult, ct);
    public Task AuditLeaseLostAsync(EvaluationClaim claim, Exception exception, CancellationToken ct) =>
        RecordStaleFailureAsync(claim, exception, ct);

    private async Task<bool> CompleteSuccessCoreAsync(
        EvaluationClaim claim,
        string outputJson,
        AiGenerationMetadata metadata,
        string? sentPrompt,
        string? raw,
        IEvaluationMachineJudge judge,
        CancellationToken ct)
    {
        var now = timeProvider.GetUtcNow();
        var fenced = db.EvaluationAttempts.Include(x => x.Session)
            .Where(x => x.Id == claim.AttemptId
                && x.Status == EvaluationAttemptStatus.Running
                && x.LeaseToken == claim.LeaseToken
                && x.Revision == claim.Revision);
        var attempt = db.Database.IsSqlite()
            ? await fenced.SingleOrDefaultAsync(ct)
            : await fenced.SingleOrDefaultAsync(x => x.LeaseExpiresAt > now, ct);
        if (attempt?.LeaseExpiresAt is null || attempt.LeaseExpiresAt <= now)
        {
            await RecordStaleSuccessAsync(claim, outputJson, metadata, sentPrompt, raw, ct);
            return false;
        }

        var invocation = await db.EvaluationModelInvocations.SingleOrDefaultAsync(x => x.Id == claim.InvocationId
            && x.LeaseToken == claim.LeaseToken && x.AttemptRevision == claim.Revision, ct);
        if (invocation is null || invocation.Status != EvaluationInvocationStatus.Started) return false;
        ApplySuccessAudit(invocation, outputJson, metadata, sentPrompt, raw, now);

        EvaluationScore score;
        try
        {
            score = judge.Judge(claim.Stage, claim.RequestJson, outputJson, claim.ExpectationsJson);
            invocation.ValidationJson = Serialize(new { status = "judged", judge = judge.Key, version = judge.Version, score.Passed, score.Labels });
        }
        catch (Exception exception)
        {
            invocation.ValidationJson = Serialize(new { status = "scoring-failed", error = exception.GetType().Name });
            attempt.Status = EvaluationAttemptStatus.Failed;
            attempt.ErrorCode = "machine_judgment_failed";
            attempt.CompletedAt = now;
            ClearLease(attempt);
            if (!await SaveFinalizationAsync(() => RecordStaleSuccessAsync(claim, outputJson, metadata, sentPrompt, raw, ct), ct)) return false;
            await UpdateSessionProgressAsync(attempt.SessionId, ct);
            return true;
        }

        db.EvaluationMachineJudgments.Add(new EvaluationMachineJudgment
        {
            Id = NewMachineJudgmentId(),
            SessionId = attempt.SessionId,
            AttemptId = attempt.Id,
            InvocationId = invocation.Id,
            OutputHash = invocation.OutputHash!,
            JudgeKey = judge.Key,
            JudgeVersion = judge.Version,
            CriterionKey = "overall",
            Passed = score.Passed,
            Score = score.Score,
            Confidence = score.Confidence,
            LabelsJson = Serialize(score.Labels),
            Rationale = score.Rationale,
            CreatedAt = now,
        });
        attempt.Status = EvaluationAttemptStatus.Succeeded;
        attempt.CompletedAt = now;
        ClearLease(attempt);
        if (!await SaveFinalizationAsync(() => RecordStaleSuccessAsync(claim, outputJson, metadata, sentPrompt, raw, ct), ct)) return false;
        await UpdateSessionProgressAsync(attempt.SessionId, ct);
        return true;
    }

    public async Task<bool> CompleteFailureAsync(EvaluationClaim claim, Exception exception, CancellationToken ct)
    {
        var now = timeProvider.GetUtcNow();
        var fenced = db.EvaluationAttempts.Include(x => x.Candidate)
            .Where(x => x.Id == claim.AttemptId
                && x.Status == EvaluationAttemptStatus.Running
                && x.LeaseToken == claim.LeaseToken
                && x.Revision == claim.Revision);
        var attempt = db.Database.IsSqlite()
            ? await fenced.SingleOrDefaultAsync(ct)
            : await fenced.SingleOrDefaultAsync(x => x.LeaseExpiresAt > now, ct);
        if (attempt?.LeaseExpiresAt is null || attempt.LeaseExpiresAt <= now)
        {
            await RecordStaleFailureAsync(claim, exception, ct);
            return false;
        }

        var invocation = await db.EvaluationModelInvocations.SingleOrDefaultAsync(x => x.Id == claim.InvocationId
            && x.LeaseToken == claim.LeaseToken && x.AttemptRevision == claim.Revision, ct);
        if (invocation is null || invocation.Status != EvaluationInvocationStatus.Started) return false;
        ApplyFailureAudit(invocation, exception, now, stale: false);
        if (invocation.Retryable && attempt.InvocationCount < attempt.Candidate.MaxInvocations)
        {
            attempt.Status = EvaluationAttemptStatus.RetryWait;
            attempt.NextAttemptAt = now + TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, attempt.InvocationCount)));
        }
        else
        {
            attempt.Status = exception is OperationCanceledException ? EvaluationAttemptStatus.Cancelled : EvaluationAttemptStatus.Failed;
            attempt.CompletedAt = now;
        }
        attempt.ErrorCode = invocation.ErrorCode;
        ClearLease(attempt);
        if (!await SaveFinalizationAsync(() => RecordStaleFailureAsync(claim, exception, ct), ct)) return false;
        await UpdateSessionProgressAsync(attempt.SessionId, ct);
        return true;
    }
    public async Task<EvaluationRawInvocationResponse?> RawInvocationAsync(AccountId owner, bool admin, bool rawReader, EvaluationModelInvocationId id, CancellationToken ct)
    {
        var row = await db.EvaluationModelInvocations.AsNoTracking()
            .Include(x => x.Attempt).ThenInclude(x => x.Session)
            .Include(x => x.Attempt).ThenInclude(x => x.Situation)
            .Include(x => x.Attempt).ThenInclude(x => x.Candidate)
            .SingleOrDefaultAsync(x => x.Id == id, ct);
        if (row is null || (!admin && (!rawReader || row.Attempt.Session.OwnerId != owner))) return null;
        return new(row.Id, row.AttemptId, row.Attempt.Situation.StableKey, row.Attempt.Candidate.CandidateKey,
            row.Attempt.Candidate.BlindCode, row.Status.Wire(), Element(row.RequestEnvelopeJson), row.SentPrompt, row.RawResponse, row.RawError,
            NullableElement(row.ParsedOutputJson), NullableElement(row.ValidationJson), row.ProfileSnapshotJson, row.GenerationConfigJson, row.Provider, row.Model,
            row.ProviderRequestId, row.FinishReason, row.InputTokens, row.OutputTokens, row.EndToEndLatencyMilliseconds, row.ErrorCode, row.ErrorCategory,
            row.Retryable, row.StartedAt, row.CompletedAt);
    }
    public async Task<IReadOnlyList<EvaluationJudgmentResponse>?> JudgmentsAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        if (!await Owned(id, owner, admin).AnyAsync(ct)) return null; var rows = await db.EvaluationMachineJudgments.AsNoTracking().Where(x => x.SessionId == id).ToListAsync(ct); return rows.OrderBy(x => x.CreatedAt).Select(Map).ToList();
    }
    public async Task<EvaluationQuoteSourcesResponse> QuoteSourcesAsync(AccountId owner, bool admin, CancellationToken ct)
    {
        var authoredScenarioIds = admin
            ? await db.Scenarios.AsNoTracking().Select(x => x.Id).ToListAsync(ct)
            : await db.Scenarios.AsNoTracking().Where(x => x.AuthorId == owner).Select(x => x.Id).ToListAsync(ct);
        var sessions = await db.Sessions.AsNoTracking()
            .Where(x => admin || x.OwnerId == owner || authoredScenarioIds.Contains(x.ScenarioId))
            .ToListAsync(ct);
        if (sessions.Count == 0) return new([]);

        var sessionIds = sessions.Select(x => x.Id).ToList();
        var scenarioIds = sessions.Select(x => x.ScenarioId).Distinct().ToList();
        var scenarios = await db.Scenarios.AsNoTracking().Where(x => scenarioIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var turns = await db.SessionTurns.AsNoTracking().Where(x => sessionIds.Contains(x.SessionId) && x.PlayerInputId != null).ToListAsync(ct);
        var interactions = await db.SessionAiInteractions.AsNoTracking().Include(x => x.Execution)
            .Where(x => sessionIds.Contains(x.SessionId) && x.Status == SessionAiInteractionStatus.Succeeded && x.SentPrompt != null)
            .ToListAsync(ct);
        var turnByInput = turns.Where(x => x.PlayerInputId is not null)
            .ToDictionary(x => x.PlayerInputId!.Value.AsPrimitive(), x => x, StringComparer.Ordinal);

        var response = sessions.GroupBy(x => x.ScenarioId).OrderBy(x => scenarios[x.Key].Title.Value).Select(scenarioGroup =>
            new EvaluationQuoteScenarioResponse(scenarioGroup.Key, scenarios[scenarioGroup.Key].Title.Value,
                scenarioGroup.OrderByDescending(x => x.UpdatedAt).Select(session =>
                {
                    var stagesByTurn = interactions.Where(x => x.SessionId == session.Id && x.Execution.TriggerType == SessionExecutionTriggerType.PlayerInput)
                        .Select(x => new { Interaction = x, Trigger = x.Execution.TriggerId.AsPrimitive() })
                        .Where(x => turnByInput.TryGetValue(x.Trigger, out var turn) && turn.SessionId == session.Id)
                        .GroupBy(x => turnByInput[x.Trigger].Id)
                        .ToDictionary(x => x.Key, x => x.OrderBy(y => y.Interaction.Sequence).Select(y =>
                            new EvaluationQuoteStageResponse(y.Interaction.Stage switch
                            {
                                SessionAiInteractionStage.ActionDecision => "action",
                                SessionAiInteractionStage.Narrative => "narrative",
                                _ => "entityState",
                            }, y.Interaction.Stage.ToString(), Preview(y.Interaction.ReceivedResult), y.Interaction.Id)).ToList());
                    var quoteTurns = turns.Where(x => x.SessionId == session.Id && stagesByTurn.ContainsKey(x.Id)).OrderBy(x => x.Position)
                        .Select(x => new EvaluationQuoteTurnResponse(x.Id, x.Position, stagesByTurn[x.Id])).ToList();
                    return new EvaluationQuoteSessionResponse(session.Id, $"{scenarios[session.ScenarioId].Title.Value} · {session.Id.AsPrimitive()}", quoteTurns);
                }).Where(x => x.Turns.Count > 0).ToList())).Where(x => x.Sessions.Count > 0).ToList();
        return new(response);
    }

    public async Task<IReadOnlyList<EvaluationReviewBatchResponse>?> ReviewBatchesAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        if (!await Owned(id, owner, admin).AnyAsync(ct)) return null;
        var batches = (await db.EvaluationReviewBatches.AsNoTracking().Include(x => x.Assignments).ThenInclude(x => x.Items)
            .Where(x => x.SessionId == id).ToListAsync(ct)).OrderByDescending(x => x.CreatedAt).ToList();
        var itemIds = batches.SelectMany(x => x.Assignments).SelectMany(x => x.Items).Select(x => x.Id).ToList();
        IReadOnlyList<EvaluationHumanJudgment> judgmentRows = itemIds.Count == 0
            ? []
            : await db.EvaluationHumanJudgments.AsNoTracking().Where(x => itemIds.Contains(x.ItemId)).ToListAsync(ct);
        var judged = judgmentRows.GroupBy(x => x.ItemId)
            .ToDictionary(x => x.Key, x => x.Select(y => y.CriterionKey).Distinct(StringComparer.Ordinal).Count());
        return batches.Select(batch => new EvaluationReviewBatchResponse(batch.Id, batch.Status.Wire(), batch.RequiredReviewsPerOutput,
            batch.Deadline, batch.CreatedAt, batch.ClosedAt, batch.Assignments.OrderBy(x => x.CreatedAt).Select(assignment =>
                new EvaluationReviewAssignmentSummaryResponse(assignment.OpaqueCode, assignment.ReviewerId, assignment.Status.Wire(),
                    assignment.Items.Count, assignment.Items.Count(item => judged.TryGetValue(item.Id, out var count) && count > 0), assignment.SubmittedAt)).ToList())).ToList();
    }

    public async Task<EvaluationReviewBatchId?> CreateReviewBatchAsync(AccountId owner, bool admin, EvaluationSessionId id, CreateEvaluationReviewBatchRequest input, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).SingleOrDefaultAsync(ct); if (session is null) return null;
        if (session.Status is not (EvaluationSessionStatus.AwaitingHumanReview or EvaluationSessionStatus.Completed or EvaluationSessionStatus.CompletedWithErrors)) throw new EvaluationValidationException("machine_execution_not_complete");
        if (input.ReviewerIds.Count == 0 || input.RequiredReviewsPerOutput < 1) throw new EvaluationValidationException("reviewers_required");
        var attempts = await db.EvaluationAttempts.AsNoTracking().Include(x => x.Candidate).Where(x => x.SessionId == id && x.Status == EvaluationAttemptStatus.Succeeded).OrderBy(x => x.Id).ToListAsync(ct);
        var now = timeProvider.GetUtcNow(); var batch = new EvaluationReviewBatch { Id = NewReviewBatchId(), SessionId = id, RubricVersion = Clean(input.RubricVersion, "1"), RequiredReviewsPerOutput = input.RequiredReviewsPerOutput,
            ReviewerPoolJson = Serialize(input.ReviewerIds), PolicyJson = session.ReviewPolicyJson, Deadline = input.Deadline, CreatedAt = now };
        var random = RandomNumberGenerator.GetInt32(int.MaxValue); var ordered = attempts.OrderBy(x => Hash($"{random}:{x.Id.AsPrimitive()}"), StringComparer.Ordinal).ToList();
        foreach (var reviewer in input.ReviewerIds.Distinct())
        {
            var assignment = new EvaluationReviewAssignment { Id = NewReviewAssignmentId(), BatchId = batch.Id, OpaqueCode = $"REV-{Convert.ToHexString(RandomNumberGenerator.GetBytes(12))}", ReviewerId = reviewer, CreatedAt = now };
            var index = 0; foreach (var attempt in ordered) assignment.Items.Add(new EvaluationReviewItem { Id = NewReviewItemId(), AssignmentId = assignment.Id, AttemptId = attempt.Id, OpaqueCandidateCode = attempt.Candidate.BlindCode, DisplayOrder = ++index });
            batch.Assignments.Add(assignment);
        }
        db.EvaluationReviewBatches.Add(batch); session.Status = EvaluationSessionStatus.AwaitingHumanReview; session.ReviewOpenedAt ??= now; session.Revision++; await db.SaveChangesAsync(ct); return batch.Id;
    }
    public async Task<BlindReviewAssignmentResponse?> BlindAssignmentAsync(AccountId reviewer, bool admin, string opaqueCode, CancellationToken ct)
    {
        var assignment = await db.EvaluationReviewAssignments.AsNoTracking().Include(x => x.Batch).Include(x => x.Items).SingleOrDefaultAsync(x => x.OpaqueCode == opaqueCode && (admin || x.ReviewerId == reviewer), ct); if (assignment is null) return null;
        var session = await db.EvaluationSessions.AsNoTracking().SingleAsync(x => x.Id == assignment.Batch.SessionId, ct); var itemIds = assignment.Items.Select(x => x.Id).ToList();
        var judgments = await db.EvaluationHumanJudgments.AsNoTracking().Where(x => itemIds.Contains(x.ItemId) && x.ReviewerId == assignment.ReviewerId).ToListAsync(ct);
        var attemptIds = assignment.Items.Select(x => x.AttemptId).ToList(); var attempts = await db.EvaluationAttempts.AsNoTracking().Include(x => x.Situation).Include(x => x.Invocations).Where(x => attemptIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var items = assignment.Items.OrderBy(x => x.DisplayOrder).Select(item => { var attempt = attempts[item.AttemptId]; var invocation = attempt.Invocations.Where(x => x.Status == EvaluationInvocationStatus.Succeeded).OrderByDescending(x => x.InvocationNumber).First();
            return new BlindReviewItemResponse(item.Id, item.OpaqueCandidateCode, attempt.Situation.Stage.Wire(), Element(attempt.Situation.RequestJson), Element(invocation.ParsedOutputJson ?? "{}"), item.DisplayOrder,
                judgments.Where(x => x.ItemId == item.Id).OrderBy(x => x.Revision).Select(x => new BlindHumanJudgmentResponse(x.Id, x.CriterionKey, x.Score, x.Verdict, Deserialize<string>(x.TagsJson), x.Comment, x.Confidence, x.Revision, x.SubmittedAt)).ToList()); }).ToList();
        return new(assignment.OpaqueCode, assignment.Status.Wire(), assignment.Revision, Element(session.RubricJson), items);
    }
    public async Task<BlindHumanJudgmentResponse?> SaveBlindJudgmentAsync(AccountId reviewer, bool admin, string opaqueCode, EvaluationReviewItemId itemId, SaveBlindJudgmentRequest input, CancellationToken ct)
    {
        var assignment = await db.EvaluationReviewAssignments.Include(x => x.Items).Include(x => x.Batch).SingleOrDefaultAsync(x => x.OpaqueCode == opaqueCode && (admin || x.ReviewerId == reviewer), ct); if (assignment is null) return null;
        if (assignment.Status != EvaluationAssignmentStatus.Draft) throw new EvaluationValidationException("assignment_locked"); if (assignment.Revision != input.AssignmentRevision) throw new EvaluationValidationException("revision_conflict");
        if (!assignment.Items.Any(x => x.Id == itemId)) return null;
        var rubricJson = await db.EvaluationSessions.AsNoTracking().Where(x => x.Id == assignment.Batch.SessionId).Select(x => x.RubricJson).SingleAsync(ct);
        ValidateHumanJudgment(rubricJson, input);
        var prior = await db.EvaluationHumanJudgments.Where(x => x.ItemId == itemId && x.ReviewerId == assignment.ReviewerId && x.CriterionKey == input.CriterionKey).OrderByDescending(x => x.Revision).FirstOrDefaultAsync(ct);
        var row = new EvaluationHumanJudgment { Id = NewHumanJudgmentId(), ItemId = itemId, ReviewerId = assignment.ReviewerId, CriterionKey = Required(input.CriterionKey, "criterion_required"), Score = input.Score, Verdict = input.Verdict,
            TagsJson = Serialize(input.Tags ?? []), Comment = input.Comment?.Trim() ?? "", Confidence = input.Confidence, Revision = (prior?.Revision ?? 0) + 1, SupersedesJudgmentId = prior?.Id, SubmittedAt = timeProvider.GetUtcNow() };
        db.EvaluationHumanJudgments.Add(row); assignment.Revision++; await db.SaveChangesAsync(ct); return new(row.Id, row.CriterionKey, row.Score, row.Verdict, Deserialize<string>(row.TagsJson), row.Comment, row.Confidence, row.Revision, row.SubmittedAt);
    }
    public async Task<bool?> SubmitAssignmentAsync(AccountId reviewer, bool admin, string opaqueCode, long revision, CancellationToken ct)
    {
        var assignment = await db.EvaluationReviewAssignments.Include(x => x.Items).Include(x => x.Batch).SingleOrDefaultAsync(x => x.OpaqueCode == opaqueCode && (admin || x.ReviewerId == reviewer), ct); if (assignment is null) return null;
        if (assignment.Status != EvaluationAssignmentStatus.Draft) return true; if (assignment.Revision != revision) throw new EvaluationValidationException("revision_conflict");
        var judged = await db.EvaluationHumanJudgments.Where(x => x.ReviewerId == assignment.ReviewerId && assignment.Items.Select(i => i.Id).Contains(x.ItemId)).Select(x => x.ItemId).Distinct().CountAsync(ct);
        if (judged < assignment.Items.Count) throw new EvaluationValidationException("assignment_incomplete"); assignment.Status = EvaluationAssignmentStatus.Submitted; assignment.SubmittedAt = timeProvider.GetUtcNow(); assignment.Revision++;
        await db.SaveChangesAsync(ct); await UpdateReviewProgressAsync(assignment.Batch.SessionId, ct); return true;
    }
    public async Task<bool?> CloseReviewAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).SingleOrDefaultAsync(ct); if (session is null) return null; var batches = await db.EvaluationReviewBatches.Include(x => x.Assignments).Where(x => x.SessionId == id && x.Status == EvaluationReviewStatus.Open).ToListAsync(ct);
        if (batches.SelectMany(x => x.Assignments).Any(x => x.Status != EvaluationAssignmentStatus.Submitted)) throw new EvaluationValidationException("review_incomplete"); var now = timeProvider.GetUtcNow();
        foreach (var batch in batches) { batch.Status = EvaluationReviewStatus.Closed; batch.ClosedAt = now; foreach (var assignment in batch.Assignments) assignment.Status = EvaluationAssignmentStatus.Locked; }
        session.ReviewClosedAt = now; session.Status = session.FailedAttemptCount > 0 ? EvaluationSessionStatus.CompletedWithErrors : EvaluationSessionStatus.Completed; session.CompletedAt = now; session.Revision++; await db.SaveChangesAsync(ct); await CreateAggregateAsync(session, ct); return true;
    }
    public async Task<bool?> RevealAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).SingleOrDefaultAsync(ct); if (session is null) return null; session.Reveal(owner, timeProvider.GetUtcNow()); await db.SaveChangesAsync(ct); return true;
    }
    public async Task<EvaluationResultsResponse?> ResultsAsync(AccountId owner, bool admin, EvaluationSessionId id, CancellationToken ct)
    {
        var session = await Owned(id, owner, admin).SingleOrDefaultAsync(ct); if (session is null) return null; var candidates = await db.EvaluationCandidates.AsNoTracking().Where(x => x.SessionId == id).ToListAsync(ct);
        var attempts = await db.EvaluationAttempts.AsNoTracking().Where(x => x.SessionId == id).Include(x => x.Invocations).ToListAsync(ct); var judgments = await db.EvaluationMachineJudgments.AsNoTracking().Where(x => x.SessionId == id).ToListAsync(ct);
        var humanCount = await db.EvaluationHumanJudgments.AsNoTracking().Join(db.EvaluationReviewItems, x => x.ItemId, x => x.Id, (j, i) => new { j, i }).Join(db.EvaluationAttempts, x => x.i.AttemptId, x => x.Id, (x, a) => new { x.j, a.SessionId }).CountAsync(x => x.SessionId == id, ct);
        var candidateResults = candidates.Select(c => { var a = attempts.Where(x => x.CandidateId == c.Id).ToList(); var js = judgments.Where(x => a.Select(y => y.Id).Contains(x.AttemptId)).ToList(); var invocations = a.SelectMany(x => x.Invocations).ToList();
            return new EvaluationCandidateResultResponse(c.Id, c.CandidateKey, session.IdentitiesRevealed ? $"{c.Provider}/{c.Model}" : c.BlindCode, a.Count, a.Count(x => x.Status == EvaluationAttemptStatus.Succeeded), js.Count(x => x.Passed), js.Count == 0 ? 0 : decimal.Divide(js.Count(x => x.Passed), js.Count), invocations.Sum(x => x.InputTokens), invocations.Sum(x => x.OutputTokens), invocations.Sum(x => x.EndToEndLatencyMilliseconds)); }).ToList();
        var aggregate = await db.EvaluationAggregates.AsNoTracking().Where(x => x.SessionId == id).OrderByDescending(x => x.Revision).FirstOrDefaultAsync(ct);
        return new(id, session.Status.Wire(), session.CurrentAggregateRevision, candidateResults, judgments.Select(Map).ToList(), humanCount, aggregate is null ? null : Element(aggregate.SummaryJson));
    }
    public async Task<(string ContentType, string FileName, byte[] Content)?> ExportAsync(AccountId owner, bool admin, bool rawReader, EvaluationSessionId id, string format, bool redacted, CancellationToken ct)
    {
        var results = await ResultsAsync(owner, admin, id, ct); if (results is null) return null;
        if (format.Equals("json", StringComparison.OrdinalIgnoreCase)) return ("application/json", $"{id.AsPrimitive()}.json", JsonSerializer.SerializeToUtf8Bytes(results, Json));
        if (!format.Equals("csv", StringComparison.OrdinalIgnoreCase)) throw new EvaluationValidationException("unsupported_export_format");
        var csv = new StringBuilder("candidateId,candidateKey,displayIdentity,attemptCount,succeededCount,passedCount,passRate,inputTokens,outputTokens,latencyMilliseconds\n");
        foreach (var c in results.Candidates) csv.AppendLine(string.Join(',', Csv(c.CandidateId.AsPrimitive()), Csv(c.CandidateKey), Csv(redacted ? c.DisplayIdentity : c.DisplayIdentity), c.AttemptCount, c.SucceededCount, c.PassedCount, c.PassRate.ToString(CultureInfo.InvariantCulture), c.InputTokens, c.OutputTokens, c.LatencyMilliseconds));
        return ("text/csv; charset=utf-8", $"{id.AsPrimitive()}.csv", Encoding.UTF8.GetBytes(csv.ToString()));
    }
    public EvaluationCorpusManifestResponse Corpus()
    {
        var resource = typeof(EvaluationSessionService).Assembly.GetManifestResourceNames().Single(x => x.EndsWith("ai-evaluation-corpus.v1.json", StringComparison.Ordinal)); using var stream = typeof(EvaluationSessionService).Assembly.GetManifestResourceStream(resource)!;
        using var doc = JsonDocument.Parse(stream); var root = doc.RootElement; var cases = root.GetProperty("cases").EnumerateArray().Select(x => new EvaluationCorpusCaseResponse(x.GetProperty("caseId").GetString()!, x.GetProperty("stage").GetString()!, x.GetProperty("request").Clone(), x.GetProperty("metadata").Clone())).ToList();
        return new(root.GetProperty("corpusId").GetString()!, root.GetProperty("version").GetString()!, root.GetProperty("description").GetString()!, cases);
    }
    private async Task<List<EvaluationAttempt>> LoadClaimCandidatesAsync(DateTimeOffset now, int scanSize, CancellationToken ct)
    {
        if (db.Database.IsNpgsql())
        {
            var ids = await ReadLockedPostgresCandidateIdsAsync(now, scanSize, ct);
            if (ids.Count == 0) return [];
            var rows = await db.EvaluationAttempts
                .Include(x => x.Session)
                .Include(x => x.Situation)
                .Include(x => x.Candidate)
                .Include(x => x.Invocations)
                .Where(x => ids.Contains(x.Id))
                .ToListAsync(ct);
            var order = ids.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);
            return rows.OrderBy(x => order[x.Id]).ToList();
        }

        return (await db.EvaluationAttempts
                .Include(x => x.Session)
                .Include(x => x.Situation)
                .Include(x => x.Candidate)
                .Include(x => x.Invocations)
                .Where(x => (x.Status == EvaluationAttemptStatus.Queued
                        || x.Status == EvaluationAttemptStatus.RetryWait
                        || x.Status == EvaluationAttemptStatus.Running)
                    && x.Session.Status != EvaluationSessionStatus.CancelRequested
                    && x.Session.Status != EvaluationSessionStatus.Cancelled)
                .OrderBy(x => x.Id)
                .Take(scanSize)
                .ToListAsync(ct))
            .Where(x => x.Status == EvaluationAttemptStatus.Queued
                || x.Status == EvaluationAttemptStatus.RetryWait && (x.NextAttemptAt is null || x.NextAttemptAt <= now)
                || x.Status == EvaluationAttemptStatus.Running && x.LeaseExpiresAt <= now)
            .OrderBy(x => x.CreatedAt)
            .ThenBy(x => x.Id.AsPrimitive(), StringComparer.Ordinal)
            .ToList();
    }

    private async Task<List<EvaluationAttemptId>> ReadLockedPostgresCandidateIdsAsync(DateTimeOffset now, int scanSize, CancellationToken ct)
    {
        await db.Database.OpenConnectionAsync(ct);
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.Transaction = db.Database.CurrentTransaction?.GetDbTransaction()
            ?? throw new InvalidOperationException("A claim transaction is required.");
        command.CommandText = """
            SELECT a."Id"
            FROM "EvaluationAttempts" AS a
            INNER JOIN "EvaluationSessions" AS s ON s."Id" = a."SessionId"
            WHERE a."Status" IN ('Queued', 'RetryWait', 'Running')
              AND s."Status" NOT IN ('CancelRequested', 'Cancelled')
              AND (
                    a."Status" = 'Queued'
                 OR (a."Status" = 'RetryWait' AND (a."NextAttemptAt" IS NULL OR a."NextAttemptAt" <= @now))
                 OR (a."Status" = 'Running' AND a."LeaseExpiresAt" <= @now)
              )
            ORDER BY a."CreatedAt", a."Id"
            FOR UPDATE OF a SKIP LOCKED
            LIMIT @scanSize
            """;
        AddParameter(command, "now", now);
        AddParameter(command, "scanSize", scanSize);
        var ids = new List<EvaluationAttemptId>(scanSize);
        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) ids.Add(new(reader.GetString(0)));
        return ids;
    }

    private static void AddParameter(DbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private async Task<bool> SaveFinalizationAsync(Func<Task> recordStale, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            db.ChangeTracker.Clear();
            await recordStale();
            return false;
        }
    }

    private async Task RecordStaleSuccessAsync(
        EvaluationClaim claim,
        string outputJson,
        AiGenerationMetadata metadata,
        string? sentPrompt,
        string? raw,
        CancellationToken ct)
    {
        var invocation = await db.EvaluationModelInvocations.SingleOrDefaultAsync(x => x.Id == claim.InvocationId
            && x.LeaseToken == claim.LeaseToken && x.AttemptRevision == claim.Revision, ct);
        if (invocation is null || invocation.Status is not (EvaluationInvocationStatus.Started or EvaluationInvocationStatus.UnknownOutcome)) return;
        var now = timeProvider.GetUtcNow();
        ApplySuccessAudit(invocation, outputJson, metadata, sentPrompt, raw, now);
        invocation.Status = EvaluationInvocationStatus.UnknownOutcome;
        invocation.ExpiredAt ??= now;
        invocation.CompletedAt ??= now;
        invocation.ErrorCode ??= "lease_lost";
        invocation.ErrorCategory = "lease";
        invocation.Retryable = true;
        invocation.ValidationJson = Serialize(new { status = "lease-lost-after-provider-success", outputAudited = true });
        await db.SaveChangesAsync(ct);
    }

    private async Task RecordStaleFailureAsync(EvaluationClaim claim, Exception exception, CancellationToken ct)
    {
        var invocation = await db.EvaluationModelInvocations.SingleOrDefaultAsync(x => x.Id == claim.InvocationId
            && x.LeaseToken == claim.LeaseToken && x.AttemptRevision == claim.Revision, ct);
        if (invocation is null || invocation.Status is not (EvaluationInvocationStatus.Started or EvaluationInvocationStatus.UnknownOutcome)) return;
        var now = timeProvider.GetUtcNow();
        ApplyFailureAudit(invocation, exception, now, stale: true);
        await db.SaveChangesAsync(ct);
    }

    private static void ApplySuccessAudit(
        EvaluationModelInvocation invocation,
        string outputJson,
        AiGenerationMetadata metadata,
        string? sentPrompt,
        string? raw,
        DateTimeOffset now)
    {
        invocation.Status = EvaluationInvocationStatus.Succeeded;
        invocation.SentPrompt = sentPrompt;
        invocation.RawResponse = raw;
        invocation.ParsedOutputJson = outputJson;
        invocation.Provider = metadata.Provider.AsPrimitive();
        invocation.Model = metadata.Model;
        invocation.ProviderRequestId = metadata.ResponseId;
        invocation.FinishReason = metadata.FinishReason;
        invocation.InputTokens = metadata.InputTokens;
        invocation.OutputTokens = metadata.OutputTokens;
        invocation.GenerationLatencyMilliseconds = metadata.LatencyMilliseconds;
        invocation.EndToEndLatencyMilliseconds = Math.Max(0, (long)(now - invocation.StartedAt).TotalMilliseconds);
        invocation.CompletedAt = now;
        invocation.PromptHash = sentPrompt is null ? null : Hash(sentPrompt);
        invocation.RawResultHash = raw is null ? null : Hash(raw);
        invocation.OutputHash = Hash(outputJson);
    }

    private static void ApplyFailureAudit(EvaluationModelInvocation invocation, Exception exception, DateTimeOffset now, bool stale)
    {
        var provider = exception as AiProviderException;
        var retryable = provider?.Retryable ?? exception is TimeoutException;
        invocation.Status = stale ? EvaluationInvocationStatus.UnknownOutcome
            : exception is OperationCanceledException ? EvaluationInvocationStatus.Cancelled : EvaluationInvocationStatus.Failed;
        invocation.CompletedAt ??= now;
        invocation.ExpiredAt = stale ? invocation.ExpiredAt ?? now : invocation.ExpiredAt;
        invocation.ErrorCode = stale ? invocation.ErrorCode ?? "lease_lost"
            : provider?.Code ?? (exception is OperationCanceledException ? "cancelled" : "evaluation_execution_failed");
        invocation.ErrorCategory = stale ? "lease" : provider is null ? "internal" : "provider";
        invocation.Retryable = stale || retryable;
        invocation.SentPrompt ??= provider?.SentPrompt;
        invocation.RawResponse ??= provider?.ReceivedResult;
        invocation.RawError ??= provider?.ProviderResponseExcerpt ?? exception.Message;
        invocation.ProviderRequestId ??= provider?.Metadata?.ResponseId;
        invocation.InputTokens ??= provider?.Metadata?.InputTokens;
        invocation.OutputTokens ??= provider?.Metadata?.OutputTokens;
        invocation.GenerationLatencyMilliseconds ??= provider?.Metadata?.LatencyMilliseconds;
        invocation.EndToEndLatencyMilliseconds ??= Math.Max(0, (long)(now - invocation.StartedAt).TotalMilliseconds);
        invocation.PromptHash ??= invocation.SentPrompt is null ? null : Hash(invocation.SentPrompt);
        invocation.RawResultHash ??= invocation.RawResponse is null ? Hash(invocation.RawError ?? "") : Hash(invocation.RawResponse);
        if (stale) invocation.ValidationJson = Serialize(new { status = "lease-lost-after-provider-failure", errorAudited = true });
    }

    private async Task UpdateSessionProgressAsync(EvaluationSessionId id, CancellationToken ct)
    {
        db.ChangeTracker.Clear();
        var attempts = await db.EvaluationAttempts.AsNoTracking().Where(x => x.SessionId == id).ToListAsync(ct);
        var terminal = attempts.Count(x => x.Status is EvaluationAttemptStatus.Succeeded or EvaluationAttemptStatus.Failed or EvaluationAttemptStatus.Cancelled or EvaluationAttemptStatus.Skipped);
        var succeeded = attempts.Count(x => x.Status == EvaluationAttemptStatus.Succeeded);
        var failed = attempts.Count(x => x.Status == EvaluationAttemptStatus.Failed);
        await db.EvaluationSessions.Where(x => x.Id == id).ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.TerminalAttemptCount, terminal)
            .SetProperty(x => x.SucceededAttemptCount, succeeded)
            .SetProperty(x => x.FailedAttemptCount, failed)
            .SetProperty(x => x.Revision, x => x.Revision + 1), ct);
        var planned = await db.EvaluationSessions.AsNoTracking().Where(x => x.Id == id).Select(x => x.PlannedAttemptCount).SingleAsync(ct);
        if (terminal != planned || planned == 0) return;
        var now = timeProvider.GetUtcNow(); var cancelled = attempts.All(x => x.Status == EvaluationAttemptStatus.Cancelled);
        await db.EvaluationSessions.Where(x => x.Id == id && x.Status != EvaluationSessionStatus.Cancelled && x.Status != EvaluationSessionStatus.Completed && x.Status != EvaluationSessionStatus.CompletedWithErrors)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, cancelled ? EvaluationSessionStatus.Cancelled : EvaluationSessionStatus.AwaitingHumanReview)
                .SetProperty(x => x.MachineCompletedAt, now)
                .SetProperty(x => x.ReviewOpenedAt, x => cancelled ? x.ReviewOpenedAt : x.ReviewOpenedAt ?? now)
                .SetProperty(x => x.CompletedAt, x => cancelled ? now : x.CompletedAt)
                .SetProperty(x => x.Revision, x => x.Revision + 1), ct);
    }
    private async Task UpdateReviewProgressAsync(EvaluationSessionId id, CancellationToken ct)
    {
        var reviewed = await db.EvaluationReviewAssignments.Where(x => x.Batch.SessionId == id && x.Status == EvaluationAssignmentStatus.Submitted).SelectMany(x => x.Items).CountAsync(ct);
        await db.EvaluationSessions.Where(x => x.Id == id).ExecuteUpdateAsync(setters => setters
            .SetProperty(x => x.ReviewedItemCount, reviewed).SetProperty(x => x.Revision, x => x.Revision + 1), ct);
    }
    private async Task CreateAggregateAsync(EvaluationSession session, CancellationToken ct)
    {
        var machine = await db.EvaluationMachineJudgments.AsNoTracking().Where(x => x.SessionId == session.Id).ToListAsync(ct); var human = await db.EvaluationHumanJudgments.AsNoTracking().Join(db.EvaluationReviewItems, x => x.ItemId, x => x.Id, (j, i) => new { j, i }).Join(db.EvaluationAttempts, x => x.i.AttemptId, x => x.Id, (x, a) => new { x.j, a.SessionId }).Where(x => x.SessionId == session.Id).Select(x => x.j).ToListAsync(ct);
        var watermark = Hash(string.Join('|', machine.Select(x => x.Id.AsPrimitive()).Concat(human.Select(x => x.Id.AsPrimitive())).Order(StringComparer.Ordinal))); var revision = session.CurrentAggregateRevision + 1;
        var summary = Serialize(new { attempts = session.PlannedAttemptCount, succeeded = session.SucceededAttemptCount, failed = session.FailedAttemptCount, machineJudgments = machine.Count, machinePassed = machine.Count(x => x.Passed), humanJudgments = human.Count });
        db.EvaluationAggregates.Add(new EvaluationAggregate { Id = NewAggregateId(), SessionId = session.Id, Revision = revision, SourceWatermark = watermark, IncludedAttemptCount = session.TerminalAttemptCount, IncludedMachineJudgmentCount = machine.Count, IncludedHumanJudgmentCount = human.Count, SummaryJson = summary, CalculatedAt = timeProvider.GetUtcNow() }); session.CurrentAggregateRevision = revision; await db.SaveChangesAsync(ct);
    }
    private IQueryable<EvaluationSession> Owned(EvaluationSessionId id, AccountId owner, bool admin) => db.EvaluationSessions.Where(x => x.Id == id && (admin || x.OwnerId == owner));
    private static EvaluationSituation NewSituation(EvaluationSession session, string stableKey, EvaluationStage stage, EvaluationSituationSourceKind source, string request, string expectations, AccountId actor, string? sensitivity)
    {
        var revision = session.Situations.Where(x => x.StableKey == stableKey.Trim()).Select(x => x.Revision).DefaultIfEmpty(0).Max() + 1; return new() { Id = NewSituationId(), SessionId = session.Id, StableKey = Required(stableKey, "stable_key_required"), Revision = revision, Stage = stage, SourceKind = source, RequestJson = request, ExpectationsJson = expectations, RequestHash = Hash(request), SourceBundleHash = Hash(request + expectations), Sensitivity = Clean(sensitivity, session.Sensitivity), ImportedById = actor, ImportedAt = DateTimeOffset.UtcNow };
    }
    private static void ValidateRequest(EvaluationStage stage, string request)
    {
        object? value = stage switch
        {
            EvaluationStage.Action => JsonSerializer.Deserialize<ModelActionDecisionRequest>(request, Json),
            EvaluationStage.Narrative => JsonSerializer.Deserialize<PostStateNarrativeRequest>(request, Json),
            _ => JsonSerializer.Deserialize<EntityStateTransitionRequest>(request, Json),
        };
        if (value is null) throw new EvaluationValidationException("request_invalid");
    }
    private static void ValidateHumanJudgment(string rubricJson, SaveBlindJudgmentRequest input)
    {
        var criterionKey = Required(input.CriterionKey, "criterion_required");
        using var rubric = JsonDocument.Parse(string.IsNullOrWhiteSpace(rubricJson) ? "{}" : rubricJson);
        var root = rubric.RootElement;
        var criteria = root.ValueKind == JsonValueKind.Array
            ? root
            : root.ValueKind == JsonValueKind.Object && root.TryGetProperty("criteria", out var nested) && nested.ValueKind == JsonValueKind.Array
                ? nested
                : default;
        if (criteria.ValueKind != JsonValueKind.Array) throw new EvaluationValidationException("criterion_not_found");
        foreach (var criterion in criteria.EnumerateArray())
        {
            var key = criterion.ValueKind == JsonValueKind.String
                ? criterion.GetString()
                : criterion.ValueKind == JsonValueKind.Object && criterion.TryGetProperty("id", out var id) && id.ValueKind == JsonValueKind.String
                    ? id.GetString()
                    : criterion.ValueKind == JsonValueKind.Object && criterion.TryGetProperty("criterionKey", out var legacyId) && legacyId.ValueKind == JsonValueKind.String
                        ? legacyId.GetString()
                        : null;
            if (!string.Equals(key, criterionKey, StringComparison.Ordinal)) continue;
            if (input.Score is null) return;
            var minimum = criterion.ValueKind == JsonValueKind.Object && criterion.TryGetProperty("scaleMin", out var min) && min.TryGetDecimal(out var parsedMin) ? parsedMin : 1m;
            var maximum = criterion.ValueKind == JsonValueKind.Object && criterion.TryGetProperty("scaleMax", out var max) && max.TryGetDecimal(out var parsedMax) ? parsedMax : 5m;
            if (input.Score < minimum || input.Score > maximum) throw new EvaluationValidationException("score_out_of_range");
            return;
        }
        throw new EvaluationValidationException("criterion_not_found");
    }
    private static EvaluationSessionResponse Map(EvaluationSession x) => new(MapSummary(x), Element(x.ConfigJson), Element(x.RubricJson), Element(x.ReviewPolicyJson), x.Situations.OrderBy(y => y.StableKey).ThenBy(y => y.Revision).Select(Map).ToList(), x.Candidates.OrderBy(y => y.CandidateKey).Select(Map).ToList());
    private static EvaluationSessionSummaryResponse MapSummary(EvaluationSession x) => new(x.Id, x.Title, x.Purpose, Deserialize<string>(x.TagsJson), x.Sensitivity, x.Status.Wire(), x.Revision, x.Situations.Count, x.Candidates.Count, x.PlannedAttemptCount, x.TerminalAttemptCount, x.SucceededAttemptCount, x.FailedAttemptCount, x.ReviewedItemCount, x.IdentitiesRevealed, x.CreatedAt, x.CompletedAt);
    private static EvaluationSituationResponse Map(EvaluationSituation x) => new(x.Id, x.StableKey, x.Revision, x.Stage.Wire(), x.SourceKind.Wire(), Element(x.RequestJson), Element(x.ExpectationsJson), x.RequestHash, x.SourceBundleHash, Element(x.CitationJson));
    private static EvaluationCandidateResponse Map(EvaluationCandidate x) => new(x.Id, x.CandidateKey, x.BlindCode, x.ProfileId, x.ProfileRevision, x.Provider, x.Adapter, x.Model, x.Repetitions, x.IsActive);
    private static EvaluationAttemptResponse Map(EvaluationAttempt x) => new(x.Id, x.SituationId, x.CandidateId, x.Repetition, x.Status.Wire(), x.InvocationCount, x.ErrorCode, x.StartedAt, x.CompletedAt, x.Invocations.OrderBy(y => y.InvocationNumber).Select(y => new EvaluationInvocationSummaryResponse(y.Id, y.InvocationNumber, y.Status.Wire(), y.ErrorCode, y.StartedAt, y.CompletedAt)).ToList());
    private static EvaluationJudgmentResponse Map(EvaluationMachineJudgment x) => new(x.Id, x.AttemptId, x.InvocationId, x.JudgeKey, x.JudgeVersion, x.CriterionKey, x.Passed, x.Score, x.Confidence, Deserialize<string>(x.LabelsJson), x.Rationale, x.CreatedAt);
    private static void ClearLease(EvaluationAttempt x) { x.LeaseOwner = null; x.LeaseToken = null; x.LeaseExpiresAt = null; }
    private static string Required(string? value, string code) => string.IsNullOrWhiteSpace(value) ? throw new EvaluationValidationException(code) : value.Trim();
    private static string Clean(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    private static string Normalize(JsonElement value) => value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null ? "{}" : JsonSerializer.Serialize(value, Json);
    private static string Normalize<T>(T value) => JsonSerializer.Serialize(value, Json);
    private static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Json);
    private static JsonElement Element(string json) => JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json).RootElement.Clone();
    private static JsonElement? NullableElement(string? json) => string.IsNullOrWhiteSpace(json) ? null : Element(json);
    private static IReadOnlyList<T> Deserialize<T>(string json) => JsonSerializer.Deserialize<List<T>>(json, Json) ?? [];
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    private static string BlindCode() => $"C-{Convert.ToHexString(RandomNumberGenerator.GetBytes(5))}";
    private static string Preview(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "Stored response";
        var compact = value.Replace('\r', ' ').Replace('\n', ' ').Trim();
        return compact.Length <= 180 ? compact : compact[..177] + "...";
    }
    private static string Csv(object? value) { var text = Convert.ToString(value, CultureInfo.InvariantCulture) ?? ""; if (text.Length > 0 && "=+-@\t\r".Contains(text[0])) text = "'" + text; return '"' + text.Replace("\"", "\"\"") + '"'; }
    private static EvaluationSessionId NewSessionId() => new($"EVS-{Guid.NewGuid():N}".ToUpperInvariant()); private static EvaluationSituationId NewSituationId() => new($"EVQ-{Guid.NewGuid():N}".ToUpperInvariant());
    private static EvaluationCandidateId NewCandidateId() => new($"EVC-{Guid.NewGuid():N}".ToUpperInvariant()); private static EvaluationAttemptId NewAttemptId() => new($"EVA-{Guid.NewGuid():N}".ToUpperInvariant());
    private static EvaluationModelInvocationId NewInvocationId() => new($"EVI-{Guid.NewGuid():N}".ToUpperInvariant()); private static EvaluationMachineJudgmentId NewMachineJudgmentId() => new($"EVM-{Guid.NewGuid():N}".ToUpperInvariant());
    private static EvaluationReviewBatchId NewReviewBatchId() => new($"EVB-{Guid.NewGuid():N}".ToUpperInvariant()); private static EvaluationReviewAssignmentId NewReviewAssignmentId() => new($"EVR-{Guid.NewGuid():N}".ToUpperInvariant());
    private static EvaluationReviewItemId NewReviewItemId() => new($"EVT-{Guid.NewGuid():N}".ToUpperInvariant()); private static EvaluationHumanJudgmentId NewHumanJudgmentId() => new($"EVH-{Guid.NewGuid():N}".ToUpperInvariant());
    private static EvaluationAggregateId NewAggregateId() => new($"EVG-{Guid.NewGuid():N}".ToUpperInvariant());
}
