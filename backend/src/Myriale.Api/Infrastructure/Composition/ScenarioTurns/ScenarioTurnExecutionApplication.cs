using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Infrastructure.Composition.SessionArtifacts;

namespace Myriale.Api.Infrastructure.Composition.ScenarioTurns;

public sealed record ScenarioExecutionCheckpoint(
    SessionExecutionId ExecutionId,
    SessionId SessionId,
    SessionPlayerInputId PlayerInputId,
    string PlayerInput,
    SessionTurnId? AcceptedHeadTurnId,
    long AcceptedSessionRevision,
    AiProviderProfileId ActionAiProfileId,
    AiProviderProfileId NarrativeAiProfileId);

public interface IScenarioExecutionFence
{
    Task<ScenarioExecutionCheckpoint?> CheckAsync(SessionExecutionContext context, ScenarioTurnStage stage, CancellationToken cancellationToken);
}

public interface IScenarioWorldSnapshotQuery
{
    Task<ScenarioRuleWorldSnapshot> LoadAsync(SessionId sessionId, CancellationToken cancellationToken);
}

public sealed record ScenarioActionStepSnapshot(
    SessionRuleActionStepId Id,
    SessionId SessionId,
    SessionExecutionId ExecutionId,
    SessionPlayerInputId PlayerInputId,
    ScenarioTurnStage Stage,
    long PreSessionRevision,
    long? PostSessionRevision,
    string ObjectRevisionsJson,
    string ActionSnapshotJson,
    string? DecisionJson,
    string? SelectedRuleId,
    string? ResolutionPlanJson,
    string? AppliedEffectsJson,
    string? PublicPostStateJson,
    string? FactsJson,
    string? EventsJson,
    string? NarrativeHintsJson,
    string? ForbiddenNarrativeFactsJson,
    string? ExtensionReceiptJson,
    DateTimeOffset? AppliedAt,
    DateTimeOffset? NarrativePublishedAt);

public enum ScenarioCheckpointWriteOutcome { Written, Existing, LeaseLost, Conflict }

public interface IScenarioActionSnapshotRepository
{
    Task<ScenarioActionStepSnapshot?> FindAsync(SessionExecutionId executionId, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> CreateAsync(SessionExecutionContext context, ScenarioExecutionCheckpoint execution, ScenarioRuleWorldSnapshot world, RuleActionSnapshot snapshot, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> RecordDecisionAsync(SessionExecutionContext context, RuleActionDecisionResult decision, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> RecordResolutionAsync(SessionExecutionContext context, ScenarioRuleResolution resolution, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ScenarioCheckpointWriteOutcome> RecordExtensionAsync(SessionExecutionContext context, ScenarioExtensionResult result, DateTimeOffset now, CancellationToken cancellationToken);
}

public interface IScenarioAiInteractionRecorder
{
    Task<RuleActionDecisionResult?> FindRecordedDecisionAsync(SessionExecutionId executionId, CancellationToken cancellationToken);
    Task RecordSuccessAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        string canonicalResultJson, CancellationToken cancellationToken);
    Task RecordValidationFailureAsync<T>(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, NarrativeGeneration<T> generation,
        ScenarioTurnValidationException exception, CancellationToken cancellationToken);
    Task TryRecordProviderFailureAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context, int sequence,
        SessionAiInteractionStage stage, AiProviderProfileId profileId, DateTimeOffset startedAt, AiProviderException exception, CancellationToken cancellationToken);
}

public interface IScenarioAiDecisionService
{
    Task<RuleActionDecisionResult> DecideAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        RuleActionSnapshot snapshot, CancellationToken cancellationToken);
}

public sealed class ScenarioAiDecisionService(
    ScenarioActionDecisionModelMapper mapper,
    IScenarioTurnAi ai,
    IScenarioAiInteractionRecorder recorder) : IScenarioAiDecisionService
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<RuleActionDecisionResult> DecideAsync(ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        RuleActionSnapshot snapshot, CancellationToken cancellationToken)
    {
        var recorded = await recorder.FindRecordedDecisionAsync(execution.ExecutionId, cancellationToken);
        if (recorded is not null) return Validate(snapshot, recorded);
        var request = mapper.CreateRequest(execution.PlayerInput, snapshot);
        var startedAt = DateTimeOffset.UtcNow;
        NarrativeGeneration<ModelActionDecisionResult> generated;
        try { generated = await ai.DecideActionForProfileAsync(execution.ActionAiProfileId, request, cancellationToken); }
        catch (AiProviderException exception) when (exception.SentPrompt is not null || exception.ReceivedResult is not null)
        {
            await recorder.TryRecordProviderFailureAsync(execution, context, 1, SessionAiInteractionStage.ActionDecision,
                execution.ActionAiProfileId, startedAt, exception, cancellationToken);
            throw;
        }
        RuleActionDecisionResult decision;
        try { decision = Validate(snapshot, mapper.MapResult(snapshot, generated.Value)); }
        catch (ScenarioTurnValidationException exception)
        {
            await recorder.RecordValidationFailureAsync(execution, context, 1, SessionAiInteractionStage.ActionDecision,
                execution.ActionAiProfileId, startedAt, generated, exception, cancellationToken);
            throw;
        }
        await recorder.RecordSuccessAsync(execution, context, 1, SessionAiInteractionStage.ActionDecision,
            execution.ActionAiProfileId, startedAt, generated, JsonSerializer.Serialize(decision, Json), cancellationToken);
        return decision;
    }

