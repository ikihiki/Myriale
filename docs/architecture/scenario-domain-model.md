# Scenario domain model

## Purpose

This document organizes the current `Scenario` implementation using Domain-Driven Design terminology. It distinguishes:

- **Current implementation**: facts represented by the existing EF Core entities, endpoints, and services.
- **Recommended model**: a target domain model that makes aggregate boundaries, invariants, and lifecycle operations explicit.

The central distinction is:

> `Scenario` represents the identity and catalog entry of a work. `ScenarioDefinition` represents one executable, versioned definition of that work.

## Ubiquitous language

| Term | Meaning |
|---|---|
| Scenario | A work authored by one user. It provides a stable identity and user-facing metadata. |
| Scenario definition | A versioned executable world definition containing Locations, Object Types, Actions, and Objects. |
| Draft | An editable Scenario or Scenario Definition that is not yet an immutable execution input. |
| Published definition | A validated and immutable definition that can be pinned by a Session. |
| Location | A named place in the executable world. Its `Code` is the stable reference inside one definition. |
| Object Type | A reusable state schema and action set applied to Objects. |
| Object | A concrete actor or thing placed in the world, with type mixins and local overrides. |
| Progression graph | Nodes and signal-driven transitions that describe the scenario-level narrative progression. |
| Session | A playthrough that pins a published Scenario Definition so later edits do not change its rules. |

## Recommended aggregate boundaries

```text
Scenario [Aggregate Root]
├─ ScenarioId
├─ AuthorId
├─ ScenarioMetadata
├─ PublicationState
├─ PublishedDefinitionId
└─ AuditInfo

ScenarioDefinition [Aggregate Root]
├─ ScenarioDefinitionId
├─ ScenarioId
├─ VersionNumber
├─ DefinitionStatus
├─ NarrativeGuidance
├─ HeroPolicy
├─ IllustrationPrompt
├─ StartLocationCode
├─ Locations
├─ ObjectTypes
│  └─ Actions
├─ Objects
└─ ProgressionGraph

Session [separate Aggregate]
├─ ScenarioId
└─ ScenarioDefinitionId
```

The current implementation stores `NarrativeGuidance`, `HeroPolicy`, and `IllustrationPrompt` fields on `Scenario`. The recommended model moves settings that affect execution into `ScenarioDefinition`, because a Session currently pins only `ScenarioDefinitionVersion`. Without that move, changing `Lore`, `Tone`, `Opening`, or Hero settings can change runtime behavior without changing the pinned definition.

## `Scenario` as an aggregate root

`Scenario` is defined in `backend/src/Myriale.Api/Data/Scenario.cs`. It currently has 19 persisted fields.

### Identity, ownership, and audit fields

| Field | Current type and persistence | Domain role | Invariants | Lifecycle |
|---|---|---|---|---|
| `Id` | `string`, primary key | `ScenarioId`; stable identity of the aggregate | Must be non-empty and globally unique. Current creation uses an `SCN-...` identifier. Must not change after creation. | Assigned at creation only. |
| `AuthorId` | `string`, required | `AuthorId`; identifies the owner and is used for edit authorization | Must equal the authenticated creator at creation. Should be immutable unless ownership transfer is implemented as an explicit use case. | Assigned at creation only. |
| `CreatedAt` | `DateTimeOffset` | Creation timestamp | Must be a trusted server timestamp and remain unchanged. | Assigned at creation only. |
| `UpdatedAt` | `DateTimeOffset` | Timestamp of the latest meaningful aggregate change | Must be greater than or equal to `CreatedAt`. | Updated when Scenario metadata or publication state changes. |

`AuthorId` is currently not modeled as a typed ID or an explicit `ApplicationUser` foreign-key navigation. Ownership is enforced by endpoint queries rather than by behavior on the entity.

### Work metadata

