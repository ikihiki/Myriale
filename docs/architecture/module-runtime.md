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

## Execution and Session Turn persistence

The API retains an authenticated detached Module Execution seam for preview and tooling. Each execution is owner-scoped and pins module ID, semantic version, package digest, contract version, configuration/state schema versions, configuration, and context. State, view state, available actions, revision, and a completed outcome are persisted after every accepted lifecycle step.

A play `Session` is owner-scoped to one existing scenario. A `SessionTurn` has a stable position and is currently either a Module Turn owning exactly one Module Execution or a Narrative Turn linked to the completed Module Turn that produced it. The session's next-position counter is an optimistic concurrency token, so competing API processes retry allocation instead of producing duplicate positions. Creating a Module Turn inserts its turn, execution, and initialization receipt atomically; every internal dispatch continues to update that same execution and never creates another turn. Detached executions remain valid and have no Session Turn.

Initialization and dispatch request IDs are recorded as durable receipts. Receipts store semantic request fingerprints, host-generated random values, actions, and exact responses. Session ownership participates in initialization fingerprints, so a request ID cannot be replayed into a different session. Matching retries replay a completed response; a retry of a pending request reinvokes the pure module operation with the same snapshots and random values. Revision concurrency ensures that at most one competing action becomes the accepted state transition.

A module-declared failed dispatch does not mutate the execution snapshot or revision. Its transient error and `uiEvents` are retained in the request receipt for replay. A failed initialization is terminal. Ordinary API responses expose view state and available actions but not private module state, configuration, context, or recorded randomness.

Sessions currently reference the scenario identity rather than an immutable published scenario version. The current application startup also recreates the database. These records are database-backed within the running application environment, but scenario-version pinning and restart durability are intentionally not claimed yet.

## Deferred work

Additional effect vocabularies, player-input narrative turns, durable emitted-event processing, scenario-version snapshots, real AI provider selection, background generation, worker-process isolation, package-cache invalidation across API processes, and retained database lifecycle management remain deferred.
