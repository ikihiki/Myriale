using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class ScenarioTurnExecutionHandler(
    ApplicationDbContext db,
    ScenarioActionEnumerator enumerator,
    ScenarioEffectApplier effectApplier,
    ScenarioActionDecisionModelMapper actionDecisionMapper,
    IScenarioTurnAi ai,
    IScenarioExtensionAdapter extensions,
    ILogger<ScenarioTurnExecutionHandler> logger) : ISessionExecutionHandler
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow };
    public string Kind => SessionExecutionKinds.ScenarioTurn;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        try
        {
            var execution = await db.SessionExecutions.SingleOrDefaultAsync(item => item.Id == context.ExecutionId && item.Status == SessionExecutionStatuses.Running && item.LeaseToken == context.LeaseToken, cancellationToken);
            if (execution is null) return new(false, false, "lease_lost");
            var input = await db.SessionPlayerInputs.AsNoTracking().SingleAsync(item => item.Id == execution.TriggerId, cancellationToken);
            var step = await db.SessionRuleActionSteps.SingleOrDefaultAsync(item => item.ExecutionId == execution.Id, cancellationToken);

            if (step is null)
            {
                await SetStageAsync(execution, ScenarioTurnStages.LoadingWorld, cancellationToken);
                var world = await LoadWorldAsync(execution.SessionId, tracking: true, cancellationToken);
                if (!string.Equals(world.Session.HeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal)
                    || world.Session.Revision != execution.AcceptedSessionRevision + 1)
                    return new(false, false, "stale_session_revision", "Sessionが更新されたため再入力してください。", SessionExecutionStatuses.Superseded);
                await SetStageAsync(execution, ScenarioTurnStages.EnumeratingActions, cancellationToken);
                var snapshotId = $"RAS-{Guid.NewGuid():N}".ToUpperInvariant();
                var snapshot = enumerator.Enumerate(world, snapshotId);
                var now = DateTimeOffset.UtcNow;
                step = new SessionRuleActionStep
                {
                    Id = $"RST-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = execution.SessionId, ExecutionId = execution.Id,
                    PlayerInputId = input.Id, ScenarioDefinitionVersionId = world.Session.ScenarioDefinitionVersionId
                        ?? throw new ScenarioTurnValidationException("scenario_definition_not_pinned"),
                    Stage = ScenarioTurnStages.SelectingAction, SchemaVersion = 1, PreSessionRevision = world.Session.Revision,
                    ObjectRevisionsJson = JsonSerializer.Serialize(world.States.ToDictionary(item => item.ScenarioObjectId, item => item.Revision), Json),
                    ActionSnapshotJson = JsonSerializer.Serialize(snapshot, Json), EnumeratedAt = now, CreatedAt = now, UpdatedAt = now,
                };
                db.SessionRuleActionSteps.Add(step); execution.Stage = ScenarioTurnStages.SelectingAction;
                await db.SaveChangesAsync(cancellationToken);
            }

            var actionSnapshot = JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)
                ?? throw new ScenarioTurnValidationException("invalid_action_snapshot");
            RuleActionDecisionResult decision;
            if (step.DecisionJson is null)
            {
                var actionProfileId = execution.ActionDecisionAiProfileId ?? throw new ScenarioTurnValidationException("action_ai_profile_not_snapshotted");
                var modelRequest = actionDecisionMapper.CreateRequest(input.Text, actionSnapshot);
                RuleActionDecisionResult? mappedDecision = null;
                await ExecuteAiInteractionAsync(
                    execution,
                    context.AttemptId,
                    1,
                    SessionAiInteractionStages.ActionDecision,
                    actionProfileId,
                    token => ai.DecideActionForProfileAsync(actionProfileId, modelRequest, token),
                    value => mappedDecision = ValidateDecision(actionSnapshot, actionDecisionMapper.MapResult(actionSnapshot, value)),
                    cancellationToken);
                decision = mappedDecision ?? throw new ScenarioTurnValidationException("invalid_model_action_decision");
                step.DecisionJson = JsonSerializer.Serialize(decision, Json); step.SelectedAt = DateTimeOffset.UtcNow; step.Stage = ScenarioTurnStages.ApplyingRules; step.UpdatedAt = DateTimeOffset.UtcNow;
                execution.Stage = ScenarioTurnStages.ApplyingRules;
                await db.SaveChangesAsync(cancellationToken);
            }
            else decision = JsonSerializer.Deserialize<RuleActionDecisionResult>(step.DecisionJson, Json)!;

            if (step.AppliedAt is null)
            {
                db.ChangeTracker.Clear();
                execution = await db.SessionExecutions.SingleAsync(item => item.Id == context.ExecutionId && item.Status == SessionExecutionStatuses.Running && item.LeaseToken == context.LeaseToken, cancellationToken);
                step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == execution.Id, cancellationToken);
                var world = await LoadWorldAsync(execution.SessionId, tracking: true, cancellationToken);
                var expectedRevisions = JsonSerializer.Deserialize<Dictionary<string, long>>(step.ObjectRevisionsJson, Json) ?? [];
                if (world.Session.Revision != step.PreSessionRevision || world.States.Any(state => expectedRevisions.GetValueOrDefault(state.ScenarioObjectId, -1) != state.Revision))
                    return new(false, false, "stale_object_revision", "Object stateが更新されたため再入力してください。", SessionExecutionStatuses.Superseded);
                var freshSnapshot = enumerator.Enumerate(world, actionSnapshot.SnapshotId);
                ValidateDecision(freshSnapshot, decision);
                var resolution = effectApplier.ResolveAndApply(world, decision);
                ScenarioExtensionResult? extensionResult = null;
                if (resolution.Rule?.ModuleId is { } moduleId)
                {
                    step.Stage = ScenarioTurnStages.RunningExtension; execution.Stage = ScenarioTurnStages.RunningExtension;
                    var boundObject = world.Definition.Objects.Single(item => item.Id == decision.ObjectId);
                    var boundState = world.States.Single(item => item.ScenarioObjectId == decision.ObjectId);
                    extensionResult = await extensions.ExecuteAsync(new(
                        step.Id,
                        world.Session.OwnerId,
                        execution.SessionId,
                        decision.ObjectId,
                        world.Definition.ObjectTypes.SelectMany(type => type.Actions).Single(action => action.Id == decision.ActionId).ObjectTypeId,
                        decision.ActionId,
                        resolution.Rule.Id,
                        moduleId,
                        resolution.Rule.ModuleVersion!,
                        resolution.Rule.ModuleDigest!,
                        Parse(resolution.Rule.ModuleConfigurationJson ?? "{}"),
                        decision.Arguments,
                        Parse(boundState.StateJson)), cancellationToken);
                    step.ExtensionReceiptJson = JsonSerializer.Serialize(extensionResult, Json);
                }
                world.Session.Revision++; world.Session.UpdatedAt = DateTimeOffset.UtcNow;
                var postState = effectApplier.ProjectPostState(world);
                var facts = resolution.Facts.Concat(extensionResult?.Facts ?? []).ToList();
                var events = resolution.Events.Concat(extensionResult?.Events ?? []).ToList();
                var hints = resolution.Hints.Concat(extensionResult?.NarrativeHints ?? []).ToList();
                var forbidden = resolution.ForbiddenFacts.Concat(extensionResult?.ForbiddenNarrativeFacts ?? []).ToList();
                step.SelectedRuleId = resolution.Rule?.Id; step.AppliedEffectsJson = JsonSerializer.Serialize(resolution.Effects.Concat(extensionResult?.Effects ?? []), Json);
                step.PublicPostStateJson = JsonSerializer.Serialize(postState, Json); step.FactsJson = JsonSerializer.Serialize(facts, Json); step.EventsJson = JsonSerializer.Serialize(events, Json);
                step.NarrativeHintsJson = JsonSerializer.Serialize(hints, Json); step.ForbiddenNarrativeFactsJson = JsonSerializer.Serialize(forbidden, Json);
                step.PostSessionRevision = world.Session.Revision; step.AppliedAt = DateTimeOffset.UtcNow; step.Stage = ScenarioTurnStages.GeneratingNarrative; step.UpdatedAt = DateTimeOffset.UtcNow;
                execution.Stage = ScenarioTurnStages.GeneratingNarrative;
                db.SessionArtifacts.Add(CreateArtifact(execution, context.AttemptId, "rule-action-step.v1", JsonSerializer.Serialize(new { step.ActionSnapshotJson, step.DecisionJson, step.SelectedRuleId, step.AppliedEffectsJson, step.PublicPostStateJson }, Json)));
                try { await db.SaveChangesAsync(cancellationToken); }
                catch (DbUpdateConcurrencyException) { return new(false, false, "stale_object_revision", "Object stateが更新されたため再入力してください。", SessionExecutionStatuses.Superseded); }
            }

            db.ChangeTracker.Clear();
            execution = await db.SessionExecutions.SingleAsync(item => item.Id == context.ExecutionId && item.Status == SessionExecutionStatuses.Running && item.LeaseToken == context.LeaseToken, cancellationToken);
            step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == execution.Id, cancellationToken);
            if (step.NarrativePublishedAt is not null) return new(true);
            var snapshotForNarrative = JsonSerializer.Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson, Json)!;
            decision = JsonSerializer.Deserialize<RuleActionDecisionResult>(step.DecisionJson!, Json)!;
            var selectedAction = snapshotForNarrative.Actions.Single(action => action.ObjectId == decision.ObjectId && action.ActionId == decision.ActionId);
            var postStateForNarrative = JsonSerializer.Deserialize<RulePostState>(step.PublicPostStateJson!, Json)!;
            var selectedObject = decision.ObjectId == "system"
                ? new RulePublicObject("system", "system", "システム", postStateForNarrative.CurrentLocation.Id, true, 0, Parse("{}"))
                : snapshotForNarrative.Objects.Single(item => item.Id == decision.ObjectId);
            var narrativeSession = await db.Sessions.AsNoTracking().Include(item => item.ScenarioDefinitionVersion).SingleAsync(item => item.Id == execution.SessionId, cancellationToken);
            var narrativeEntities = await db.ScenarioObjects.AsNoTracking()
                .Where(item => item.DefinitionVersionId == narrativeSession.ScenarioDefinitionVersionId)
                .OrderBy(item => item.Code)
                .Select(item => new NarrativeEntityInput(item.Code, item.Name, item.ProfileMarkdown))
                .ToListAsync(cancellationToken);
            var narrativeRequest = new PostStateNarrativeRequest(
                ScenarioTurnSchemas.PostStateNarrative,
                new NarrativeScenarioInput(
                    narrativeSession.ScenarioDefinitionVersion!.ScenarioTitle.Value,
                    narrativeSession.ScenarioDefinitionVersion.ScenarioSummary,
                    narrativeSession.ScenarioDefinitionVersion.ScenarioGenre,
                    narrativeSession.ScenarioDefinitionVersion.ScenarioTone,
                    narrativeSession.ScenarioDefinitionVersion.ScenarioLore,
                    narrativeSession.ScenarioDefinitionVersion.ScenarioAiFreedom,
                    narrativeSession.SelectedHero,
                    narrativeEntities,
                    narrativeSession.ScenarioDefinitionVersion.ScenarioOpening),
                input.Text, selectedObject, selectedAction, postStateForNarrative,
                DeserializeList<string>(step.FactsJson), DeserializeList<JsonElement>(step.EventsJson), DeserializeList<string>(step.NarrativeHintsJson), DeserializeList<string>(step.ForbiddenNarrativeFactsJson));
            var narrativeProfileId = execution.NarrativeAiProfileId ?? throw new ScenarioTurnValidationException("narrative_ai_profile_not_snapshotted");
            var narrative = await ExecuteAiInteractionAsync(
                execution,
                context.AttemptId,
                2,
                SessionAiInteractionStages.Narrative,
                narrativeProfileId,
                token => ai.GeneratePostStateNarrativeForProfileAsync(narrativeProfileId, narrativeRequest, token),
                value => ValidateNarrative(value, narrativeRequest.ForbiddenNarrativeFacts),
                cancellationToken);

            db.ChangeTracker.Clear();
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            execution = await db.SessionExecutions.SingleAsync(item => item.Id == context.ExecutionId && item.Status == SessionExecutionStatuses.Running && item.LeaseToken == context.LeaseToken, cancellationToken);
            step = await db.SessionRuleActionSteps.SingleAsync(item => item.ExecutionId == execution.Id, cancellationToken);
            var session = await db.Sessions.Include(item => item.HeadTurn).SingleAsync(item => item.Id == execution.SessionId, cancellationToken);
            if (step.NarrativePublishedAt is not null || await db.SessionTurns.AnyAsync(turn => turn.PlayerInputId == input.Id, cancellationToken)) return new(true);
            if (!string.Equals(session.HeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal))
                return new(false, false, "session_advanced", "Sessionが先へ進みました。", SessionExecutionStatuses.Superseded);
            var nowPublished = DateTimeOffset.UtcNow;
            var turn = new SessionTurn
            {
                Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = session.Id, PreviousTurnId = session.HeadTurnId,
                Position = (session.HeadTurn?.Position ?? 0) + 1, Kind = "narrative", DialogueSchemaVersion = ScenarioTurnSchemas.PostStateNarrative,
                ContextSchemaVersion = ScenarioTurnSchemas.NarrativeContext, PromptVersion = ScenarioTurnSchemas.NarrativePrompt,
                DialogueTurnType = "action-result", Heading = narrative.Value.Heading, NarrativeBody = narrative.Value.Body,
                PlayerInputId = input.Id, SourceSessionRevision = step.PostSessionRevision, AiProvider = narrative.Metadata.Provider, AiModel = narrative.Metadata.Model,
                AiResponseId = narrative.Metadata.ResponseId, AiInputTokens = narrative.Metadata.InputTokens, AiOutputTokens = narrative.Metadata.OutputTokens,
                AiLatencyMilliseconds = narrative.Metadata.LatencyMilliseconds, AiAttemptCount = narrative.Metadata.AttemptCount, AiFinishReason = narrative.Metadata.FinishReason, CreatedAt = nowPublished,
            };
            db.SessionTurns.Add(turn); session.HeadTurnId = turn.Id; session.HeadTurn = turn; session.Revision++; session.UpdatedAt = nowPublished;
            step.NarrativePublishedAt = nowPublished; step.Stage = ScenarioTurnStages.Completed; step.UpdatedAt = nowPublished; execution.Stage = ScenarioTurnStages.Completed;
            db.SessionArtifacts.Add(CreateArtifact(execution, context.AttemptId, "post-state-narrative.v1", JsonSerializer.Serialize(narrative.Value, Json)));
            var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == context.AttemptId, cancellationToken);
            attempt.Provider = narrative.Metadata.Provider; attempt.Model = narrative.Metadata.Model; attempt.ProviderRequestId = narrative.Metadata.ResponseId;
            await db.SaveChangesAsync(cancellationToken); await transaction.CommitAsync(cancellationToken);
            return new(true);
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

    private async Task<NarrativeGeneration<T>> ExecuteAiInteractionAsync<T>(
        SessionExecution execution,
        string attemptId,
        int sequence,
        string stage,
        string aiProfileId,
        Func<CancellationToken, Task<NarrativeGeneration<T>>> generate,
        Action<T> validate,
        CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        NarrativeGeneration<T> generated;
        try
        {
            generated = await generate(cancellationToken);
        }
        catch (AiProviderException exception) when (exception.SentPrompt is not null || exception.ReceivedResult is not null)
        {
            await TryPersistFailedInteractionAsync(
                execution,
                attemptId,
                sequence,
                stage,
                aiProfileId,
                startedAt,
                exception,
                cancellationToken);
            throw;
        }

        try
        {
            validate(generated.Value);
        }
        catch (ScenarioTurnValidationException exception)
        {
            await PersistInteractionAsync(
                execution,
                attemptId,
                sequence,
                stage,
                aiProfileId,
                startedAt,
                generated,
                SessionAiInteractionStatuses.ValidationFailed,
                exception.Code,
                exception.Message,
                JsonSerializer.Serialize(new { status = "invalid", code = exception.Code }, Json),
                cancellationToken);
            throw;
        }

        await PersistInteractionAsync(
            execution,
            attemptId,
            sequence,
            stage,
            aiProfileId,
            startedAt,
            generated,
            SessionAiInteractionStatuses.Succeeded,
            null,
            null,
            JsonSerializer.Serialize(new { status = "valid" }, Json),
            cancellationToken);
        return generated;
    }

    private async Task PersistInteractionAsync<T>(
        SessionExecution execution,
        string attemptId,
        int sequence,
        string stage,
        string aiProfileId,
        DateTimeOffset startedAt,
        NarrativeGeneration<T> generated,
        string status,
        string? errorCode,
        string? errorMessage,
        string validationResult,
        CancellationToken cancellationToken)
    {
        var interaction = await db.SessionAiInteractions
            .SingleOrDefaultAsync(item => item.AttemptId == attemptId && item.Stage == stage, cancellationToken);
        if (interaction is null)
        {
            interaction = new SessionAiInteraction
            {
                Id = $"AII-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = execution.SessionId,
                ExecutionId = execution.Id,
                AttemptId = attemptId,
                Sequence = sequence,
                Stage = stage,
                AiProfileId = aiProfileId,
                StartedAt = startedAt,
            };
            db.SessionAiInteractions.Add(interaction);
        }

        interaction.Provider = generated.Metadata.Provider;
        interaction.Model = generated.Metadata.Model;
        interaction.ProviderRequestId = generated.Metadata.ResponseId;
        interaction.CompletedAt = DateTimeOffset.UtcNow;
        interaction.LatencyMilliseconds = generated.Metadata.LatencyMilliseconds;
        interaction.InputTokens = generated.Metadata.InputTokens;
        interaction.OutputTokens = generated.Metadata.OutputTokens;
        interaction.FinishReason = generated.Metadata.FinishReason;
        interaction.Status = status;
        interaction.ErrorCode = errorCode;
        interaction.ErrorMessage = errorMessage;
        interaction.SentPrompt = generated.SentPrompt;
        interaction.ReceivedResult = generated.ReceivedResult;
        interaction.ValidationResult = validationResult;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task TryPersistFailedInteractionAsync(
        SessionExecution execution,
        string attemptId,
        int sequence,
        string stage,
        string aiProfileId,
        DateTimeOffset startedAt,
        AiProviderException exception,
        CancellationToken cancellationToken)
    {
        SessionAiInteraction? interaction = null;
        try
        {
            interaction = await db.SessionAiInteractions
                .SingleOrDefaultAsync(item => item.AttemptId == attemptId && item.Stage == stage, cancellationToken);
            if (interaction is null)
            {
                interaction = new SessionAiInteraction
                {
                    Id = $"AII-{Guid.NewGuid():N}".ToUpperInvariant(),
                    SessionId = execution.SessionId,
                    ExecutionId = execution.Id,
                    AttemptId = attemptId,
                    Sequence = sequence,
                    Stage = stage,
                    AiProfileId = aiProfileId,
                    StartedAt = startedAt,
                };
                db.SessionAiInteractions.Add(interaction);
            }

            var completedAt = DateTimeOffset.UtcNow;
            interaction.CompletedAt = completedAt;
            interaction.LatencyMilliseconds = Math.Max(0, (long)(completedAt - startedAt).TotalMilliseconds);
            interaction.Status = SessionAiInteractionStatuses.Failed;
            interaction.ErrorCode = exception.Code;
            interaction.ErrorMessage = exception.Message;
            interaction.SentPrompt = exception.SentPrompt;
            interaction.ReceivedResult = exception.ReceivedResult;
            interaction.ValidationResult = JsonSerializer.Serialize(new { status = "not-validated" }, Json);
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception persistenceException)
        {
            if (interaction is not null) db.Entry(interaction).State = EntityState.Detached;
            logger.LogWarning(
                persistenceException,
                "Failed to persist AI interaction failure without changing execution retry behavior. ExecutionId={ExecutionId} AttemptId={AttemptId} Stage={Stage}",
                execution.Id,
                attemptId,
                stage);
        }
    }

    private async Task<ScenarioRuleWorld> LoadWorldAsync(string sessionId, bool tracking, CancellationToken cancellationToken)
    {
        var sessions = tracking ? db.Sessions.AsQueryable() : db.Sessions.AsNoTracking();
        var session = await sessions.Include(item => item.State).SingleAsync(item => item.Id == sessionId, cancellationToken);
        var definition = await db.ScenarioDefinitionVersions.Include(item => item.Locations)
            .Include(item => item.ObjectTypes).ThenInclude(type => type.Actions)
            .Include(item => item.Objects)
            .SingleAsync(item => item.Id == session.ScenarioDefinitionVersionId && item.Status == DefinitionStatus.Published, cancellationToken);
        var statesQuery = db.SessionObjectStates.Include(item => item.ScenarioObject);
        var states = tracking ? await statesQuery.Where(item => item.SessionId == sessionId).ToListAsync(cancellationToken) : await statesQuery.AsNoTracking().Where(item => item.SessionId == sessionId).ToListAsync(cancellationToken);
        foreach (var state in states) state.ScenarioObject = definition.Objects.Single(item => item.Id == state.ScenarioObjectId);
        return new(session, definition, states);
    }

    private static RuleActionDecisionResult ValidateDecision(RuleActionSnapshot snapshot, RuleActionDecisionResult decision)
    {
        if (decision.SchemaVersion != ScenarioTurnSchemas.ActionDecision || decision.Arguments.ValueKind != JsonValueKind.Object)
            throw new ScenarioTurnValidationException("invalid_action_decision");
        var action = snapshot.Actions.SingleOrDefault(item => item.ObjectId == decision.ObjectId && item.ActionId == decision.ActionId);
        if (action is null) throw new ScenarioTurnValidationException("unknown_action");
        if (!action.Enabled) throw new ScenarioTurnValidationException("disabled_action");
        ScenarioActionArgumentValidator.Validate(action.ArgumentSchema, decision.Arguments);
        return decision;
    }


    private static void ValidateNarrative(PostStateNarrativeResult result, IReadOnlyList<string> forbidden)
    {
        if (result.SchemaVersion != ScenarioTurnSchemas.PostStateNarrative || string.IsNullOrWhiteSpace(result.Heading) || result.Heading.Length > 120 || string.IsNullOrWhiteSpace(result.Body) || result.Body.Length > 20_000)
            throw new ScenarioTurnValidationException("invalid_post_state_narrative");
        if (forbidden.Any(item => !string.IsNullOrWhiteSpace(item) && result.Body.Contains(item, StringComparison.OrdinalIgnoreCase)))
            throw new ScenarioTurnValidationException("forbidden_narrative_fact");
    }

    private async Task SetStageAsync(SessionExecution execution, string stage, CancellationToken cancellationToken) { execution.Stage = stage; await db.SaveChangesAsync(cancellationToken); }
    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
    private static IReadOnlyList<T> DeserializeList<T>(string? json) => string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<List<T>>(json, Json) ?? [];
    private static SessionArtifact CreateArtifact(SessionExecution execution, string attemptId, string kind, string content)
    {
        var now = DateTimeOffset.UtcNow;
        return new SessionArtifact { Id = $"ART-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = execution.SessionId, ExecutionId = execution.Id, AttemptId = attemptId, Kind = kind, Status = "committed", ContentType = "application/json", ContentJson = content, MetadataJson = "{\"schemaVersion\":1}", Checksum = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content))).ToLowerInvariant(), CreatedAt = now, ValidatedAt = now, CommittedAt = now };
    }
}
