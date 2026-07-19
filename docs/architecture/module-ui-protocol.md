# Module UI protocol

## Isolation

Module UI is an optional JavaScript ES module that registers a Web Component. It runs inside a Myriale-owned sandboxed iframe, not in the application document. Myriale owns the shell document, Content Security Policy, asset URLs, and connection setup.

The module manifest can declare runtime, authoring, and result-summary UI entries. If authoring UI is absent, Myriale generates a form from the configuration field definitions.

## Communication

The iframe and host communicate over a `MessageChannel`. Messages are versioned and correlated by request ID.

Host-to-module messages include:

- initialization with locale, theme, view state, and available actions;
- accepted transitions;
- submitting, completed, and error states.

Module-to-host messages include:

- ready;
- dispatch with expected revision and a structured action;
- resize and diagnostic log requests.

The UI submits intent such as `use-action`; it cannot submit authoritative damage, HP, dice results, or completion status. The C# module produces those results.

## Data disclosure

Only module-generated view state and available actions are sent to UI. The complete session snapshot, hidden scenario facts, credentials, and author-only information remain on the server.

## Deferred work

The concrete message DTOs, iframe shell, CSP, asset endpoint, reconnect behavior, and theme tokens are implemented with the UI host.
