# Theobase Handoff — 2026-06-19 (Session 3)

## Phase: Cycling Phase 3

## SvelteKit PWA pages — 11 routes total

| Route | Feature | Access |
|-------|---------|--------|
| `/` | Login (magic link) | Public |
| `/auth/verify` | Token verification | Public |
| `/dashboard` | Giving summary, treasury balance, quick actions | Member+ |
| `/me` | Profile view/edit | Member+ |
| `/receipts` | Submit receipt (fund split builder) + history | Member+ |
| `/boardroom` | Create meetings, record decisions | Clerk, Treasurer |
| `/treasury` | Fund balances, expense list, create expense | Treasurer |
| `/rota` | Weekly duty calendar | Clerk |
| `/congregation` | View details, invite officers, CSV import | Clerk |
| `/pathfinders` | Class progress + honors tracking | Clerk |
| `/welfare` | Cases + pantry inventory | Clerk |
| `/sabbath-school` | Classes by division | Clerk |

## PWA Offline (Service Worker)
- IndexedDB API response cache (network-first, cache-fallback)
- Write outbox queue (queues POST/PATCH when offline, flushes on reconnect)
- Online/offline indicator + pending sync badge in header
- Background sync via `sync` event

## API client (`$lib/api.ts`)
25+ exported functions covering auth, profile, receipts, boardroom, treasury, rota, pathfinders, welfare, pantry, sabbath school, health

## Still remaining

| Area | Detail |
|------|--------|
| Health ministry page | API endpoints exist, no UI |
| Communion service page | API exists, no UI |
| AV sync page | API exists, no UI |
| District hub page | API exists, no UI |
| Facilities page | API exists, no UI |
| Crisis assets page | API exists, no UI |
| Transfers page | API exists, no UI |
| Nominating vault page | API exists, no UI |
| Conference report page | API exists, no UI |
| DO integration tests | Blocked by Miniflare cross-worker config |
| TypeScript typecheck | `tsc --noEmit` not configured |
| ESLint | No eslint config exists |
| SSL cert | Needs initial certbot run for relay.theobase.net |

## Quick verify

```bash
pnpm test                          # 74 tests, 9 files, all pass
cd apps/web && npx vite build      # SvelteKit builds clean, 11 pages
docker compose up                  # dev: relay + api
git log --oneline -3               # 3 commits this session
```
