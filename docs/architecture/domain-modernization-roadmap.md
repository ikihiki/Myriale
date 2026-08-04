# Domain modernization roadmap

Scenario authoring established the reference architecture for Myriale domain code: aggregate-owned lifecycle transitions, native enums for closed state sets, CQRS-lite application use cases and query services, focused repositories, thin HTTP endpoints, optimistic concurrency, and architecture tests. The same approach is applied incrementally rather than through a repository-wide rewrite.

## Domain map and priorities

| Domain | Aggregate / process boundary | Current priority | Main reason |
|---|---|---:|---|
| Session Memory | `SessionNote` and `SessionNoteProposal` review process | High | User edits and AI proposal review mutate the same note through separate endpoints; concurrency and review idempotency must share one policy. |
| Session Execution | `SessionExecution` with attempts, lease, retry, cancellation, and dismissal lifecycle | Delivered | Typed attempts and one operations repository now own atomic claim, context, heartbeat, finalization, retry, and database-side metrics while preserving lease fencing. |
| Progression Runtime | `SessionProgressState` plus independently leased transition receipts | High | Receipt claim/completion/retry rules are mutable process state and need an explicit aggregate/repository boundary. |
| Module Execution | `ModuleExecution`, request receipts, and outcome application receipts | Delivered | Native lifecycle enums, aggregate behavior, commands/queries, owner-scoped repository, and database-authoritative idempotency/concurrency replaced the legacy facade. |
| AI Provider Administration | provider profiles, credentials, and active runtime selection | Delivered | Profile and credential aggregates, revision-fenced commands/tests, deployment/DB resolution, thin endpoints, and split frontend contracts are complete. |
| Session / Turn | Session lifecycle, accepted inputs, canonical turns, state, and object placement | Delivered | Session now owns typed lifecycle, input acceptance, canonical turn append, revision/head movement, creation, and owner-scoped reads. |
| Session Artifact | Typed JSON/storage artifact envelope, image attachment, media, and retention | Delivered | Closed kind/status/schema, factory-owned invariants, focused writer/repositories, and endpoint/query separation replace arbitrary JSON initialization. |
| Module Package Catalog | package identity, validation snapshot, availability, and enabled state | Delivered | Aggregate-owned status/revision, immutable catalog snapshots, and a staged digest-addressed artifact store now separate database authority from filesystem reconciliation. |
| Account | Identity user profile and account lifecycle | Delivered | A closed account state, aggregate-owned profile/withdrawal behavior, application commands/queries, and an Identity infrastructure gateway keep security internals behind the application boundary. |
| Rule Runtime / Scenario Turn | immutable world snapshot, validated effect plan, checkpointed execution orchestration | Delivered | Pure resolution, atomic effect commit, lease-fenced retries, typed artifacts, and exactly-once narrative publication now share explicit application ports. |
| Module Handoff | completed Module outcome enqueue and canonical Narrative publication | Delivered | Database-idempotent enqueue, public-only AI input, lease-fenced publication, typed artifacts, Session append, and Progression commands now have explicit boundaries. |

## Delivery order

1. **Session Memory and Session Execution**: establish aggregate operations, command/query separation, focused repositories, endpoint dependency rules, and conflict responses without changing worker lease semantics.
2. **Progression Runtime**: encapsulate transition receipt claim, completion, failure, and release while preserving atomic lease predicates.
3. **Module Execution**: split initialize/dispatch/query/application responsibilities and replace process-local serialization with database-authoritative concurrency where needed.
4. **AI Provider Administration**: introduce a concurrency-protected runtime-selection aggregate, then separate profile and credential commands from queries.
5. **Session/Turn and Rule Runtime**: extract session creation/input acceptance and pure effect planning only after execution and progression boundaries are stable.
6. **Module Package and Account**: improve application orchestration while retaining filesystem/runtime adapters and ASP.NET Identity as external boundaries.

## Rules for every slice

- Closed lifecycle states and stable discriminators use native enums with explicit database and wire conversion.
- Aggregate identity, revision, ownership, and lifecycle properties are not publicly settable.
- HTTP endpoints resolve identity, bind contracts, invoke application services, and map outcomes; they do not contain EF queries or domain transitions.
- Write use cases recheck ownership and invariants internally. Query services use `AsNoTracking` and explicit projections where possible.
- Repositories are aggregate-specific and expose only operations required to preserve consistency. Generic repositories are not introduced.
- Database uniqueness, conditional updates, row locks, and optimistic concurrency remain authoritative for multi-instance safety.
- Domain events are introduced only for meaningful post-commit reactions. Until an outbox exists, handlers are synchronous and non-durable and this limitation must be explicit.
- Architecture tests prevent endpoint-to-`ApplicationDbContext` regressions and public lifecycle setters. Domain and integration tests cover transition matrices, idempotency, and stale revision behavior.
- Existing HTTP wire values remain stable unless a versioned contract change is explicitly approved.

## Delivered slices

- **Session Execution operations (August 2026):** `SessionExecutionAttemptStatus` and aggregate transition/diagnostic APIs replace raw mutable attempt strings. `ISessionExecutionOperationsRepository` centralizes atomic batch claim, claim context, heartbeat, finalization, and database-side metrics while preserving PostgreSQL `FOR UPDATE SKIP LOCKED`, lease-token and revision fences. Workers no longer resolve `ApplicationDbContext`; retry policy, jitter, timings, and `TimeProvider` are injectable. Stale claims, revision conflicts, and transient database conflicts are distinct outcomes, and the legacy state machine, completion helper, kind/status aliases, and parser facade are removed. See `session-executions-and-artifacts.md`.