    public static RuleActionDecisionResult Validate(RuleActionSnapshot snapshot, RuleActionDecisionResult decision)
    {
        if (decision.SchemaVersion != ScenarioTurnSchemas.ActionDecision || decision.Arguments.ValueKind != JsonValueKind.Object)
            throw new ScenarioTurnValidationException("invalid_action_decision");
        var action = snapshot.Actions.SingleOrDefault(item => item.ObjectId == decision.ObjectId && item.ActionId == decision.ActionId)
            ?? throw new ScenarioTurnValidationException("unknown_action");
        if (!action.Enabled) throw new ScenarioTurnValidationException("disabled_action");
        ScenarioActionArgumentValidator.Validate(action.ArgumentSchema, decision.Arguments);
        return decision;
    }
}

public interface IScenarioTurnArtifactWriter
{
    void AddRuleStep(SessionId sessionId, SessionExecutionId executionId, SessionExecutionAttemptId attemptId, SessionRuleActionStep step, DateTimeOffset now);
    void AddNarrative(SessionId sessionId, SessionExecutionId executionId, SessionExecutionAttemptId attemptId, PostStateNarrativeResult narrative, DateTimeOffset now);
}

public sealed class ScenarioTurnArtifactWriter(ISessionArtifactWriter writer) : IScenarioTurnArtifactWriter
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;
    public void AddRuleStep(SessionId sessionId, SessionExecutionId executionId, SessionExecutionAttemptId attemptId, SessionRuleActionStep step, DateTimeOffset now) =>
        writer.Add(SessionArtifact.CreateCommittedJson(
            new SessionArtifactId($"ART-{Guid.NewGuid():N}".ToUpperInvariant()), sessionId, executionId, attemptId,
            new RuleActionStepArtifactPayload(step.ActionSnapshotJson, step.DecisionJson, step.SelectedRuleId,
                step.AppliedEffectsJson, step.PublicPostStateJson), null, now, Json));
    public void AddNarrative(SessionId sessionId, SessionExecutionId executionId, SessionExecutionAttemptId attemptId, PostStateNarrativeResult narrative, DateTimeOffset now) =>
        writer.Add(SessionArtifact.CreateCommittedJson(
            new SessionArtifactId($"ART-{Guid.NewGuid():N}".ToUpperInvariant()), sessionId, executionId, attemptId,
            new PostStateNarrativeArtifactPayload(narrative.SchemaVersion, narrative.Heading, narrative.Body), null, now, Json));
}

public sealed record ScenarioEffectCommitResult(ScenarioCheckpointWriteOutcome Outcome);

public interface IScenarioEffectCommitUnitOfWork
{
    Task<ScenarioEffectCommitResult> CommitAsync(SessionExecutionContext context, ScenarioRuleWorldSnapshot world, CancellationToken cancellationToken);
}

public interface IScenarioNarrativeGenerationService
{
    Task<NarrativeGeneration<PostStateNarrativeResult>> GenerateAsync(
        ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        ScenarioActionStepSnapshot step, CancellationToken cancellationToken);
}

