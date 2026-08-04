# Session executions and artifacts

## Boundary

Session processing follows five durable concepts:

> Input is a fact. Execution is a process. Action step is the state transition audit. Artifact is a versioned result. Turn is published narrative canon.

- `SessionPlayerInput` is immutable after acceptance.
- `SessionExecution` owns the mutable `scenario-turn` lifecycle, lease, retry schedule, and terminal status.
- `SessionExecutionAttempt` owns a typed running-to-terminal lifecycle and bounded worker/provider diagnostics; lifecycle and diagnostic setters are nonpublic.
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

The durable `ScenarioTurnStage` sequence is `snapshot` → `decision` → `resolution` → optional `extension` → `effect-commit` → `narrative-publish` → `completed`. `SessionRuleActionStep` owns these transitions through factories and behavior methods; lifecycle fields are not publicly settable. Public payloads expose safe status and projections, not hidden rules, module bindings, private state, randomness, or diagnostics.

## Idempotency, leases, and fencing

Input acceptance computes a normalized payload hash and creates the input/execution atomically. `(SessionId, RequestId)` and `(SessionId, IdempotencyKey)` are unique. Same-key/same-payload retries return the existing resources; changed payloads are rejected.

Workers use `ISessionExecutionOperationsRepository` to atomically claim queued, retry-wait, or expired-running work with a bounded lease token and fencing revision. PostgreSQL selection remains `FOR UPDATE SKIP LOCKED`. Claim context loading supplies kind, Session ID, and trace parent without giving the worker an `ApplicationDbContext`; heartbeat and finalization classify stale claims, revision conflicts, and transient database conflicts separately. Every checkpoint publication verifies ownership of the current lease and applicable Session/Object revisions. A late worker cannot overwrite a replacement worker or commit from a stale action snapshot.

Database uniqueness ensures one canonical snapshot, decision, extension invocation, state commit, and narrative per action step. Checkpoint completion is recorded in the same transaction as its artifact/domain mutation so recovery can skip completed work safely.

## Scenario-turn application orchestration

`ScenarioTurnExecutionHandler` is only the `ISessionExecutionHandler` adapter and has no `ApplicationDbContext` dependency. `ScenarioTurnExecutionOrchestrator` coordinates focused ports for the world snapshot query, action-step repository, AI decision, AI interaction recording, rule resolution, effect commit unit of work, typed artifact writing, narrative generation/publication, and Session Turn append.

Every external or durable checkpoint is fenced by execution ID, lease token, and lease-generation revision. Decision recovery reads the already-recorded canonical decision, extension retries reuse the action-step invocation ID, effect commit is guarded by the action-step receipt plus artifact uniqueness, and narrative publication is guarded by the Player Input/Turn and `(ExecutionId, Kind)` artifact constraints. Effect and narrative persistence each run in a transaction; a losing concurrent publisher observes the winning Turn instead of appending a second one.

## Module-handoff application orchestration

Completed Module outcomes enqueue through `EnqueueModuleHandoffCommand` and `IModuleHandoffEnqueuePort`. The command accepts only a completed attached Module Execution, resolves the pinned narrative profile, and the EF port validates the source Module Turn, Session head, and execution link before adding the `module-handoff:{ModuleExecutionId}` queue item. `(SessionId, IdempotencyKey)` remains the database authority for simultaneous enqueue attempts.

`ModuleHandoffExecutionHandler` is a thin `ISessionExecutionHandler` adapter with no `ApplicationDbContext`. Its orchestrator uses an immutable source snapshot query, pure causality validator, public-only request builder, AI interaction recorder, typed artifact writer, Session handoff append port, publish unit of work, and Progression commands. Private Module configuration/context/state, capabilities, random receipts, and package paths never enter `NarrativeHandoffRequest`.

Publication rechecks lease token/generation plus accepted Session head/revision. The Turn append, `narrative-text` artifact, optional narrative signal, progression receipt, and node movement commit in one transaction. `SourceModuleTurnId` and `(ExecutionId, Kind)` uniqueness select one concurrent winner; a loser or retry that observes the existing Turn returns success without generating or appending a second canonical result. Session advancement returns `superseded`. The operations repository is the sole SessionExecution lifecycle closer. After commit, `IProgressionReceiptCommand` claims and starts any receipt through the completed Progression Runtime.

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

