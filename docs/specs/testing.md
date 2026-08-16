# Testing Strategy

Five seams (from #221): E2E (Playwright), DO interface (Vitest + `@cloudflare/vitest-pool-workers`), Worker middleware (Vitest), PWA components (Vitest + RTL), Drizzle schema (Vitest). Test external behaviour at the highest possible seam.

## Key seams

- **DO interface** — the highest-value seam: dual-signoff and sync determinism (two offline devices converge, dispute, reconcile, idempotent replay).
- **Offline/sync** — the protocol is tested at the DO seam; offline is covered at the seam plus a thin Playwright smoke via service-worker interception. Do not try to test real 3G in CI.

## Fixtures

The demo seed (Suva Central, 120 members, 6 months of giving, 24 committed cash counts) doubles as the integration-test fixture.
