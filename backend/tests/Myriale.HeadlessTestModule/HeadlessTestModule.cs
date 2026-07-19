using System.Text.Json;
using Myriale.ModuleSdk;

[assembly: MyrialeModuleEntryPoint(typeof(Myriale.HeadlessTestModule.HeadlessTestModule))]

namespace Myriale.HeadlessTestModule;

public sealed class HeadlessTestModule : IMyrialeModule
{
    public ModuleManifest GetManifest() => new(
        "com.myriale.headless-test-module",
        "1.0.0",
        "ヘッドレステストモジュール",
        "DLL単体インストールのテスト用モジュールです。",
        ModuleContractVersions.V1,
        new ModuleConfigurationManifest(1, 1, []),
        new ModuleUiManifest(null, null, null),
        [],
        new ModuleLimits(65_536, 65_536, 16_384, 10));

    public ValueTask<ModuleValidationResult> ValidateConfigAsync(ModuleValidationRequest request, CancellationToken cancellationToken) =>
        ValueTask.FromResult(new ModuleValidationResult([]));

    public ValueTask<ModuleInitializationResult> InitializeAsync(ModuleInitializationRequest request, CancellationToken cancellationToken) =>
        ValueTask.FromResult(new ModuleInitializationResult(ModuleExecutionStatuses.Active, EmptyObject(), EmptyObject(), []));

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
