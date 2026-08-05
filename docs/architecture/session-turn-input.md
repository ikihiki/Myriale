# Session / Turn / Input domain slice

## Boundary

`Session` is the consistency boundary for play lifecycle, accepted player input, the canonical turn chain, head position, and session revision. Closed values use `SessionStatus`, `SessionTurnKind`, `SessionTurnType`, and `SessionInputInteractionType`; EF stores their explicit wire values.

The aggregate exposes creation, input acceptance, opening/scenario/module/handoff append, location movement, completion, and runtime revision advancement. Module handoff publication reaches `AppendModuleHandoffNarrative` only through `IModuleHandoffSessionTurnAppender` inside the fenced publish unit of work. Every append advances position, predecessor, head, revision, and update time together. Opening turns reject causal sources, action-result turns require player input, module handoffs require the source module turn, and completed sessions reject new input or turns. `SessionPlayerInput.Accept` and the `SessionTurn` factories create immutable facts with non-public setters.

## Commands and persistence

`CreateSessionUseCase` owns creation validation, canonical request fingerprinting, replay/conflict decisions, published-definition pinning, object/progression/module snapshot initialization, opening turn creation, and atomic graph persistence. The EF repository uses one transaction and two saves only to break the relational Session-head/Turn cycle; no partially-created graph commits.

`AcceptSessionInputUseCase` resolves AI profiles, reloads the owner-scoped aggregate, validates active/forced-module/handoff/rate-limit policy, calculates the canonical payload hash, creates the accepted input and queued execution, and commits input/execution/session revision in one transaction. Database uniqueness and the Session revision concurrency token classify same-request replay, idempotency-key reuse, and different-request concurrency without returning an unhandled 500.

The configured per-session requests-per-minute check is intentionally **best effort**. It is an indexed/counting policy guard, not a strict database window counter; revision concurrency still ensures that simultaneous accepted writes have one durable winner.

## Queries and HTTP

Session HTTP handlers resolve identity, invoke application commands/queries, and map typed outcomes. They do not depend on `ApplicationDbContext`. Read responsibilities are split among list, detail, turn, turn inspection, and action-recommendation context query services. Queries enforce owner or author/administrator scope internally and use no-tracking reads. Turn/module/handoff data is batch-loaded for Session detail to avoid per-turn execution queries.

The input contract no longer exposes `RequestedOutputs`. `SessionInputService`, `SessionInputAcceptanceResult`, `NarrativeInteractionTypes`, and `PlaySessionListingService` were removed rather than retained as compatibility facades.

## Concurrency verification

SQLite/domain tests cover aggregate invariants, monotonic head/position/revision behavior, completion guards, atomic input/execution creation, replay/conflict outcomes, stable retryable concurrency outcomes, creation replay, endpoint dependency rules, and non-public setters. Opt-in PostgreSQL tests (`MYRIALE_TEST_POSTGRES`) exercise concurrent input acceptance and concurrent root-turn append alongside the existing queue/lease tests.
