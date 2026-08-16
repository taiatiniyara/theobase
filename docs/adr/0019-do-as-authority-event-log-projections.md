# Per-unit Durable Objects own an append-only event log; D1 projects from it

Each grassroots unit (church) owns a Durable Object that is its authoritative write source. The DO holds an append-only event log with a SHA-256 hash chain — every membership and finance event, each carrying its date, author, and evidence (ADR-0007, ADR-0009). The DO's live state is a materialized view of that log, rebuildable from it. D1 holds relational projections derived from the log, serving the online read surfaces: the mission office, reporting, and the read-only cross-tenant aggregates for union/division/GC (ADR-0008). Evidence blobs (deposit slips, receipts) live in R2 and are referenced immutably from the log.

The offline PWA keeps a local write-ahead log in IndexedDB and flushes it to the unit's DO over WebSocket when connectivity appears — the DO is the authority, and the device is eventually consistent (ADR-0002). A version header on the DO forces a stale PWA to reload on a major bump.

We chose this because ADR-0007 requires rolls and balances to be derived, not entered, and offline-first (ADR-0002) requires a single authoritative owner per unit so two devices cannot double-write the same event. A central relational store cannot be that authority for an offline device; a per-unit DO can.

## Consequences

- Corrections are correcting events, never edits to the log (ADR-0007); the hash chain makes tampering detectable (ADR-0009).
- Reporting is a projection over the log, never a hand-maintained table.
- The mission office and operator read D1, never per-church DOs directly — aggregation is read-only and cross-tenant for levels above the conference (ADR-0008).
