# ADR-0002: Online-First Architecture with Offline Caching

**Status:** Accepted
**Date:** 2026-07-21

## Context

Many SDA churches operate in areas with unreliable internet. The PRD requires offline data entry. The stack is Cloudflare Workers + D1, which is inherently online.

## Decision

Use an **online-first** architecture: the Worker + D1 is the source of truth. The PWA client uses a Service Worker for aggressive caching (reads served from cache, writes cached and queued to network). When offline, data entry continues locally; changes sync when connectivity returns.

## Alternatives Considered

1. **Offline-first (client as source of truth)** — Client stores data in IndexedDB as the primary store, server is a replication target. Rejected because:
   - Fights the stack (Workers + D1 are server-primary).
   - Conference/Union officers need near-real-time aggregates. If data sits on a clerk's device for days, the "channel data up" promise breaks.
   - Sync protocol complexity is high (CRDTs, vector clocks, conflict resolution) for low benefit given the access pattern (one clerk, one church, one device is the norm).
2. **Pure online (no offline)** — Rejected. Offline capacity is a core requirement for remote churches.

## Consequences

- **Data freshness**: upstream officers always see server state, which is the best available data.
- **UX during offline**: the PWA feels responsive (cached reads, instant local writes). The user may not notice they lost connectivity.
- **Sync conflicts**: handled by last-write-wins with a server-side audit log. Safe because concurrent edits to the same church by different users are rare.
- **Sync queue**: the client must maintain a queue of pending writes in IndexedDB. On reconnect, the queue is drained in FIFO order. Failed writes (e.g., 409 Conflict) are surfaced to the user in an inbox.
