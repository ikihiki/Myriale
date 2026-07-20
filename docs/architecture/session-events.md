# Session events and mutable state

## Boundary

A Session separates immutable facts from mutable aggregate and worker state.

Immutable facts:

- `SessionPlayerInput`: accepted player text and the Session head observed at acceptance.
- `SessionTurn`: one committed narrative or module turn and its predecessor.
- `SessionNarrativeSignal`: one host-validated signal emitted with a Narrative Turn.

Mutable Session-owned state:

- `Session.HeadTurnId`: the authoritative final committed Turn.
- `Session.Revision`: optimistic concurrency token for accepting inputs and appending Turns.
- `SessionState`: current flags and their revision.
- `SessionProgressState`: current Scenario node and its revision.

Mutable processing state is not stored on immutable events:

- `SessionPlayerInputWork`: AI generation lease, attempts, retryability, and errors.
- `SessionNarrativeHandoff`: Module Outcome narrative-generation processing.
- `SessionProgressionTransitionReceipt`: signal-to-Module processing.

## Player Input lifecycle

`SessionPlayerInput.AcceptedAfterTurnId` records `Session.HeadTurnId` when the input is accepted. The input row is not updated after insertion.

The domain state of an input is derived:

- completed: a `SessionTurn` exists whose `PlayerInputId` is the input ID;
- pending: no result Turn exists and `Session.HeadTurnId == AcceptedAfterTurnId` using null-safe equality;
- stale: no result Turn exists and the two head IDs differ.

Operational failure and retry information belongs to `SessionPlayerInputWork`, not to the Player Input event.

## Turn ordering

`Session.HeadTurnId` and `SessionTurn.PreviousTurnId` are authoritative. `SessionTurn.Position` remains an immutable display ordinal calculated from the predecessor (`1` for the root, otherwise predecessor position plus one). It is not an allocation cursor or concurrency boundary.

Appending a Turn requires:

1. reading the expected Session head;
2. creating a Turn whose `PreviousTurnId` is that head;
3. updating `Session.HeadTurnId` to the new Turn and incrementing `Session.Revision`;
4. saving the Turn and Session update atomically.

Unique predecessor/root constraints prevent forks. `Session.Revision` provides optimistic compare-and-swap across workers and API instances.

## Revision meanings

The word `Revision` is scoped to its aggregate or projection:

- `Session.Revision`: Session aggregate concurrency for input acceptance and Turn append.
- `SessionState.Revision`: current flags version; only changes when Session effects change flags.
- `SessionProgressState.Revision`: current Scenario-node projection version.
- `ModuleExecution.Revision`: Module-private state-machine version used by action dispatch.
- revisions on work/receipt entities: worker lease concurrency only.

Appending a Narrative Turn does not increment `SessionState.Revision` unless flags actually change.

## Causal links

Player Narrative:

```text
SessionPlayerInput.AcceptedAfterTurnId = previous head
SessionTurn.PreviousTurnId             = previous head
SessionTurn.PlayerInputId              = input ID
```

Module Outcome Narrative:

```text
SessionTurn.PreviousTurnId     = source Module Turn ID
SessionTurn.SourceModuleTurnId = source Module Turn ID
```

Narrative signal to Module:

```text
Narrative Turn -> SessionNarrativeSignal -> SessionProgressionTransitionReceipt -> Module Turn
```

The signal and Turn are immutable. Retry and completion state remains on the transition receipt.
