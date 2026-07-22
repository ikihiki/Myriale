using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Contracts;
using Myriale.Api.Data;

namespace Myriale.Api.Services;

public sealed class NarrativeExecutionHandler(
    ApplicationDbContext db,
    INarrativeContextBuilder contextBuilder,
    INarrativePromptBuilder promptBuilder,
    INarrativeGenerator generator,
    SessionScenarioProgressionService progression,
    SessionSummaryService summaries,
    IHostEnvironment environment,
    ILogger<NarrativeExecutionHandler> logger) : ISessionExecutionHandler
{
    public string Kind => SessionExecutionKinds.Narrative;

    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext workerContext, CancellationToken cancellationToken)
    {
        var execution = await db.SessionExecutions.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == workerContext.ExecutionId
                && item.Status == SessionExecutionStatuses.Running
                && item.LeaseToken == workerContext.LeaseToken
                && item.Revision == workerContext.Revision,
            cancellationToken);
        if (execution is null)
            return new(false, false, "lease_lost", "生成処理の所有権が失われました。");
        var input = await db.SessionPlayerInputs.AsNoTracking().SingleAsync(item => item.Id == execution.TriggerId, cancellationToken);
        var session = await db.Sessions.AsNoTracking().Include(item => item.State).Include(item => item.HeadTurn)
            .SingleAsync(item => item.Id == execution.SessionId, cancellationToken);
        if (!string.Equals(session.HeadTurnId, execution.AcceptedHeadTurnId, StringComparison.Ordinal))
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);

        NarrativeDialogueContext context;
        NarrativePromptInstructions prompt;
        NarrativeGeneration<NarrativeDialogueResult> generation;
        IReadOnlyList<ValidatedNarrativeProgressionSignal> validatedSignals;
        string? sentPrompt = null;
        string? receivedResult = null;
        string? validationResult = null;
        using var providerActivity = SessionExecutionTelemetry.ActivitySource.StartActivity("ai.provider.request", ActivityKind.Client);
        try
        {
            context = await contextBuilder.BuildDialogueAsync(session.OwnerId, session.Id, input.InteractionType, input.Text, cancellationToken);
            prompt = promptBuilder.Build(context, input.InteractionType);
            var dialogueRequest = new NarrativeDialogueRequest(
                NarrativeDialogueSchema.Version, context.SchemaVersion, context.Diagnostics, context.Scenario, context.RecentTurns,
                context.Memory, context.PriorModuleOutcomes, input.InteractionType, prompt, input.Text, context.SessionState,
                context.CurrentProgressionNode, context.AllowedSignals, session.InterpretationEnabled);
            if (environment.IsDevelopment()) sentPrompt = DiagnosticContent(JsonSerializer.Serialize(dialogueRequest));
            generation = await generator.GenerateDialogueAsync(dialogueRequest, cancellationToken);
            if (environment.IsDevelopment())
            {
                sentPrompt = DiagnosticContent(generation.SentPrompt ?? sentPrompt);
                receivedResult = DiagnosticContent(generation.ReceivedResult ?? JsonSerializer.Serialize(generation.Value));
            }
            if (string.IsNullOrWhiteSpace(generation.Value.Body) || generation.Value.Body.Length > 20_000)
                throw new NarrativeGenerationException("Narrative provider returned an invalid body.");
            ValidateGeneratedResult(generation.Value, generation.Metadata, input.InteractionType, session.InterpretationEnabled);
            validatedSignals = NarrativeSemanticGuard.ValidateProgressionSignals(
                generation.Value.Signals,
                context.AllowedSignals,
                input.Text,
                context.SessionState,
                context.CurrentProgressionNode);
            ValidateForbiddenNarrativeFacts(
                string.Join('\n', new[] { generation.Value.Heading, generation.Value.Body, generation.Value.Interpretation ?? string.Empty }),
                generation.Metadata,
                context.PriorModuleOutcomes);
            if (environment.IsDevelopment())
                validationResult = JsonSerializer.Serialize(new
                {
                    status = generation.Metadata.FinishReason == "safe_fallback" ? "safe_fallback" : "passed",
                    checks = new[] { "dialogue-contract", "body-quality", "public-interpretation", "progression-signals", "forbidden-narrative-facts" },
                });
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            var providerError = exception as AiProviderException;
            var code = providerError?.Code
                ?? (exception is NarrativeSignalValidationException ? "invalid_signal"
                    : exception is OperationCanceledException ? AiProviderErrorCodes.Timeout
                    : AiProviderErrorCodes.SchemaFailure);
            var retryable = providerError?.Retryable ?? exception is HttpRequestException or OperationCanceledException;
            if (exception is NarrativeSignalValidationException)
                SessionExecutionTelemetry.RecordInvalidSignal(execution.Kind, execution.Status);
            if (environment.IsDevelopment())
            {
                sentPrompt = DiagnosticContent(providerError?.SentPrompt ?? sentPrompt);
                receivedResult ??= DiagnosticContent(providerError?.ReceivedResult ?? providerError?.ProviderResponseExcerpt);
                validationResult = JsonSerializer.Serialize(new { status = "failed", errorCode = code, reason = exception.Message });
            }
            providerActivity?.SetStatus(ActivityStatusCode.Error, code);
            await RecordFailureDiagnosticsAsync(
                workerContext.AttemptId, exception, code, retryable, sentPrompt, receivedResult, validationResult, cancellationToken);
            logger.LogWarning(exception, "Narrative execution failed. ExecutionId={ExecutionId} ErrorCode={ErrorCode} Retryable={Retryable}", execution.Id, code, retryable);
            return new(false, retryable, code);
        }

        var committedDialogue = generation.Value with
        {
            Signals = validatedSignals
                .Select(signal => new NarrativeProgressionSignal(signal.Code, signal.ServerEvidence))
                .ToArray(),
        };

        providerActivity?.SetTag("ai.provider.name", generation.Metadata.Provider);
        providerActivity?.SetTag("ai.model.name", generation.Metadata.Model);
        providerActivity?.SetTag("myriale.provider.status", generation.Metadata.FinishReason == "safe_fallback" ? "safe_fallback" : "completed");
        SessionExecutionTelemetry.ProviderDuration.Record(generation.Metadata.LatencyMilliseconds, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, generation.Metadata.Provider, generation.Metadata.Model));
        if (generation.Metadata.InputTokens is not null) SessionExecutionTelemetry.ProviderInputTokens.Record(generation.Metadata.InputTokens.Value, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, generation.Metadata.Provider, generation.Metadata.Model));
        if (generation.Metadata.OutputTokens is not null) SessionExecutionTelemetry.ProviderOutputTokens.Record(generation.Metadata.OutputTokens.Value, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status, generation.Metadata.Provider, generation.Metadata.Model));

        db.ChangeTracker.Clear();
        await using var publishTransaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var current = await LoadFencedForPublishAsync(workerContext, cancellationToken);
        if (current is null)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            return new(false, false, "lease_lost", "生成処理の所有権が失われました。");
        }
        await db.Entry(current).Reference(item => item.Session).Query()
            .Include(item => item.HeadTurn)
            .Include(item => item.State)
            .Include(item => item.Progress)
            .LoadAsync(cancellationToken);
        if (!string.Equals(current.Session.HeadTurnId, current.AcceptedHeadTurnId, StringComparison.Ordinal))
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);
        }
        var alreadyPublished = await db.SessionTurns.AsNoTracking().SingleOrDefaultAsync(turn => turn.PlayerInputId == input.Id, cancellationToken);
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == workerContext.AttemptId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        if (alreadyPublished is not null)
        {
            SessionExecutionCompletion.MarkPublished(current, attempt, now);
            await db.SaveChangesAsync(cancellationToken);
            await publishTransaction.CommitAsync(cancellationToken);
            return new(true);
        }

        var artifact = new SessionArtifact
        {
            Id = $"ART-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = current.SessionId,
            ExecutionId = current.Id,
            AttemptId = workerContext.AttemptId,
            Kind = "narrative-text",
            Status = "committed",
            ContentType = "application/json",
            ContentJson = JsonSerializer.Serialize(committedDialogue),
            MetadataJson = JsonSerializer.Serialize(new { generation.Metadata.Provider, generation.Metadata.Model, generation.Metadata.ResponseId, generation.Metadata.FinishReason }),
            Checksum = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(generation.Value.Body))).ToLowerInvariant(),
            CreatedAt = now,
            ValidatedAt = now,
            CommittedAt = now,
        };
        var turn = new SessionTurn
        {
            Id = $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(),
            SessionId = current.SessionId,
            PreviousTurnId = current.AcceptedHeadTurnId,
            Position = (current.Session.HeadTurn?.Position ?? 0) + 1,
            Kind = "narrative",
            DialogueSchemaVersion = generation.Value.SchemaVersion,
            ContextSchemaVersion = context.Diagnostics.SchemaVersion,
            ContextComponentIdsJson = JsonSerializer.Serialize(context.Diagnostics.ComponentIds),
            ContextSizeBytes = context.Diagnostics.SizeBytes,
            ContextHash = context.Diagnostics.Hash,
            PromptVersion = prompt.Version,
            DialogueTurnType = generation.Value.TurnType,
            Heading = generation.Value.Heading,
            NarrativeBody = generation.Value.Body,
            Interpretation = current.Session.InterpretationEnabled ? generation.Value.Interpretation : null,
            AiProvider = generation.Metadata.Provider,
            AiModel = generation.Metadata.Model,
            AiResponseId = generation.Metadata.ResponseId,
            AiInputTokens = generation.Metadata.InputTokens,
            AiOutputTokens = generation.Metadata.OutputTokens,
            AiLatencyMilliseconds = generation.Metadata.LatencyMilliseconds,
            AiAttemptCount = generation.Metadata.AttemptCount,
            AiFinishReason = generation.Metadata.FinishReason,
            PlayerInputId = input.Id,
            SourceSessionRevision = current.Session.State?.Revision ?? 0,
            CreatedAt = now,
        };
        current.Session.HeadTurnId = turn.Id;
        current.Session.HeadTurn = turn;
        current.Session.Revision++;
        current.Session.UpdatedAt = now;
        db.SessionArtifacts.Add(artifact);
        db.SessionTurns.Add(turn);
        foreach (var lorebookEntry in context.Memory.Lorebook)
        {
            db.SessionTurnLorebookReferences.Add(new SessionTurnLorebookReference
            {
                TurnId = turn.Id,
                NoteId = lorebookEntry.Id,
                Reason = "context-retrieval",
                Turn = turn,
            });
        }
        foreach (var generatedSignal in validatedSignals)
        {
            var signal = new SessionNarrativeSignal
            {
                Id = $"NSG-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = current.SessionId,
                NarrativeTurnId = turn.Id,
                Code = generatedSignal.Code,
                Evidence = generatedSignal.ServerEvidence,
                CreatedAt = now,
            };
            db.SessionNarrativeSignals.Add(signal);
            if (current.Session.Progress is null) continue;
            var transition = await db.ScenarioProgressionTransitions.AsNoTracking()
                .SingleOrDefaultAsync(item => item.SourceNodeId == current.Session.Progress.CurrentNodeId
                    && item.SignalCode == generatedSignal.Code, cancellationToken);
            if (transition is null) continue;
            var snapshot = await db.SessionProgressionModuleSnapshots.AsNoTracking()
                .SingleOrDefaultAsync(item => item.SessionId == current.SessionId && item.TransitionId == transition.Id, cancellationToken);
            db.SessionProgressionTransitionReceipts.Add(new SessionProgressionTransitionReceipt
            {
                Id = $"PTR-{Guid.NewGuid():N}".ToUpperInvariant(),
                SessionId = current.SessionId,
                SourceSignalId = signal.Id,
                TransitionId = transition.Id,
                FromNodeId = transition.SourceNodeId,
                ToNodeId = transition.TargetNodeId,
                Status = snapshot is null ? "waiting-configuration" : "pending",
                ModuleId = snapshot?.ModuleId,
                ModuleVersion = snapshot?.ModuleVersion,
                ModuleDigest = snapshot?.ModuleDigest,
                ModuleConfigurationJson = snapshot?.ConfigurationJson,
                ModuleContextJson = snapshot?.ContextJson,
                ModuleRandomValueCount = snapshot?.RandomValueCount ?? 0,
                Revision = 0,
                AttemptCount = 0,
                IsRetryable = snapshot is not null,
                CreatedAt = now,
                UpdatedAt = now,
            });
            current.Session.Progress.CurrentNodeId = transition.TargetNodeId;
            current.Session.Progress.Revision++;
            current.Session.Progress.UpdatedAt = now;
        }
        attempt.Provider = generation.Metadata.Provider; attempt.Model = generation.Metadata.Model; attempt.ProviderRequestId = generation.Metadata.ResponseId;
        attempt.LatencyMilliseconds = generation.Metadata.LatencyMilliseconds; attempt.InputTokens = generation.Metadata.InputTokens; attempt.OutputTokens = generation.Metadata.OutputTokens;
        attempt.FinishReason = generation.Metadata.FinishReason; attempt.PromptVersion = prompt.Version; attempt.ContextHash = context.Diagnostics.Hash; attempt.ContextSizeBytes = context.Diagnostics.SizeBytes;
        if (environment.IsDevelopment())
        {
            attempt.SentPrompt = sentPrompt;
            attempt.ReceivedResult = receivedResult;
            attempt.ValidationResult = validationResult;
        }
        SessionExecutionCompletion.MarkPublished(current, attempt, now);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await publishTransaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await publishTransaction.RollbackAsync(CancellationToken.None);
            db.ChangeTracker.Clear();
            if (await db.SessionTurns.AsNoTracking().AnyAsync(item => item.PlayerInputId == input.Id, cancellationToken))
                return await CompleteExistingPublicationAsync(workerContext, cancellationToken);
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", SessionExecutionStatuses.Superseded);
        }
        SessionExecutionTelemetry.ArtifactCommitted.Add(1, SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        SessionExecutionTelemetry.TurnPublished.Add(1, SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        SessionExecutionTelemetry.ArtifactSize.Record(System.Text.Encoding.UTF8.GetByteCount(generation.Value.Body), SessionExecutionTelemetry.Tags(current.Kind, current.Status));
        await progression.EnsureNarrativeTurnAsync(session.OwnerId, turn.Id, cancellationToken);
        await summaries.TryGenerateAsync(session.Id, turn.Position, cancellationToken);
        return new(true);
    }

    private async Task<SessionExecutionHandlerResult> CompleteExistingPublicationAsync(
        SessionExecutionContext workerContext,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var execution = await LoadFencedForPublishAsync(workerContext, cancellationToken);
        if (execution is null)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            return new(false, false, "lease_lost", "生成処理の所有権が失われました。");
        }

        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == workerContext.AttemptId, cancellationToken);
        SessionExecutionCompletion.MarkPublished(execution, attempt, DateTimeOffset.UtcNow);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new(true);
    }

    private Task<SessionExecution?> LoadFencedForPublishAsync(
        SessionExecutionContext workerContext,
        CancellationToken cancellationToken)
    {
        if (db.Database.IsNpgsql())
        {
            return db.SessionExecutions.FromSqlInterpolated($$"""
                SELECT *
                FROM "SessionExecutions"
                WHERE "Id" = {{workerContext.ExecutionId}}
                  AND "Status" = {{SessionExecutionStatuses.Running}}
                  AND "LeaseToken" = {{workerContext.LeaseToken}}
                  AND "Revision" = {{workerContext.Revision}}
                FOR UPDATE
                """).SingleOrDefaultAsync(cancellationToken);
        }

        return db.SessionExecutions.SingleOrDefaultAsync(
            item => item.Id == workerContext.ExecutionId
                && item.Status == SessionExecutionStatuses.Running
                && item.LeaseToken == workerContext.LeaseToken
                && item.Revision == workerContext.Revision,
            cancellationToken);
    }

    private void ValidateGeneratedResult(
        NarrativeDialogueResult result,
        AiGenerationMetadata metadata,
        string interactionType,
        bool interpretationRequired)
    {
        var violations = new List<string>();
        if (!string.Equals(result.SchemaVersion, NarrativeDialogueSchema.Version, StringComparison.Ordinal))
            violations.Add($"schemaVersion expected={NarrativeDialogueSchema.Version} actual={result.SchemaVersion}");
        if (!NarrativeDialogueSchema.TurnTypes.Contains(result.TurnType))
            violations.Add($"turnType unsupported actual={result.TurnType}");
        var expectedTurnTypes = interactionType == NarrativeInteractionTypes.Clarification
            ? "clarification"
            : "action-result|npc-reply";
        var turnTypeMatchesInteraction = interactionType switch
        {
            NarrativeInteractionTypes.Clarification => result.TurnType == "clarification",
            NarrativeInteractionTypes.Dialogue => result.TurnType is "action-result" or "npc-reply",
            _ => false,
        };
        if (!turnTypeMatchesInteraction)
            violations.Add($"turnType mismatch interactionType={interactionType} expected={expectedTurnTypes} actual={result.TurnType}");
        if (string.IsNullOrWhiteSpace(result.Heading)) violations.Add("heading is empty");
        else if (result.Heading.Length > 120) violations.Add($"heading length={result.Heading.Length} max=120");
        if (string.IsNullOrWhiteSpace(result.Body)) violations.Add("body is empty");
        else if (result.Body.Length > 20_000) violations.Add($"body length={result.Body.Length} max=20000");
        if (result.Signals is null) violations.Add("signals is null");
        else if (result.TurnType == "clarification" && result.Signals.Count > 0)
            throw new NarrativeSignalValidationException($"Narrative provider returned progression signals for clarification: count={result.Signals.Count}.");
        if (interpretationRequired && string.IsNullOrWhiteSpace(result.Interpretation))
            violations.Add("interpretation is required but empty");
        if (interpretationRequired && result.Interpretation is { } interpretation)
        {
            if (interpretation.Length > 200)
                violations.Add($"interpretation length={interpretation.Length} max=200");
            if (interpretation.Contains('\n') || interpretation.Contains('\r'))
                violations.Add("interpretation must be a single line");

        }

        if (violations.Count == 0) return;
        var reason = string.Join("; ", violations);
        logger.LogWarning(
            "AI Provider dialogue failed semantic validation. Provider={Provider} Model={Model} ResponseId={ResponseId} InteractionType={InteractionType} InterpretationRequired={InterpretationRequired} TurnType={TurnType} Violations={Violations}",
            metadata.Provider, metadata.Model, metadata.ResponseId, interactionType, interpretationRequired, result.TurnType, reason);
        throw new NarrativeGenerationException($"Narrative provider returned an invalid dialogue result: {reason}");
    }

    private void ValidateForbiddenNarrativeFacts(
        string body,
        AiGenerationMetadata metadata,
        IReadOnlyList<NarrativePriorModuleOutcomeInput> priorModuleOutcomes)
    {
        var matchedFacts = NarrativeSemanticGuard.MatchForbiddenFacts(
            body,
            priorModuleOutcomes.SelectMany(outcome => outcome.ForbiddenNarrativeFacts));
        if (matchedFacts.Count == 0) return;

        logger.LogWarning(
            "AI Provider narrative matched forbidden facts. Provider={Provider} Model={Model} ResponseId={ResponseId} MatchCount={MatchCount}",
            metadata.Provider, metadata.Model, metadata.ResponseId, matchedFacts.Count);
        throw new AiProviderException(
            AiProviderErrorCodes.ContentRejected,
            $"Narrative provider returned content matching {matchedFacts.Count} forbidden narrative fact(s).",
            false);
    }

    private async Task RecordFailureDiagnosticsAsync(
        string attemptId,
        Exception exception,
        string code,
        bool retryable,
        string? sentPrompt,
        string? receivedResult,
        string? validationResult,
        CancellationToken cancellationToken)
    {
        var attempt = await db.SessionExecutionAttempts.SingleAsync(item => item.Id == attemptId, cancellationToken);
        attempt.ErrorCode = code;
        attempt.ErrorCategory = exception.GetType().Name;
        attempt.Retryable = retryable;
        if (environment.IsDevelopment())
        {
            attempt.ExceptionChain = string.Join(" -> ", Enumerate(exception).Select(item => item.GetType().Name));
            attempt.RedactedResponseExcerpt = DevelopmentErrorDetails.From(environment, exception) is { } details ? Redact(details) : null;
            attempt.SentPrompt = sentPrompt;
            attempt.ReceivedResult = receivedResult;
            attempt.ValidationResult = validationResult;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static IEnumerable<Exception> Enumerate(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException!) yield return current;
    }

    private static string? DiagnosticContent(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        const int maxLength = 100_000;
        var redacted = System.Text.RegularExpressions.Regex.Replace(
            value,
            "(?i)(authorization|api[-_ ]?key|cookie)\\s*[:=]\\s*[^,;\\s\\\"]+",
            "$1=[REDACTED]");
        return redacted.Length <= maxLength ? redacted : redacted[..maxLength] + "…";
    }

    public static string Redact(string value)
    {
        var redacted = System.Text.RegularExpressions.Regex.Replace(value, "(?i)(authorization|api[-_ ]?key|cookie)\\s*[:=]\\s*[^,;\\s]+", "$1=[REDACTED]");
        return redacted.Length <= 1000 ? redacted : redacted[..1000];
    }
}
