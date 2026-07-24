# Extension module runtime

## Purpose and boundary

The Object rule engine is the default execution mechanism. Declarative Object action results handle state updates, counters, set membership, placement moves, Session flags, facts/events/hints, forbidden facts, and Session completion. Extension modules are reserved for bounded mechanics that need trusted code or a dedicated interactive UI, such as a multi-round battle.

An extension is never selected by AI or by arbitrary client input. A published Object action result pins the exact module ID, semantic version, SHA-256 package digest, configuration, contract version, and schema versions. After an enumerated action is selected, the rule engine resolves that binding and is the only component allowed to initialize or dispatch it.

```text
Pinned Object action result
  -> rule engine validates selected Object/action/arguments
  -> exact extension binding
  -> IModuleRuntime
       -> trusted DotNetModuleRuntime
       -> isolated worker/runtime (future)
```

## Contract baseline

The incompatible Object-action extension contract starts again at contract version `"1"`; package configuration/state schemas start at `1`, and rebuilt first-party/test packages start at `1.0.0` with digests calculated from their new contents. No adapter accepts the previous module/progression contracts, and existing active executions are not migrated implicitly.

Package digests, execution revisions, receipt sequences, dependency versions, and toolchain/application versions retain their normal meanings and are not reset.

## Request authority and privacy

Modules receive only immutable, JSON-compatible inputs required by the bound action:

- pinned Object/action/result identity and public action context;
- validated arguments;
- immutable bound configuration;
- current private module state and logical revision;
- explicitly allowed Object/Session context;
- host-generated random values and request identity.

Modules do not receive `DbContext`, `HttpContext`, service providers, credentials, filesystem paths, arbitrary callbacks, unrelated Objects, or authority to select another module. They cannot directly mutate the database, choose a Scenario destination, change an unbound Object, publish narrative, or manufacture host randomness.

The host exposes only the module's safe public view/outcome to players and narrative generation. Private state, configuration, binding identity, package details, random receipts, diagnostics, and hidden effects stay server-side.

## Lifecycle

1. `ValidateConfigAsync` validates authoring-time configuration for the exact package.
2. `InitializeAsync` creates module state, public view, and available manual actions. It may complete immediately.
3. `DispatchAsync` accepts one host-authorized action and expected revision, then returns an active or completed transition.
4. A completed transition returns a bounded extension outcome. The host validates and translates that outcome into the Object action step's atomic effect commit.

An active transition may expose transient `uiEvents` and safe available actions. These render the current mechanic but are not durable Scenario facts. A completed outcome may provide public facts/events/hints and host-supported effects; the host remains responsible for validating targets, paths, counts, sizes, revisions, and capabilities.

## Manual UI actions

A Module UI is displayed only when the current immutable action snapshot exposes an Object Type action whose visibility is `manual-ui` and whose selected Object result binds the extension. The UI may dispatch only the available action IDs for that active execution and expected revision.

The browser cannot create a play-session Module Execution, choose a module/version/digest, replace the Object/action binding, or dispatch an extension for an Object action that was not enumerated. Detached owner-scoped preview/tooling executions may exist, but they cannot mutate a play Session.

## Integrity, idempotency, and recovery

The runtime resolves the exact ID/version/digest tuple, verifies package integrity, and applies host-wide request/response limits. Trusted .NET packages run in a fresh collectible `AssemblyLoadContext` per invocation; durable state must cross the explicit contract. In-process code is not a hard security boundary, so untrusted packages require a future worker process or container.

Initialization and dispatch use durable request receipts containing semantic fingerprints, input snapshots, host random values, and exact responses. Matching retries replay completed responses. A recovered pending invocation uses the same frozen inputs and randomness; revision and unique-receipt constraints ensure only one result becomes canonical.

Extension completion alone does not publish narrative. The rule engine commits the extension outcome with Object/Session/module state and the action-step checkpoint. Post-state narrative is generated afterward. If narrative fails, retry never reinitializes or redispatches the extension.