| Field | Current type and limit | Domain role | Invariants | Lifecycle |
|---|---|---|---|---|
| `Title` | `string`, required, max 160 | `ScenarioTitle`; the user-facing name of the work | Trimmed length must be 1–160 characters. | Editable; currently editable even after publication. |
| `Summary` | `string`, max 2000 | Catalog/listing summary of the work | Must be at most 2,000 characters. Its catalog purpose should be kept separate from AI instructions. | Editable. |
| `Genre` | `string`, max 80 | `ScenarioGenre`; classification and discovery metadata | Must be at most 80 characters. It may become a controlled vocabulary later. Current endpoint normalization uses `未分類` when blank. | Editable. |
| `Tone` | `string`, max 120 | Intended narrative tone and emotional style | Must be at most 120 characters. Because it affects generated narrative, it should be versioned with the executable definition. | Currently editable directly; recommended to edit through a Definition draft. |

Recommended value objects:

```text
ScenarioTitle
ScenarioMetadata
├─ Title
├─ Summary
└─ Genre
```

`Tone` belongs to `NarrativeGuidance` rather than catalog metadata when it influences AI output.

### Narrative guidance

| Field | Current type and limit | Domain role | Invariants | Lifecycle |
|---|---|---|---|---|
| `Lore` | `string`, no declared max length | World lore, history, setting, and narrative facts supplied to generation | Define a storage limit and accepted markup format. Publication may require non-empty or internally valid content depending on product rules. | Currently editable directly; recommended to version. |
| `AiFreedom` | `string`, max 120 | Policy describing how much the AI may invent beyond authored facts | Should be a typed policy rather than arbitrary text, optionally with supplemental instructions. | Currently editable directly; recommended to version. |
| `Opening` | `string`, no declared max length | Opening text or opening guidance used when a Session begins | Consider requiring non-empty content before publication. | Currently editable directly; recommended to version. |
| `SampleScene` | `string`, no declared max length | Example scene used to demonstrate desired prose or provide a preview | Its role must be explicit: a catalog preview and an AI few-shot example have different lifecycle and security implications. | Currently editable directly; recommended to version if used for generation. |

Recommended value object:

```text
NarrativeGuidance
├─ Tone
├─ Lore
├─ CreativeFreedomPolicy
├─ Opening
└─ SampleScene
```

`AiFreedom` should be represented by a closed domain value such as `Strict`, `Guided`, or `Flexible`, with optional free-form supplemental guidance.

### Hero policy

| Field | Current type and limit | Domain role | Invariants | Lifecycle |
|---|---|---|---|---|
| `HeroMode` | `string`, max 20, default `free` | Selects how a Session obtains its protagonist | Must be exactly `fixed`, `select`, or `free`. | Editable; recommended to version. |
| `HeroFreeGenerationAllowed` | `bool` | Allows generation outside the authored candidate list | May be `true` only when `HeroMode == select`. The endpoint currently normalizes all other modes to `false`. | Editable; recommended to version. |
| `Hero` | `string`, no declared max length | Defines the fixed hero or the authored hero candidates | Must be non-empty for `fixed` and `select`; its format should be explicit rather than an opaque string. | Editable; recommended to version. |

These three fields should become one `HeroPolicy` value object so invalid combinations cannot be created:

```text
HeroPolicy
├─ FreeHeroPolicy
├─ FixedHeroPolicy(HeroDefinition)
└─ SelectableHeroPolicy(Candidates, AllowGeneratedAlternative)
```

Examples of states that the value object must reject:

- `HeroMode == free` with `HeroFreeGenerationAllowed == true`
- `HeroMode == fixed` with an empty `Hero`
- `HeroMode == select` with no candidates

### Illustration guidance

| Field | Current type and limit | Domain role | Invariants | Lifecycle |
|---|---|---|---|---|
| `IllustrationStyle` | `string`, max 240 | Provider-independent desired visual style | Must be at most 240 characters. | Editable; recommended to version when Session images use it. |
| `IllustrationMood` | `string`, max 240 | Desired atmosphere, palette, and emotional quality | Must be at most 240 characters. | Editable; recommended to version. |
| `IllustrationNegative` | `string`, no declared max length | Elements that image generation should avoid | Define a storage limit. Keep provider-specific syntax outside the Scenario domain. | Editable; recommended to version. |

Recommended value object:

```text
IllustrationPrompt
├─ Style
├─ Mood
└─ NegativeGuidance
```