public sealed class ScenarioNarrativeGenerationService(
    IScenarioTurnAi ai,
    IScenarioAiInteractionRecorder recorder,
    IScenarioWorldSnapshotQuery worldQuery) : IScenarioNarrativeGenerationService
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<NarrativeGeneration<PostStateNarrativeResult>> GenerateAsync(
        ScenarioExecutionCheckpoint execution, SessionExecutionContext context,
        ScenarioActionStepSnapshot step, CancellationToken cancellationToken)
    {
        var snapshot = JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)!;
        var decision = JsonSerializer.Deserialize<RuleActionDecisionResult>(step.DecisionJson!, Json)!;
        var postState = JsonSerializer.Deserialize<RulePostState>(step.PublicPostStateJson!, Json)!;
        var action = snapshot.Actions.Single(item => item.ObjectId == decision.ObjectId && item.ActionId == decision.ActionId);
        var selectedObject = decision.ObjectId == new ScenarioObjectId("system")
            ? new RulePublicObject(new("system"), "system", "システム", postState.CurrentLocation.Id, true, 0, Parse("{}"))
            : snapshot.Objects.Single(item => item.Id == decision.ObjectId);
        var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
        var request = new PostStateNarrativeRequest(
            ScenarioTurnSchemas.PostStateNarrative,
            new NarrativeScenarioInput(world.Narrative.Title, world.Narrative.Summary, world.Narrative.Genre,
                world.Narrative.Tone, world.Narrative.Lore, world.Narrative.AiFreedom,
                world.Narrative.SelectedHero, world.Narrative.Entities, world.Narrative.Opening),
            execution.PlayerInput, selectedObject, action, postState,
            DeserializeList<string>(step.FactsJson), DeserializeList<JsonElement>(step.EventsJson),
            DeserializeList<string>(step.NarrativeHintsJson), DeserializeList<string>(step.ForbiddenNarrativeFactsJson));
        var startedAt = DateTimeOffset.UtcNow;
        NarrativeGeneration<PostStateNarrativeResult> generated;
        try { generated = await ai.GeneratePostStateNarrativeForProfileAsync(execution.NarrativeAiProfileId, request, cancellationToken); }
        catch (AiProviderException exception) when (exception.SentPrompt is not null || exception.ReceivedResult is not null)
        {
            await recorder.TryRecordProviderFailureAsync(execution, context, 2, SessionAiInteractionStage.Narrative,
                execution.NarrativeAiProfileId, startedAt, exception, cancellationToken);
            throw;
        }
        try { Validate(generated.Value, request.ForbiddenNarrativeFacts); }
        catch (ScenarioTurnValidationException exception)
        {
            await recorder.RecordValidationFailureAsync(execution, context, 2, SessionAiInteractionStage.Narrative,
                execution.NarrativeAiProfileId, startedAt, generated, exception, cancellationToken);
            throw;
        }
        await recorder.RecordSuccessAsync(execution, context, 2, SessionAiInteractionStage.Narrative,
            execution.NarrativeAiProfileId, startedAt, generated,
            JsonSerializer.Serialize(new { status = "valid" }, Json), cancellationToken);
        return generated;
    }

    private static void Validate(PostStateNarrativeResult result, IReadOnlyList<string> forbidden)
    {
        if (result.SchemaVersion != ScenarioTurnSchemas.PostStateNarrative || string.IsNullOrWhiteSpace(result.Heading)
            || result.Heading.Length > 120 || string.IsNullOrWhiteSpace(result.Body) || result.Body.Length > 20_000)
            throw new ScenarioTurnValidationException("invalid_post_state_narrative");
        if (forbidden.Any(item => !string.IsNullOrWhiteSpace(item) && result.Body.Contains(item, StringComparison.OrdinalIgnoreCase)))
            throw new ScenarioTurnValidationException("forbidden_narrative_fact");
    }

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
    private static IReadOnlyList<T> DeserializeList<T>(string? json) => string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<List<T>>(json, Json) ?? [];
}

public interface IScenarioSessionTurnAppender
{
    SessionTurn Append(Session session, SessionPlayerInput input, SessionRuleActionStep step,
        NarrativeGeneration<PostStateNarrativeResult> narrative, DateTimeOffset now);
}

