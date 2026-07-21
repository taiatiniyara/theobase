# ADR-0004: Self-Managed JWT Auth Without Third-Party Provider

**Status:** Accepted
**Date:** 2026-07-21

## Context

Theobase users are church officers and members — not a technical audience. Many do not have Google, Microsoft, or GitHub accounts. Auth must be simple, secure, and zero-cost.

## Decision

Use **email + password with Worker-issued JWTs**. The Worker handles login, token issuance, refresh, and password reset. JWT payload carries `{ sub: userId, orgId, orgLevel, role }` for downstream authorization. Password reset via one-time link sent through Cloudflare Email Routing. No third-party auth provider.

## Alternatives Considered

1. **Clerk / Auth0 / Supabase Auth** — Rejected because:
   - Recurring cost at scale (thousands of users across hundreds of churches).
   - Social login (Google, Microsoft) is unreliable for this audience.
   - Phone-based auth is regionally inconsistent.
2. **Cloudflare Access (SSO)** — Rejected. Requires enterprise identity provider; unsuitable for grassroots volunteers.
3. **Passwordless (magic link only)** — Rejected. Many users access email on the same device they'll use the PWA on, but email deliverability in developing regions is unreliable. Password fallback is necessary.

## Consequences

- **No recurring cost**: auth is just Worker CPU cycles and D1 rows.
- **Responsibility for security**: password hashing (bcrypt-compatible via Web Crypto), rate limiting on login/reset endpoints, token expiry, and secure cookie handling are application-level concerns. Must be tested thoroughly in Phase 5.
- **No immediate MFA**: adding MFA (TOTP, SMS) would require additional implementation. The architecture supports it — a `mfaEnabled` flag on the user row and TOTP secret — but it is deferred to a later phase.
