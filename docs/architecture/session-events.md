# Session events and generic Entity state

## Authority chain

Every accepted player input is processed through one causal chain:

```text
Input
  -> pinned Scenario definition + current Entity state/location
  -> immutable safe Entity/action snapshot
  -> AI decision { entityId, actionId, arguments }
  -> configured Entity result or bound extension
  -> optional AI-managed state transition
  -> validated durable transition checkpoint
  -> atomic authored-effect + AI-state commit
  -> runtime post-state/post-location projection
  -> narrative generated from that committed projection
```

Only the pinned Scenario definition, Session runtime state, rule evaluator/effect applier, a bound extension outcome, and the validated AI transition path described below can change state. The action-selection AI chooses only from enumerated actions. The transition AI can replace only `ai`-authority fields on its target Entity. Narrative generation describes committed facts and has no field that can select a module, advance progression, move the Session/Entity, or mutate state. NPC is a narrative role of an Entity, not a separate domain type or authority path.

## Immutable facts and mutable state

Immutable facts and audit records:

- `SessionPlayerInput`: accepted text, idempotency identity, and observed Session head/revision.
- `SessionRuleActionStep`: the action snapshot, accepted decision, selected rule/result, validated AI transition reference when present, applied effects, extension reference, pre/post revisions, public post-state, and checkpoint receipts.
- `SessionTurn`: one published canonical narrative and its predecessor.
- versioned `SessionArtifact` records for action snapshots, decisions, AI transition requests/results/checkpoints, effect commits, extension outcomes, public post-state, and narrative.

Mutable Session-owned state:

- `Session.HeadTurnId` and `Session.Revision` for canonical publication and optimistic concurrency.
- pinned `Session.ScenarioDefinitionVersionId` and current `LocationId`.
- `SessionObjectState`: private runtime state JSON, current placement, and revision for each pinned Entity (persisted through the existing Object-state model).
- `SessionState`: host-owned flags/completion state and revision.
- `ModuleExecution`: private state and revision only while a configured extension action is active.
- `SessionExecution`: durable processing status, lease, retry scheduling, and checkpoint progress.

Published Scenario definitions are immutable. Starting a Session pins one published definition version, initializes `rules`-authority fields from resolved defaults/overrides, leaves permitted `ai` fields uninitialized, and initializes placement from that version. Later authoring or publishing creates a new definition version and affects only new Sessions.

## Static profile, runtime state, and projections

An Entity Type (persisted as an Object Type) declares structured profile fields/defaults, a strict runtime-state schema, one update authority per state field, public projection, and action interfaces. An Entity supplies ordered Type mixins, structured profile values, optional local profile fields/defaults, supplemental `ProfileMarkdown`, initial location/rule-state override, and conditional action results. Structured profile values are authoritative if Markdown contradicts them; Markdown headings are not parsed into implicit fields. Static profile data is definition-owned and is never copied into mutable state merely to make it available to prompts.

The public action snapshot contains only:

- current runtime/post-effect Location's public description;
- Entities in that Location plus explicitly global Entities;
- each included Entity's whitelisted public state;
- enabled or safely explainable disabled action descriptors;
- action argument schemas and relevant state revisions;
- system-owned `clarify` and `no-op` choices when applicable.

It excludes private state, structured profile details, Markdown, Entities in other Locations, hidden result branches, condition/effect ASTs, extension bindings/configuration, private module state, and random values. AI-state and Narrative prompt builders may add the target/in-scope Entities' resolved structured profile and Entity-local Markdown under their own safe projection; player/session responses do not expose that generation-only context. A narrowly selected/affected Entity may remain in the Narrative projection only when needed to describe a movement just committed; this exception does not include unrelated remote Entities. Profile secrets do not become public facts merely because generation can read authorized profile context.

## Profile composition and state authority

Profile composition follows ordered mixin precedence:

```text
earlier Entity Type
< later Entity Type
< Entity-local declaration/default
< Entity profile value
```

Compatible schemas compose; incompatible schemas are publication errors. `required` cannot be weakened by a later mixin, and every required field must resolve from a default or Entity value. `ProfileMarkdown` stays verbatim and Entity-local rather than being concatenated from Types.

Every runtime state field resolves to exactly one authority:

