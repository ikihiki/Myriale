using System.Reflection;
using Myriale.ModuleSdk;

namespace Myriale.Api.Modules.Runtime;

internal sealed class ModuleAssemblyCache : IDisposable
{
    private readonly object _capacitySync = new();
    private bool _disposed;

    public ModuleAssemblyLease Acquire(ModulePackageRuntimeDescriptor descriptor)
    {
        lock (_capacitySync)
        {
            ObjectDisposedException.ThrowIf(_disposed, this);
            var entry = Load(descriptor);
            return entry.Acquire(retireOnRelease: true);
        }
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
            _disposed = true;
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

    public ModuleAssemblyLease Acquire(bool retireOnRelease = false)
    {
        lock (_sync)
        {
            if (_retired) throw new ModuleRuntimeException(ModuleRuntimeErrorCodes.PackageUnavailable, "モジュールキャッシュは終了処理中です。");
            _activeLeases++;
            return new ModuleAssemblyLease(this, retireOnRelease);
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

internal sealed class ModuleAssemblyLease(ModuleCacheEntry entry, bool retireOnRelease = false) : IDisposable
{
    private ModuleCacheEntry? _entry = entry;
    public IMyrialeModule CreateModule() => (_entry ?? throw new ObjectDisposedException(nameof(ModuleAssemblyLease))).CreateModule();
    public void Dispose()
    {
        var current = Interlocked.Exchange(ref _entry, null);
        if (current is null) return;
        if (retireOnRelease) current.Retire();
        current.Release();
    }
}
