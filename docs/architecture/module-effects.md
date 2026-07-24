# Object effects and extension outcomes

## State authority

Configured Object action results are the source of state transitions. A result consists of a versioned condition AST, deterministic priority, an ordered effect batch, and optionally one exact extension binding. AI selects an already enumerated `{objectId, actionId, arguments}`; it cannot return effects, state patches, destinations, or module identities.

When multiple rules exist for the same Object state/action, the evaluator chooses the first satisfied result by priority. Equal-priority ambiguity and an enabled state/action without a deterministic result are publish-blocking errors. Runtime never chooses a branch by undocumented randomness.

## Declarative effect vocabulary

Baseline schema `1` supports typed effects such as:

- `set-state` and `increment-state` on schema-valid Object state paths;
- `append-set` / `remove-set` for bounded set-like properties;
- `move-object` to one valid Location (an Object has one current placement);
- `set-session-flag`;
- `emit-fact` and `emit-event`;
- `add-narrative-hint` and `forbid-narrative-fact`;
- `complete-session`.

Conditions and effects are versioned JSON ASTs, not author-provided scripts or arbitrary JSON Patch. Allowed roots and operators are explicit. References must belong to the pinned Scenario definition, and private values are not copied into public facts or hints.

## Validation and atomic application

Before mutation, the host:

1. verifies the action belongs to the immutable snapshot and arguments match its schema;
2. rechecks Object/Session revisions, location visibility, availability, and result conditions;
3. resolves exactly one configured result;
4. validates every effect target, path, value, and cross-reference against pinned schemas;
5. validates any extension outcome and capability limits;
6. stages the complete ordered batch;
7. commits Object state/placement, Session state, module state, random receipt, facts/events/hints, revisions, and one unique application receipt atomically.

A failure in any item rejects the whole batch. No partial effects become visible. Replaying the same action step returns the committed receipt rather than applying the batch again.

`clarify` and `no-op` are system-owned actions for questions or inputs that should not mutate world state. They still produce an auditable selected/applied checkpoint and a narrative based on the unchanged post-state.

## Extension outcome limits

An extension may calculate bounded mechanics and return only contract-approved public view/outcome data and host-supported effect proposals. It cannot directly persist data, target unrelated Objects, select another extension, change the pinned Scenario definition, or publish narrative. The host validates its outcome using the same effect rules and commit boundary as a declarative result.

Transient extension `uiEvents` may animate an accepted interactive step but do not alter Scenario state and are not narrative facts. Durable facts/events/hints enter the action-step commit only after host validation.

## Post-state narrative

After the state commit, narrative generation receives:

- accepted input and the public selected Object/action;
- current Location and public Object state/placement after effects;
- authoritative public facts/events and narrative hints;
- forbidden facts;
- safe public extension view/outcome, if used.

The Object Type public projection is applied before this payload is built. Narrative generation never receives private Object state, hidden branches, effect programs, module configuration/state, or random receipts. Generated prose cannot modify committed facts. Provider or validation failure leaves the committed action intact and retries from the stored post-state only.