The Scenario domain should describe visual intent. Provider-specific prompt conversion belongs to the image-generation integration boundary.

### Publication state

| Field | Current type and limit | Domain role | Invariants | Lifecycle |
|---|---|---|---|---|
| `Status` | `string`, max 40, default `draft` | `PublicationState`; controls public visibility of the Scenario | Current effective values are `draft` and `published`. Arbitrary strings should not be accepted. | Created as `draft`; changed to `published` when a Definition is published. |

The current field is ambiguous. It may mean any of the following:

- the Scenario has been published at least once;
- the Scenario is currently publicly visible;
- the latest Definition is published;
- at least one published Definition exists.

The target model must choose one meaning. Prefer an explicit `PublishedDefinitionId` or visibility state and avoid storing a value that can be derived from Definition state.

Recommended transition:

```text
Draft --publish validated definition--> Published
```

The transition must be exposed as domain behavior, not a public string setter.

## Scenario aggregate behavior

### Creation

```text
Scenario.Create(
  ScenarioId,
  AuthorId,
  ScenarioTitle,
  ScenarioMetadata,
  CreatedAt)
```

Creation must guarantee:

- valid and immutable IDs;
- a non-empty title within its domain limit;
- initial publication state `Draft`;
- `CreatedAt == UpdatedAt`;
- no invalid Hero policy if execution guidance remains on this aggregate during migration.

### Editing

Prefer intention-revealing operations over a general-purpose property replacement operation:

- `ReviseMetadata(...)`
- `ChangeNarrativeGuidance(...)`
- `ChangeHeroPolicy(...)`
- `ChangeIllustrationPrompt(...)`

In the target split, only catalog metadata remains directly editable on `Scenario`. Execution-affecting changes create or update a `ScenarioDefinition` draft.

### Publishing

Publishing spans two aggregate roots and should be coordinated by an application service or process manager:

```text
Load Scenario
→ Load its Draft ScenarioDefinition
→ Check ownership
→ Evaluate definition readiness
→ ScenarioDefinition.Publish(now)
→ Scenario.MarkDefinitionPublished(definitionId, now)
→ Save both in one transaction
→ Publish a domain event
```

The current implementation performs the status updates in `ScenarioEndpoints`: it changes the Definition status and `PublishedAt`, then changes `Scenario.Status` to `published` in the same request.

## `ScenarioDefinition` as a separate aggregate

`ScenarioDefinitionVersion` is defined in `backend/src/Myriale.Api/Data/ScenarioDefinitionVersion.cs`. Although it is not declared as a DDD aggregate in code, its lifecycle and consistency rules make it a separate aggregate-root candidate.

Reasons for separating it from `Scenario`:

- it has its own identity, version number, status, and timestamps;
- its full child graph is saved and validated together;
- published versions are immutable through the rule-data update endpoint;
- a Session directly pins one `ScenarioDefinitionVersionId`;
- metadata and executable definition change at different rates;
- loading every rule definition is not necessary to edit or list Scenario metadata.

### Definition fields

| Field | Domain role | Invariants |
|---|---|---|
| `Id` | `ScenarioDefinitionId`; identity of one version | Non-empty, unique, immutable. |
| `ScenarioId` | Reference to the owning Scenario | Must refer to the same Scenario for the entire lifetime. |
| `Version` | Monotonically increasing version number within a Scenario | `(ScenarioId, Version)` is unique in the current EF mapping. Allocation must be concurrency-safe. |
| `Status` | `DefinitionStatus` | Must be `Draft` or `Published`; published definitions are immutable. |
| `SchemaVersion` | Version of the definition data contract | Current authoring logic expects schema version 2. |
| `CreatedAt` | Definition creation timestamp | Immutable. |
| `UpdatedAt` | Latest draft update timestamp | Must not precede `CreatedAt`. |
| `PublishedAt` | Publication timestamp | Must be null for Draft and non-null for Published. |
| `StartLocationCode` | Stable code of the initial Location | Must resolve to a Location in the same Definition before publication. |
| `Locations` | Location entities in this version | Must contain at least one Location before publication. Codes must be unique within the Definition. |
| `ObjectTypes` | Reusable state and action definitions | Codes must be unique and all rules and schemas must validate. |
| `Objects` | Concrete world objects | Must contain at least one Object before publication. References must resolve inside the same Definition. |

