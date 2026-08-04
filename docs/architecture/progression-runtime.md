# Progression runtime

Progression runtime advances a session immediately after a narrative signal and starts the module pinned to the selected scenario transition. The consistency boundary is `SessionProgressionTransitionReceipt`: a receipt owns its lifecycle and an independently fenced lease while `SessionProgressState` continues to represent the session's selected progression node.

## Boundaries

- `SessionProgressionTransitionReceipt` creates either a claimable `pending` receipt with a complete `ProgressionModuleSnapshot`, or a terminal `waiting-configuration` receipt when the pinned snapshot is missing or incomplete.
- `ProgressionReceiptStatus` is the native lifecycle type. EF and HTTP projections explicitly preserve the existing wire values `pending`, `waiting-configuration`, `completed`, and `failed`.
- `EnsureProgressionSignalCommand` accepts a published narrative Turn and signal code inside the caller transaction. It validates the current node allowance, resolves the pinned transition/snapshot, creates the unique signal and receipt, and advances `SessionProgressState` once.
- `EnsureProgressionReceiptCommand` implements `IProgressionReceiptCommand` and owns post-commit module-start orchestration, stored JSON parsing, cancellation release, and retryability mapping. It does not mutate EF entities directly.
- `IProgressionReceiptRepository` exposes only owner-scoped discovery/claim and lease-fenced completion, failure, and release operations.
- `EfProgressionReceiptRepository` uses conditional updates. Claim is fenced by the observed `Revision`; completion, failure, and release require both the claimed `LeaseId` and `Revision`.

## Lifecycle and fencing

A successful claim increments `AttemptCount` and `Revision`, assigns a two-minute `PTL-*` lease, and clears the previous error. Only the worker holding that exact lease generation may complete, fail, or release it. Every lifecycle write increments `Revision`, so an expired or released lease cannot later commit a stale module turn.

Cancellation releases the claim without using the cancelled token. Invalid snapshot JSON is non-retryable. Unexpected module initialization exceptions, 5xx results, `request_in_progress`, and `package_unavailable` remain retryable; other module errors are terminal. Missing snapshots are terminal with `module_snapshot_missing` and do not dispatch module execution.

Signal creation and receipt lifecycle use the existing unique constraints and text wire values. The current reset-and-`EnsureCreated` schema lifecycle requires no migration for this slice.

## Verification

`SessionProgressionRuntimeDomainSliceTests` covers wire conversion, aggregate behavior, missing snapshots, non-public lifecycle setters, owner-compatible repository access, concurrent claim winner selection, stale lease rejection, cancellation release, and retryable/non-retryable error mapping. Architecture assertions require the receipt command port and keep the deleted `SessionScenarioProgressionService` absent.
