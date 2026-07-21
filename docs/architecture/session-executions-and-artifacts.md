# Session executions and artifacts

## Boundary

Session processing follows four durable concepts:

> Input is a fact. Execution is a process. Artifact is a result. Turn is published canon.

- `SessionPlayerInput` is immutable at acceptance and remains visible after provider failure, cancellation, retry, or Session advancement.
- `SessionExecution` is the mutable, owner-scoped lifecycle for `narrative`, `module-handoff`, `note-proposal`, and `image` work.
- `SessionExecutionAttempt` is append-only provider/worker diagnostic history.
- `SessionArtifact` is a typed result envelope. Only validated, committed artifacts may update typed domain records.
- `SessionTurn` contains only successfully published Narrative or Module canon. Operational errors are never Turns.

The Session API returns separate collections plus an ordered causal `activity` projection. Persistence is not flattened into a single event table.

## Acceptance, idempotency, and publication

`POST /api/sessions/{sessionId}/inputs` validates owner/session state, computes a normalized payload hash, then creates `SessionPlayerInput` and queued `SessionExecution` in one transaction. `(SessionId, RequestId)` and `(SessionId, IdempotencyKey)` are unique. Replays return the same resources; a different payload returns `409 idempotency_key_reused`.

A worker claim moves eligible queued, retry-wait, or expired-running work to running, assigns a lease owner/token/expiry, increments the fencing revision, and appends an Attempt. Publication verifies the running status, lease token, accepted Session head, and unique Turn/Artifact guards. A late worker cannot publish after cancellation, lease replacement, or Session advancement. Session advancement produces `superseded`; it does not create an error Turn.

Allowed statuses are `queued`, `running`, `retry-wait`, `cancel-requested`, `succeeded`, `failed`, `cancelled`, and `superseded`. Retry uses bounded exponential delay with jitter and a maximum attempt count. Retry/cancel/dismiss endpoints are idempotent and owner-scoped.

## Artifact-specific domains

Narrative text is committed as a `narrative-text` artifact before/with its canonical `SessionTurn`. Note generation is represented by `note-proposal` Execution, `note-patch` Artifact, `SessionNoteProposal`, `SessionNote`, and append-only `SessionNoteRevision`. Apply and edit-apply require the expected Note revision; reject and snooze never change canon. There is intentionally no note AI handler/provider in this implementation.

Images use `image` Execution, `SessionArtifact`, and `SessionImage`. Binary data is stored through `ISessionObjectStorage`; the database stores the authorized storage key, MIME type, size, dimensions, checksum, and moderation metadata. The media endpoint verifies Session ownership. Retention cleanup removes expired objects. Image failure never rolls back Narrative. There is intentionally no image AI handler/provider.

## Diagnostics and telemetry

`IHostEnvironment.IsDevelopment()` is the only diagnostics gate. Development responses may include safe lease hints, Attempt metadata, provider/model IDs, timing/token counts, exception type chains, redacted excerpts, and trace/span IDs. Production omits the entire diagnostics object. Credentials, headers, full prompts, raw provider responses, and private Module state are forbidden in every environment.

`Myriale.SessionExecution` supplies ActivitySource and Meter instrumentation for acceptance, execution, provider, artifact, and Turn publication. Metrics use bounded labels only (`kind`, `status`, provider/model, normalized error code); Session/Input/Execution IDs and player text are never metric labels. The API stores W3C trace parent information so worker work remains causally linked after the request ends. OTLP export is enabled by ServiceDefaults when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured; exporter failure must not affect domain commits.

## UI and accessibility

`SessionActivityFeed` renders `SessionInputItem`, `SessionExecutionItem`, `NarrativeTurnItem`, `NoteProposalItem`, and `ImageArtifactItem` as separate DOM elements. The feed is a `role="log"`; active status uses polite status announcements, and terminal actionable failure uses `role="alert"`. Polling runs only while an active Execution exists and stops at terminal state. Retry updates one stable Execution slot. Reduced-motion styles disable nonessential animation.

## Retention

Player inputs and published Turns follow Session retention. Attempts and text artifacts are retained for operational diagnosis according to deployment policy. Image objects use `RetainUntil` and the cleanup worker. Dismiss is UI folding metadata, never deletion. Orphan detection and cleanup procedures are documented in the operations runbook.
