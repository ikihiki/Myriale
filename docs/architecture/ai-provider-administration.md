# AI provider administration architecture

The active runtime provider is the first DDD/CQRS-lite slice of AI provider administration. Provider profile definitions and credential storage remain existing infrastructure-owned resources; this slice intentionally does not aggregate them or change the OpenAI-compatible transport.

## Write boundary

`AiProviderRuntimeSettings` is the singleton aggregate for runtime selection. It owns `ActiveProvider`, `Revision`, and `UpdatedAt`; activation is performed through `Activate`, and mutable state is not publicly settable. `Revision` is an EF optimistic-concurrency token.

`ActivateAiProviderUseCase` resolves the requested profile, verifies that its configured or database credential is available, loads or creates the singleton through `IActiveAiProviderSettingsRepository`, applies the transition, and saves it. Outcomes distinguish unknown profiles, missing credentials, and concurrency conflicts. The optional `expectedRevision` request field provides client-side stale-write detection while requests that omit it remain compatible.

`EfActiveAiProviderSettingsRepository` owns tracked singleton load/create/save behavior. A stale update and the primary-key race between simultaneous first creates both become a stable conflict rather than an unhandled database error.

## Read and compatibility boundaries

`ActiveAiProviderQueryService` contains runtime fallback policy independently of writes:

1. use a persisted selection when it still resolves;
2. otherwise use the legacy `AiProvider:Provider` configuration when it is non-mock and resolves;
3. otherwise use the catalog narrative default.

`IActiveAiProviderSettingsReader` supplies the persisted projection without tracking. Existing provider consumers continue to use `IAiProviderSelectionStore`; `DbAiProviderSelectionStore` is now a compatibility adapter over the query and activation use cases.

The activation endpoint binds the existing route and response contract, invokes the command, maps stale writes to HTTP 409, and obtains its response projection from `AiProviderAdministrationQueryService`. It no longer receives `ApplicationDbContext`.

## Deliberate next steps

- Profile definition commands and queries remain in the existing admin endpoint and catalog service.
- Credential lifecycle remains in `IAiCredentialStore`.
- Transport adapter extraction and account-domain changes are out of scope.
- Existing configuration fallback and all `IAiProviderSelectionStore` consumers remain supported.
