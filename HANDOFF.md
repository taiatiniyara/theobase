# Theobase Handoff — 2026-06-19 (Final)

## Phase 3 Complete — 20 SvelteKit Pages, All 23 Issues Covered

## SvelteKit PWA pages (20 routes)

| # | Route | Feature | Access |
|---|-------|---------|--------|
| 1 | `/` | Login (magic link) | Public |
| 2 | `/auth/verify` | Token verification | Public |
| 3 | `/dashboard` | Giving summary, treasury balance, quick actions | Member+ |
| 4 | `/me` | Profile view/edit | Member+ |
| 5 | `/receipts` | Submit receipt + history | Member+ |
| 6 | `/boardroom` | Meetings + decisions | Clerk/Treasurer |
| 7 | `/treasury` | Fund balances, expenses | Treasurer |
| 8 | `/rota` | Weekly duty calendar | Clerk |
| 9 | `/congregation` | View, invite officers, CSV import | Clerk |
| 10 | `/pathfinders` | Class progress + honors | Clerk |
| 11 | `/welfare` | Cases + pantry inventory | Clerk |
| 12 | `/sabbath-school` | Classes by division | Clerk |
| 13 | `/health` | Events + contacts | Clerk |
| 14 | `/communion` | Service planner (rooms + inventory) | Clerk |
| 15 | `/av` | Order of service builder | Clerk |
| 16 | `/district` | Preaching rotations + visits | Clerk |
| 17 | `/facilities` | Room/venue bookings | Clerk |
| 18 | `/crisis` | Asset registry | Clerk |
| 19 | `/transfers` | Membership transfers | Clerk |
| 20 | `/nominating` | Session + ballot management | Clerk |
| 21 | `/conference` | Stats + CSV export | Clerk |

## Infrastructure

| Area | Status |
|------|--------|
| API (Hono Worker) | 40+ endpoints, 74 tests, 9 files |
| Durable Object | 140 lines, 10 RPC methods, 4 channels, alarms |
| PWA offline | IndexedDB cache, write outbox queue, connectivity indicator |
| CI/CD | GitHub Actions: CI, deploy (Cloudflare), deploy-relay (Docker) |
| Docker | Relay: multi-stage, non-root, health check |
| Nginx | SSL, HSTS, secure headers, rate limiting |
| docker-compose | Dev + prod profiles with certbot |
| ESLint | Configured with TypeScript support (0 errors, 12 warnings) |
| TypeScript | tsconfig with excludes, D1Database types |

## Known issues

- **DO integration tests**: blocked by Miniflare cross-worker DO setup on Windows. DO code is verified manually.
- **TypeScript typecheck**: pre-existing drizzle-orm type conflict (pnpm duplicate install). Skip `tsc --noEmit`, rely on tests.
- **SSL cert**: initial certbot command documented in docker-compose, not yet executed.

## Quick verify

```bash
pnpm test                          # 74 tests, 9 files, all pass
cd apps/web && npx vite build      # 20 pages, builds clean
pnpm lint                          # 0 errors, 12 warnings
docker compose up                  # dev: relay + api
docker compose --profile prod up   # prod: nginx + relay + certbot
```
