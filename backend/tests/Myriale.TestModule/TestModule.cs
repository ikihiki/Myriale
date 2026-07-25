using System.Text.Json;
using Myriale.ModuleSdk;

[assembly: MyrialeModuleEntryPoint(typeof(Myriale.TestModule.TestModule))]

namespace Myriale.TestModule;

public sealed class TestModule : IMyrialeModule
{
    public ModuleManifest GetManifest() => new(
        "com.myriale.test-module",
        "1.0.0",
        "テストモジュール",
        "パッケージ管理テスト用のモジュールです。",
        ModuleContractVersions.V1,
        new ModuleConfigurationManifest(1, 1, []),
        new ModuleUiManifest(
            new ModuleUiEntry("resources/runtime.mjs", "myriale-test-module", ["resources/module.css"]),
            null,
            null),
        [],
        new ModuleLimits(65_536, 65_536, 16_384, 0));

    public ValueTask<ModuleValidationResult> ValidateConfigAsync(ModuleValidationRequest request, CancellationToken cancellationToken) =>
        ValueTask.FromResult(new ModuleValidationResult([]));

    public ValueTask<ModuleInitializationResult> InitializeAsync(ModuleInitializationRequest request, CancellationToken cancellationToken) =>
        ValueTask.FromResult(new ModuleInitializationResult(
            ModuleExecutionStatuses.Active,
            EmptyObject(),
            EmptyObject(),
            []));

    public ValueTask<ModuleTransitionResult> DispatchAsync(ModuleDispatchRequest request, CancellationToken cancellationToken) =>
        ValueTask.FromResult(new ModuleTransitionResult(
            ModuleExecutionStatuses.Active,
            request.ExpectedRevision + 1,
            request.State,
            EmptyObject(),
            [],
            []));

    private static JsonElement EmptyObject()
    {
        using var document = JsonDocument.Parse("{}");
        return document.RootElement.Clone();
    }
}
