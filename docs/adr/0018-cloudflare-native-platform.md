# Theobase runs entirely on Cloudflare

Theobase runs entirely on Cloudflare: Workers for compute, Durable Objects for per-unit authoritative state, D1 for relational projections, R2 for evidence blobs, Queues for the sync-plus-rollup pipeline, Email Routing + Email Sending for the (minimal) email we handle, and Pages for the PWA/office shells. It is a pnpm-workspaces monorepo — `packages/shared`, `packages/worker`, `packages/web` — deployed to `theobase.app` (production) and `staging.theobase.app` (beta).

We chose Cloudflare because the offline-first, per-unit-authority shape (ADR-0002, ADR-0008) maps naturally onto it: a Durable Object gives each unit a single authoritative owner that two devices cannot double-write, D1 gives the mission office fast relational reads over the event log without touching per-church objects, and the edge gives the grassroots PWA a close sync endpoint wherever the church happens to be. The traditional alternative — a Postgres server behind an app server — was rejected because per-tenant isolation and global edge reach would have to be hand-built.

## Consequences

- Cloudflare is a deliberate lock-in (deployment target, database, storage). This is consistent with selling the *operated* service rather than the software (ADR-0012) — the moat is operation, and the stack is ours to run — but it means self-hosting (ADR-0012) means running Cloudflare too, which is unsupported.
- The frontend shells (PWA at the church, Tauri at the mission office) share one Worker backend and one D1 projection store; domain logic lives in `packages/shared` (ADR-0006).
- The sync-plus-rollup pipeline runs on Queues, not a live query against a central store (ADR-0002).
