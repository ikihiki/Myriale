# Module packages

## Decision

Myriale modules are installed as one immutable package containing one managed assembly and optional UI resources.

```text
module.dll
resources/
  runtime.mjs
  authoring.mjs
  result-summary.mjs
  module.css
  images/
  audio/
  locales/
```

Modules with UI resources are installed as `.myriale-module` ZIP packages. Headless modules that declare no runtime, authoring, or result-summary UI may also be installed directly as a single `.dll` file.

## Identity and catalog aggregate

A package is identified by typed module ID, semantic version, and lowercase SHA-256 digest values. Published scenario versions and active executions pin all three values. A package with the same ID and version but a different digest is rejected; reinstalling the same digest is idempotent.

`ModulePackage` owns the catalog lifecycle:

- `Install` creates a disabled `Staged` row from a validated inspection snapshot;
- `MarkVerified` makes promoted and integrity-checked artifacts eligible for enablement;
- `MarkMissing` and `MarkInvalid` always disable the package;
- `Enable` accepts only `Verified` packages and requires the expected `Revision`;
- `Disable` also requires the expected `Revision`.

The database revision, unique digest key, and unique module-ID/version key are authoritative for multi-instance races. There is no process-static package lock.

## Application and infrastructure boundaries

Package responsibilities are separated into focused ports:

- `IModulePackageRepository` persists the aggregate and normalizes database conflicts;
- `IModulePackageCatalog` returns immutable snapshots and is the one availability rule used by runtime, Module Execution initialization, Session creation, and Module UI;
- `IModulePackageInspector` validates DLL/ZIP structure and the trusted assembly manifest;
- `IModulePackageArtifactStore` stages, promotes, verifies, repairs, reads, and deletes digest-addressed artifacts;
- install, rescan, enable, and disable commands orchestrate these ports.

The persistence entity is not returned by HTTP endpoints, runtime adapters, UI services, Session queries, or Module Execution creation. `ModuleExecution.Create` accepts an immutable package snapshot containing only the pinned execution fields.

## Artifact lifecycle and reconciliation

The artifact root defaults to `data/module-packages/`, with `staging/`, `packages/`, `expanded/`, and `inbox/` children. Installation follows:

1. copy the bounded request into staging while calculating SHA-256;
2. inspect archive paths, symlink bits, size limits, declared resources, assembly entry point, and manifest;
3. commit a disabled `Staged` catalog row under database uniqueness;
4. promote the canonical digest-addressed package and atomically replace its expanded directory;
5. verify canonical and expanded hashes, then mark the aggregate `Verified`.

Filesystem and database updates are intentionally not treated as one transaction. A promotion failure leaves a disabled `Staged` row. Reinstall or rescan repairs from the canonical package when possible. Rescan also consumes inbox artifacts, restores missing expansions, and marks missing/corrupt packages unavailable with a revision update. A concurrent enable or rescan therefore resolves through optimistic database concurrency rather than a process-local gate.

## Assembly and security contract

`module.dll` contains one module, declares its entry point with `MyrialeModuleEntryPointAttribute`, and implements `IMyrialeModule` from `Myriale.ModuleSdk`. The SDK and framework assemblies are supplied by the host; module-specific dependency assemblies are not supported in the first version.

There is no required JSON manifest. The host loads the trusted assembly during inspection and stores its serializable `ModuleManifest` snapshot. Archive extraction rejects rooted paths, traversal, backslashes, duplicate case-insensitive paths, undeclared files, symbolic links, oversized entries, and expanded-size overflow. Runtime and UI reads reapply the shared availability rule and artifact hash verification before code or resources are returned.

## Deferred work

Package signatures, physical deletion protection based on scenario/session references, and an expanded-directory development loader are deferred to later changes.
