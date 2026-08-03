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

Publishing records `ScenarioDefinitionPublished`. After the successful database save, `DomainEventDispatcher` invokes scoped handlers synchronously. `ScenarioDefinitionPublicationAuditHandler` is the initial useful in-process audit projection. This is deliberately **post-commit, synchronous, and not durable**: handler failure is visible to the request, and there is no outbox or replay guarantee.

## Typed JSON boundary

The database and HTTP contracts continue to use JSON text/`JsonElement`. At the application/domain boundary, `ConditionExpression`, `EffectSet`, `StateSchema`, `StateValue`, `PublicProjection`, and `ActionRules` provide shape-checked representations through `ScenarioRuleJsonCodec`. Mapping and persistence use these types, and runtime condition/effect execution consumes typed wrappers rather than reparsing raw strings.

The scope is intentionally bounded: arbitrary JSON-schema keywords, module configuration payloads, authoring metadata, event payloads, and individual effect values remain JSON because they are extension data rather than stable core rule concepts. This preserves existing API and runtime behavior without inventing a second schema system.
