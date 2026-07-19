using Microsoft.Extensions.Options;

namespace Myriale.Api.Modules.Runtime;

internal sealed class ModuleRuntimeInvocationGate(IOptions<ModuleRuntimeOptions> options) : IDisposable
{
    private readonly SemaphoreSlim _semaphore = new(Math.Max(1, options.Value.MaxConcurrentInvocations));

    public async ValueTask<IDisposable> EnterAsync(CancellationToken cancellationToken)
    {
        await _semaphore.WaitAsync(cancellationToken);
        return new Releaser(_semaphore);
    }

    public void Dispose() => _semaphore.Dispose();

    private sealed class Releaser(SemaphoreSlim semaphore) : IDisposable
    {
        private SemaphoreSlim? _semaphore = semaphore;
        public void Dispose() => Interlocked.Exchange(ref _semaphore, null)?.Release();
    }
}
