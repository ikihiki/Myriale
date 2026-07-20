# Module security

## Trust model

A C# module DLL is arbitrary executable code. `AssemblyLoadContext` provides dependency isolation and unloading, not a security boundary. The first runtime therefore accepts only built-in or administrator-approved trusted modules.

Untrusted third-party DLL support requires a separate worker process or container with operating-system resource and network restrictions. The runtime abstraction must permit that move without changing session contracts.

Module administration requires an Identity claim (`myriale:module-admin=true`) provisioned out of band. Public registration, email address matching, and ordinary authentication never grant module installation rights.

## UI boundary

Module JavaScript is isolated in an opaque-origin iframe with only `allow-scripts`. It has no direct access to the application DOM, cookies, authentication state, storage, forms, or Myriale APIs. A shell CSP denies direct fetch/subresource, frame, worker, media, object, and form access. The authenticated parent verifies and fetches package resources, then transfers source over a private `MessageChannel`; package code receives no resource URL or credentials.

The UI script belongs to the same administrator-approved trusted package as the C# DLL. Browser sandboxing protects application authority and credentials; it is not a containment boundary for deliberately malicious package UI. In particular, browser sandboxes permit a frame to navigate its own browsing context, which could disclose data already given to that trusted UI through a destination URL. The host detects any subsequent frame load, closes the channel, refuses to reconnect, and displays an error, but it does not claim to prevent deliberate exfiltration by an approved package. Untrusted UI requires a separately isolated origin and network policy outside this in-process package model.

The one bootstrap `postMessage` uses a wildcard target because opaque origins cannot be named, but the shell verifies `event.source === parent`, the embedded parent origin, and an unguessable per-frame capability before accepting the transferred port. The parent validates protocol version, execution ID, revision, enabled action ID, message size, and dispatch concurrency. A hostile UI can still consume CPU within the browser process; the iframe boundary protects application authority, not browser resource availability.

## Data and authority

The module receives snapshots rather than host services. It cannot directly write the database, generate authoritative random values, or apply session state changes. It returns state, events, and effect requests for host validation.

## Package validation

Package installation enforces safe archive extraction, file and expanded-size limits, one managed DLL, declared-resource allowlists, SDK compatibility, immutable digests, and explicit administrator enablement. Runtime resource delivery repeats canonical digest and resource-integrity checks before bytes are served.

Secrets, provider keys, server paths, and private scenario facts must never appear in module view state or client messages.
