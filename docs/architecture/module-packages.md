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

Modules with UI resources are installed as `.myriale-module` ZIP packages. Headless modules that declare no runtime, authoring, or result-summary UI may also be installed directly as a single `.dll` file. Development environments may load an expanded directory in a future workflow.

## Identity

A package is identified by module ID, semantic version, and SHA-256 digest. Published scenario versions and active executions pin all three values. A package with the same ID and version but a different digest is rejected; development-time replacement will use a separate expanded-directory workflow rather than weakening the catalog invariant.

## Assembly contract

`module.dll` contains one module and declares its entry point with `MyrialeModuleEntryPointAttribute`. It implements `IMyrialeModule` from `Myriale.ModuleSdk`. The SDK and framework assemblies are supplied by the host; module-specific dependency assemblies are not supported in the first version.

There is no required JSON manifest. The host loads the trusted assembly during installation and obtains a serializable `ModuleManifest` C# object. The validated manifest is cached for catalog queries.

## Catalog storage

The API stores validated ZIP packages or DLL files under digest-addressed `packages/` and `expanded/` directories and records relative paths in the database. Rescan reconciles `.myriale-module` and `.dll` inbox files, orphaned canonical inputs, missing resources, and digest/resource corruption. Application database initialization continues to use the existing startup reset-and-create behavior; module management does not introduce a separate schema initializer.

## Deferred work

Package signatures, physical deletion protection based on scenario/session references, and the expanded-directory development loader are deferred to later changes.
