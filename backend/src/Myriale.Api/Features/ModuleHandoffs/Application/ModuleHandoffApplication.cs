using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Myriale.Api.Features.ProgressionRuntime.Application;
using Myriale.Api.Features.SessionArtifacts.Application;
using Myriale.Api.Data;
using Myriale.Api.Services;
using Myriale.ModuleSdk;

namespace Myriale.Api.Features.ModuleHandoffs.Application;

public enum EnqueueModuleHandoffOutcome { Enqueued, Existing }

public interface IModuleHandoffEnqueuePort
{
    Task<EnqueueModuleHandoffOutcome> EnqueueAsync(ModuleExecution execution, string narrativeAiProfileId, CancellationToken cancellationToken);
}

public sealed class EnqueueModuleHandoffCommand(
    IModuleHandoffEnqueuePort port,
    IAiProfileCatalog profiles)
{
    private static readonly JsonSerializerOptions Json = ModuleJsonSerializerOptions.Create();

    public async Task<EnqueueModuleHandoffOutcome> ExecuteAsync(
        ModuleExecution execution,
        ModuleOutcome? outcome,
        CancellationToken cancellationToken)
    {
        if (execution.Status != ModuleExecutionStatus.Completed || execution.SessionTurnId is null || outcome is null || execution.OutcomeJson is null)
            throw new ModuleHandoffValidationException("module_turn_not_completed", "完了したModule TurnだけがNarrative handoffを開始できます。");
        try
        {
            _ = JsonSerializer.Deserialize<ModuleOutcome>(execution.OutcomeJson, Json)
                ?? throw new JsonException("Outcome is empty.");
        }
        catch (JsonException exception)
        {
            throw new ModuleHandoffValidationException("narrative_source_invalid", "Module outcomeを読み込めません。", exception);
        }
        var profileId = await profiles.ResolveNarrativeProfileIdAsync(null, cancellationToken);
        return await port.EnqueueAsync(execution, profileId, cancellationToken);
    }
}

public sealed record ModuleHandoffSourceSnapshot(
    string ExecutionId,
    string SessionId,
    string OwnerId,
    SessionExecutionTriggerType TriggerType,
    string TriggerId,
    string IdempotencyKey,
    string? AcceptedHeadTurnId,
    long AcceptedSessionRevision,
    string NarrativeAiProfileId,
    string? SourceTurnId,
    string? SourceSessionId,
    SessionTurnKind? SourceTurnKind,
    string? ModuleExecutionId,
    ModuleExecutionStatus? ModuleExecutionStatus,
    string? OutcomeJson,
    string? ViewStateJson,
    string? OutcomeApplicationSessionId,
    long? OutcomeAppliedSessionRevision,
    string? SessionHeadTurnId,
    long SessionRevision,
    long SessionStateRevision,
    string SessionFlagsJson,
    string? ScenarioDefinitionVersionId,
    string ScenarioTitle,
    string ScenarioSummary,
    string ScenarioGenre,
    string ScenarioTone,
    string ScenarioLore,
    string ScenarioAiFreedom,
    string SelectedHero,
    string ScenarioOpening,
    IReadOnlyList<NarrativeEntityInput> Entities,
    string? ExistingNarrativeTurnId);

public interface IModuleHandoffSourceSnapshotQuery
{
    Task<ModuleHandoffSourceSnapshot?> LoadAsync(SessionExecutionContext context, CancellationToken cancellationToken);
}

public sealed record ModuleHandoffCausalityError(string Code, string Message, bool Superseded = false);

public sealed class ModuleHandoffCausalityValidator
{
    public ModuleHandoffCausalityError? Validate(ModuleHandoffSourceSnapshot source)
    {
        if (source.TriggerType != SessionExecutionTriggerType.ModuleOutcome)
            return new("invalid_trigger", "Module handoffの起点を確認できませんでした。");
        if (source.SourceTurnId is null || source.SourceSessionId != source.SessionId
            || source.SourceTurnKind != SessionTurnKind.Module || source.ModuleExecutionId is null
            || source.SessionId.Length == 0 || source.TriggerId != source.SourceTurnId
            || source.AcceptedHeadTurnId != source.SourceTurnId
            || source.IdempotencyKey != $"module-handoff:{source.ModuleExecutionId}")
            return new("module_execution_missing", "Module実行とSession Turnの因果関係を確認できませんでした。");
        if (source.ExistingNarrativeTurnId is not null) return null;
        if (source.SessionHeadTurnId != source.SourceTurnId || source.SessionRevision != source.AcceptedSessionRevision)
            return new("session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", true);
        if (string.IsNullOrWhiteSpace(source.NarrativeAiProfileId))
            return new("narrative_profile_missing", "Narrative AI profileを確認できませんでした。");
        return null;
    }
}

