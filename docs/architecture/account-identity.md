# Account and Identity orchestration

## Boundary

The Account domain owns profile and lifecycle policy. ASP.NET Core Identity remains the security authority for password hashing, password policy, reset tokens, application cookies, claims, optimistic concurrency stamps, and security-stamp invalidation. Application code does not reproduce those mechanisms.

`AccountEndpoints` binds HTTP contracts, passes the authenticated `ClaimsPrincipal`, invokes an Account command/query, and maps its typed outcome. Endpoint handlers do not receive `ApplicationDbContext`, `UserManager<ApplicationUser>`, or `SignInManager<ApplicationUser>`.

## Account state and aggregate

`AccountState` is a closed enum with exactly two values:

| Domain value | Wire value | Meaning |
|---|---|---|
| `Active` | `active` | The account may authenticate and update its profile. |
| `Withdrawn` | `withdrawn` | The account has completed withdrawal and cannot authenticate or update its profile. |

`ApplicationUser.Create`, `UpdateProfile`, `Withdraw`, and `IsWithdrawn` own the added account behavior. Display name, biography, dialogue-debug access, and withdrawal timestamp have no public setter. Withdrawal anonymizes the Identity email/username, clears profile data and debug access, applies permanent lockout, updates the Identity security stamp, and signs out the current cookie.

Identity's concurrency stamp is the authority when profile update and withdrawal race. A stale writer receives a conflict rather than silently overwriting the winner. Withdrawal wraps the user update and security-stamp update in one database transaction; failure to update the security stamp rolls back the account mutation.

## Application operations

The Account Application slice provides commands/queries for:

- register;
- login and logout;
- current account;
- profile update;
- request and confirm password reset;
- withdrawal.

`IAccountIdentityService` is the port used by those operations. `AspNetAccountIdentityService` is the Infrastructure implementation and is the only production Account component that directly coordinates `UserManager`, `SignInManager`, and the Identity database transaction.

## Password-reset transport and enumeration resistance

`POST /api/account/password-reset/request` always returns the same status and response body, whether the email is active, withdrawn, unknown, or blank. Its response contains only the generic message and has no reset-token field.

Generated tokens are sent through `IAccountPasswordResetTokenTransport`. Development and test hosts register an in-memory transport exposed to tests through `IDevelopmentAccountPasswordResetTokenStore`; production registers a separate transport boundary. A production delivery integration can replace that registration without changing the HTTP contract or exposing tokens to the browser.

Confirmation failures use a generic response so the reset endpoint does not reveal whether an account exists or is withdrawn.

## Enforcement

Tests cover aggregate profile validation, closed setters and state contracts, withdrawn login/profile rejection, duplicate-email registration races, profile/withdrawal optimistic concurrency, security-stamp failure rollback, reset enumeration resistance, and the endpoint dependency rule. Frontend types and Storybook fixtures use only `active` and `withdrawn`; legacy `unverified`, `suspended`, `pending`, and `deleted` account states are not supported.
