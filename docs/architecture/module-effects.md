# Module effects and outcomes

## Internal state versus session state

A module owns its internal state while active. It does not directly mutate the session aggregate. A completed initialization or dispatch transition returns the sole authoritative `ModuleOutcome`, containing public facts, ordered effects, events, and narrative guidance.

Effects use a stable string discriminator plus JSON payload. This keeps the SDK transport-neutral and allows unknown future effects to be rejected safely by an older host.

The first host-owned effect vocabulary contains `set-flag`:

```json
{
  "type": "set-flag",
  "payload": {
    "flagId": "boss-defeated",
    "value": true
  }
}
```

A package must declare the `emit:session-effects` capability before a Session-owned execution may emit effects. The capability list is snapshotted onto the execution at initialization, so later catalog changes cannot rewrite authorization for an in-flight turn. Flag IDs are bounded host identifiers, values are Boolean, and unknown effect types or payload properties are rejected. Parameter, inventory, clue, and arbitrary JSON-patch effects remain unsupported until their host domain schemas exist.

Transition `uiEvents` are transient instructions for rendering the accepted internal step, such as damage or animation cues. They do not change session state and are not authoritative after completion. Outcome `emittedEvents` are durable scenario-level facts used for history and subsequent scene evaluation.

## Host responsibilities

The host validates that:

- the module declared the required capability;
- referenced scenario and session entities exist;
- values satisfy host-owned constraints;
- inventory and clue operations are legal;
- effects have not already been applied;
- the session revision still matches.

For a Session-owned execution, the host validates the complete ordered batch before staging any mutation. It records the expected Session State revision with the pending module request, applies the batch in order, increments the state revision once, and inserts a unique `ModuleOutcomeApplication` receipt. The execution completion, request completion, state update, and application receipt are committed by one `SaveChanges` transaction. Replays return the stored response without applying effects again.

Detached Module Executions continue to persist outcomes without applying effects. A stale Session revision returns `session_revision_conflict`; unsupported effects, malformed payloads, and missing capabilities are rejected without changing an active execution or Session State. Failed initialization is terminal, while a rejected dispatch retains its prior active snapshot.

## Narrative handoff

When a Session-owned Module Turn completes, the host automatically prepares a durable Narrative handoff in the same transaction that commits the authoritative outcome, request receipt, effects, and `ModuleOutcomeApplication`. No public API starts the handoff. After that transaction commits and the module invocation gate is released, the host claims the handoff with a bounded lease and invokes the Narrative generator. Immediate-completion initialization and completed dispatch follow the same lifecycle.

The handoff records `pending`, `failed`, or `completed` state. Provider failures leave the completed Module Turn and applied effects untouched; replaying the matching module request retries a retryable failed handoff. Expired leases allow another API process to recover work after a crash. The final append revalidates the frozen post-effect Session State revision and Session turn position, and updates both optimistic-concurrency boundaries before inserting one uniquely linked `narrative` Session Turn.

AI receives only scenario guidance, public facts, durable emitted events, final public module view state, post-effect flags, narrative hints, and forbidden facts. Private module state, configuration, context, randomness, request receipts, diagnostics, capabilities, leases, and transient UI events are excluded. A unique source-turn relationship guarantees that only one Narrative Turn is persisted. Session GET responses expose only safe handoff status and error information; they do not trigger generation.

Durable `emittedEvents` processing beyond prompt projection, scenario-defined flag catalogs, additional effect handlers, player-input narrative turns, real provider selection, and background generation are deferred to later changes.
