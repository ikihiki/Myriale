# Module runtime

## Turn model

A session contains narrative turns and module turns. A module turn owns execution until it completes; battle rounds and other internal steps do not create additional session turns. Module state is persisted after every accepted action so execution can resume after navigation or disconnection.

## Runtime boundary

The session engine calls an internal `IModuleRuntime`. The first implementation will adapt this boundary to `IMyrialeModule` in a trusted .NET assembly. A future WebAssembly implementation can use the same JSON-compatible requests and responses.

```text
Session engine
  -> IModuleRuntime
       -> DotNetModuleRuntime
       -> WebAssemblyModuleRuntime (future)
```

Modules receive immutable configuration, context, state, action, logical revision, and host-provided random values. They do not receive `DbContext`, `HttpContext`, service providers, credentials, file paths, or arbitrary callbacks.

## Lifecycle

1. `ValidateConfigAsync` validates authoring configuration.
2. `InitializeAsync` creates module state, view state, and available actions. An immediate module may complete here with an outcome.
3. `DispatchAsync` applies one player intent and returns the next module state. A completed transition carries the sole authoritative outcome.

Active transitions may carry transient `uiEvents` for rendering the accepted step. A completed outcome may carry durable `emittedEvents` for scenario progression; the two collections have separate semantics and are never interchangeable.

The host validates every response before persistence. Request IDs provide idempotency and expected revisions prevent stale writes.

## .NET runtime implementation

The API resolves modules by the exact tuple of module ID, semantic version, and SHA-256 digest. Runtime calls require the package to remain enabled and installed. Before execution, the host verifies the canonical package digest and confirms that the expanded `module.dll` matches the canonical DLL or ZIP entry.

`DotNetModuleRuntime` uses a digest-keyed, bounded cache of collectible `AssemblyLoadContext` instances. The cache retains the entry-point constructor but creates a fresh `IMyrialeModule` instance for every invocation so mutable module objects cannot leak state between sessions. Cache entries use leases and are unloaded only after active calls finish.

The host enforces configuration, state, action, context, effect-count, and total-response limits. It also validates lifecycle status, outcome/error combinations, action and event identifiers, and dispatch revisions before results can reach persistence. Accepted active or completed dispatches advance the revision by exactly one; failed transitions retain the expected revision.

Calls are bounded by a host-wide concurrency gate, including package integrity checks, assembly loading, invocation, response validation, and serialization. Caller cancellation is forwarded to modules, but the in-process runtime does not advertise a hard timeout: trusted code can ignore cancellation or block in constructors and static initializers. Untrusted modules therefore require a future worker process or container boundary.

## Deferred work

Worker-process isolation, execution persistence, random-number recording, package-cache invalidation across API processes, and recovery behavior remain deferred.