public sealed class ScenarioSessionTurnAppender : IScenarioSessionTurnAppender
{
    public SessionTurn Append(Session session, SessionPlayerInput input, SessionRuleActionStep step,
        NarrativeGeneration<PostStateNarrativeResult> narrative, DateTimeOffset now)
    {
        var id = new SessionTurnId($"TRN-{Guid.NewGuid():N}".ToUpperInvariant());
        var ai = new SessionTurnAiMetadata(narrative.Metadata.Provider.AsPrimitive(), narrative.Metadata.Model, narrative.Metadata.ResponseId,
            narrative.Metadata.InputTokens, narrative.Metadata.OutputTokens, narrative.Metadata.LatencyMilliseconds,
            narrative.Metadata.AttemptCount, narrative.Metadata.FinishReason);
        return session.Status == SessionStatus.Completed
            ? session.AppendScenarioCompletionNarrative(id, input.Id, ScenarioTurnSchemas.PostStateNarrative,
                ScenarioTurnSchemas.NarrativeContext, ScenarioTurnSchemas.NarrativePrompt,
                narrative.Value.Heading, narrative.Value.Body, null, step.PostSessionRevision!.Value, ai, now)
            : session.AppendScenarioNarrative(id, input.Id, ScenarioTurnSchemas.PostStateNarrative,
                ScenarioTurnSchemas.NarrativeContext, ScenarioTurnSchemas.NarrativePrompt,
                narrative.Value.Heading, narrative.Value.Body, null, step.PostSessionRevision!.Value, ai, now);
    }
}

public enum ScenarioNarrativePublishOutcome { Published, Existing, LeaseLost, SessionAdvanced, Conflict }

public interface IScenarioNarrativePublisher
{
    Task<ScenarioNarrativePublishOutcome> PublishAsync(SessionExecutionContext context,
        NarrativeGeneration<PostStateNarrativeResult> narrative, CancellationToken cancellationToken);
}