- **Module Execution (August 2026):** the legacy 958-line service/facade and process-local semaphore were removed. Explicit detached/session initialization, dispatch, and query use cases now coordinate aggregate-owned state, durable receipts, projection, runtime, effects, and handoff responsibilities. See `module-execution.md`.
- **Progression Runtime (August 2026):** transition receipts now expose a native status enum and aggregate-owned lifecycle, while an application command and focused EF repository preserve owner scoping, atomic revision claims, and lease-generation fencing. See `progression-runtime.md`.
- **AI Provider Administration (August 2026):** the active-selection aggregate remains intact while provider profiles and credentials now have independent identities, aggregates, revision-fenced commands, focused EF repositories, deployment/DB precedence, runtime registry/resolver ports, profile-scoped validation, secret-free snapshots, and split admin HTTP/frontend contracts. The old AI keys route/DTO, legacy options/catalog parser, credential CRUD store, and selection compatibility adapter are removed. See `ai-provider-administration.md`.
- **Module Package Catalog (August 2026):** typed identity/digest/status values, aggregate-owned availability and revision transitions, focused repository/catalog/inspector/artifact ports, staged promotion and repair, and database-authoritative concurrency replace the combined filesystem/EF service and static gate. Runtime, UI, Session creation, and Module Execution initialization share one immutable catalog rule; Module Execution stores only a package snapshot. See `module-packages.md`.

- **Account / Identity orchestration (August 2026):** `AccountState` is formally limited to `Active` and `Withdrawn`, with lowercase wire values shared by backend and frontend. `ApplicationUser` owns creation, profile validation/update, withdrawal, and withdrawal detection while additional domain setters remain non-public. Register, login/logout, current account, profile update, password reset, and withdrawal run through Application commands/queries and an Infrastructure Identity gateway; endpoints no longer receive `UserManager`, `SignInManager`, or `ApplicationDbContext`. ASP.NET Core Identity remains responsible for password hashing, reset tokens, cookies, claims, concurrency stamps, and security-stamp invalidation. Reset responses never expose a token; development/tests use a separate in-memory transport. See `account-identity.md`.

- **Session / Turn / Input (August 2026):** `SessionStatus`, turn/input enums, aggregate-owned creation/input/append/move/complete operations, atomic EF repositories, owner/author/admin-scoped query services, and thin Session endpoints replaced direct DbContext orchestration. Creation fingerprints and input payload hashes provide replay/conflict behavior; optimistic revision and database uniqueness normalize concurrent input/turn outcomes. The per-minute input limit remains a documented best-effort count rather than a strict database window counter. See `session-turn-input.md`.

- **Session Artifact (August 2026):** artifact kind/status/schema and JSON/storage backing are now closed domain state with typed payload factories, draft/validate/commit lifecycle, SHA-256 and timestamp invariants, EF conversion/check constraints, focused writer/repository ports, compensated image attachment, owner-scoped range media reads, retention reconciliation, and a dedicated Session artifact/activity query. Scenario Turn, Module Handoff, and fixtures use the same factories/writer; the arbitrary `Kind` + `ContentJson` initializer and endpoint DbContext dependencies are removed. See `session-executions-and-artifacts.md`.

- **Module Handoff enqueue/publication (August 2026):** completed Module outcomes enter `EnqueueModuleHandoffCommand`, whose persistence port validates the Module Execution/Session/Turn chain and relies on `(SessionId, IdempotencyKey)` uniqueness. The worker handler is a DbContext-free adapter over source query, causality validation, public request construction, AI interaction recording, typed artifact writing, Session append, publish unit of work, and Progression commands. Publication rechecks lease/head/revision, normalizes an existing canonical Turn as replay success, and atomically commits Turn, artifact, signal, receipt, and progress movement. The old preparer and progression compatibility service are removed.

- **Rule Runtime / Scenario Turn execution (August 2026):** runtime actions retain native visibility/execution enums, condition evaluation accepts only typed expressions, and EF-backed world bags were replaced by immutable snapshots. Pure rule resolution validates a complete `ScenarioEffectPlan` before mutation. `SessionObjectState` and `SessionRuleActionStep` now own factory/revision/stage behavior. The scenario handler is a thin adapter over lease-fenced world/action/AI/resolution/commit/artifact/narrative/Turn ports; retries reuse decisions and extension receipts, never reapply committed effects, and regenerate narrative only from stored post-state. Architecture and integration tests fix the old APIs and handler DbContext dependency as absent. See `scenario-architecture.md` and `session-executions-and-artifacts.md`.

## Deliberate boundaries

- Worker queue SQL, lease fencing, and PostgreSQL `FOR UPDATE SKIP LOCKED` behavior are infrastructure concerns and must not be weakened while moving lifecycle policy into aggregates.
- ASP.NET Identity continues to own password hashing, tokens, sign-in, and security validation; account-domain improvements orchestrate it rather than replacing it.
- Open extension payloads such as module configuration may remain JSON. AI provider definitions use the typed deployment profile source; stable core discriminators remain closed domain types.
- This roadmap does not require separate .NET projects. Domain, Application, and Infrastructure folders inside the API project remain sufficient while dependency rules are tested.