public sealed class ModuleHandoffNarrativeRequestBuilder
{
    private static readonly JsonSerializerOptions Json = ModuleJsonSerializerOptions.Create();

    public NarrativeHandoffRequest Build(ModuleHandoffSourceSnapshot source)
    {
        if (source.ModuleExecutionStatus != ModuleExecutionStatus.Completed || source.OutcomeJson is null)
            throw new ModuleHandoffValidationException("module_turn_not_completed", "Module Turnが完了していません。");
        ModuleOutcome outcome;
        JsonElement viewState;
        IReadOnlyDictionary<string, bool> flags;
        try
        {
            outcome = JsonSerializer.Deserialize<ModuleOutcome>(source.OutcomeJson, Json) ?? throw new JsonException("Outcome is empty.");
            viewState = Parse(source.ViewStateJson ?? "{}");
            flags = JsonSerializer.Deserialize<IReadOnlyDictionary<string, bool>>(source.SessionFlagsJson, Json)
                ?? new Dictionary<string, bool>();
        }
        catch (JsonException exception)
        {
            throw new ModuleHandoffValidationException("narrative_source_invalid", "Narrative生成元の公開データを読み込めません。", exception);
        }
        if (HasEffects(source.OutcomeJson) && (source.OutcomeApplicationSessionId != source.SessionId
            || source.OutcomeAppliedSessionRevision != source.SessionStateRevision))
            throw new ModuleHandoffValidationException("effects_not_applied", "Outcome Effectの適用が完了していません。");
        return new(
            new NarrativeScenarioInput(source.ScenarioTitle, source.ScenarioSummary, source.ScenarioGenre,
                source.ScenarioTone, source.ScenarioLore, source.ScenarioAiFreedom, source.SelectedHero,
                source.Entities, source.ScenarioOpening),
            new NarrativeOutcomeInput(outcome.Category, outcome.Code, outcome.Title, outcome.Summary,
                outcome.PublicFacts, outcome.EmittedEvents, outcome.NarrativeHints, outcome.ForbiddenNarrativeFacts),
            viewState,
            new NarrativeSessionStateInput(source.OutcomeAppliedSessionRevision ?? source.SessionStateRevision, flags));
    }

    internal static bool HasEffects(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.EnumerateObject().FirstOrDefault(property =>
            string.Equals(property.Name, "effects", StringComparison.OrdinalIgnoreCase)).Value is { ValueKind: JsonValueKind.Array } effects
            && effects.GetArrayLength() > 0;
    }

    private static JsonElement Parse(string json) { using var document = JsonDocument.Parse(json); return document.RootElement.Clone(); }
}

public interface IModuleHandoffAiInteractionRecorder
{
    Task RecordSuccessAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context, DateTimeOffset startedAt,
        NarrativeGeneration<string> generation, CancellationToken cancellationToken);
    Task TryRecordFailureAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context, DateTimeOffset startedAt,
        Exception exception, string code, bool retryable, CancellationToken cancellationToken);
}

public sealed record ModuleHandoffGenerationResult(NarrativeHandoffRequest Request, NarrativeGeneration<string> Generation);

public interface IModuleHandoffNarrativeService
{
    Task<ModuleHandoffGenerationResult> GenerateAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context,
        NarrativeHandoffRequest request, CancellationToken cancellationToken);
}

