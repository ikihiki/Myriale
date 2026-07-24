using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Myriale.Api.Modules;
using Myriale.Api.Modules.Runtime;
using Myriale.ModuleSdk;

namespace Myriale.Api.Tests;

public sealed class ModuleRuntimeTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"myriale-runtime-tests-{Guid.NewGuid():N}");
    private readonly string _storagePath;
    private readonly WebApplicationFactory<Program> _factory;

    public ModuleRuntimeTests()
    {
        Directory.CreateDirectory(_root);
        _storagePath = Path.Combine(_root, "modules");
        var dbPath = Path.Combine(_root, "myriale.db");
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:MyrialeAccounts", $"Data Source={dbPath}");
            builder.UseSetting("Modules:StoragePath", _storagePath);
            builder.UseSetting("ModuleRuntime:MaxResponseBytes", "1024");
            builder.UseSetting("ModuleRuntime:MaxCollectionItems", "8");
            builder.UseSetting("ModuleRuntime:MaxConcurrentInvocations", "4");
            builder.UseSetting("ModuleRuntime:MaxCachedAssemblies", "4");
        });
    }

    [Fact]
    public async Task DisabledPackageIsRejectedAndEnabledPackageSupportsLifecycle()
    {
        var identity = await InstallAsync(enable: false);
        await using var scope = _factory.Services.CreateAsyncScope();
        var runtime = scope.ServiceProvider.GetRequiredService<IModuleRuntime>();

        var disabled = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.ValidateConfigAsync(identity, new ModuleValidationRequest("validate-1", Json(new { })), default));
        Assert.Equal(ModuleRuntimeErrorCodes.PackageDisabled, disabled.Code);

        await SetEnabledAsync(identity.Digest, true);
        var validation = await runtime.ValidateConfigAsync(identity, new ModuleValidationRequest("validate-2", Json(new { invalid = true })), default);
        Assert.False(validation.IsValid);

        var initialized = await runtime.InitializeAsync(identity, new ModuleInitializationRequest("initialize-1", Json(new { }), Binding(), [1]), default);
        Assert.Equal(ModuleExecutionStatuses.Active, initialized.Status);
        Assert.Equal(1, initialized.State.GetProperty("instanceInvocations").GetInt32());

        var transition = await runtime.DispatchAsync(identity, Dispatch("dispatch-1", 0, new { mode = "complete" }), default);
        Assert.Equal(ModuleExecutionStatuses.Completed, transition.Status);
        Assert.Equal(1, transition.Revision);
        Assert.NotNull(transition.Outcome);
    }

    [Fact]
    public async Task ExactIdentityIsRequiredAndEachInvocationUsesFreshModuleInstance()
    {
        var identity = await InstallAsync();
        await using var scope = _factory.Services.CreateAsyncScope();
        var runtime = scope.ServiceProvider.GetRequiredService<IModuleRuntime>();

        var wrongIdentity = identity with { ModuleId = "com.myriale.wrong" };
        var missing = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.InitializeAsync(wrongIdentity, Initialize("wrong"), default));
        Assert.Equal(ModuleRuntimeErrorCodes.PackageNotFound, missing.Code);

        var first = await runtime.DispatchAsync(identity, Dispatch("dispatch-1", 0, new { }), default);
        var second = await runtime.DispatchAsync(identity, Dispatch("dispatch-2", 0, new { }), default);
        Assert.Equal(1, first.State.GetProperty("instanceInvocations").GetInt32());
        Assert.Equal(1, second.State.GetProperty("instanceInvocations").GetInt32());
        Assert.Equal(1, first.State.GetProperty("staticInvocations").GetInt32());
        Assert.Equal(1, second.State.GetProperty("staticInvocations").GetInt32());
    }

    [Fact]
    public async Task CorruptExpandedAssemblyIsNeverExecuted()
    {
        var identity = await InstallAsync();
        await File.WriteAllTextAsync(Path.Combine(_storagePath, "expanded", identity.Digest, "module.dll"), "corrupt");
        await using var scope = _factory.Services.CreateAsyncScope();
        var runtime = scope.ServiceProvider.GetRequiredService<IModuleRuntime>();

        var unavailable = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.InitializeAsync(identity, Initialize("initialize"), default));

        Assert.Equal(ModuleRuntimeErrorCodes.PackageUnavailable, unavailable.Code);
    }

    [Fact]
    public async Task PluginFailuresAndContractViolationsAreSanitized()
    {
        var identity = await InstallAsync();
        await using var scope = _factory.Services.CreateAsyncScope();
        var runtime = scope.ServiceProvider.GetRequiredService<IModuleRuntime>();

        var failed = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.DispatchAsync(identity, Dispatch("throw", 0, new { mode = "throw" }), default));
        Assert.Equal(ModuleRuntimeErrorCodes.InvocationFailed, failed.Code);
        Assert.DoesNotContain("secret", failed.Message, StringComparison.OrdinalIgnoreCase);

        var revision = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.DispatchAsync(identity, Dispatch("revision", 3, new { mode = "invalid-revision" }), default));
        Assert.Equal(ModuleRuntimeErrorCodes.ContractViolation, revision.Code);

        var descriptor = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.DispatchAsync(identity, Dispatch("descriptor", 0, new { mode = "invalid-action-descriptor" }), default));
        Assert.Equal(ModuleRuntimeErrorCodes.ContractViolation, descriptor.Code);
    }

    [Fact]
    public async Task ResponseByteAndCollectionLimitsAreEnforced()
    {
        var identity = await InstallAsync();
        await using var scope = _factory.Services.CreateAsyncScope();
        var runtime = scope.ServiceProvider.GetRequiredService<IModuleRuntime>();

        var responseSize = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.DispatchAsync(identity, Dispatch("response-size", 0, new { mode = "oversized-response" }), default));
        Assert.Equal(ModuleRuntimeErrorCodes.ContractViolation, responseSize.Code);

        var collectionSize = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.DispatchAsync(identity, Dispatch("collection-size", 0, new { mode = "too-many-events" }), default));
        Assert.Equal(ModuleRuntimeErrorCodes.ContractViolation, collectionSize.Code);
    }

    [Fact]
    public async Task RequestLimitsAndCancellationAreEnforced()
    {
        var identity = await InstallAsync();
        await using var scope = _factory.Services.CreateAsyncScope();
        var runtime = scope.ServiceProvider.GetRequiredService<IModuleRuntime>();
        var oversized = new string('x', 70_000);

        var violation = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.ValidateConfigAsync(identity, new ModuleValidationRequest("oversized", Json(new { oversized })), default));
        Assert.Equal(ModuleRuntimeErrorCodes.ContractViolation, violation.Code);

        var unbound = Initialize("unbound") with { Binding = Binding() with { ObjectId = string.Empty } };
        var unboundViolation = await Assert.ThrowsAsync<ModuleRuntimeException>(() =>
            runtime.InitializeAsync(identity, unbound, default));
        Assert.Equal(ModuleRuntimeErrorCodes.ContractViolation, unboundViolation.Code);

        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            runtime.InitializeAsync(identity, Initialize("cancelled"), cancellation.Token));
    }

    private async Task<ModulePackageIdentity> InstallAsync(bool enable = true)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
        await using var stream = File.OpenRead(Path.Combine(AppContext.BaseDirectory, "Myriale.HeadlessTestModule.dll"));
        var result = await service.InstallAsync(stream, default);
        if (enable) await service.SetEnabledAsync(result.Package.Digest, true, default);
        return new ModulePackageIdentity(result.Package.ModuleId, result.Package.Version, result.Package.Digest);
    }

    private async Task SetEnabledAsync(string digest, bool enabled)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var service = scope.ServiceProvider.GetRequiredService<IModulePackageService>();
        await service.SetEnabledAsync(digest, enabled, default);
    }

    private static ModuleInitializationRequest Initialize(string requestId) =>
        new(requestId, Json(new { }), Binding(), [1, 2]);

    private static ModuleDispatchRequest Dispatch<T>(string requestId, long revision, T action) =>
        new(requestId, revision, Json(new { }), Binding(), Json(new { hp = 10 }), Json(action), [3, 4]);

    private static ModuleObjectActionContext Binding() =>
        new("test-object", "test-object-type", "test-action", Json(new { difficulty = 2 }), Json(new { phase = "ready" }));

    private static JsonElement Json<T>(T value) => JsonSerializer.SerializeToElement(value);

    public void Dispose()
    {
        _factory.Dispose();
        try { if (Directory.Exists(_root)) Directory.Delete(_root, true); }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
}
