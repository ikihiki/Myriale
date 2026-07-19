using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.Extensions.Options;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

internal sealed class ModuleAssemblyCache(IOptions<ModuleRuntimeOptions> options, ILogger<ModuleAssemblyCache> logger) : IDisposable
{
    private readonly ConcurrentDictionary<string, Lazy<ModuleCacheEntry>> _entries = new(StringComparer.Ordinal);
    private readonly object _capacitySync = new();
    private readonly int _maximumEntries = Math.Max(1, options.Value.MaxCachedAssemblies);
    private bool _disposed;

    public ModuleAssemblyLease Acquire(ModulePackageRuntimeDescriptor descriptor)
    {
        lock (_capacitySync)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            EnsureCapacity(descriptor.Identity.Digest);
            var lazy = _entries.GetOrAdd(descriptor.Identity.Digest, _ =>
                new Lazy<ModuleCacheEntry>(() => Load(descriptor), LazyThreadSafetyMode.ExecutionAndPublication));
            try
            {
                return lazy.Value.Acquire();
            }
            catch
            {
                if (_entries.TryRemove(new KeyValuePair<string, Lazy<ModuleCacheEntry>>(descriptor.Identity.Digest, lazy))
                    && lazy.IsValueCreated)
                    lazy.Value.Retire();
                throw;
            }
        }
    }

    private void EnsureCapacity(string requestedDigest)
    {
        if (_entries.ContainsKey(requestedDigest) || _entries.Count < _maximumEntries) return;
        foreach (var candidate in _entries)
        {
            if (!candidate.Value.IsValueCreated || !candidate.Value.Value.IsIdle) continue;
            if (_entries.TryRemove(new KeyValuePair<string, Lazy<ModuleCacheEntry>>(candidate.Key, candidate.Value)))
            {
                candidate.Value.Value.Retire();
                return;
            }
        }
        throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.CapacityExceeded, "モジュールランタイムのキャッシュ上限に達しました。");
    }

    private static ModuleCacheEntry Load(ModulePackageRuntimeDescriptor descriptor)
    {
        var loadContext = new ModuleAssemblyLoadContext();
        try
        {
            using var stream = new MemoryStream(descriptor.AssemblyBytes, writable: false);
            var assembly = loadContext.LoadFromStream(stream);
            var attribute = assembly.GetCustomAttributes<MyrialeModuleEntryPointAttribute>().SingleOrDefault()
                ?? throw Violation("MyrialeModuleEntryPoint属性がありません。");
            var type = attribute.ModuleType;
            if (type.Assembly != assembly || !type.IsPublic || type.IsAbstract || !typeof(IMyrialeModule).IsAssignableFrom(type))
                throw Violation("モジュールエントリーポイントが不正です。");
            var constructor = type.GetConstructor(Type.EmptyTypes)
                ?? throw Violation("モジュールにpublicな引数なしコンストラクターがありません。");
            var probe = (IMyrialeModule)constructor.Invoke(null);
            var manifest = probe.GetManifest();
            if (manifest.Id != descriptor.Identity.ModuleId
                || manifest.Version != descriptor.Identity.Version
                || manifest.ContractVersion != descriptor.Manifest.ContractVersion)
                throw Violation("実行時マニフェストがカタログと一致しません。");
            return new ModuleCacheEntry(loadContext, constructor);
        }
        catch
        {
            loadContext.Unload();
            throw;
        }
    }

    public void Dispose()
    {
        lock (_capacitySync)
        {
            if (_disposed) return;
            _disposed = true;
            foreach (var lazy in _entries.Values)
            {
                if (!lazy.IsValueCreated) continue;
                try { lazy.Value.Retire(); }
                catch (Exception exception) { logger.LogWarning(exception, "Failed to retire a module assembly cache entry"); }
            }
            _entries.Clear();
        }
    }

    private static ModuleRuntimeException Violation(string message) =>
        new(ModuleRuntimeErrorCodes.ContractViolation, message);
}

internal sealed class ModuleCacheEntry(ModuleAssemblyLoadContext loadContext, ConstructorInfo constructor)
{
    private readonly object _sync = new();
    private int _activeLeases;
    private bool _retired;
    private bool _unloaded;

    public bool IsIdle
    {
        get { lock (_sync) return _activeLeases == 0 && !_retired; }
    }

    public ModuleAssemblyLease Acquire()
    {
        lock (_sync)
        {
            if (_retired) throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.PackageUnavailable, "モジュールキャッシュは終了処理中です。");
            _activeLeases++;
            return new ModuleAssemblyLease(this);
        }
    }

    public IMyrialeModule CreateModule() => (IMyrialeModule)constructor.Invoke(null);

    public void Retire()
    {
        lock (_sync)
        {
            _retired = true;
            TryUnload();
        }
    }

    public void Release()
    {
        lock (_sync)
        {
            _activeLeases--;
            TryUnload();
        }
    }

    private void TryUnload()
    {
        if (!_retired || _activeLeases != 0 || _unloaded) return;
        _unloaded = true;
        loadContext.Unload();
    }
}

internal sealed class ModuleAssemblyLease(ModuleCacheEntry entry) : IDisposable
{
    private ModuleCacheEntry? _entry = entry;
    public IMyrialeModule CreateModule() => (_entry ?? throw new ObjectDisposedException(nameof(ModuleAssemblyLease))).CreateModule();
    public void Dispose() => Interlocked.Exchange(ref _entry, null)?.Release();
}