public sealed class ModuleHandoffNarrativeService(
    INarrativeGenerator generator,
    IModuleHandoffAiInteractionRecorder recorder) : IModuleHandoffNarrativeService
{
    public async Task<ModuleHandoffGenerationResult> GenerateAsync(ModuleHandoffSourceSnapshot source, SessionExecutionContext context,
        NarrativeHandoffRequest request, CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        using var activity = SessionExecutionTelemetry.ActivitySource.StartActivity("ai.provider.request", ActivityKind.Client);
        try
        {
            var generation = await generator.GenerateForProfileAsync(source.NarrativeAiProfileId, request, cancellationToken);
            if (string.IsNullOrWhiteSpace(generation.Value) || generation.Value.Length > 20_000)
                throw new NarrativeGenerationException("Narrative provider returned an invalid body.");
            await recorder.RecordSuccessAsync(source, context, startedAt, generation, cancellationToken);
            activity?.SetTag("ai.provider.name", generation.Metadata.Provider);
            activity?.SetTag("ai.model.name", generation.Metadata.Model);
            SessionExecutionTelemetry.ProviderDuration.Record(generation.Metadata.LatencyMilliseconds,
                SessionExecutionTelemetry.Tags(SessionExecutionKind.ModuleHandoff, SessionExecutionStatus.Running,
                    generation.Metadata.Provider, generation.Metadata.Model));
            if (generation.Metadata.InputTokens is not null)
                SessionExecutionTelemetry.ProviderInputTokens.Record(generation.Metadata.InputTokens.Value,
                    SessionExecutionTelemetry.Tags(SessionExecutionKind.ModuleHandoff, SessionExecutionStatus.Running,
                        generation.Metadata.Provider, generation.Metadata.Model));
            if (generation.Metadata.OutputTokens is not null)
                SessionExecutionTelemetry.ProviderOutputTokens.Record(generation.Metadata.OutputTokens.Value,
                    SessionExecutionTelemetry.Tags(SessionExecutionKind.ModuleHandoff, SessionExecutionStatus.Running,
                        generation.Metadata.Provider, generation.Metadata.Model));
            return new(request, generation);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is NarrativeGenerationException or AiProviderException or HttpRequestException or JsonException or OperationCanceledException)
        {
            var providerError = exception as AiProviderException;
            var code = providerError?.Code ?? (exception is OperationCanceledException ? AiProviderErrorCodes.Timeout : AiProviderErrorCodes.SchemaFailure);
            var retryable = providerError?.Retryable ?? exception is HttpRequestException or OperationCanceledException;
            activity?.SetStatus(ActivityStatusCode.Error, code);
            await recorder.TryRecordFailureAsync(source, context, startedAt, exception, code, retryable, cancellationToken);
            throw new ModuleHandoffGenerationException(code, retryable, exception);
        }
    }
}

public interface IModuleHandoffArtifactWriter
{
    void Add(string sessionId, string executionId, string attemptId, NarrativeGeneration<string> narrative, DateTimeOffset now);
}

public sealed class ModuleHandoffArtifactWriter(ISessionArtifactWriter writer) : IModuleHandoffArtifactWriter
{
    private static readonly JsonSerializerOptions Json = ModuleJsonSerializerOptions.Create();
    public void Add(string sessionId, string executionId, string attemptId, NarrativeGeneration<string> narrative, DateTimeOffset now) =>
        writer.Add(SessionArtifact.CreateCommittedJson(
            $"ART-{Guid.NewGuid():N}".ToUpperInvariant(), sessionId, executionId, attemptId,
            new NarrativeTextArtifactPayload(narrative.Value),
            JsonSerializer.Serialize(new { narrative.Metadata.Provider, narrative.Metadata.Model, narrative.Metadata.ResponseId }), now, Json));
}

public interface IModuleHandoffSessionTurnAppender
{
    SessionTurn Append(Session session, string sourceTurnId, long sourceStateRevision,
        NarrativeGeneration<string> narrative, DateTimeOffset now);
}

public sealed class ModuleHandoffSessionTurnAppender : IModuleHandoffSessionTurnAppender
{
    public SessionTurn Append(Session session, string sourceTurnId, long sourceStateRevision,
        NarrativeGeneration<string> narrative, DateTimeOffset now) =>
        session.AppendModuleHandoffNarrative(
            $"TRN-{Guid.NewGuid():N}".ToUpperInvariant(), sourceTurnId, NarrativeDocumentSchemas.ModuleHandoff,
            "確定した結果を受ける", narrative.Value, sourceStateRevision,
            new SessionTurnAiMetadata(narrative.Metadata.Provider, narrative.Metadata.Model, narrative.Metadata.ResponseId,
                narrative.Metadata.InputTokens, narrative.Metadata.OutputTokens, narrative.Metadata.LatencyMilliseconds,
                narrative.Metadata.AttemptCount, narrative.Metadata.FinishReason), now);
}

