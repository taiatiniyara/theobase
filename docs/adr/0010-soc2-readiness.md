# ADR-0010: SOC 2 Readiness

## Status

Accepted (2026-08-10)

## Context

SOC 2 certification is deferred (build secure, certify later) but the architecture must be SOC2-ready so we're not rebuilding when a Conference requires it.

## Decision

The architecture maps to the five SOC 2 Trust Service Criteria as follows:

### 1. Security

| Requirement        | Implementation                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication     | Magic link + JWT (ADR-0006)                                                                                                                               |
| MFA                | TOTP required for treasurer and counter roles (they handle money). Clerk and pastor may enable voluntarily.                                               |
| Session management | 7-day JWT with inactivity timeout (30 min idle → re-auth required for sensitive operations). Token version invalidation on role change.                   |
| Access logging     | Every DO mutation emits to the event log with actor, timestamp, and IP. A separate access log tracks all read operations (who viewed which member, when). |
| Encryption         | TLS 1.3 in transit. AES-256 at rest (Cloudflare D1, R2, DO Storage).                                                                                      |

### 2. Availability

| Requirement                    | Implementation                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTO (Recovery Time Objective)  | < 1 hour. DO state is reconstructed by replaying the event log. D1 restored from point-in-time backup.                                                   |
| RPO (Recovery Point Objective) | < 5 minutes. DO event log is durably stored per write. D1 snapshots every 5 minutes.                                                                     |
| Backup                         | DO event log is the backup. D1: Cloudflare's built-in point-in-time recovery. R2: cross-region replication.                                              |
| Monitoring                     | Cloudflare Analytics + custom health checks on DO connectivity. Alert on: DO error rate spike, sync queue backlog > 10 minutes, auth failure rate spike. |
| Incident response              | Runbook documented in `docs/incident-response.md`.                                                                                                       |

### 3. Confidentiality

| Requirement         | Implementation                                                                                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data classification | `PII` (name, address, phone, email, DOB, photo), `Financial` (tithe/offering amounts, batch totals), `Governance` (membership status, offices held), `Public` (church name, aggregate stats). |
| PII isolation       | Conference and above see aggregates only. Individual PII visible only to church officers and pastor.                                                                                          |
| Log redaction       | Event log stores operation metadata (e.g. `member.email_updated`) but not the old/new values for PII fields. Financial amounts are logged (audit requirement).                                |
| Retention           | Giving records: 7 years (SDA policy). Member records: duration of membership + 3 years after removal. Access logs: 1 year. Login logs: 90 days.                                               |

### 4. Processing Integrity

| Requirement           | Implementation                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Input validation      | All DO inputs validated via Drizzle-zod schemas. No raw input reaches state.                                                                     |
| Completeness          | Sync protocol's FIFO queue guarantees no intent is silently dropped. Queue backlog monitoring alerts on stalls.                                  |
| Error handling        | DO rejects invalid intents with structured errors. Client surfaces errors with next-action guidance. No partial state — DO mutations are atomic. |
| Processing monitoring | Dashboard for Conference: processing health per church (sync latency, queue depth, error rate).                                                  |

### 5. Privacy

| Requirement         | Implementation                                                                                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data access request | Any member can request a full export of their data. Church clerk triggers the export from the member profile. Delivered as structured JSON/CSV within 48 hours.                                                                                                                                               |
| Data correction     | Clerk can correct PII fields. Corrections are logged.                                                                                                                                                                                                                                                         |
| Data deletion       | "Right to erasure": member can request anonymization. PII fields are overwritten with redacted placeholders. Giving records retain their financial amounts (7-year regulatory requirement) but are disassociated from the individual. A `redacted-member-<uuid>` placeholder preserves audit trail integrity. |
| Privacy policy      | Published at `theobase.app/privacy`. Explains what data is collected, why, who sees it, and how to exercise rights.                                                                                                                                                                                           |

## Consequences

- The event log redaction decision means we can't reconstruct PII from the event log alone — the current DO state is the only canonical source for PII fields. This is correct but means PII backups must capture the DO state, not just the event log.
- TOTP MFA for treasurer/counter roles adds UX friction at the point these roles are assigned. The tradeoff is acceptable — these roles handle money.
- Privacy compliance across 215 jurisdictions is complex. The GDPR-inspired baseline covers most cases, but country-specific requirements (e.g. data sovereignty) will need per-country policy overrides in v2+.
