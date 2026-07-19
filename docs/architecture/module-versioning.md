# Module versioning

## Contract version

`ModuleContractVersions` identifies the host/module wire contract independently from assembly versions. Manifests declare the contract version they implement. Unsupported contracts prevent package activation.

All boundary DTOs must remain JSON-compatible. C# types are an authoring convenience, not the durable storage format.

## Package version

Modules use semantic versions. Package content is immutable and additionally identified by SHA-256. Published scenario versions store module ID, module version, package digest, configuration schema version, and a configuration snapshot.

Detached and session-owned executions store the exact package identity, contract and schema versions, configuration snapshot, and context snapshot. Installing a newer module does not alter an active or completed execution. The current runtime still requires the pinned package to remain installed and enabled for subsequent dispatches.

## Schema migration

Configuration and state schemas have independent integer versions. A future SDK revision may add explicit migration operations. Active module state is not migrated by default; it continues with its pinned package.

A package cannot be physically removed while referenced by a published scenario version, active execution, or retained history.
