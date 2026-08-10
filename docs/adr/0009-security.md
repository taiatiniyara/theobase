# ADR-0009: Security Model

## Status

Accepted (2026-08-10)

## Context

Theobase handles sensitive data: member PII (names, addresses, birth dates), financial records (tithe and offering amounts), and church governance data (membership state transitions). The platform must be secure by design. Compliance certification (SOC 2, etc.) is deferred — build secure first, certify later.

## Decision

### Data Integrity — Append-Only Event Log

Every DO mutation emits an event to an append-only log. Each event carries:
- The operation (e.g. `member.created`, `giving.batch.committed`)
- The payload (the Zod-validated data)
- The actor (`userId`)
- A cryptographic hash of the previous event (SHA-256, stored as hex)

The DO's current state is the cumulative result of replaying the event log. The D1 reporting layer recomputes aggregate figures from the same log. This makes tampering detectable: any modification to a committed event changes its hash, which breaks the chain. The audit trail is immutable by construction.

### Member PII — Data Isolation

| Level | Access |
|-------|--------|
| Local church officers (clerk, treasurer) | Full member details for their church only |
| Pastor | Full member details for churches in their district |
| Conference admin | Aggregate statistics only (counts, trends, totals). No individual member details. |
| Union/Division admin | Aggregate statistics only |

PII at rest is encrypted (Cloudflare D1, R2, and Durable Object Storage all use AES-256). In transit: HTTPS (TLS 1.3) enforced on all connections.

### JWT Security

- Magic link tokens: RS256 signed, 10-minute expiry, single-use (consumed on first validation, stored in Workers KV for the expiry window to prevent replay).
- Session JWTs: 7-day expiry. Refreshed transparently when >24h remain.
- Signing key rotation: keys stored in Cloudflare Secrets, rotated quarterly.
- On role change, all existing session JWTs for that user are revoked (tracked via a `tokenVersion` field on the user record — JWTs carry the version, DO rejects mismatches).

### DO Isolation

- DO ID namespace: `church:<churchId>`.
- Worker middleware extracts `churchId` from the JWT and the DO ID from the request path. Mismatch → 403 before the DO runs.
- A DO validates its own `churchId` on init, rejecting requests that bypass the Worker (defence in depth).

### Rate Limiting & Input Sanitisation

- Workers KV-based rate limiter: 5 login attempts per email per 15 minutes. 100 requests per IP per minute on the API.
- All DO inputs validated via Drizzle-zod schemas. No raw input reaches DO state.
- D1 queries use Drizzle's parameterised queries → no SQL injection surface.
- CORS: only `theobase.app`, `staging.theobase.app`, and `*.theobase.pages.dev` origins.

### Threat Model (Top Risks)

1. **Stolen magic link** — 10-min expiry + single-use. Attacker window is narrow. Rate limiting on `/auth/send-link` prevents email bombing.
2. **Compromised session JWT** — token version forced rotation on role change. 7-day max lifetime. No refresh token on disk.
3. **Malicious insider (church officer)** — dual-signoff on financial commits. Membership state changes are logged with actor identity. Audit trail is append-only and immutable.
4. **DO bypass via Worker exploit** — DO self-validates churchId on every request. Worker serves as the first gate, not the only gate.
5. **D1 reporting data tampering** — D1 is derived from DO event logs, not a separate write path. Discrepancy between DO state and D1 state surfaces on the next reporting cycle.

## Consequences

- The append-only event log is the single most important architectural decision. It makes auditability a property of the system, not a feature to add later.
- PII isolation at the Conference aggregate boundary means the Conference dashboard gets powerful analytics without exposure to individual member data. This is both a security and a privacy decision.
- No compliance certification in v1 means we ship faster but must be prepared to add certification controls (audit log export, access review reports) when a Conference requires it.
