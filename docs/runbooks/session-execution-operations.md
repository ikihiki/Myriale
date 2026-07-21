# Session execution operations runbook

## Queue or worker outage

1. Check `myriale.session.execution.queue_depth`, `running`, `retry_wait`, and oldest queued age in the Aspire Dashboard/collector.
2. Search logs for structured `SessionId`, `ExecutionId`, `AttemptId`, trace ID, claim, retry, recovery, and publish decisions. Never paste player input or provider credentials into incidents.
3. Verify API health and that `SessionExecutionWorker` is running. Restarting is safe: queued rows remain durable and expired running leases are reclaimable.
4. Confirm the oldest running leases expire and are reclaimed once. Repeated lease expiry indicates a provider timeout, worker crash, or too-short lease.

## Provider outage and retry exhaustion

- Group failures by bounded error code/provider/model, not Session ID.
- Transient timeout/rate-limit/transport failures enter `retry-wait` with bounded exponential delay and jitter.
- Permanent validation/configuration errors fail immediately.
- After maximum attempts, the Execution remains `failed` beside its Input. Operators or players may retry only when capability says so.
- Never convert provider failure text into a Session Turn.

## Publish conflict or late completion

- A `session_advanced` result should end as `superseded` and publish no Turn.
- Check the Session head, accepted head, Execution revision, lease token, unique PlayerInput/SourceModuleTurn constraint, and committed Artifact.
- If a Turn already exists, normalize the Execution to success rather than publishing another Turn.
- Cancellation loses only when the publish transaction committed first; otherwise the invalidated lease prevents late publication.

## Trace and diagnostics

In Development, expand `開発者向け詳細`, copy the trace ID, and search the Aspire Dashboard. Correlate `session.input.accept`, `session.execution.run`, `ai.provider.request`, artifact persistence, and Turn publication. Production responses intentionally omit exception/lease/provider excerpts; use redacted telemetry instead.

Audit telemetry/log output for forbidden data: player text, full prompt/Narrative, credentials, Authorization/Cookie headers, raw provider response, Data Protection payload, and private Module state. Metric dimensions must never include Session/Input/Execution IDs or email.

## Note/image artifacts

- Note proposals do not update canon until apply/edit-apply succeeds with the expected revision. A revision conflict requires re-review.
- Image failure is partial success and must not remove Narrative.
- Verify MIME type, object size, dimensions, checksum, and moderation metadata before attaching an image.
- The authorized media endpoint must return 404 for another owner.
- Investigate objects without `SessionImage` rows and rows whose objects are missing. Remove expired objects through the retention worker; do not store binary/base64 in execution rows.

## Migration and rollback

PostgreSQL startup applies retained EF migrations; SQLite development/test startup uses non-destructive `EnsureCreated`. Startup never drops the schema or database file. Before deployment, back up the database and validate migration SQL. Legacy pending/handoff rows are retained during the compatibility window; do not allow old and new workers to claim the same work. Roll back the read path before rolling back schema. Preserve Request ID semantics and existing Turn chains.
