# Session events and object-rule state

## Authority chain

Every accepted player input is processed through one causal chain:

```text
Input
  -> pinned Scenario definition + current Object state
  -> immutable public Object/action snapshot
  -> AI decision { objectId, actionId, arguments }
  -> configured Object result or bound extension
  -> committed post-state
  -> narrative generated from that post-state
```

Only the pinned Scenario definition, Session runtime state, rule evaluator, effect applier, and a bound extension outcome can change state. The action-selection AI chooses only from enumerated actions. Narrative generation describes committed facts and has no field that can select a module, advance progression, or mutate state.

## Immutable facts and mutable state

Immutable facts and audit records:

- `SessionPlayerInput`: accepted text, idempotency identity, and observed Session head/revision.
- `SessionRuleActionStep`: the action snapshot, accepted decision, selected rule/result, applied effects, extension reference, pre/post revisions, public post-state, and checkpoint receipts.
- `SessionTurn`: one published canonical narrative and its predecessor.
- versioned `SessionArtifact` records for action snapshots, decisions, effect commits, extension outcomes, and post-state narrative.

Mutable Session-owned state:

- `Session.HeadTurnId` and `Session.Revision` for canonical publication and optimistic concurrency.
- pinned `Session.ScenarioDefinitionVersionId` and current `LocationId`.
- `SessionObjectState`: private state JSON, current placement, and revision for each pinned Object.
- `SessionState`: host-owned flags/completion state and revision.
- `ModuleExecution`: private state and revision only while a configured extension action is active.
- `SessionExecution`: durable processing status, lease, retry scheduling, and checkpoint progress.

Published Scenario definitions are immutable. Starting a Session pins one published definition version and initializes Object state and placement from that version. Later authoring or publishing creates a new definition version and affects only new Sessions.

## Public and private projections

An Object Type defines its strict state schema, default state, public projection, and action interfaces. An Object supplies its initial location/state override and conditional action results.

The public action snapshot contains only:

- current Location's public description;
- Objects in the current Location plus explicitly global Objects;
- each Object's whitelisted public state;
- enabled or safely explainable disabled action descriptors;
- action argument schemas and relevant state revisions;
- system-owned `clarify` and `no-op` choices when applicable.

It excludes private Object properties, Objects in other Locations, hidden result branches, condition/effect ASTs, extension bindings/configuration, private module state, and random values. Player/session responses and narrative prompts apply the same safe projection.

## Input lifecycle and concurrency

`POST /api/sessions/{sessionId}/inputs` atomically stores one `SessionPlayerInput` and queues one `scenario-turn` execution. Request and idempotency keys are unique per Session; a replay with the same payload returns the same work, while key reuse with a different payload is rejected.

Acceptance fences the observed Session head/revision. Before mutation, the engine also compares the Object and Session revisions captured by the action snapshot with current revisions and re-evaluates action availability. A stale snapshot is rejected before effects or extension dispatch; processing restarts from enumeration against fresh state rather than asking the AI to reuse the old snapshot.

An input is:

- **pending** while its canonical scenario-turn has not reached a terminal state;
- **completed** when its canonical narrative Turn has been published;
- **state-committed / narrative-pending** when action effects are durable but narrative publication still needs retry;
- **superseded or failed** when processing terminates without a canonical Turn.

## Commit and publication ordering

The rule/effect commit is the state authority boundary. The complete declarative effect batch and any bound extension result are validated before mutation. Object state, placement, Session state, module state, random receipt, facts/events/hints, and their before/after revisions are committed atomically with a unique effect-commit receipt.

Narrative generation starts only after that commit. Its input is the stored public post-state and authoritative facts/events/hints/forbidden facts. A narrative failure never rolls back committed state. Retrying narrative publication reuses the committed post-state and does not repeat enumeration, AI selection, random generation, extension invocation, or effects.

`Session.HeadTurnId` and `SessionTurn.PreviousTurnId` order published canon. Turn append uses compare-and-swap on `Session.Revision`, and unique input/action-step/source constraints prevent duplicate canonical narratives.

## Revision meanings

Revisions remain monotonic concurrency values and are not reset by the new contract baseline:

- `Session.Revision`: input acceptance and canonical Turn publication.
- `SessionObjectState.Revision`: private Object state or placement changes.
- `SessionState.Revision`: host-owned flags/completion changes.
- `ModuleExecution.Revision`: active extension state-machine changes.
- execution/lease revisions: worker fencing only.

Contract and artifact schemas restart at `1` / `.v1`; revisions, sequences, SHA-256 digests, dependency versions, and application/toolchain versions do not restart.