public sealed class ScenarioTurnExecutionOrchestrator(
    IScenarioExecutionFence fence,
    IScenarioWorldSnapshotQuery worldQuery,
    ScenarioActionEnumerator enumerator,
    IScenarioActionSnapshotRepository steps,
    IScenarioAiDecisionService decisions,
    IScenarioRuleResolutionService resolutionService,
    IScenarioExtensionAdapter extensions,
    IScenarioEffectCommitUnitOfWork effectCommit,
    IScenarioNarrativeGenerationService narratives,
    IScenarioNarrativePublisher publisher,
    TimeProvider timeProvider,
    ILogger<ScenarioTurnExecutionOrchestrator> logger)
{
    private static readonly JsonSerializerOptions Json = ScenarioJson.Options;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        try
        {
            var execution = await fence.CheckAsync(context, ScenarioTurnStage.Snapshot, cancellationToken);
            if (execution is null) return LeaseLost();
            var step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            if (step is null)
            {
                var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
                if (world.SessionRevision != execution.AcceptedSessionRevision + 1)
                    return StaleSession();
                var snapshot = enumerator.Enumerate(world, $"RAS-{Guid.NewGuid():N}".ToUpperInvariant());
                var create = await steps.CreateAsync(context, execution, world, snapshot, timeProvider.GetUtcNow(), cancellationToken);
                if (create == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                if (create == ScenarioCheckpointWriteOutcome.Conflict) return StaleSession();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.DecisionJson is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.Decision, cancellationToken);
                if (execution is null) return LeaseLost();
                var snapshot = JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)
                    ?? throw new ScenarioTurnValidationException("invalid_action_snapshot");
                var decision = await decisions.DecideAsync(execution, context, snapshot, cancellationToken);
                var write = await steps.RecordDecisionAsync(context, decision, timeProvider.GetUtcNow(), cancellationToken);
                if (write == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.ResolutionPlanJson is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.Resolution, cancellationToken);
                if (execution is null) return LeaseLost();
                var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
                EnsureRevisions(step, world);
                var snapshot = enumerator.Enumerate(world,
                    JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)!.SnapshotId);
                var decision = JsonSerializer.Deserialize<RuleActionDecisionResult>(step.DecisionJson!, Json)!;
                ScenarioAiDecisionService.Validate(snapshot, decision);
                var resolution = resolutionService.Resolve(world, decision, step.Id.AsPrimitive());
                var write = await steps.RecordResolutionAsync(context, resolution, timeProvider.GetUtcNow(), cancellationToken);
                if (write == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.Stage == ScenarioTurnStage.Extension && step.ExtensionReceiptJson is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.Extension, cancellationToken);
                if (execution is null) return LeaseLost();
                var plan = JsonSerializer.Deserialize<ScenarioEffectPlan>(step.ResolutionPlanJson!, Json)
                    ?? throw new ScenarioTurnValidationException("invalid_effect_plan");
                var result = await extensions.ExecuteAsync(plan.ExtensionRequest
                    ?? throw new ScenarioTurnValidationException("extension_request_required"), cancellationToken);
                var write = await steps.RecordExtensionAsync(context, result, timeProvider.GetUtcNow(), cancellationToken);
                if (write == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            if (step!.AppliedAt is null)
            {
                execution = await fence.CheckAsync(context, ScenarioTurnStage.EffectCommit, cancellationToken);
                if (execution is null) return LeaseLost();
                var world = await worldQuery.LoadAsync(execution.SessionId, cancellationToken);
                EnsureRevisions(step, world);
                var commit = await effectCommit.CommitAsync(context, world, cancellationToken);
                if (commit.Outcome == ScenarioCheckpointWriteOutcome.LeaseLost) return LeaseLost();
                if (commit.Outcome == ScenarioCheckpointWriteOutcome.Conflict) return StaleObjects();
                step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            }

            execution = await fence.CheckAsync(context, ScenarioTurnStage.NarrativePublish, cancellationToken);
            if (execution is null) return LeaseLost();
            step = await steps.FindAsync(context.ExecutionId, cancellationToken);
            if (step!.NarrativePublishedAt is not null) return new(true);
            var narrative = await narratives.GenerateAsync(execution, context, step, cancellationToken);
            if (await fence.CheckAsync(context, ScenarioTurnStage.NarrativePublish, cancellationToken) is null) return LeaseLost();
            var publish = await publisher.PublishAsync(context, narrative, cancellationToken);
            return publish switch
            {
                ScenarioNarrativePublishOutcome.Published or ScenarioNarrativePublishOutcome.Existing => new(true),
                ScenarioNarrativePublishOutcome.LeaseLost => LeaseLost(),
                ScenarioNarrativePublishOutcome.SessionAdvanced => new(false, false, "session_advanced", "Sessionが先へ進みました。", nameof(SessionExecutionStatus.Superseded)),
                _ => new(false, true, "scenario_publish_conflict", "公開処理を再試行します。"),
            };
        }
        catch (SessionRevisionConflictException)
        {
            return StaleObjects();
        }
        catch (ScenarioRuntimeRevisionConflictException)
        {
            return StaleObjects();
        }
        catch (ScenarioTurnValidationException exception) when (exception.Code == "stale_object_revision")
        {
            return StaleObjects();
        }
        catch (ScenarioTurnValidationException exception) when (exception.Code == "stale_session_revision")
        {
            return StaleSession();
        }
        catch (ScenarioTurnValidationException exception)
        {
            logger.LogWarning("Scenario turn validation failed. ExecutionId={ExecutionId} Code={Code}", context.ExecutionId, exception.Code);
            return new(false, false, exception.Code, "選択された行動を適用できませんでした。");
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            logger.LogWarning(exception, "Scenario turn AI stage failed. ExecutionId={ExecutionId}", context.ExecutionId);
            return new(false, true, "scenario_ai_failed", "AI処理を再試行します。");
        }
    }

    private static void EnsureRevisions(ScenarioActionStepSnapshot step, ScenarioRuleWorldSnapshot world)
    {
        if (world.SessionRevision != step.PreSessionRevision) throw new ScenarioTurnValidationException("stale_session_revision");
        var expected = JsonSerializer.Deserialize<Dictionary<string, long>>(step.ObjectRevisionsJson, Json) ?? [];
        if (world.Objects.Any(item => expected.GetValueOrDefault(item.Id.AsPrimitive(), -1) != item.Revision))
            throw new ScenarioTurnValidationException("stale_object_revision");
    }

    private static SessionExecutionHandlerResult LeaseLost() => new(false, false, "lease_lost", "生成処理の所有権が失われました。");
    private static SessionExecutionHandlerResult StaleSession() => new(false, false, "stale_session_revision", "Sessionが更新されたため再入力してください。", nameof(SessionExecutionStatus.Superseded));
    private static SessionExecutionHandlerResult StaleObjects() => new(false, false, "stale_object_revision", "Object stateが更新されたため再入力してください。", nameof(SessionExecutionStatus.Superseded));
}

internal static class ScenarioJson
{
    internal static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };
}
