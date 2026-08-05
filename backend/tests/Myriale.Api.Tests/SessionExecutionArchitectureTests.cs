using System.Diagnostics.Metrics;
using System.Diagnostics;
using Myriale.Api.Infrastructure.Persistence;

namespace Myriale.Api.Tests;

public sealed class SessionExecutionArchitectureTests
{
    [Fact]
    public void AggregateRejectsInvalidTerminalTransitionAndLegacyTypesAreAbsent()
    {
        var execution = Execution(SessionExecutionStatus.Succeeded);
        Assert.False(SessionExecution.CanTransition(SessionExecutionStatus.Succeeded, SessionExecutionStatus.Queued));
        Assert.Throws<InvalidOperationException>(() => execution.TransitionTo(SessionExecutionStatus.Queued));

        var assembly = typeof(SessionExecution).Assembly;
        Assert.Null(assembly.GetType("Myriale.Api.Services.SessionExecutionStateMachine"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.SessionExecutionCompletion"));
        Assert.Null(assembly.GetType("Myriale.Api.Data.SessionExecutionKinds"));
        Assert.Null(assembly.GetType("Myriale.Api.Data.SessionExecutionStatuses"));
        Assert.Null(assembly.GetType("Myriale.Api.Data.SessionExecutionEnumValues"));
    }

    [Theory]
    [InlineData(SessionExecutionStatus.Queued, true, false, false)]
    [InlineData(SessionExecutionStatus.Running, true, false, false)]
    [InlineData(SessionExecutionStatus.Failed, false, true, true)]
    [InlineData(SessionExecutionStatus.Cancelled, false, true, true)]
    [InlineData(SessionExecutionStatus.Superseded, false, false, true)]
    public void ProjectionUsesStatusCapabilities(SessionExecutionStatus status, bool canCancel, bool canRetry, bool canDismiss)
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
        var execution = Execution(SessionExecutionStatus.Failed);
        var attempt = SessionExecutionAttempt.Start("ATT-1", execution.Id, 1, "worker", DateTimeOffset.UtcNow);
        attempt.RecordTrace(null, "trace-id", "span-id");
        attempt.RecordFailureDiagnostics("TimeoutException", "Authorization=[REDACTED]");
        attempt.Fail(DateTimeOffset.UtcNow, "timeout", "provider", true);
        execution.Attempts.Add(attempt);
        var development = SessionExecutionProjection.ToResponse(execution, true);
        var production = SessionExecutionProjection.ToResponse(execution, false);
        Assert.Equal("trace-id", Assert.Single(development.DevelopmentDiagnostics!.Attempts).TraceId);
        Assert.DoesNotContain("secret", Assert.Single(development.DevelopmentDiagnostics.Attempts).RedactedResponseExcerpt!, StringComparison.OrdinalIgnoreCase);
        Assert.Null(production.DevelopmentDiagnostics);
    }

    [Fact]
    public void RedactionRemovesCredentialLikeValues()
    {
        var redacted = SessionExecutionDiagnostics.Redact("Authorization: Bearer-secret api_key=top-secret Cookie=session-secret");
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

    [Fact]
    public void ProviderMetricTagsContainOnlyBoundedOperationalDimensions()
    {
        TagList tags = SessionExecutionTelemetry.ProviderTags("runpod", "model-a", "failed", AiProviderErrorCodes.RateLimited);
        var names = tags.ToArray().Select(item => item.Key).ToArray();
        Assert.Equal(["ai.provider.name", "ai.model.name", "myriale.provider.status", "error.type"], names);
        Assert.DoesNotContain("prompt", names);
        Assert.DoesNotContain("response", names);
        Assert.DoesNotContain("myriale.session.id", names);
    }

    [Fact]
    public void SessionAdvancedAndInvalidSignalMetricsUseBoundedErrorTags()
    {
        var measurements = new List<(string Name, Dictionary<string, object?> Tags)>();
        using var listener = new MeterListener();
        listener.InstrumentPublished = (instrument, activeListener) =>
        {
            if (instrument.Meter.Name == SessionExecutionTelemetry.MeterName)
                activeListener.EnableMeasurementEvents(instrument);
        };
        listener.SetMeasurementEventCallback<long>((instrument, _, tags, _) =>
        {
            if (instrument.Name is "myriale.session.execution.session_advanced" or "myriale.ai.dialogue.invalid_signal")
                measurements.Add((instrument.Name, tags.ToArray().ToDictionary(item => item.Key, item => item.Value)));
        });
        listener.Start();

        SessionExecutionTelemetry.RecordSessionAdvanced("narrative", "superseded");
        SessionExecutionTelemetry.RecordInvalidSignal("narrative", "running");

        Assert.Contains(measurements, measurement => measurement.Name == "myriale.session.execution.session_advanced"
            && Equals(measurement.Tags["error.type"], "session_advanced"));
        Assert.Contains(measurements, measurement => measurement.Name == "myriale.ai.dialogue.invalid_signal"
            && Equals(measurement.Tags["error.type"], "invalid_signal"));
        Assert.All(measurements, measurement => Assert.Equal(
            ["myriale.execution.kind", "myriale.execution.status", "error.type"],
            measurement.Tags.Keys));
    }

    [Fact]
    public void WorkerUsesOperationsRepositoryInsteadOfApplicationDbContext()
    {
        var constructor = Assert.Single(typeof(SessionExecutionWorker).GetConstructors());
        Assert.DoesNotContain(constructor.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
        Assert.Contains(typeof(Myriale.Api.Features.SessionExecutions.Application.ISessionExecutionOperationsRepository),
            typeof(SessionExecutionWorker).Assembly.GetTypes());
    }

    [Fact]
    public void ScenarioTurnHandler_IsThinAndHasNoDbContextDependency()
    {
        var constructor = Assert.Single(typeof(ScenarioTurnExecutionHandler).GetConstructors());
        Assert.DoesNotContain(constructor.GetParameters(), parameter => parameter.ParameterType == typeof(ApplicationDbContext));
        Assert.Equal([typeof(Myriale.Api.Features.ScenarioTurns.Application.ScenarioTurnExecutionOrchestrator)],
            constructor.GetParameters().Select(parameter => parameter.ParameterType));
    }

    [Fact]
    public void ScenarioTurnExecution_HasExplicitSplitPortsAndNoLegacyRuntimeTypes()
    {
        var assembly = typeof(ScenarioTurnExecutionHandler).Assembly;
        var required = new[]
        {
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioWorldSnapshotQuery),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioActionSnapshotRepository),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioAiDecisionService),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioAiInteractionRecorder),
            typeof(IScenarioRuleResolutionService),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioEffectCommitUnitOfWork),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioTurnArtifactWriter),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioNarrativePublisher),
            typeof(Myriale.Api.Features.ScenarioTurns.Application.IScenarioSessionTurnAppender),
        };
        Assert.All(required, type => Assert.True(type.IsInterface, type.Name));
        Assert.Null(assembly.GetType("Myriale.Api.Services.ScenarioRuleWorld"));
        Assert.Null(assembly.GetType("Myriale.Api.Services.ScenarioEffectApplier"));
        Assert.Null(assembly.GetType("Myriale.Api.Data.ScenarioTurnStages"));
    }

    private static SessionExecution Execution(SessionExecutionStatus status) => new()
    {
        Id = "EXE-1",
        SessionId = "SES-1",
        Kind = SessionExecutionKind.Narrative,
        TriggerType = SessionExecutionTriggerType.PlayerInput,
        TriggerId = "INP-1",
        Status = status,
        IdempotencyKey = "request-1",
        PayloadHash = new string('a', 64),
        CreatedAt = DateTimeOffset.UtcNow,
        QueuedAt = DateTimeOffset.UtcNow,
    };
}
