# Module UI protocol

## Isolation

A runtime UI is an optional JavaScript ES module that registers one manifest-declared Web Component. Myriale runs it in an application-owned iframe with `sandbox="allow-scripts"`; `allow-same-origin`, forms, popups, downloads, top navigation, storage, and direct API access are not granted.

The iframe document uses a restrictive CSP: default, connect, media, object, frame, worker, base, and form sources are denied. The authenticated parent fetches verified package JavaScript and CSS, transfers their source over a `MessageChannel`, and the shell imports only a temporary Blob URL. Package source is never interpolated into `srcdoc`.

## Resource delivery

Runtime assets are execution-scoped and owner-authorized:

```text
GET /api/module-executions/{executionId}/ui/runtime/
GET /api/module-executions/{executionId}/ui/runtime/resources/{resourceId}
```

The descriptor exposes opaque resource IDs (`script`, `style-N`), the Web Component element name, content hashes, and exact pinned package identity. It never exposes filesystem paths, `module.dll`, configuration, context, private state, or recorded randomness.

Before serving bytes, the host requires the pinned package to remain installed and enabled, verifies the canonical package digest, and compares each expanded resource with the canonical ZIP entry. Responses use fixed JavaScript/CSS content types, `nosniff`, `no-store`, and a denying CSP so package disablement and authorization changes are revalidated.

## Communication

The initial parent-to-iframe window message transfers one `MessagePort`. Because the sandbox has an opaque origin, that one transfer uses a wildcard target; the shell accepts it only from `parent`, only when the sender origin equals the embedded parent origin, and only when an unguessable per-frame capability matches. Invalid early messages do not consume the listener. The parent never reconnects after a frame navigation. All subsequent communication uses the private port.

Protocol v1 envelopes carry the protocol name, version, execution ID, message type, and payload. Host-to-shell messages include resource loading, initialization, accepted transitions, submission state, and errors. Shell-to-host messages include ready, fatal bootstrap errors, dispatch intent, and bounded resize requests. Import or custom-element construction failures close the channel and expose a host-owned retry control.

The shell delivers state to the Web Component as `myriale:state` custom events. A component requests an action by emitting `myriale:dispatch` with the expected revision and a structured `{ id, payload? }` action. Myriale validates protocol/version/execution, current revision, enabled action ID, message size, and one-in-flight-dispatch before generating its own server request ID.

## Data and authority

Only locale, safe theme tokens, execution status/revision, module-generated view state, available actions, outcome summary, errors, and transient UI events cross into the iframe. Complete session state, module state, configuration, context, credentials, and hidden scenario facts remain outside.

The UI submits intent only. It cannot submit authoritative damage, HP, dice results, random values, completion status, effects, or outcomes. The C# module and host validate all authoritative results.

## Recovery

Reloading the route creates a new iframe and initializes it from the durable execution snapshot. Transient UI events are not replayed by a normal GET. Dispatch retries reuse the server-side idempotency behavior; revision conflicts adopt the latest returned execution but never automatically resubmit stale intent. Completed, unauthorized, unavailable, disabled, corrupt, and headless-module states are rendered by the host rather than unverified package code.

Authoring and result-summary UI hosts, a separate UI origin, richer action schemas, and generic media resources remain deferred.
