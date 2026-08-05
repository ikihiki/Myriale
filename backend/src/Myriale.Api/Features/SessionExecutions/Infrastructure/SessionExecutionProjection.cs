using System.Text.Json;
using Myriale.Api.Data;

namespace Myriale.Api.Features.SessionExecutions.Infrastructure;

public static class SessionExecutionProjection
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static SessionExecutionResponse ToResponse(SessionExecution execution, bool includeDevelopmentDiagnostics, SessionRuleActionStep? step = null)
    {
        var capabilities = new SessionExecutionCapabilities(
            execution.IsRetryable && execution.Status is SessionExecutionStatus.Failed or SessionExecutionStatus.Cancelled,
            execution.Status is SessionExecutionStatus.Queued or SessionExecutionStatus.Running or SessionExecutionStatus.RetryWait or SessionExecutionStatus.CancelRequested,
            execution.Status.IsTerminal());
        SessionExecutionDiagnosticsResponse? diagnostics = null;
        if (includeDevelopmentDiagnostics)
        {
            diagnostics = new SessionExecutionDiagnosticsResponse(
                execution.SessionId, execution.TriggerType.ToContractValue(), execution.TriggerId, execution.Revision, execution.LeaseOwner,
                execution.LeaseToken is { Length: >= 8 } token ? $"…{token[^8..]}" : null, execution.LeaseExpiresAt,
                execution.Attempts.OrderBy(item => item.AttemptNumber).Select(item => new SessionExecutionAttemptDiagnosticsResponse(
                    item.Id, item.AttemptNumber, item.Status.ToContractValue(), item.WorkerId, item.Provider, item.Model, item.ProviderRequestId,
                    item.StartedAt, item.CompletedAt, item.LatencyMilliseconds, item.InputTokens, item.OutputTokens, item.FinishReason,
                    item.ErrorCode, item.ErrorCategory, item.Retryable, item.CorrelationId, item.TraceId, item.SpanId,
                    item.ExceptionChain, item.RedactedResponseExcerpt, item.SentPrompt, item.ReceivedResult, item.ValidationResult,
                    item.PromptVersion, item.ContextHash, item.ContextSizeBytes)).ToList());
        }
        return new SessionExecutionResponse(
            execution.Id, execution.SessionId, execution.Kind.ToContractValue(), execution.TriggerType.ToContractValue(), execution.TriggerId, execution.Status.ToContractValue(),
            execution.Revision, execution.IsRetryable, execution.AttemptCount, execution.MaxAttempts, execution.NextAttemptAt,
            execution.ErrorCode, execution.UserErrorMessage, execution.CreatedAt, execution.StartedAt, execution.CompletedAt,
            execution.CancelRequestedAt, execution.DismissedAt, capabilities, diagnostics, execution.Stage, execution.SchemaVersion,
            step is null ? null : ToScenarioTurn(step), execution.ActionDecisionAiProfileId, execution.NarrativeAiProfileId);
    }

    private static SessionScenarioTurnProjectionResponse ToScenarioTurn(SessionRuleActionStep step)
    {
        var snapshot = Deserialize<RuleActionSnapshot>(step.ActionSnapshotJson);
        var decision = Deserialize<RuleActionDecisionResult>(step.DecisionJson);
        var postState = Deserialize<RulePostState>(step.PublicPostStateJson);
        var selectedAction = decision is null || snapshot is null
            ? null
            : snapshot.Actions.SingleOrDefault(item => item.ObjectId == decision.ObjectId && item.ActionId == decision.ActionId);
        var selectedObject = decision is null || snapshot is null
            ? null
            : snapshot.Objects.SingleOrDefault(item => item.Id == decision.ObjectId);
        return new SessionScenarioTurnProjectionResponse(
            "scenario-turn.v1",
            step.Stage.ToWireValue(),
            postState?.CurrentLocation ?? snapshot?.CurrentLocation,
            snapshot?.Objects ?? [],
            snapshot?.Actions ?? [],
            decision is null ? null : new SessionScenarioTurnSelectedActionResponse(
                decision.ObjectId,
                decision.ActionId,
                selectedObject?.Code,
                selectedObject?.Name,
                selectedAction?.Code,
                selectedAction?.Label,
                decision.Arguments),
            postState is null ? null : new SessionScenarioTurnPostStateResponse(
                step.PostSessionRevision ?? postState.SessionStateRevision,
                postState.CurrentLocation,
                postState.Objects,
                DeserializeList<string>(step.FactsJson),
                DeserializeList<JsonElement>(step.EventsJson),
                DeserializeList<string>(step.NarrativeHintsJson),
                DeserializeList<RuleAppliedEffect>(step.AppliedEffectsJson)));
    }

    private static T? Deserialize<T>(string? json) => string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json, Json);
    private static IReadOnlyList<T> DeserializeList<T>(string? json) => string.IsNullOrWhiteSpace(json) ? [] : JsonSerializer.Deserialize<List<T>>(json, Json) ?? [];

    public static SessionPlayerInputResponse ToResponse(SessionPlayerInput input) => new(
        input.Id, input.RequestId, input.Text, input.InteractionType.ToWireValue(), input.AcceptedAfterTurnId,
        input.AcceptedSessionRevision, input.SupersedesInputId, input.CreatedAt);
}
