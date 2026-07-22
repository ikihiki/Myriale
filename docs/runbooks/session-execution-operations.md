# Session execution operations runbook

## Queue or worker outage

1. Check `myriale.session.execution.queue_depth`, `running`, `retry_wait`, `oldest_queued_age`, and `stuck` in the Aspire Dashboard/collector. Gauges are cached database samples; the default refresh is 15 seconds (`SessionExecutionMetrics:SampleIntervalSeconds`) and stuck age is 600 seconds (`SessionExecutionMetrics:StuckAfterSeconds`).
2. Search logs for structured `SessionId`, `ExecutionId`, `AttemptId`, trace ID, claim, retry, recovery, and publish decisions. Never paste player input or provider credentials into incidents.
3. Verify API health and that `SessionExecutionWorker` is running. Restarting is safe: queued rows remain durable and expired running leases are reclaimable.
4. Confirm the oldest running leases expire and are reclaimed once. Repeated lease expiry indicates a provider timeout, worker crash, or too-short lease.

## Provider outage and retry exhaustion

1. Confirm the outage from `myriale.ai.provider.requests` grouped only by `myriale.provider.status`, `error.type`, `ai.provider.name`, and `ai.model.name`. Correlate spikes in `timeout`, `rate_limited`, `provider_unavailable`, and `schema_failure` with `myriale.ai.provider.retries`, latency, and token histograms. Do not add Session, Input, Execution, prompt, or response content as metric dimensions.
2. Check the configured provider status page and the bounded structured logs. For 429, honor `Retry-After` and reduce traffic before retrying. For provider 5xx/timeouts, allow the bounded provider retry and durable Execution retry policies to run; do not repeatedly trigger manual retries during an active incident.
3. If failures are sustained, disable new real-provider traffic or switch `AiProvider:Provider` to the approved fallback, then restart through the normal deployment path. Never put credentials in configuration committed to Git, incident chat, command history, or screenshots.
4. Verify recovery with a connection probe or the opt-in sanitized evaluation below before restoring normal traffic. Confirm the success counter recovers and queue age declines. A cold provider may require several minutes before the first successful response.
5. Permanent validation/configuration errors fail immediately. After maximum attempts, the Execution remains `failed` beside its Input; operators or players may retry only when capability says so. Never convert provider failure text into a Session Turn.

### Opt-in real-provider evaluation

