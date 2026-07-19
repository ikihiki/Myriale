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

Development environments may load an expanded directory. Production packages use the `.myriale-module` extension and ZIP encoding.

## Identity

A package is identified by module ID, semantic version, and SHA-256 digest. Published scenario versions and active executions pin all three values. A package with the same ID and version but a different digest is rejected outside development.

## Assembly contract

`module.dll` contains one module and declares its entry point with `MyrialeModuleEntryPointAttribute`. It implements `IMyrialeModule` from `Myriale.ModuleSdk`. The SDK and framework assemblies are supplied by the host; module-specific dependency assemblies are not supported in the first version.

There is no required JSON manifest. The host loads the trusted assembly during installation and obtains a serializable `ModuleManifest` C# object. The validated manifest is cached for catalog queries.

## Deferred work

Package scanning, safe ZIP extraction, signature verification, catalog persistence, enable/disable operations, and package deletion protection are implemented in later changes.
