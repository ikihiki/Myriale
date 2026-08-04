using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Myriale.Api.Contracts;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Application.Sessions;

public enum SessionCommandOutcome { Created, Accepted, Replay, Invalid, Forbidden, NotFound, Conflict, RateLimited, RetryableConflict }
public sealed record SessionCommandResult(SessionCommandOutcome Outcome, string? SessionId = null, SessionPlayerInput? Input = null,
    SessionExecution? Execution = null, string? ErrorCode = null, string? ErrorMessage = null);

public sealed record AcceptSessionInputCommand(string OwnerId, string SessionId, string RequestId, string Text,
    string InteractionType, string? SupersedesInputId, string? ActionDecisionAiProfileId, string? NarrativeAiProfileId);

public interface ISessionInputAcceptanceRepository
{
    Task<Session?> LoadOwnedAsync(string ownerId, string sessionId, CancellationToken cancellationToken);
    Task<(SessionPlayerInput Input, SessionExecution Execution)?> FindReplayAsync(string sessionId, string requestId, CancellationToken cancellationToken);
    Task<bool> HasBlockingModuleHeadAsync(string sessionId, string? headTurnId, CancellationToken cancellationToken);
    Task<bool> IsModuleHandoffPendingAsync(string sessionId, string? headTurnId, CancellationToken cancellationToken);
    Task<int> CountRecentInputsAsync(string sessionId, DateTimeOffset cutoff, CancellationToken cancellationToken);
    Task<SessionRepositoryCommitOutcome> CommitInputAsync(Session session, SessionExecution execution, CancellationToken cancellationToken);
    void ClearTracking();
}

public enum SessionRepositoryCommitOutcome { Committed, ConcurrencyConflict, UniqueConflict }

