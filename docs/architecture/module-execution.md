# Module Execution architecture

Module Execution is a destructive, non-compatible DDD/CQRS-lite redesign. The API and database no longer accept the former lowercase string lifecycle values or the former service-shaped contract.

## Domain boundary

`ModuleExecution` is the aggregate root. It owns initialization completion/failure, dispatch acceptance, revision advancement, terminal-state invariants, and optional attachment to one session turn. `ModuleExecutionStatus` is a native closed enum (`Initializing`, `Active`, `Completed`, `Failed`) with explicit database and JSON conversion.

`ModuleExecutionRequest` is the durable idempotency receipt. Its operation and status are native enums. Factory methods create initialize/dispatch receipts, and `Complete`/`Reject` close them once. `ModuleOutcomeApplication.Create` records the exactly-once application of session effects. Aggregate and receipt lifecycle setters are not public.

## Application use cases

HTTP and internal callers use explicit application entry points:

- `InitializeDetachedModuleExecutionCommand`
- `InitializeSessionTurnModuleExecutionCommand`, with an explicit `UserRequested` or `ScenarioProgression` policy
- `DispatchModuleExecutionCommand`
- `GetModuleExecutionQuery`

Application results expose `ModuleExecutionOutcome`; they do not expose HTTP status codes. Endpoints alone translate outcomes to HTTP responses. Scenario extensions and progression runtime use the matching command instead of an HTTP-shaped facade.

## Persistence and concurrency

`IModuleExecutionRepository`/`EfModuleExecutionRepository` provide owner-scoped aggregate and receipt access. The database is authoritative:

- `(OwnerId, RequestId)` is unique, so equal requests replay and a different payload conflicts.
- `Revision` is an optimistic concurrency token, so stale dispatches lose deterministically.
- outcome applications are unique by execution and request, making session effects exactly-once.
- session turn attachment is unique and owner-scoped reads return not-found across owners.

There is no process-static execution semaphore. PostgreSQL/SQLite uniqueness, transactions, session revision fencing, and EF concurrency exceptions define multi-instance behavior.

## Adapters and responsibilities

The runtime SDK and package installation contracts are unchanged. Runtime invocation remains behind `IModuleRuntime`; session effects remain in `SessionOutcomeEffectService`; response projection is `IModuleExecutionProjection`; session handoff preparation remains distinct from SessionExecution queue semantics. The orchestration implementation is split into initialize, dispatch, and support partials so each source file remains reviewable.

## Dependency rules

`ModuleExecutionEndpoints` depends only on commands/queries. It has no `ApplicationDbContext` dependency. The deleted `IModuleExecutionService`, `ModuleExecutionServiceResult`, and `ModuleExecutionService` are intentionally not retained as compatibility facades.

## Test strategy

Domain tests cover enum conversion, initialization/dispatch transitions, revision conflict, and terminal invariants. Integration coverage exercises initialize/dispatch/replay, owner isolation, session effects, and database uniqueness/concurrency. Architecture tests prevent public lifecycle setters, endpoint DbContext dependencies, and reintroduction of the deleted facade. PostgreSQL row-lock tests may skip when no external PostgreSQL test connection is configured.