The current database guarantees uniqueness of `(ScenarioId, Version)`, but it does not guarantee that a Scenario has at most one Draft. Draft uniqueness and version allocation need a database-backed concurrency strategy.

### `ScenarioLocation`

| Field | Domain role |
|---|---|
| `Id` | Persistence identity of the Location row. |
| `DefinitionVersionId` | Owning Definition. |
| `Code` | Stable domain reference inside the Definition; used by start location and rule effects. |
| `Name` | User-facing Location name. |
| `Description` | Narrative and authoring description. |
| `AuthoringDataJson` | Editor-only supplemental data. It should not silently become execution authority. |

Current authoring saves rebuild child records, so technical IDs may change. Domain references should use `LocationCode` rather than row IDs.

### `ScenarioObjectType`

| Field | Domain role |
|---|---|
| `Id` | Persistence identity. |
| `DefinitionVersionId` | Owning Definition. |
| `Code` | Stable Object Type reference within the Definition. |
| `Name` | User-facing type name. |
| `Description` | Meaning and intended use of the type. |
| `SchemaVersion` | Version of the Object Type schema representation. |
| `StateSchemaJson` | Allowed shape and constraints of runtime state. |
| `DefaultStateJson` | Default runtime state for Objects of the type. |
| `PublicProjectionJson` | Rules defining which state may be exposed to players or AI. |
| `GenericActionRulesJson` | Reusable rules supplied by the type. |
| `Actions` | Actions supplied by this type. |

JSON strings are persistence representations. The domain layer should operate on typed values such as `StateSchema`, `DefaultState`, `PublicProjection`, and `ActionRuleSet`.

### `ScenarioObjectTypeAction`

| Field | Domain role |
|---|---|
| `Id` | Persistence identity. |
| `ObjectTypeId` | Owning Object Type. |
| `Code` | Stable action reference within the Object Type. |
| `Label` | User-facing action name. |
| `Description` | Explanation used by users and action-selection AI. |
| `ArgumentSchemaJson` | Valid argument structure. |
| `AvailabilityConditionJson` | Condition under which the action can be selected. |
| `Visibility` | Selection channel: `ai-choice`, `manual-ui`, or `system-only`. |
| `ExecutionMode` | Execution strategy: `rule` or `extension-module`. |

`Visibility` and `ExecutionMode` should be closed enum/value-object types.

### `ScenarioObject`

| Field | Domain role |
|---|---|
| `Id` | Persistence identity. |
| `DefinitionVersionId` | Owning Definition. |
| `Code` | Stable Object reference inside the Definition. |
| `Name` | User-facing Object name. |
| `ProfileMarkdown` | Narrative profile, appearance, personality, and role. |
| `LocationId` / `Location` | Initial placement. The referenced Location must belong to the same Definition. |
| `InitialStateOverrideJson` | Override applied to type defaults. |
| `MixinTypeCodesJson` | Object Types applied to the Object. |
| `LocalStateSchemaJson` | Object-specific additions to the state schema. |
| `LocalDefaultStateJson` | Object-specific default state. |
| `LocalPublicProjectionJson` | Object-specific state exposure rules. |
| `LocalActionsJson` | Actions defined only for this Object. |
| `ActionRuleMutationsJson` | Additions, replacements, removals, or adjustments to inherited rules. |
| `IsGlobal` | Indicates that the Object is not limited to one ordinary Location context. |

All Location, Object Type, Action, and rule references must resolve within the same Definition aggregate.

## Progression graph boundary

The current `ScenarioProgressionNode` belongs directly to a `ScenarioId`, and `ScenarioProgressionTransition` connects nodes by ID. It is not part of `ScenarioDefinitionVersion`.

A node contains:

- `Id`: persistence identity;
- `ScenarioId`: owning Scenario;
- `Code`: stable node code within the Scenario;
- `IsInitial`: whether this is the initial progression node;
- `AllowedNarrativeSignalsJson`: signals the node accepts.

A transition contains:

