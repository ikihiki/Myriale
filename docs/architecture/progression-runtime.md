# Progression runtime

Progression runtime advances a session immediately after a narrative signal and starts the module pinned to the selected scenario transition. The consistency boundary is `SessionProgressionTransitionReceipt`: a receipt owns its lifecycle and an independently fenced lease while `SessionProgressState` continues to represent the session's selected progression node.

## Boundaries

- `SessionProgressionTransitionReceipt` creates either a claimable `pending` receipt with a complete `ProgressionModuleSnapshot`, or a terminal `waiting-configuration` receipt when the pinned snapshot is missing or incomplete.
- `ProgressionReceiptStatus` is the native lifecycle type. EF and HTTP projections explicitly preserve the existing wire values `pending`, `waiting-configuration`, `completed`, and `failed`.
- `EnsureProgressionReceiptCommand` owns module-start orchestration, stored JSON parsing, cancellation release, and retryability mapping. It does not mutate EF entities directly.
- `IProgressionReceiptRepository` exposes only owner-scoped discovery/claim and lease-fenced completion, failure, and release operations.
- `EfProgressionReceiptRepository` uses conditional updates. Claim is fenced by the observed `Revision`; completion, failure, and release require both the claimed `LeaseId` and `Revision`.
- `SessionScenarioProgressionService` remains as a compatibility adapter for existing callers. HTTP contracts and module execution APIs are unchanged.

## Lifecycle and fencing

A successful claim increments `AttemptCount` and `Revision`, assigns a two-minute `PTL-*` lease, and clears the previous error. Only the worker holding that exact lease generation may complete, fail, or release it. Every lifecycle write increments `Revision`, so an expired or released lease cannot later commit a stale module turn.

Cancellation releases the claim without using the cancelled token. Invalid snapshot JSON is non-retryable. Unexpected module initialization exceptions, 5xx results, `request_in_progress`, and `package_unavailable` remain retryable; other module errors are terminal. Missing snapshots are terminal with `module_snapshot_missing` and do not dispatch module execution.

The enum conversion changes only the CLR model. The database column remains text with the same values, so this slice requires no schema migration or database reset.

## Verification

`SessionProgressionRuntimeDomainSliceTests` covers wire conversion, aggregate behavior, missing snapshots, non-public lifecycle setters, owner-compatible repository access, concurrent claim winner selection, stale lease rejection, cancellation release, and retryable/non-retryable error mapping. The compatibility-adapter architecture assertion prevents `ApplicationDbContext` and orchestration responsibilities from returning to `SessionScenarioProgressionService`.