public enum ModuleHandoffPublishOutcome { Published, Existing, LeaseLost, SessionAdvanced, Conflict }
public sealed record ModuleHandoffPublishResult(ModuleHandoffPublishOutcome Outcome, string? OwnerId = null, string? NarrativeTurnId = null);

public interface IModuleHandoffPublishUnitOfWork
{
    Task<ModuleHandoffPublishResult> PublishAsync(SessionExecutionContext context, ModuleHandoffGenerationResult narrative,
        CancellationToken cancellationToken);
}

public sealed class ModuleHandoffExecutionOrchestrator(
    IModuleHandoffSourceSnapshotQuery sources,
    ModuleHandoffCausalityValidator causality,
    ModuleHandoffNarrativeRequestBuilder requests,
    IModuleHandoffNarrativeService narratives,
    IModuleHandoffPublishUnitOfWork publisher,
    IProgressionReceiptCommand progression,
    ILogger<ModuleHandoffExecutionOrchestrator> logger)
{
    public async Task<SessionExecutionHandlerResult> ExecuteAsync(SessionExecutionContext context, CancellationToken cancellationToken)
    {
        var source = await sources.LoadAsync(context, cancellationToken);
        if (source is null) return LeaseLost();
        var causalError = causality.Validate(source);
        if (causalError is not null)
            return new(false, false, causalError.Code, causalError.Message,
                causalError.Superseded ? nameof(SessionExecutionStatus.Superseded) : null);
        if (source.ExistingNarrativeTurnId is not null)
        {
            await progression.ExecuteForNarrativeTurnAsync(source.OwnerId, source.ExistingNarrativeTurnId, cancellationToken);
            return new(true);
        }

        NarrativeHandoffRequest request;
        try { request = requests.Build(source); }
        catch (ModuleHandoffValidationException exception)
        {
            return new(false, false, exception.Code, exception.Message,
                exception.Code == "session_advanced" ? nameof(SessionExecutionStatus.Superseded) : null);
        }

        ModuleHandoffGenerationResult narrative;
        try { narrative = await narratives.GenerateAsync(source, context, request, cancellationToken); }
        catch (ModuleHandoffGenerationException exception)
        {
            logger.LogWarning(exception.InnerException, "Module handoff generation failed. ExecutionId={ExecutionId} ErrorCode={ErrorCode}", source.ExecutionId, exception.Code);
            return new(false, exception.Retryable, exception.Code, "Narrativeを生成できませんでした。Moduleの結果は保存されています。", ErrorCategory: "ai-provider");
        }

        var published = await publisher.PublishAsync(context, narrative, cancellationToken);
        if (published.Outcome == ModuleHandoffPublishOutcome.LeaseLost) return LeaseLost();
        if (published.Outcome == ModuleHandoffPublishOutcome.SessionAdvanced)
            return new(false, false, "session_advanced", "Sessionが先へ進んだため、この結果は適用されませんでした。", nameof(SessionExecutionStatus.Superseded));
        if (published.Outcome == ModuleHandoffPublishOutcome.Conflict)
            return new(false, false, "publication_conflict", "Module handoffの公開競合が発生しました。");
        if (published.OwnerId is not null && published.NarrativeTurnId is not null)
            await progression.ExecuteForNarrativeTurnAsync(published.OwnerId, published.NarrativeTurnId, cancellationToken);
        return new(true);
    }

    private static SessionExecutionHandlerResult LeaseLost() =>
        new(false, false, "lease_lost", "生成処理の所有権が失われました。");
}

public sealed class ModuleHandoffValidationException(string code, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string Code { get; } = code;
}

public sealed class ModuleHandoffGenerationException(string code, bool retryable, Exception innerException)
    : Exception(innerException.Message, innerException)
{
    public string Code { get; } = code;
    public bool Retryable { get; } = retryable;
}
