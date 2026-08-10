# Database migration and reset runbook

## Supported startup mode

Myriale applies the repository's single EF Core `InitialCreate` migration with `Database.MigrateAsync` on normal API startup. Normal restarts are non-destructive: accounts, Scenarios, Sessions, Evaluation Sessions, invocation audit rows, reviews, and package data remain in the configured SQLite database or PostgreSQL schema.

This release intentionally has no upgrade or backfill path from the pre-migration schema. Before first deployment of this release, discard the old database/schema and start empty. The migration does not contain the removed `ScenarioAiEvaluationRun`, `ScenarioAiEvaluationCase`, or `ScenarioAiEvaluationAttempt` tables.

## One-time cutover reset

Use a dedicated database. Back up anything that must be retained outside Myriale, then perform exactly one of:

- SQLite: remove the old database file before startup.
- PostgreSQL: drop/recreate the Myriale-owned database or `public` schema using deployment credentials.
- Controlled application reset: set both `Database:ResetOnStartup=true` and `Database:ConfirmResetDataLoss=true` for one startup only. Immediately return both settings to `false`.

`ResetOnStartup=true` without the explicit confirmation fails startup. Never leave reset enabled in a normal deployment. After reset, startup applies `InitialCreate`, records `__EFMigrationsHistory`, and runs the idempotent account/scenario/module fixture seeds.

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
