# Theobase Handoff — 2026-06-20 (Updated)

## Phase 3 Complete — 26 SvelteKit Pages, All 23 Issues Covered

## SvelteKit PWA pages (26 routes)

| # | Route | Feature | Access |
|---|-------|---------|--------|
| 1 | `/` | Login (magic link) | Public |
| 2 | `/auth/verify` | Token verification | Public |
| 3 | `/dashboard` | Giving summary, treasury balance, quick actions | Member+ |
| 4 | `/me` | Profile view/edit | Member+ |
| 5 | `/setup` | Initial congregation setup wizard | Clerk |
| 6 | `/join` | Join congregation via invite link | Public |
| 7 | `/help` | Help and documentation | Public |
| 8 | `/receipts` | Submit receipt + history | Member+ |
| 9 | `/boardroom` | Meetings + decisions | Clerk/Treasurer |
| 10 | `/treasury` | Fund balances, expenses | Treasurer |
| 11 | `/rota` | Weekly duty calendar | Clerk |
| 12 | `/congregation` | View, invite officers, CSV import | Clerk |
| 13 | `/pathfinders` | Class progress + honors | Clerk |
| 14 | `/welfare` | Cases + pantry inventory | Clerk |
| 15 | `/sabbath-school` | Classes by division | Clerk |
| 16 | `/health` | Events + contacts | Clerk |
| 17 | `/communion` | Service planner (rooms + inventory) | Clerk |
| 18 | `/av` | Order of service builder | Clerk |
| 19 | `/district` | Preaching rotations + visits | Clerk |
| 20 | `/facilities` | Room/venue bookings | Clerk |
| 21 | `/crisis` | Asset registry | Clerk |
| 22 | `/transfers` | Membership transfers | Clerk |
| 23 | `/nominating` | Session + ballot management | Clerk |
| 24 | `/conference` | Stats + CSV export | Clerk |
| 25 | `/households` | Household management | Clerk |
| 26 | `/candidacies` | Baptismal candidacy pipeline | Clerk |

## Infrastructure

| Area | Status |
|------|--------|
| API (Hono Worker) | 60+ endpoints across 21 route modules, 74 tests, 9 test files |
| Durable Object | 140 lines, 10 RPC methods, 4 channels, alarms, email dispatch |
| DO Tests | 10 tests, 3 files (RPC method acceptance) |
| PWA offline | IndexedDB cache, write outbox queue, connectivity indicator |
| CI/CD | GitHub Actions: CI, deploy (Cloudflare), deploy-relay (Docker) |
| Docker | Relay: multi-stage, non-root, health check |
| Nginx | SSL, HSTS, secure headers, rate limiting |
| docker-compose | Dev + prod profiles with certbot |
| ESLint | 0 errors, 0 warnings |
| TypeScript | `tsc --noEmit` passes (0 errors) |

## Known issues

- **DO integration tests**: blocked by Miniflare cross-worker DO setup. DO code is verified manually.
- **SSL cert**: initial certbot command documented in docker-compose, not yet executed.

## Quick verify

```bash
pnpm test                          # 74 tests, 9 files, all pass
pnpm test:do                       # 10 tests, 3 files, all pass
cd apps/web && npx vite build      # 26 pages, builds clean
pnpm lint                          # 0 errors, 0 warnings
pnpm typecheck                     # 0 errors
docker compose up                  # dev: relay + api
docker compose --profile prod up   # prod: nginx + relay + certbot
```
