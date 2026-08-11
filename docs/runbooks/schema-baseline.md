# Database migration and reset runbook

## Supported startup mode

Myriale applies the repository's single EF Core `InitialCreate` migration with `Database.MigrateAsync` on normal API startup. Normal restarts are non-destructive: accounts, Scenarios, Sessions, Evaluation Sessions, invocation audit rows, reviews, and package data remain in the configured SQLite database or PostgreSQL schema.

This release intentionally has no upgrade or backfill path from the pre-migration `EnsureCreated` schema. On startup, Myriale inspects database metadata before migration:

- An empty database/schema is migrated normally.
- If any table from the current application model exists but `__EFMigrationsHistory` does not, startup identifies the database as the pre-migration schema, deletes the SQLite database or current PostgreSQL schema once, and then applies `InitialCreate`.
- If `__EFMigrationsHistory` exists, startup never performs this automatic reset; normal migration/restart behavior preserves data.
- PostgreSQL startup serializes the detection/reset/migration sequence with an advisory lock so concurrent replicas cannot repeat the cutover.

The automatic cutover permanently deletes all pre-migration data. Back up anything that must be retained outside Myriale before deploying this release. The migration does not contain the removed `ScenarioAiEvaluationRun`, `ScenarioAiEvaluationCase`, or `ScenarioAiEvaluationAttempt` tables.

## Explicit reset

Operators can still request a controlled destructive reset by setting both `Database:ResetOnStartup=true` and `Database:ConfirmResetDataLoss=true` for one startup only. Immediately return both settings to `false`.

`ResetOnStartup=true` without the explicit confirmation fails startup. Never leave reset enabled in a normal deployment. An explicitly confirmed reset applies even to a migrated database. After either automatic cutover or explicit reset, startup applies `InitialCreate`, records `__EFMigrationsHistory`, and runs the idempotent account/scenario/module fixture seeds.

## Verification

1. Confirm `__EFMigrationsHistory` contains one row ending in `_InitialCreate`.
2. Confirm Evaluation tables exist and no table name begins with `ScenarioAiEvaluation`.
3. Create an Evaluation Session, restart the API without reset flags, and confirm it remains.
4. Confirm workers resume queued or lease-expired evaluation/session execution rows.
5. For PostgreSQL conformance tests, set `MYRIALE_TEST_POSTGRES` to an administrative connection string that may create and drop isolated temporary databases.

## Rollback

There is no automatic downgrade or legacy-data restore. Roll back by restoring a database backup compatible with the application version being restored, or deploy a tested forward fix.

## Domain-event durability limitation

Scenario Definition publication events remain synchronous and non-durable. Do not attach critical external effects without a transactional outbox, idempotent dispatcher, retry/dead-letter handling, and monitoring.
