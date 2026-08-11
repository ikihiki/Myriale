# Evaluation execution worker operations

Evaluation attempts are durable queue rows. A claim transaction writes the attempt lease/fence and its `EvaluationModelInvocation` `Started` row before the provider call begins. PostgreSQL claims a bounded batch with `FOR UPDATE SKIP LOCKED`, so concurrent workers receive disjoint attempts instead of rolling back an entire colliding batch. SQLite retains the same lease and invocation behavior for local development and tests.

While a provider call is running, `EvaluationExecutionWorker` renews the lease approximately every third of the configured `EvaluationWorker:LeaseSeconds`, bounded between 50 milliseconds and 30 seconds. Keep the lease longer than normal database stalls; provider timeout may remain much longer because heartbeat prevents healthy calls from being reclaimed.

Finalization requires the exact attempt ID, lease token, lease-generation revision, running status, and an unexpired lease. If heartbeat or the final fence check fails, the provider call is cancelled. A late provider response/error may enrich only its original invocation, which is recorded as `unknownOutcome` with lease-loss audit metadata; it cannot mark the attempt successful or create machine judgments. The replacement worker owns the new invocation and is the only worker allowed to finalize the attempt.

Expired `Started` invocations become `unknownOutcome` with `lease_expired` when reclaimed. This is intentionally different from provider failure: the provider may have accepted or completed the request, but the old worker no longer owns the fence.

## Verification

- SQLite durability/concurrency coverage: `EvaluationExecutionReliabilityTests`.
- PostgreSQL disjoint batch claim coverage: `PostgresEvaluationExecutionIntegrationTests`.
- Set `MYRIALE_TEST_POSTGRES` to a PostgreSQL connection string to enable the opt-in PostgreSQL test.
- Migration history must remain one `InitialCreate`; worker reliability changes do not add schema.
