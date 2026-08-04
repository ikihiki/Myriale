# Destructive schema baseline runbook

## Current supported mode

Myriale currently supports a **destructive development/test baseline only**. Compatibility with an existing database is not provided.

- `Database:RecreateOnStartup` must remain `true`.
- SQLite startup deletes the configured database before `EnsureCreated` builds the current model.
- PostgreSQL startup drops and recreates only the Myriale-owned `public` schema, then runs `EnsureCreated`.
- Every API restart destroys application and Identity data, including Scenarios, Sessions, accounts, database-managed AI profiles/credentials, execution history, artifacts, and package catalog rows.
- Startup fails fast if `Database:RecreateOnStartup=false`; this prevents `EnsureCreated` from silently accepting a stale database.

Do not point the current application at a shared PostgreSQL database whose `public` schema contains objects owned by another application. Use a dedicated database and credentials with ownership limited to that database/schema.

## Development reset

1. Back up any fixture or authoring data that must be retained outside the database.
2. Confirm `Database:RecreateOnStartup=true`.
3. Start the API once.
4. Confirm seed/bootstrap logs and smoke-test the expected Scenario and Module catalog.
5. For PostgreSQL-specific conformance and locking tests, set `MYRIALE_TEST_POSTGRES` to an administrative connection string that may create/drop temporary databases, then run the backend suite.

## Production prerequisite — not yet delivered

Persistent production deployment is **not supported** until all of the following are implemented and reviewed:

1. An EF Core baseline migration and a migration for each subsequent schema change.
2. Clean-apply tests on SQLite and PostgreSQL.
3. Upgrade tests from every supported deployed schema version on both providers.
4. Backup and restore verification using production-equivalent data volume.
5. A deployment sequence that handles mixed application versions or explicitly prevents them.
6. A rollback policy. For destructive changes, prefer restore or a tested forward-fix rather than claiming automatic downgrade safety.
7. Operational ownership, monitoring, timeout, locking, and failure-recovery procedures for migration execution.
8. Removal of the startup rejection for `Database:RecreateOnStartup=false` only after the application applies or verifies migrations safely.

Until those items exist, no document or deployment configuration should describe Myriale as ready for persistent production data.

## Domain-event durability limitation

The current Scenario Definition publication event is dispatched synchronously after the database save. Its only production reaction is structured logging; tests register an in-memory recorder when verifying dispatcher behavior. Delivery is non-durable and has no replay, retry, dead-letter, or cross-process guarantee.

Do not attach critical external side effects such as email, billing, messaging, webhooks, or durable audit export to this dispatcher. Introduce a transactional Outbox with versioned event envelopes, an idempotent dispatcher, retry/dead-letter handling, and operational monitoring before such reactions are added.
