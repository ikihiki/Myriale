# Scenario architecture

Scenario authoring remains in the API project, but is organized into Domain, Application, and Infrastructure folders rather than a needless project split. In this document, **Entity Type** and **Entity** are the generic domain terms for the currently persisted `ScenarioObjectType` and `ScenarioObject`; there is no NPC-specific aggregate or runtime mode.

## Write path

- `Scenario` and `ScenarioDefinitionVersion` are aggregate roots. Lifecycle, identity, timestamps, publication state, version allocation, and optimistic-concurrency revisions do not have public setters.
- HTTP handlers create command records and invoke `CreateScenarioUseCase`, `UpdateScenarioUseCase`, `CreateScenarioDefinitionDraftUseCase`, `SaveScenarioDefinitionUseCase`, or `PublishScenarioDefinitionUseCase`.
- `ScenarioDefinitionDraftService` atomically allocates a definition version through the concurrency-protected Scenario row. Database uniqueness still enforces one `(ScenarioId, Version)` and one draft.
- `IScenarioDefinitionRepository` is intentionally focused on aggregate loading: `GetDraft`, `GetLatestPublished`, `GetById`, and `Add`.
- `ScenarioDefinitionValidator`, `ScenarioDefinitionMapper`, `ScenarioDefinitionWriter`, and `ScenarioRuleJsonCodec` separate validation, API mapping, persistence mapping, and JSON representation. Deleted compatibility facades are not retained.

## Read path

`ScenarioQueryService` and `ScenarioDefinitionQueryService` use `AsNoTracking` and explicit projections/aggregate read mapping. Scenario endpoints never inject `ApplicationDbContext` and only map HTTP identity, status codes, and wire contracts.

## Concurrency

`Scenario.Revision` and `ScenarioDefinitionVersion.Revision` are EF concurrency tokens. `Scenario.DefinitionVersionCounter` is advanced while updating the Scenario concurrency token, so competing draft creators cannot silently allocate the same version. Unique indexes remain the final database guard. Use cases translate expected update races to HTTP 409.

## Domain events

Publishing records `ScenarioDefinitionPublished`. After the successful database save, `DomainEventDispatcher` invokes scoped handlers synchronously. The only production reaction is structured logging; tests register an in-memory recording handler when verifying dispatcher behavior. This is deliberately **post-commit, synchronous, and not durable**: handler failure is visible to the request, and there is no outbox or replay guarantee. No critical external side effect may rely on this dispatcher; adding one requires a transactional outbox and idempotent delivery.

## Typed JSON boundary

The database and HTTP contracts continue to use JSON text/`JsonElement`. At the application/domain boundary, conditions and effects are discriminated records: logical and predicate conditions, state/movement/flag/text/event/completion effects, typed action rules, module bindings, and mutation operations. `ScenarioRuleJsonCodec` rejects unsupported core variants, preserves effect order, and preserves omitted/null/value mutation-patch semantics. Runtime evaluation accepts only `ConditionExpression`; there is no string-evaluation overload. Resolved actions retain native `ActionVisibility` and `ActionExecutionMode` values instead of converting back to wire strings.

Runtime queries map EF entities into an immutable `ScenarioRuleWorldSnapshot`. Rule resolution is a pure operation over that snapshot and returns a fully validated `ScenarioEffectPlan` containing Session, Session State, Object, placement/movement, fact/event/hint, completion, and optional extension-request changes. The resolver never mutates Session or Object entities. The effect commit unit of work rechecks all expected revisions and the execution lease before applying the complete plan atomically, so an invalid path/value or stale revision leaves every runtime row unchanged.

The scope is intentionally bounded. Predicate comparison values, state-effect values, arbitrary `emit-event` payload fields, module configuration, validated state/default/projection/initial-state documents, action argument schemas, and location authoring data remain `JsonElement`. They are intentionally open extension data rather than stable core rule discriminators. This preserves existing API and runtime behavior without inventing a second schema system.

## Generic Entity profile boundary

The accepted definition contract adds structured static profile data without reusing runtime state:

- an Entity Type declares profile fields and optional defaults;
- an Entity composes ordered Types, may add local fields/defaults, and supplies profile values;
- `ProfileMarkdown` remains Entity-local supplemental prose for fine detail, examples, exceptions, relationships, and performance guidance;
- structured profile values are authoritative on conflict, and Markdown headings are not parsed into fields.

`ScenarioProfileConfigurationResolver` (or an equivalently focused application service) resolves fields, defaults, Entity values, effective values, declaration sources, and conflicts independently from state/action resolution. Publication validation rejects incompatible duplicate schemas, unknown values, invalid constraints, and required fields not satisfied by a default or Entity value. The accepted rule-data contract baseline is v3; v2 definitions read as empty structured profile data with every state field owned by `rules`.

## Field authority and AI state transition

State remains Session-owned mutable data. Every resolved state field has exactly one field authority, `rules` or `ai`:

- `rules` is updated only by existing action rules/effects and is the compatibility default;
- `ai` is updated only by a structured, schema-validated transition and may begin uninitialized;
- `hybrid` is intentionally excluded until an explicit arbitration contract exists.

The scenario-turn composition order is:

```text
runtime snapshot
→ action / target Entity decision
→ AI-managed state transition (when applicable)
→ schema + authority + expected-revision validation
→ durable transition checkpoint
→ atomic authored-effect + AI-state commit
→ runtime post-state / post-location projection
→ Narrative generation
```

The transition can replace only the selected Entity's `ai` fields. It cannot write `rules` fields, another Entity, completion, or Session/Entity location. The checkpoint is bound to the causal input/execution/action step, target Entity, transition schema version, and expected `SessionObjectState.Revision`. Retries reuse the same validated checkpoint. Commit compares the expected revisions and applies the complete effect plan once; stale or invalid work leaves runtime rows unchanged and restarts from a fresh snapshot when appropriate.

Narrative is downstream from the authority commit. Narrative retry uses the committed public post-state and must not repeat AI transition generation, rule selection, random generation, extension invocation, or effects.

## Runtime location and safe prompt projection

Multiple Locations, arbitrary `StartLocationCode`, non-global initial placement, and `move-session` / `move-object` remain supported. AI-managed state does not become an alternate movement authority. At runtime, `SessionObjectState.LocationId` is authoritative for Entity placement.

Prompt builders receive Session location and target Entity location as separate values and derive visibility from the runtime/post-effect snapshot. The ordinary Narrative profile projection contains only:

- Entities at the Session's post-effect Location;
- global Entities;
- the selected/affected Entity when narrowly required to narrate a just-committed movement.

It excludes unrelated remote Entities' structured profile, `ProfileMarkdown`, and private state. Structured profile secrets are context for authorized generation only and do not become player-visible facts unless committed/public authorities expose them.
