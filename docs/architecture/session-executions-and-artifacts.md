# Session executions and artifacts

## Boundary

Session processing follows five durable concepts:

> Input is a fact. Execution is a process. Action step is the state transition audit. Artifact is a versioned result. Turn is published narrative canon.

- `SessionPlayerInput` is immutable after acceptance.
- `SessionExecution` owns the mutable `scenario-turn` lifecycle, lease, retry schedule, and terminal status.
- `SessionExecutionAttempt` is append-only worker/provider diagnostics.
- `SessionRuleActionStep` links one input to its immutable snapshot, decision, configured result/extension, effect commit, post-state, and narrative checkpoint.
- `SessionArtifact` stores explicitly versioned envelopes for durable intermediate/final results.
- `SessionTurn` contains only successfully published narrative canon; operational errors are not Turns.

Note and image work may retain separate execution kinds and domain records, but they do not participate in the Object-rule state authority chain.

## Scenario-turn checkpoints

One accepted input queues one `scenario-turn` execution with these durable checkpoints:

1. **accepted** — fence Session head/revision and load the pinned Scenario definition, Location, Objects, and private Object states.
2. **enumerated** — evaluate availability/result conditions and persist one immutable public Object/action snapshot plus pre-state revisions.
3. **selected** — obtain and validate exactly `{objectId, actionId, arguments}` against that snapshot and persist one canonical decision.
4. **resolved** — recheck current revisions/conditions and identify the configured Object result and optional exact extension binding.
5. **extension-completed** — when required, persist the canonical extension invocation/result using frozen inputs and random receipt.
6. **state-committed** — atomically persist ordered effects, post-state revisions/placement, facts/events/hints, module state, and a unique commit receipt.
7. **narrative-published** — generate from the stored public post-state, persist the narrative artifact, and append one canonical Turn.

Public stages may be projected as `loading-world`, `enumerating-actions`, `selecting-action`, `applying-rules`, `running-extension`, `generating-narrative`, and a terminal status. Public payloads expose safe status and projections, not hidden rules, module bindings, private state, randomness, or diagnostics.

## Idempotency, leases, and fencing

Input acceptance computes a normalized payload hash and creates the input/execution atomically. `(SessionId, RequestId)` and `(SessionId, IdempotencyKey)` are unique. Same-key/same-payload retries return the existing resources; changed payloads are rejected.

Workers claim queued, retry-wait, or expired-running work with a bounded lease token and fencing revision. Every checkpoint publication verifies ownership of the current lease and applicable Session/Object revisions. A late worker cannot overwrite a replacement worker or commit from a stale action snapshot.

Database uniqueness ensures one canonical snapshot, decision, extension invocation, state commit, and narrative per action step. Checkpoint completion is recorded in the same transaction as its artifact/domain mutation so recovery can skip completed work safely.

## Retry boundaries

Retries are checkpoint-aware:

- before **enumerated**, loading/enumeration may run again against the same accepted fence;
- after **enumerated**, action-decision retries reuse only the same immutable snapshot while it remains current;
- stale revisions invalidate the snapshot before mutation and restart at fresh enumeration;
- after **selected**, the canonical decision is reused rather than asking for a different action;
- after **extension-completed**, the stored outcome/random receipt is reused;
- after **state-committed**, neither rules, AI selection, random generation, extension invocation, nor effects may run again;
- narrative failures retry only post-state narrative generation/publication from stored public post-state and facts.

A Session can therefore report **state committed, narrative pending/failed** without implying rollback. Cancellation or supersession before commit creates no Turn and no state transition. Once state is committed, finalization cannot undo it; it either publishes the unique narrative later or exposes a terminal narrative error for retry.

## Artifacts and contract versions

New incompatible Scenario rule, action snapshot/decision/action-step/post-state narrative, execution payload, Module SDK, and Module UI shapes begin at schema `1` or a `.v1` identifier such as `rule-action-decision.v1` and `post-state-narrative.v1`. Old execution, dialogue, progression, and handoff wire shapes are not accepted and have no compatibility adapter.

This baseline reset does not reset database revisions/sequences, SHA-256 semantics, module package digests, dependency versions, toolchain versions, application/deployment versions, or telemetry schema versions unrelated to the contract.

Each artifact records its schema explicitly rather than relying only on a generic `kind` string. Audit data includes the pinned Scenario definition version, snapshot ID/revisions, provider metadata, selected rule/result, effect schema version, exact extension identity when used, ordered effects, random receipt, and pre/post revisions.

## Diagnostics, telemetry, and retention

Development-only diagnostics may expose bounded, redacted worker/provider timing and validation details to authorized owners. Production omits diagnostic payloads. Credentials, private Object/module state, hidden rule branches, package configuration, and player secrets remain forbidden in every environment.

Telemetry uses bounded labels such as execution kind, checkpoint, status, provider/model, and normalized error code. Session/Input/Execution/Object IDs and player text are not metric labels. Export failure cannot affect domain commits.

Inputs, action-step audit records, committed artifacts, and published Turns follow Session retention policy. Dismissal is UI folding metadata, never deletion of authority records.
