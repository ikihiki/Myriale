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

## Deferred work

Assembly loading, runtime timeouts, worker-process isolation, execution persistence, random-number recording, and recovery behavior are intentionally outside the SDK contract change.