- **`rules`**: configured rules/effects are the only writer; this is the default for definitions that omit authority.
- **`ai`**: the structured AI transition is the only writer; the field may be absent before first interaction.

The initial contract does not permit `hybrid`. An authority collision during Type/Entity composition blocks publication. `InitialStateOverride` does not normally supply concrete `ai` values.

## AI transition checkpoint and revision semantics

For a target Entity with `ai` fields, transition generation receives its resolved structured profile, Entity-local `ProfileMarkdown`, AI field schemas/guidance, prior private AI state (including explicit uninitialized fields), relevant projected rule state, player input, interaction type, separate Session/Entity runtime locations, bounded dialogue, committed/forbidden facts, and expected object revision.

The result is a complete replacement for the target Entity's `ai` fields and carries the transition schema version, Entity identity, and expected revision. It cannot patch `rules` fields, another Entity, Session completion, or Session/Entity location. Location changes continue to require `move-session` or `move-object` effects.

After schema, identity, authority, and revision validation, the transition result is stored as a durable checkpoint associated with the causal input/execution/action step. The checkpoint is immutable evidence of the proposed transition; it is not itself mutable world state. The effect commit unit then atomically applies the full authored effect plan, extension outcome, and AI-state replacement against all expected revisions.

- A successful private-state or placement change advances `SessionObjectState.Revision` once for that authority commit.
- A stale revision or invalid transition changes no runtime row. Processing must enumerate from a fresh snapshot rather than transplanting the stale checkpoint.
- Narrative failure does not roll back committed state.
- Narrative retry, duplicate request retry, worker lease loss, or process restart reuses the validated checkpoint/commit receipt and committed post-state. It does not regenerate or reapply the transition.
- The next turn and Session reload read persisted `SessionObjectState` as the authority, not reconstructed prompt output.

## Input lifecycle and concurrency

`POST /api/sessions/{sessionId}/inputs` atomically stores one `SessionPlayerInput` and queues one `scenario-turn` execution. Request and idempotency keys are unique per Session; a replay with the same payload returns the same work, while key reuse with a different payload is rejected.

Acceptance fences the observed Session head/revision. Before mutation, the engine also compares the Entity and Session revisions captured by the action snapshot and any AI transition checkpoint with current revisions, then re-evaluates action availability. A stale snapshot is rejected before effects or extension dispatch; processing restarts from enumeration against fresh state rather than asking either AI stage to reuse an obsolete snapshot.

An input is:

- **pending** while its canonical scenario-turn has not reached a terminal state;
- **completed** when its canonical narrative Turn has been published;
- **state-committed / narrative-pending** when action effects are durable but narrative publication still needs retry;
- **superseded or failed** when processing terminates without a canonical Turn.

## Commit and publication ordering

The rule/effect commit is the state authority boundary. The complete declarative effect batch and any bound extension result are validated before mutation. Entity state (including the complete AI-authority replacement when present), placement, Session state, module state, random receipt, facts/events/hints, and their before/after revisions are committed atomically with a unique effect-commit receipt.

Narrative generation starts only after that commit. Its input is the stored public post-state and authoritative facts/events/hints/forbidden facts. A narrative failure never rolls back committed state. Retrying narrative publication reuses the committed post-state and does not repeat enumeration, action selection, AI-state transition generation, random generation, extension invocation, or effects.

`Session.HeadTurnId` and `SessionTurn.PreviousTurnId` order published canon. Turn append uses compare-and-swap on `Session.Revision`, and unique input/action-step/source constraints prevent duplicate canonical narratives.

## Revision meanings

Revisions remain monotonic concurrency values and are not reset by the new contract baseline:

- `Session.Revision`: input acceptance and canonical Turn publication.
- `SessionObjectState.Revision`: private Entity state (whether `rules`- or `ai`-authority) or runtime placement changes. The durable transition checkpoint records its expected value; only the successful authority commit advances it.
- `SessionState.Revision`: host-owned flags/completion changes.
- `ModuleExecution.Revision`: active extension state-machine changes.
- execution/lease revisions: worker fencing only.

Contract and artifact schemas restart at `1` / `.v1`; revisions, sequences, SHA-256 digests, dependency versions, and application/toolchain versions do not restart.
