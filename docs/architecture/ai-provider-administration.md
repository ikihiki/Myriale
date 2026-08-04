# AI provider administration architecture

AI provider administration is split into three independent boundaries: the completed active-provider selection aggregate, provider profile definitions, and credentials. The split is intentionally destructive; the former AI keys route, mixed profile/key DTO, legacy catalog parser, and selection compatibility store do not exist.

## Domain and persistence

`AiProviderProfile` owns `AiProviderProfileId`, OpenAI-compatible endpoint/model metadata, the referenced `AiCredentialId`, enabled state, `Revision`, and `UpdatedAt`. `AiCredential` owns encrypted secret material, a non-secret hint, identity, and revision. Both aggregates validate creation, expose private setters, require expected revisions for mutation, and use EF optimistic-concurrency tokens.

Connection validation is stored as `AiProviderProfileValidation`. Each record is fenced by profile ID/revision and credential ID/revision, so replacing a credential or editing a profile makes an older result `Untested` for the current snapshot rather than transferring validity to a different connection.

`IAiProviderProfileRepository` and `IAiCredentialRepository` are focused write/read ports. Their EF implementations normalize unique-create and stale-write failures to conflict outcomes. Credential deletion is rejected while a database or deployment-owned profile references it. Disabling or deleting the active database profile is rejected; changing the active profile remains the responsibility of the existing activation command.

## Runtime resolution

`IAiDeploymentProfileSource` reads typed `AiDeployment:Profiles` configuration. Database definitions override deployment definitions with the same profile ID. `IAiProfileCatalog` is the runtime profile registry and exposes descriptors without secrets.

`IAiRuntimeCredentialResolver` resolves typed `AiDeployment:Credentials` first and encrypted database credentials second. Deployment-owned secrets therefore retain precedence without being copied into descriptors, queries, HTTP responses, logs, or frontend state. Runtime tuning remains under `AiProvider`; runtime adapter selection is under `AiRuntime`.

## Application and HTTP

Profile commands create, update, enable, disable, and delete definitions. Credential commands set, replace, and delete secrets. Every update/delete request carries an expected revision. Connection and prompt tests carry both the profile and credential revision, recheck the fence after provider I/O, and return conflict if either resource changed.

The admin snapshot query combines deployment and database profile definitions, credential availability/source, active state, references, and the latest validation valid for the current revision fence. `AiAdminEndpoints` receives application services only; it has no `ApplicationDbContext` dependency.

Routes:

- `/api/admin/ai-profiles`
- `/api/admin/ai-credentials`
- `/api/admin/ai-profiles/{id}/connection-tests`
- `/api/admin/ai-profiles/{id}/prompt-tests`

The frontend mirrors the split with separate Profile and Credential forms/tables. It carries revisions through edits, state transitions, deletion, and tests. Storybook covers replacement and profile-scoped connection testing.
