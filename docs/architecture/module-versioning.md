# Module versioning

## Contract version

`ModuleContractVersions` identifies the host/module wire contract independently from assembly versions. Manifests declare the contract version they implement. Unsupported contracts prevent package activation.

All boundary DTOs must remain JSON-compatible. C# types are an authoring convenience, not the durable storage format.

## Package version

Modules use semantic versions. Package content is immutable and additionally identified by SHA-256. Published scenario versions store module ID, module version, package digest, configuration schema version, and a configuration snapshot.

Active executions also store the exact package digest and configuration snapshot. Installing a newer module does not alter an active or completed execution.

## Schema migration

Configuration and state schemas have independent integer versions. A future SDK revision may add explicit migration operations. Active module state is not migrated by default; it continues with its pinned package.

A package cannot be physically removed while referenced by a published scenario version, active execution, or retained history.