public sealed class AcceptSessionInputUseCase(
    ISessionInputAcceptanceRepository repository,
    IOptions<AiProviderOptions> aiOptions,
    IAiProfileCatalog profiles,
    TimeProvider timeProvider)
{
    public async Task<SessionCommandResult> ExecuteAsync(AcceptSessionInputCommand command, CancellationToken cancellationToken)
    {
        var requestId = command.RequestId?.Trim() ?? string.Empty;
        var text = command.Text?.Trim() ?? string.Empty;
        if (requestId.Length is 0 or > 120) return Invalid("invalid_request_id", "RequestIdを指定してください。");
        if (text.Length is 0 or > 4000) return Invalid("invalid_input", "入力は1文字以上4000文字以内で指定してください。");
        if (!SessionEnumValues.TryParseInteractionType(command.InteractionType?.Trim(), out var interactionType))
            return Invalid("invalid_interaction_type", "InteractionTypeが不正です。");

        string actionProfile; string narrativeProfile;
        try
        {
            actionProfile = await profiles.ResolveActionDecisionProfileIdAsync(command.ActionDecisionAiProfileId, cancellationToken);
            narrativeProfile = await profiles.ResolveNarrativeProfileIdAsync(command.NarrativeAiProfileId, cancellationToken);
        }
        catch (AiProviderException) { return Invalid("invalid_ai_profile", "指定されたAI profileは利用できません。"); }

        var payloadHash = Hash($"{interactionType.ToWireValue()}\n{text}\n{actionProfile}\n{narrativeProfile}");
        var session = await repository.LoadOwnedAsync(command.OwnerId, command.SessionId, cancellationToken);
        if (session is null) return new(SessionCommandOutcome.NotFound, ErrorCode: "session_not_found", ErrorMessage: "Sessionが見つかりません。");
        var replay = await repository.FindReplayAsync(command.SessionId, requestId, cancellationToken);
        if (replay is not null) return replay.Value.Input.PayloadHash == payloadHash
            ? new(SessionCommandOutcome.Replay, command.SessionId, replay.Value.Input, replay.Value.Execution)
            : Conflict("idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
        if (session.Status != SessionStatus.Active) return Conflict("session_not_active", "Sessionは入力を受け付けていません。");
        if (await repository.HasBlockingModuleHeadAsync(command.SessionId, session.HeadTurnId, cancellationToken))
        {
            var handoff = await repository.IsModuleHandoffPendingAsync(command.SessionId, session.HeadTurnId, cancellationToken);
            return Conflict(handoff ? "module_handoff_pending" : "forced_mode_active",
                handoff ? "確定したモジュール結果をNarrativeへ引き渡しています。" : "プログラムによる進行中は自由入力できません。");
        }
        var now = timeProvider.GetUtcNow();
        if (await repository.CountRecentInputsAsync(command.SessionId, now.AddMinutes(-1), cancellationToken) >= aiOptions.Value.SessionRequestsPerMinute)
            return new(SessionCommandOutcome.RateLimited, ErrorCode: "session_rate_limited", ErrorMessage: "SessionのAI入力上限に達しました。しばらく待って再試行してください。");

        var input = session.AcceptInput($"INP-{Guid.NewGuid():N}".ToUpperInvariant(), requestId, text, interactionType, payloadHash,
            command.OwnerId, command.SupersedesInputId, now);
        var execution = new SessionExecution
        {
            Id = $"EXE-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = command.SessionId,
            Kind = SessionExecutionKind.ScenarioTurn, TriggerType = SessionExecutionTriggerType.PlayerInput,
            Stage = ScenarioTurnStages.LoadingWorld, SchemaVersion = 1, TriggerId = input.Id,
            Status = SessionExecutionStatus.Queued, Revision = 0, IdempotencyKey = requestId, PayloadHash = payloadHash,
            ActionDecisionAiProfileId = actionProfile, NarrativeAiProfileId = narrativeProfile,
            AcceptedHeadTurnId = input.AcceptedAfterTurnId, AcceptedSessionRevision = input.AcceptedSessionRevision,
            MaxAttempts = Math.Max(1, aiOptions.Value.MaxAttempts), CreatedAt = now, QueuedAt = now, TraceParent = Activity.Current?.Id,
        };
        var commit = await repository.CommitInputAsync(session, execution, cancellationToken);
        if (commit == SessionRepositoryCommitOutcome.Committed)
        {
            SessionExecutionTelemetry.Enqueued.Add(1, SessionExecutionTelemetry.Tags(execution.Kind, execution.Status));
            return new(SessionCommandOutcome.Accepted, command.SessionId, input, execution);
        }
        repository.ClearTracking();
        var winner = await repository.FindReplayAsync(command.SessionId, requestId, cancellationToken);
        if (winner is not null) return winner.Value.Input.PayloadHash == payloadHash
            ? new(SessionCommandOutcome.Replay, command.SessionId, winner.Value.Input, winner.Value.Execution)
            : Conflict("idempotency_key_reused", "同じRequestIdに別の入力は指定できません。");
        return new(SessionCommandOutcome.RetryableConflict, ErrorCode: "session_revision_conflict", ErrorMessage: "Sessionが更新されました。再読み込みして再試行してください。");
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    private static SessionCommandResult Invalid(string code, string message) => new(SessionCommandOutcome.Invalid, ErrorCode: code, ErrorMessage: message);
    private static SessionCommandResult Conflict(string code, string message) => new(SessionCommandOutcome.Conflict, ErrorCode: code, ErrorMessage: message);
}

public sealed record CreateSessionCommand(string OwnerId, string ScenarioId, string RequestId, bool InterpretationEnabled, string? SelectedHero);
public sealed record SessionCreationSource(bool CanDebugDialogue, ScenarioDefinitionVersion Definition, ScenarioLocation InitialLocation,
    ScenarioProgressionNode? InitialNode, IReadOnlyList<ScenarioProgressionTransition> ModuleTransitions);
public enum SessionCreationSourceOutcome { Found, ScenarioNotFound, PublishedDefinitionRequired, InitialLocationRequired }
public sealed record SessionCreationSourceResult(SessionCreationSourceOutcome Outcome, SessionCreationSource? Source = null);

public interface ISessionCreationRepository
{
    Task<Session?> FindReplayAsync(string ownerId, string requestId, CancellationToken cancellationToken);
    Task<SessionCreationSourceResult> LoadSourceAsync(string ownerId, string scenarioId, CancellationToken cancellationToken);
    Task<bool> AreModulePackagesAvailableAsync(IReadOnlyList<ScenarioProgressionTransition> transitions, CancellationToken cancellationToken);
    Task<SessionRepositoryCommitOutcome> CommitCreationAsync(Session session, CancellationToken cancellationToken);
    void ClearTracking();
}

public sealed class CreateSessionUseCase(ISessionCreationRepository repository, ScenarioRuleConfigurationResolver ruleResolver, TimeProvider timeProvider)
{
    public async Task<SessionCommandResult> ExecuteAsync(CreateSessionCommand command, CancellationToken cancellationToken)
    {
        var scenarioId = command.ScenarioId?.Trim() ?? string.Empty;
        var requestId = command.RequestId?.Trim() ?? string.Empty;
        if (scenarioId.Length == 0) return Invalid("invalid_scenario_id", "ScenarioIdを指定してください。");
        if (requestId.Length is 0 or > 120) return Invalid("invalid_request_id", "RequestIdを120文字以内で指定してください。");
        var selectedRequestHero = command.SelectedHero?.Trim();
        var replay = await repository.FindReplayAsync(command.OwnerId, requestId, cancellationToken);
        if (replay is not null)
        {
            var replayHash = HashCreation(scenarioId, command.InterpretationEnabled, selectedRequestHero ?? replay.SelectedHero);
            return replay.CreationPayloadHash == replayHash
                ? new(SessionCommandOutcome.Replay, replay.Id)
                : Conflict("idempotency_key_reused", "同じRequestIdに別のSession設定は指定できません。");
        }

        var sourceResult = await repository.LoadSourceAsync(command.OwnerId, scenarioId, cancellationToken);
        if (sourceResult.Outcome == SessionCreationSourceOutcome.ScenarioNotFound)
            return new(SessionCommandOutcome.NotFound, ErrorCode: "scenario_not_found", ErrorMessage: "Scenarioが見つかりません。");
        if (sourceResult.Outcome == SessionCreationSourceOutcome.PublishedDefinitionRequired)
            return Conflict("published_scenario_definition_required", "公開済みのScenario rule definitionが必要です。");
        if (sourceResult.Outcome == SessionCreationSourceOutcome.InitialLocationRequired)
            return Conflict("initial_location_required", "公開定義に有効な開始Locationを指定してください。");
        var source = sourceResult.Source!;
        if (command.InterpretationEnabled && !source.CanDebugDialogue)
            return new(SessionCommandOutcome.Forbidden, ErrorCode: "dialogue_debug_forbidden", ErrorMessage: "解釈説明を有効にする権限がありません。");
        var definition = source.Definition;
        var selectedHero = string.IsNullOrWhiteSpace(selectedRequestHero) ? definition.ScenarioHero : selectedRequestHero;
        var payloadHash = HashCreation(scenarioId, command.InterpretationEnabled, selectedHero);
        if (selectedHero.Length > 1000) return Invalid("invalid_selected_hero", "選択した主人公は1000文字以内で指定してください。");
        if (!await repository.AreModulePackagesAvailableAsync(source.ModuleTransitions, cancellationToken))
            return Conflict("scenario_module_unavailable", "Scenarioが使用するModule packageは承認済みかつ有効である必要があります。");

        var now = timeProvider.GetUtcNow();
        var sessionId = $"SES-{Guid.NewGuid():N}".ToUpperInvariant();
        var state = new SessionState { SessionId = sessionId, Revision = 0, FlagsJson = "{}", UpdatedAt = now };
        var session = Session.Create(sessionId, command.OwnerId, scenarioId, definition.Id, source.InitialLocation.Id,
            requestId, payloadHash, selectedHero, command.InterpretationEnabled, state, now);
        foreach (var item in definition.Objects)
        {
            var configuration = ruleResolver.Resolve(definition, item);
            if (configuration.Conflicts.Count > 0) return Conflict("invalid_rule_configuration", string.Join("; ", configuration.Conflicts));
            session.ObjectStates.Add(new SessionObjectState { Id = $"SOS-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = sessionId,
                ScenarioObjectId = item.Id, LocationId = item.LocationId, StateJson = ruleResolver.InitialState(definition, item).ToJsonString(), Revision = 0, UpdatedAt = now });
        }
        if (source.InitialNode is not null)
            session.Progress = new SessionProgressState { SessionId = sessionId, CurrentNodeId = source.InitialNode.Id, Revision = 0, UpdatedAt = now };
        foreach (var transition in source.ModuleTransitions)
        {
            if (string.IsNullOrWhiteSpace(transition.ModuleVersion) || transition.ModuleDigest?.Length != 64
                || string.IsNullOrWhiteSpace(transition.ModuleConfigurationJson) || string.IsNullOrWhiteSpace(transition.ModuleContextJson)
                || transition.ModuleRandomValueCount < 0) return Conflict("scenario_module_snapshot_invalid", "ScenarioのModule設定が不完全です。");
            session.ProgressionModuleSnapshots.Add(new SessionProgressionModuleSnapshot { Id = $"PMS-{Guid.NewGuid():N}".ToUpperInvariant(), SessionId = sessionId,
                TransitionId = transition.Id, ModuleId = transition.ModuleId!, ModuleVersion = transition.ModuleVersion!, ModuleDigest = transition.ModuleDigest!,
                ConfigurationJson = transition.ModuleConfigurationJson!, ContextJson = transition.ModuleContextJson!, RandomValueCount = transition.ModuleRandomValueCount, CreatedAt = now });
        }
        session.AppendOpeningTurn($"TRN-{Guid.NewGuid():N}".ToUpperInvariant(), NarrativeDocumentSchemas.ScenarioOpening,
            definition.ScenarioTitle.Value, definition.ScenarioOpening, now);
        var commit = await repository.CommitCreationAsync(session, cancellationToken);
        if (commit == SessionRepositoryCommitOutcome.Committed) return new(SessionCommandOutcome.Created, session.Id);
        repository.ClearTracking();
        var winner = await repository.FindReplayAsync(command.OwnerId, requestId, cancellationToken);
        if (winner is not null) return winner.CreationPayloadHash == payloadHash
            ? new(SessionCommandOutcome.Replay, winner.Id)
            : Conflict("idempotency_key_reused", "同じRequestIdに別のSession設定は指定できません。");
        return new(SessionCommandOutcome.RetryableConflict, ErrorCode: "session_creation_conflict", ErrorMessage: "Session作成が競合しました。再試行してください。");
    }

    private static string HashCreation(string scenarioId, bool interpretation, string? hero) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { scenarioId, interpretation, hero })))).ToLowerInvariant();
    private static SessionCommandResult Invalid(string code, string message) => new(SessionCommandOutcome.Invalid, ErrorCode: code, ErrorMessage: message);
    private static SessionCommandResult Conflict(string code, string message) => new(SessionCommandOutcome.Conflict, ErrorCode: code, ErrorMessage: message);
}
