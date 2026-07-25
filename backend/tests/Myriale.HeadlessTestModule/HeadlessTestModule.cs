using System.Text.Json;
using Myriale.ModuleSdk;

[assembly: MyrialeModuleEntryPoint(typeof(Myriale.HeadlessTestModule.HeadlessTestModule))]

namespace Myriale.HeadlessTestModule;

public sealed class HeadlessTestModule : IMyrialeModule
{
    private static int _staticInvocations;
    private int _invocations;

    public ModuleManifest GetManifest() => new(
        "com.myriale.headless-test-module",
        "1.0.0",
        "ヘッドレステストモジュール",
        "DLL単体インストールとランタイムのテスト用モジュールです。",
        ModuleContractVersions.V1,
        new ModuleConfigurationManifest(1, 1, []),
        new ModuleUiManifest(null, null, null),
        [],
        new ModuleLimits(65_536, 65_536, 16_384, 0));

    public ValueTask<ModuleValidationResult> ValidateConfigAsync(ModuleValidationRequest request, CancellationToken cancellationToken)
    {
        var invalid = request.Configuration.TryGetProperty("invalid", out var value) && value.GetBoolean();
        return ValueTask.FromResult(new ModuleValidationResult(invalid
            ? [new ModuleValidationIssue("invalid", "invalid", "Invalid configuration.", ModuleValidationSeverity.Error)]
            : []));
    }

    public async ValueTask<ModuleInitializationResult> InitializeAsync(ModuleInitializationRequest request, CancellationToken cancellationToken)
    {
        _invocations++;
        _staticInvocations++;
        if (request.Configuration.TryGetProperty("initializationDelayMilliseconds", out var delay))
            await Task.Delay(delay.GetInt32(), cancellationToken);
        if (request.Configuration.TryGetProperty("completeOnInitialize", out var complete) && complete.GetBoolean())
        {
            return new ModuleInitializationResult(
                ModuleExecutionStatuses.Completed,
                Json(new { initialized = true }),
                Json(new { completed = true }),
                [],
                CompletedOutcome());
        }
        return new ModuleInitializationResult(
            ModuleExecutionStatuses.Active,
            Json(new { initialized = true, instanceInvocations = _invocations, staticInvocations = _staticInvocations }),
            Json(new { screen = "runtime" }),
            [new ModuleAvailableAction("continue", "Continue", true, RandomValueCount: 4, Arguments: [])]);
    }

    public async ValueTask<ModuleTransitionResult> DispatchAsync(ModuleDispatchRequest request, CancellationToken cancellationToken)
    {
        _invocations++;
        _staticInvocations++;
        var mode = request.Action.TryGetProperty("mode", out var value) ? value.GetString() : null;
        if (mode == "throw") throw new InvalidOperationException("secret plugin failure");
        if (mode == "delay")
        {
            await Task.Delay(request.Action.GetProperty("milliseconds").GetInt32(), cancellationToken);
        }
        if (mode == "delay-complete")
        {
            await Task.Delay(request.Action.GetProperty("milliseconds").GetInt32(), cancellationToken);
            return new ModuleTransitionResult(
                ModuleExecutionStatuses.Completed,
                request.ExpectedRevision + 1,
                request.State,
                Json(new { completed = true }),
                [],
                [],
                CompletedOutcome());
        }
        if (mode == "oversized-response")
        {
            return new ModuleTransitionResult(
                ModuleExecutionStatuses.Active,
                request.ExpectedRevision + 1,
                request.State,
                Json(new { content = new string('x', 2_000) }),
                [],
                []);
        }
        if (mode == "too-many-events")
        {
            return new ModuleTransitionResult(
                ModuleExecutionStatuses.Active,
                request.ExpectedRevision + 1,
                request.State,
                Json(new { }),
                [],
                Enumerable.Range(0, 9).Select(index => new ModuleEvent($"event-{index}", Json(new { index }))).ToArray());
        }
        if (mode == "invalid-revision")
        {
            return Active(request, request.ExpectedRevision + 2);
        }
        if (mode == "invalid-action-descriptor")
        {
            return new ModuleTransitionResult(
                ModuleExecutionStatuses.Active,
                request.ExpectedRevision + 1,
                request.State,
                Json(new { }),
                [new ModuleAvailableAction("continue", "Continue", true, Arguments:
                    [new ModuleActionArgumentDescriptor("bad name", ModuleActionArgumentKind.String, false)])],
                []);
        }
        if (mode == "failed")
        {
            return new ModuleTransitionResult(
                ModuleExecutionStatuses.Failed,
                request.ExpectedRevision,
                request.State,
                Json(new { rejected = true }),
                [],
                [new ModuleEvent("rejected", Json(new { reason = "test" }))],
                Error: new ModuleError("action_rejected", "The action was rejected."));
        }
        if (mode == "complete")
        {
            return new ModuleTransitionResult(
                ModuleExecutionStatuses.Completed,
                request.ExpectedRevision + 1,
                request.State,
                Json(new { completed = true }),
                [],
                [],
                CompletedOutcome());
        }
        return Active(request, request.ExpectedRevision + 1);
    }

    private ModuleTransitionResult Active(ModuleDispatchRequest request, long revision) => new(
        ModuleExecutionStatuses.Active,
        revision,
        Json(new { instanceInvocations = _invocations, staticInvocations = _staticInvocations }),
        Json(new { screen = "runtime" }),
        [new ModuleAvailableAction("continue", "Continue", true, RandomValueCount: 4, Arguments: [])],
        [new ModuleEvent("updated", Json(new { }))]);

    private static ModuleOutcome CompletedOutcome() => new(
        "test",
        "complete",
        "Complete",
        "Completed.",
        [new ModuleFact("result", "The module completed.")],
        [new ModuleEvent("completed", Json(new { durable = true }))],
        ["Describe the confirmed result."],
        ["Do not invent another outcome."]);

    private static JsonElement Json<T>(T value) => JsonSerializer.SerializeToElement(value);
}
