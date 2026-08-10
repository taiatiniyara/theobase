# ADR-0001: Cloudflare Platform

## Status

Accepted (2026-08-10)

## Context

Theobase is a global, offline-first church management platform for SDA grassroots operations, triggered by the Fiji Mission's financial tracking needs. We need to choose a deployment platform that satisfies:

- Global deployment to 215+ countries
- Offline-first operation with eventual consistency
- Multi-tenant data isolation per local church
- Strong consistency for financial records (dual-signoff counting room)
- Low operational overhead (no server management)

## Decision

Run entirely on Cloudflare:

- **Durable Objects** — one per local church. The authoritative state holder. Each DO owns its church's membership roll, giving records, and audit log. WebSocket sync protocol from the PWA.
- **D1** — SQL database for cross-church analytics and aggregate reporting at Conference/Union/Division level. Not the source of truth; populated from DO state snapshots.
- **R2** — object storage for member photos, document uploads, and archived financial reports.
- **Workers** — API layer routing requests to the correct church's DO.
- **Pages** — static PWA frontend deployment with service worker for offline support.
- **Queues** — async tasks: report generation, email notifications, batch sync propagation.
- **Email Routing** — transactional email to members (year-end receipts, announcements).

## Consequences

- No infrastructure to manage — fully serverless.
- Durable Objects provide exactly-once semantics appropriate for financial operations.
- DO's single-threaded-per-instance model simplifies the dual-signoff counting-room workflow (no distributed locking needed).
- Edge deployment gives low latency from any country.
- PWA with IndexedDB + DO WebSocket sync satisfies offline-first without a separate synchronization layer.
- D1 is suitable for reporting queries but not for transactional writes — the boundary is clean.
