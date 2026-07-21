using System.Diagnostics;
using Myriale.Api.Data;
using Myriale.Api.Services;

namespace Myriale.Api.Tests;

public sealed class SessionExecutionArchitectureTests
{
    [Fact]
    public void StateMachineRejectsInvalidTerminalTransition()
    {
        var execution = Execution(SessionExecutionStatuses.Succeeded);
        Assert.False(SessionExecutionStateMachine.CanTransition(SessionExecutionStatuses.Succeeded, SessionExecutionStatuses.Queued));
        Assert.Throws<InvalidOperationException>(() => SessionExecutionStateMachine.Transition(execution, SessionExecutionStatuses.Queued));
    }

    [Theory]
    [InlineData(SessionExecutionStatuses.Queued, true, false, false)]
    [InlineData(SessionExecutionStatuses.Running, true, false, false)]
    [InlineData(SessionExecutionStatuses.Failed, false, true, true)]
    [InlineData(SessionExecutionStatuses.Cancelled, false, true, true)]
    [InlineData(SessionExecutionStatuses.Superseded, false, false, true)]
    public void ProjectionUsesStatusCapabilities(string status, bool canCancel, bool canRetry, bool canDismiss)
    {
        var execution = Execution(status); execution.IsRetryable = true;
        var response = SessionExecutionProjection.ToResponse(execution, includeDevelopmentDiagnostics: false);
        Assert.Equal(canCancel, response.Capabilities.CanCancel);
        Assert.Equal(canRetry, response.Capabilities.CanRetry);
        Assert.Equal(canDismiss, response.Capabilities.CanDismiss);
        Assert.Null(response.DevelopmentDiagnostics);
    }

    [Fact]
    public void DevelopmentProjectionContainsTraceButProductionOmitsDiagnostics()
    {
        var execution = Execution(SessionExecutionStatuses.Failed);
        execution.Attempts.Add(new SessionExecutionAttempt { Id = "ATT-1", ExecutionId = execution.Id, AttemptNumber = 1, Status = "failed", StartedAt = DateTimeOffset.UtcNow, TraceId = "trace-id", SpanId = "span-id", ExceptionChain = "TimeoutException", RedactedResponseExcerpt = "Authorization=[REDACTED]" });
        var development = SessionExecutionProjection.ToResponse(execution, true);
        var production = SessionExecutionProjection.ToResponse(execution, false);
        Assert.Equal("trace-id", Assert.Single(development.DevelopmentDiagnostics!.Attempts).TraceId);
        Assert.DoesNotContain("secret", Assert.Single(development.DevelopmentDiagnostics.Attempts).RedactedResponseExcerpt!, StringComparison.OrdinalIgnoreCase);
        Assert.Null(production.DevelopmentDiagnostics);
    }

    [Fact]
    public void RedactionRemovesCredentialLikeValues()
    {
        var redacted = NarrativeExecutionHandler.Redact("Authorization: Bearer-secret api_key=top-secret Cookie=session-secret");
        Assert.DoesNotContain("Bearer-secret", redacted);
        Assert.DoesNotContain("top-secret", redacted);
        Assert.DoesNotContain("session-secret", redacted);
        Assert.Contains("[REDACTED]", redacted);
    }

    [Fact]
    public void MetricTagsContainOnlyBoundedDimensions()
    {
        TagList tags = SessionExecutionTelemetry.Tags("narrative", "failed", "mock", "fixture", "timeout");
        var names = tags.ToArray().Select(item => item.Key).ToArray();
        Assert.DoesNotContain("myriale.session.id", names);
        Assert.DoesNotContain("myriale.execution.id", names);
        Assert.DoesNotContain("myriale.input.id", names);
        Assert.Equal(["myriale.execution.kind", "myriale.execution.status", "ai.provider.name", "ai.model.name", "error.type"], names);
    }

    private static SessionExecution Execution(string status) => new()
    {
        Id = "EXE-1", SessionId = "SES-1", Kind = SessionExecutionKinds.Narrative, TriggerType = "player-input", TriggerId = "INP-1",
        Status = status, IdempotencyKey = "request-1", PayloadHash = new string('a', 64), CreatedAt = DateTimeOffset.UtcNow, QueuedAt = DateTimeOffset.UtcNow,
    };
}
