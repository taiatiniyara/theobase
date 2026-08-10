# ADR-0006: Authentication — Magic Links + JWT

## Status

Accepted (2026-08-10)

## Context

Theobase serves non-technical church officers. Passwords mean forgotten credentials, reset workflows, and support tickets. OAuth requires third-party integration that may not be available in every country. Authentication must be self-teaching, work offline, and enforce role-based access at the DO boundary.

## Decision

**Magic links with signed JWTs, enforced by Worker middleware and DO role checks.**

### Login Flow

1. User enters email on the login screen.
2. Worker generates a signed JWT (RS256, 10-minute expiry, single-use) and emails it via Cloudflare Email Routing as a login link: `https://theobase.app/auth?token=<jwt>`.
3. User clicks link. Worker validates JWT, sets an httpOnly secure cookie with a long-lived session JWT (7-day expiry).
4. PWA stores the session JWT in a non-httpOnly cookie for offline header attachment.
5. Every subsequent DO call includes `Authorization: Bearer <jwt>`.

### JWT Payload

```typescript
{
  sub: string; // userId
  churchId: string; // the user's home church
  role: string; // 13 roles — see CONTEXT.md permission matrix
  tokenVersion: number; // incremented on role change or forced logout
  iat: number;
  exp: number;
}
```

### Role Assignment

- The first officer to register a church becomes **clerk** by default.
- The clerk sends role invites: "Add counter" → enter email → system generates a role-specific invite link.
- Invite link carries the target role. Invitee clicks, JWT gains that role for that church.
- One user can hold multiple roles across multiple churches (pastor serving a district).
- The PWA UI context-switches based on active church + role.

### Enforcement

- **Worker middleware**: validates JWT signature and expiry on every request. Rejects expired or malformed tokens before they reach the DO.
- **DO role check**: on each mutation, the DO verifies `role` against the operation. Counters can't edit member records. Clerk can't commit financial batches.
- **Double-check**: the DO re-validates the JWT even though the Worker did — defence in depth.

### Offline

- Session JWT cached in IndexedDB. Used for local auth UI (show/hide features based on role) and attached to queued intent headers.
- If the JWT expires while offline, the user sees a "Session expired — reconnect to sign in" banner. Queued intents are preserved.

## Consequences

- No password database to breach.
- No password reset workflow to build or support.
- Email deliverability is the single point of failure. In countries where email access is limited, this becomes a bottleneck. Future mitigation: SMS magic links as an alternative channel.
- A stolen magic link is valid for 10 minutes. The mitigation is single-use tokens (consumed on first validation) and rate limiting on the `/auth/send-link` endpoint.
