# Scenario architecture

Scenario authoring remains in the API project, but is organized into Domain, Application, and Infrastructure folders rather than a needless project split.

## Write path

- `Scenario` and `ScenarioDefinitionVersion` are aggregate roots. Lifecycle, identity, timestamps, publication state, version allocation, and optimistic-concurrency revisions do not have public setters.
- HTTP handlers create command records and invoke `CreateScenarioUseCase`, `UpdateScenarioUseCase`, `CreateScenarioDefinitionDraftUseCase`, `SaveScenarioDefinitionUseCase`, or `PublishScenarioDefinitionUseCase`.
- `ScenarioDefinitionDraftService` atomically allocates a definition version through the concurrency-protected Scenario row. Database uniqueness still enforces one `(ScenarioId, Version)` and one draft.
- `IScenarioDefinitionRepository` is intentionally focused on aggregate loading: `GetDraft`, `GetLatestPublished`, `GetById`, and `Add`.
- `ScenarioDefinitionValidator`, `ScenarioDefinitionMapper`, `ScenarioDefinitionWriter`, and `ScenarioRuleJsonCodec` separate validation, API mapping, persistence mapping, and JSON representation. `ScenarioDefinitionAuthoringService` is only a compatibility facade for older internal tests/callers.

## Read path

`ScenarioQueryService` and `ScenarioDefinitionQueryService` use `AsNoTracking` and explicit projections/aggregate read mapping. Scenario endpoints never inject `ApplicationDbContext` and only map HTTP identity, status codes, and wire contracts.

## Concurrency

`Scenario.Revision` and `ScenarioDefinitionVersion.Revision` are EF concurrency tokens. `Scenario.DefinitionVersionCounter` is advanced while updating the Scenario concurrency token, so competing draft creators cannot silently allocate the same version. Unique indexes remain the final database guard. Use cases translate expected update races to HTTP 409.

## Domain events

Publishing records `ScenarioDefinitionPublished`. After the successful database save, `DomainEventDispatcher` invokes scoped handlers synchronously. `ScenarioDefinitionPublishedLoggingHandler` emits a structured production log, while `ScenarioDefinitionPublicationAuditHandler` provides an in-process audit projection used by tests and scoped consumers. This is deliberately **post-commit, synchronous, and not durable**: handler failure is visible to the request, and there is no outbox or replay guarantee.

## Typed JSON boundary

The database and HTTP contracts continue to use JSON text/`JsonElement`. At the application/domain boundary, conditions and effects are discriminated records: logical and predicate conditions, state/movement/flag/text/event/completion effects, typed action rules, module bindings, and mutation operations. `ScenarioRuleJsonCodec` rejects unsupported core variants, preserves effect order, and preserves omitted/null/value mutation-patch semantics. Runtime condition evaluation and effect application consume these typed variants rather than branching over raw JSON strings.

The scope is intentionally bounded. Predicate comparison values, state-effect values, arbitrary `emit-event` payload fields, module configuration, validated state/default/projection/initial-state documents, action argument schemas, and location authoring data remain `JsonElement`. They are intentionally open extension data rather than stable core rule discriminators. This preserves existing API and runtime behavior without inventing a second schema system.
