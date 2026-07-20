# Module effects and outcomes

## Internal state versus session state

A module owns its internal state while active. It does not directly mutate the session aggregate. A completed initialization or dispatch transition returns the sole authoritative `ModuleOutcome`, containing public facts, ordered effects, events, and narrative guidance.

Effects use a stable string discriminator plus JSON payload. This keeps the SDK transport-neutral and allows unknown future effects to be rejected safely by an older host.

```json
{
  "type": "set-parameter",
  "payload": {
    "targetId": "hero",
    "parameterId": "hp",
    "value": 7
  }
}
```

Transition `uiEvents` are transient instructions for rendering the accepted internal step, such as damage or animation cues. They do not change session state and are not authoritative after completion. Outcome `emittedEvents` are durable scenario-level facts used for history and subsequent scene evaluation.

## Host responsibilities

The host validates that:

- the module declared the required capability;
- referenced scenario and session entities exist;
- values satisfy host-owned constraints;
- inventory and clue operations are legal;
- effects have not already been applied;
- the session revision still matches.

Validated effects are applied in order in the same transaction that completes the future session-owned module turn. Failure responses do not carry effects.

Detached Module Executions persist the complete validated outcome, including ordered effects and durable `emittedEvents`, but do not apply them. Completion at this layer means the module lifecycle produced an authoritative outcome; Session integration must later validate capabilities and apply each effect exactly once before narrative generation.

## Narrative handoff

The next narrative is generated only after the outcome and effects are persisted. AI receives public facts, important events, final public state, narrative hints, and forbidden facts—not the full private module state or diagnostic log.

Concrete effect handlers and session integration are deferred to later changes.
