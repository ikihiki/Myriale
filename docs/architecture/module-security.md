# Module security

## Trust model

A C# module DLL is arbitrary executable code. `AssemblyLoadContext` provides dependency isolation and unloading, not a security boundary. The first runtime therefore accepts only built-in or administrator-approved trusted modules.

Untrusted third-party DLL support requires a separate worker process or container with operating-system resource and network restrictions. The runtime abstraction must permit that move without changing session contracts.

Module administration requires an Identity claim (`myriale:module-admin=true`) provisioned out of band. Public registration, email address matching, and ordinary authentication never grant module installation rights.

## UI boundary

Module JavaScript is isolated in a sandboxed iframe. It has no direct access to application DOM, authentication state, or Myriale APIs. Network access is denied by the module shell policy; communication occurs through the versioned host protocol.

## Data and authority

The module receives snapshots rather than host services. It cannot directly write the database, generate authoritative random values, or apply session state changes. It returns state, events, and effect requests for host validation.

## Package validation

Later package installation work must enforce safe archive extraction, file and expanded-size limits, one managed DLL, declared-resource allowlists, SDK compatibility, immutable digests, and explicit administrator enablement.

Secrets, provider keys, server paths, and private scenario facts must never appear in module view state or client messages.
