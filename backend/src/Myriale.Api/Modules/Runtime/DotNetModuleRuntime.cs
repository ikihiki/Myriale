using System.Text.Json;
using Microsoft.Extensions.Options;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

internal sealed class DotNetModuleRuntime(
    IModulePackageRuntimeCatalog catalog,
    ModuleAssemblyCache cache,
    ModuleRuntimeInvocationGate invocationGate,
    IOptions<ModuleRuntimeOptions> options,
    ILogger<DotNetModuleRuntime> logger) : IModuleRuntime
{
    private readonly ModuleRuntimeOptions _options = options.Value;
    private readonly JsonSerializerOptions _jsonOptions = ModuleJsonSerializerOptions.Create();

    public async Task<ModuleValidationResult> ValidateConfigAsync(
        ModulePackageIdentity identity,
        ModuleValidationRequest request,
        CancellationToken cancellationToken)
    {
        using var gate = await invocationGate.EnterAsync(cancellationToken);
        RequireRequestId(request.RequestId);
        var descriptor = await catalog.ResolveEnabledAsync(identity, cancellationToken);
        RequireJsonSize(request.Configuration, descriptor.Manifest.Limits.MaxConfigurationBytes, "configuration");
        var result = await InvokeAsync(descriptor, "validate configuration", (module, token) => module.ValidateConfigAsync(request, token), cancellationToken);
        ValidateContract(() => ValidateValidationResult(result));
        await RequireResponseSizeAsync(result, cancellationToken);
        return result;
    }

    public async Task<ModuleInitializationResult> InitializeAsync(
        ModulePackageIdentity identity,
        ModuleInitializationRequest request,
        CancellationToken cancellationToken)
    {
        using var gate = await invocationGate.EnterAsync(cancellationToken);
        RequireRequestId(request.RequestId);
        var descriptor = await catalog.ResolveEnabledAsync(identity, cancellationToken);
        RequireJsonSize(request.Configuration, descriptor.Manifest.Limits.MaxConfigurationBytes, "configuration");
        RequireJsonSize(request.Context, _options.MaxContextBytes, "context");
        RequireRandomValues(request.RandomValues);
        var result = await InvokeAsync(descriptor, "initialize", (module, token) => module.InitializeAsync(request, token), cancellationToken);
        ValidateContract(() => ValidateExecutionResult(result, descriptor.Manifest.Limits));
        await RequireResponseSizeAsync(result, cancellationToken);
        return result;
    }

    public async Task<ModuleTransitionResult> DispatchAsync(
        ModulePackageIdentity identity,
        ModuleDispatchRequest request,
        CancellationToken cancellationToken)
    {
        using var gate = await invocationGate.EnterAsync(cancellationToken);
        RequireRequestId(request.RequestId);
        if (request.ExpectedRevision < 0) throw Violation("ExpectedRevisionは0以上である必要があります。");
        var descriptor = await catalog.ResolveEnabledAsync(identity, cancellationToken);
        RequireJsonSize(request.Configuration, descriptor.Manifest.Limits.MaxConfigurationBytes, "configuration");
        RequireJsonSize(request.Context, _options.MaxContextBytes, "context");
        RequireJsonSize(request.State, descriptor.Manifest.Limits.MaxStateBytes, "state");
        RequireJsonSize(request.Action, descriptor.Manifest.Limits.MaxActionBytes, "action");
        RequireRandomValues(request.RandomValues);
        var result = await InvokeAsync(descriptor, "dispatch", (module, token) => module.DispatchAsync(request, token), cancellationToken);
        ValidateContract(() =>
        {
            ValidateExecutionResult(result, descriptor.Manifest.Limits);
            ValidateEvents(result.UiEvents, "UI event");
            var expectedRevision = result.Status == ModuleExecutionStatuses.Failed
                ? request.ExpectedRevision
                : checked(request.ExpectedRevision + 1);
            if (result.Revision != expectedRevision)
                throw Violation("モジュールが返したrevisionがホスト契約と一致しません。");
        });
        await RequireResponseSizeAsync(result, cancellationToken);
        return result;
    }

    private async Task<T> InvokeAsync<T>(
        ModulePackageRuntimeDescriptor descriptor,
        string operation,
        Func<IMyrialeModule, CancellationToken, ValueTask<T>> invocation,
        CancellationToken cancellationToken)
    {
        ModuleAssemblyLease? lease = null;
        IMyrialeModule module;
        try
        {
            lease = cache.Acquire(descriptor);
            module = lease.CreateModule();
        }
        catch (ModuleRuntimeException)
        {
            lease?.Dispose();
            throw;
        }
        catch (Exception exception)
        {
            lease?.Dispose();
            logger.LogError(exception, "Failed to load module {ModuleId} {Version} {Digest} for {Operation}", descriptor.Identity.ModuleId, descriptor.Identity.Version, descriptor.Identity.Digest, operation);
            throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.InvocationFailed, "モジュールを開始できませんでした。", exception);
        }

        using (lease)
        {
            try
            {
                var result = await invocation(module, cancellationToken);
                if (result is null) throw Violation("モジュールがnullレスポンスを返しました。");
                return result;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (ModuleRuntimeException)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Module {ModuleId} {Version} {Digest} failed during {Operation}", descriptor.Identity.ModuleId, descriptor.Identity.Version, descriptor.Identity.Digest, operation);
                throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.InvocationFailed, "モジュールの処理に失敗しました。", exception);
            }
        }
    }

    private void ValidateValidationResult(ModuleValidationResult result)
    {
        RequireCollection(result.Issues, "validation issues");
        foreach (var issue in result.Issues)
        {
            if (issue is null || string.IsNullOrWhiteSpace(issue.Path) || string.IsNullOrWhiteSpace(issue.Code) || string.IsNullOrWhiteSpace(issue.Message))
                throw Violation("検証結果に不正なissueがあります。");
        }
    }

    private void ValidateExecutionResult(ModuleInitializationResult result, ModuleLimits limits) =>
        ValidateExecutionResult(result.Status, result.State, result.ViewState, result.AvailableActions, result.Outcome, result.Error, limits);

    private void ValidateExecutionResult(ModuleTransitionResult result, ModuleLimits limits) =>
        ValidateExecutionResult(result.Status, result.State, result.ViewState, result.AvailableActions, result.Outcome, result.Error, limits);

    private void ValidateExecutionResult(
        string status,
        JsonElement state,
        JsonElement viewState,
        IReadOnlyList<ModuleAvailableAction> availableActions,
        ModuleOutcome? outcome,
        ModuleError? error,
        ModuleLimits limits)
    {
        RequireJsonSize(state, limits.MaxStateBytes, "returned state");
        RequireDefinedJson(viewState, "view state");
        RequireCollection(availableActions, "available actions");
        var actionIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var action in availableActions)
        {
            if (action is null || string.IsNullOrWhiteSpace(action.Id) || string.IsNullOrWhiteSpace(action.Label) || !actionIds.Add(action.Id))
                throw Violation("利用可能アクションの識別情報が不正です。");
            if (action.RandomValueCount < 0 || action.RandomValueCount > 4_096)
                throw Violation("利用可能アクションのホスト乱数要求が範囲外です。");
        }

        switch (status)
        {
            case ModuleExecutionStatuses.Active when outcome is null && error is null:
                break;
            case ModuleExecutionStatuses.Completed when outcome is not null && error is null:
                ValidateOutcome(outcome, limits);
                break;
            case ModuleExecutionStatuses.Failed when outcome is null && error is not null:
                ValidateError(error);
                break;
            default:
                throw Violation("status、outcome、errorの組み合わせが不正です。");
        }
    }

    private void ValidateOutcome(ModuleOutcome outcome, ModuleLimits limits)
    {
        if (string.IsNullOrWhiteSpace(outcome.Category) || string.IsNullOrWhiteSpace(outcome.Code)
            || string.IsNullOrWhiteSpace(outcome.Title) || string.IsNullOrWhiteSpace(outcome.Summary))
            throw Violation("完了結果の識別情報が不正です。");
        RequireCollection(outcome.PublicFacts, "public facts");
        RequireCollection(outcome.Effects, "effects");
        RequireCollection(outcome.EmittedEvents, "emitted events");
        RequireCollection(outcome.NarrativeHints, "narrative hints");
        RequireCollection(outcome.ForbiddenNarrativeFacts, "forbidden narrative facts");
        if (outcome.Effects.Count > limits.MaxEffects) throw Violation("完了結果のeffect数が上限を超えています。");
        foreach (var effect in outcome.Effects)
        {
            if (effect is null || string.IsNullOrWhiteSpace(effect.Type)) throw Violation("effect typeが空です。");
            RequireDefinedJson(effect.Payload, "effect payload");
        }
        ValidateEvents(outcome.EmittedEvents, "emitted event");
    }

    private static void ValidateError(ModuleError error)
    {
        if (string.IsNullOrWhiteSpace(error.Code) || string.IsNullOrWhiteSpace(error.Message))
            throw Violation("エラーの識別情報が不正です。");
        if (error.Details is { } details) RequireDefinedJson(details, "error details");
    }

    private void ValidateEvents(IReadOnlyList<ModuleEvent> events, string label)
    {
        RequireCollection(events, $"{label}s");
        foreach (var moduleEvent in events)
        {
            if (moduleEvent is null || string.IsNullOrWhiteSpace(moduleEvent.Type)) throw Violation($"{label} typeが空です。");
            RequireDefinedJson(moduleEvent.Payload, $"{label} payload");
        }
    }

    private async Task RequireResponseSizeAsync<T>(T result, CancellationToken cancellationToken)
    {
        try
        {
            await using var output = new SizeLimitedWriteStream(_options.MaxResponseBytes);
            await JsonSerializer.SerializeAsync(output, result, _jsonOptions, cancellationToken);
        }
        catch (ModuleResponseSizeException)
        {
            throw Violation("モジュールレスポンスがホスト上限を超えています。");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (ModuleRuntimeException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.ContractViolation, "モジュールレスポンスをシリアライズできません。", exception);
        }
    }

    private void RequireCollection<T>(IReadOnlyList<T>? values, string label)
    {
        if (values is null) throw Violation($"{label}がnullです。");
        if (values.Count > _options.MaxCollectionItems) throw Violation($"{label}の件数がホスト上限を超えています。");
    }

    private static void ValidateContract(Action validation)
    {
        try
        {
            validation();
        }
        catch (ModuleRuntimeException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.ContractViolation, "モジュールレスポンスがホスト契約に違反しています。", exception);
        }
    }

    private static void RequireRequestId(string requestId)
    {
        if (string.IsNullOrWhiteSpace(requestId)) throw Violation("RequestIdが必要です。");
    }

    private static void RequireRandomValues(IReadOnlyList<uint>? randomValues)
    {
        if (randomValues is null) throw Violation("RandomValuesがnullです。");
    }

    private static void RequireJsonSize(JsonElement value, int maximumBytes, string label)
    {
        RequireDefinedJson(value, label);
        if (JsonSerializer.SerializeToUtf8Bytes(value).Length > maximumBytes)
            throw Violation($"{label}がサイズ上限を超えています。");
    }

    private static void RequireDefinedJson(JsonElement value, string label)
    {
        if (value.ValueKind == JsonValueKind.Undefined) throw Violation($"{label}が未定義です。");
    }

    private static ModuleRuntimeException Violation(string message) =>
        new(ModuleRuntimeErrorCodes.ContractViolation, message);
}

internal sealed class SizeLimitedWriteStream(long maximumBytes) : Stream
{
    private long _written;
    public override bool CanRead => false;
    public override bool CanSeek => false;
    public override bool CanWrite => true;
    public override long Length => _written;
    public override long Position { get => _written; set => throw new NotSupportedException(); }
    public override void Flush() { }
    public override Task FlushAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => Count(count);
    public override void Write(ReadOnlySpan<byte> buffer) => Count(buffer.Length);
    public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Count(buffer.Length);
        return ValueTask.CompletedTask;
    }

    private void Count(int count)
    {
        if (_written + count > maximumBytes) throw new ModuleResponseSizeException();
        _written += count;
    }
}

internal sealed class ModuleResponseSizeException : Exception;