## Typed artifact domain slice

`SessionArtifact` is a closed artifact envelope. `SessionArtifactKind`, `SessionArtifactStatus`, and `SessionArtifactSchema` use explicit EF/wire conversion; unknown database values are rejected. Supported pairs are `rule-action-step` / `rule-action-step.v1`, `post-state-narrative` / `post-state-narrative.v1`, `narrative-text` / `narrative-text.v1`, `note-patch` / `note-patch.v1`, and `image` / `image.v1`.

JSON artifacts are created only from typed payload records and persist `PayloadJson`; image artifacts are storage-backed and persist only `StorageKey`. The two backing modes are mutually exclusive in both aggregate validation and database check constraints. Draft → validated → committed transitions calculate or verify SHA-256, set validation/commit timestamps, and reject re-validation or re-commit. Identity, ownership, kind/schema/status, backing, checksum, and timestamps have no public setters. The former arbitrary `Kind` + `ContentJson` initializer contract is removed.

All producers use `SessionArtifact` factories and `ISessionArtifactWriter`. Image attachment is orchestrated by `AttachSessionImageUseCase` through focused persistence and storage ports. It writes a unique final object, commits the artifact/image rows under the `(ExecutionId, Kind)` database constraint, translates a simultaneous loser to conflict, and deletes that loser's object as compensation. `GetSessionImageMediaQuery` enforces owner scope before opening storage; a retention deletion racing the open resolves to either a readable stream or not found.

Session detail obtains artifact envelopes and artifact activity items through `GetSessionArtifactActivityQuery`, which owns the owner-scoped, no-tracking projection. Artifact HTTP endpoints contain no EF dependency. Retention reconciliation deletes the expired database artifact first, then its object; failed object cleanup becomes an orphan handled after the configured grace period. Missing referenced objects remain reported for operational repair.

## Diagnostics, telemetry, and retention

Development-only diagnostics may expose bounded, redacted worker/provider timing and validation details to authorized owners. Production omits diagnostic payloads. Credentials, private Object/module state, hidden rule branches, package configuration, and player secrets remain forbidden in every environment.

Telemetry uses bounded labels such as execution kind, checkpoint, status, provider/model, and normalized error code. Session/Input/Execution/Object IDs and player text are not metric labels. Export failure cannot affect domain commits.

Inputs, action-step audit records, committed artifacts, and published Turns follow Session retention policy. Dismissal is UI folding metadata, never deletion of authority records.

## Session Execution domain slice

`SessionExecution` is the lifecycle aggregate for one queued unit of session work. Core closed discriminators (`Kind`, `Status`, `TriggerType`, and `PublishPolicy`) are native enums in the domain model; EF value conversions and response projection preserve the existing lowercase/kebab-case database and HTTP values.

User-driven lifecycle changes enter through application use cases (`Get`, `Retry`, `Cancel`, and `Dismiss`) and a restricted repository abstraction. HTTP endpoints only translate authentication and use-case outcomes. `Retry`, `RequestCancellation`, and `Dismiss` enforce lifecycle rules on the aggregate, while revision-based EF concurrency conflicts are returned as HTTP 409.

Cancellation deliberately keeps the existing lease rules: a queued or retry-wait execution is cancelled immediately and has its lease cleared; a running execution moves to `cancel-requested` while retaining its lease so the fenced operations repository can close the active attempt. `SessionExecutionAttemptStatus` and `Start`/`Expire`/`Succeed`/`Fail`/`Cancel`/`Supersede` replace raw status strings and direct diagnostics mutation. Retry backoff, jitter, worker timings, and `TimeProvider` are injectable. Operational metrics execute database-side grouping, counts, and oldest-queue aggregation and cache only one bounded row per execution kind. The old state-machine/completion/kind/status compatibility types and parser facade do not exist.