- `SourceNodeId` and `TargetNodeId`;
- `SignalCode` and `TriggerDescription`;
- optional Module identity: `ModuleId`, `ModuleVersion`, `ModuleDigest`;
- optional Module configuration and context JSON;
- `ModuleRandomValueCount` for deterministic random input requirements.

Because a Session pins a Scenario Definition but not a separate Progression version, editing Progression can break complete historical reproducibility. The preferred design is to place `ProgressionGraph` inside `ScenarioDefinition`. If it requires an independent release lifecycle, introduce a versioned `ScenarioProgressionDefinition` aggregate and have Session pin both IDs.

## Domain services, policies, and repositories

### Application service

`PublishScenarioDefinition` coordinates the transaction across the two aggregates. Authorization, loading, persistence, transaction control, and event dispatch belong here.

### Domain policies

- `ScenarioDefinitionReadinessPolicy`: validates whether a Draft can be published.
- `ScenarioAccessPolicy`: evaluates owner editing, Draft visibility, and public visibility.
- `ScenarioIdGenerator`: creates IDs; the implementation belongs to infrastructure.

Readiness includes at least:

- the Definition belongs to the Scenario;
- the Definition is Draft;
- at least one Location and Object exist;
- `StartLocationCode` resolves;
- schemas, rules, effects, and Module bindings are internally consistent;
- all references remain inside the Definition.

### Repository interfaces

```text
IScenarioRepository
├─ GetById
├─ GetEditableByAuthor
├─ ListVisibleTo
└─ Add

IScenarioDefinitionRepository
├─ GetDraft
├─ GetLatestPublished
├─ GetById
├─ ReserveNextVersion
└─ Add
```

Repositories do not replace database constraints. Version allocation, one-Draft-per-Scenario, and publication races require transactions, uniqueness constraints, and optimistic or pessimistic concurrency handling.

## Current implementation gaps

1. `Scenario` is an anemic EF entity with public setters; invariants are distributed across endpoints and services.
2. `ScenarioDefinitionVersion` behaves like a separate aggregate but is not modeled as one explicitly.
3. Published Definitions are protected from ordinary updates, but published Scenario fields can still be overwritten directly.
4. `Scenario.Status` duplicates or ambiguously summarizes Definition publication state.
5. Scenario metadata and rule data are saved by separate requests and transactions, so partial success is possible.
6. Saving a Definition Draft does not update `Scenario.UpdatedAt`.
7. Progression is not versioned with the pinned Definition.
8. `HeroMode`, `Status`, `Visibility`, and `ExecutionMode` are open strings rather than closed domain values.
9. Endpoint validation does not consistently cover every EF maximum-length constraint.
10. Rule data remains JSON in persistence entities, while substantial domain validation is concentrated in services.

## Migration sequence

1. Introduce closed domain values for publication status, Hero mode, action visibility, and execution mode.
2. Add `ScenarioTitle`, `HeroPolicy`, and `IllustrationPrompt` value objects and map API DTOs into them.
3. Add intention-revealing behavior to `Scenario` and reduce public-setter mutation.
4. Treat `ScenarioDefinitionVersion` as an aggregate root and move publication invariants into it.
5. Convert persisted JSON into typed domain values at the application/persistence boundary.
6. Move Progression into a versioned Definition boundary.
7. Centralize publication in an application service and save Scenario plus Definition atomically.
8. Add concurrency-safe Draft uniqueness and version allocation.
9. Pin every execution-affecting setting through `ScenarioDefinitionId` and cover reproducibility with tests.
10. Connect readiness and publication operations to the frontend Scenario API.

## Required invariant tests

- Invalid Hero policy combinations cannot be constructed.
- A Published Definition cannot be modified.
- A Scenario cannot have multiple active Draft Definitions.
- Concurrent version allocation cannot produce duplicate version numbers.
- Start Location and Object references must resolve inside the same Definition.
- A Definition that fails readiness cannot be published.
- Publication cannot update only Scenario or only Definition.
- A Session remains bound to the Definition it pinned and is unaffected by later versions.
- Catalog-only edits and execution-affecting edits follow the chosen post-publication policy.