The normal test suite never requires a real provider. Run the evaluation only in a dedicated secret-enabled environment by setting `AI_EVAL_ENABLED=true` together with `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, and, when required, `AI_BASE_URL`. Before any measured repetition, the production gate sends a fixed sanitized structured-output probe and requires a usable response. It retries only timeout, provider-unavailable, and rate-limit failures. `AI_EVAL_WARMUP_ATTEMPTS` defaults to 3, `AI_EVAL_WARMUP_TIMEOUT_SECONDS` defaults to 600 seconds per attempt, and `AI_EVAL_WARMUP_BACKOFF_SECONDS` defaults to 15 seconds with exponential backoff; these defaults are intended to tolerate a several-minute Runpod cold start. If warmup does not succeed, the gate fails as provider unavailable and performs no measured runs.

`AI_EVAL_TIMEOUT_SECONDS` defaults to 900 seconds for each measured request, `AI_EVAL_REPETITIONS` is fixed to a minimum of 3, and `AI_EVAL_PROVIDER_ATTEMPTS` defaults to 2. The production floors remain fixed at 95% schema success, 90% quality success, 95% signal accuracy, and at least 2 of 3 schema and quality successes for every case. Warmup is never counted in those rates, and measured failures after warmup are never excluded or forgiven. `AI_EVAL_CASES` is not supported by the production gate, and `AI_EVAL_REPORT_PATH` selects the JSON output path. The Runpod adapter disables Qwen3 thinking so hidden reasoning does not consume the structured-output completion budget; this improves compatibility but does not waive the schema-success gate.

Run only the evaluation category with `dotnet test backend/tests/Myriale.Api.Tests/Myriale.Api.Tests.csproj --filter Category=RealProviderEvaluation`. The JSON report contains case IDs, provider/model, prompt/context/dialogue versions, execution time, repetitions, schema/quality/signal rates, measured latency, provider attempts, token totals, and only the warmup configuration, attempt durations, total duration, and sanitized error codes. It intentionally excludes API keys, base URLs, player text, prompts, narrative output, provider response bodies, endpoints, credentials, and request/response IDs. Treat even this sanitized report as operational data and apply the environment's normal retention and access controls.

## Publish conflict or late completion

- A `session_advanced` result should end as `superseded` and publish no Turn.
- Check the Session head, accepted head, Execution revision, lease token, unique PlayerInput/SourceModuleTurn constraint, and committed Artifact.
- If a Turn already exists, normalize the Execution to success rather than publishing another Turn.
- Cancellation loses only when the publish transaction committed first; otherwise the invalidated lease prevents late publication.

## Trace and diagnostics

In Development, expand `開発者向け詳細`, copy the Attempt trace ID, and search the Aspire Dashboard. The trace ID must match the root input-acceptance trace and contain `session.input.accept`, `session.execution.run`, `ai.provider.request`, the outbound provider HTTP span, the provider service span, and publication work. Verify the same execution in Structured Logs and confirm `Myriale.SessionExecution` counters, histograms, and cached gauges are present under Metrics. Production responses intentionally omit exception/lease/provider excerpts; use redacted telemetry instead.

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to export traces, metrics, and logs. Do not combine signal-specific `AddOtlpExporter` registration with cross-cutting `UseOtlpExporter`; ServiceDefaults uses the cross-cutting exporter once for all signals. Verify resource fields `service.name`, `service.version`, `deployment.environment.name`, and (when supplied through `GIT_COMMIT_SHA`, `SOURCE_VERSION`, or `OpenTelemetry:Resource:GitCommitSha`) `vcs.ref.head.revision`. Configure head sampling with `OpenTelemetry:Tracing:Sampler` (`always-on`, `always-off`, or `parent-based-ratio`) and `OpenTelemetry:Tracing:Ratio`; use collector configuration for tail sampling.

Audit telemetry/log output for forbidden data: player text, full prompt/Narrative, credentials, Authorization/Cookie headers, raw provider response, Data Protection payload, and private Module state. Metric dimensions must never include Session/Input/Execution IDs or email. Prompt, received result, and validation payloads are allowed only inside the Development-gated Session Execution diagnostics response and its bounded/redacted Attempt storage; they must not be emitted to logs, traces, metrics, or Production responses.

## Note/image artifacts

- Note proposals do not update canon until apply/edit-apply succeeds with the expected revision. A revision conflict requires re-review.
- Image failure is partial success and must not remove Narrative.
- Attach an existing image Execution/Attempt through authenticated `POST /api/session-artifacts/images/attach`. The endpoint accepts PNG only and verifies signature, configured `SessionImages` byte/dimension limits, SHA-256 checksum, and `ModerationDecision=approved` before committing storage and database rows.
- The authorized media endpoint must return 404 for another owner.
- `SessionArtifactRetentionWorker` lists storage every `SessionImages:ReconciliationIntervalMinutes`, removes rows/objects past `RetainUntil`, and deletes unreferenced objects only after `SessionImages:OrphanGraceMinutes`. Search `session.artifact.reconcile` logs for `ExpiredDeleted`, `OrphansDeleted`, and `MissingObjects`; investigate missing objects before repairing or removing their database rows.
- Development uses the deterministic note + one-pixel PNG Session fixture when `SessionArtifactFixture:Enabled=true`. Test hosts opt in with `SessionArtifactFixture:EnableInTestHost=true`. Disable the fixture outside development/demo environments.

## Database initialization

PostgreSQL、SQLiteともに起動時はEntity Framework Coreの`EnsureCreated`で現在のschemaを作成する。既存schemaのupgradeやbackfillは行わないため、model変更時は開発・Preview環境のdatabaseを再作成する。Session Executionの運用開始前に空のdatabaseであることを確認する。
