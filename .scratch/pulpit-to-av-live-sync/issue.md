# 017 — Pulpit-to-AV Live-Sync

**Status: Implemented** (API endpoints + page + DO WebSocket channel exist; acceptance criteria need review)

## What to build

A real-time WebSocket connection between the pulpit (service leader's device) and the AV booth (presentation computer). When the service leader makes a last-minute change to the order of service — a swapped hymn, an added scripture reading, a changed announcement — the AV operator's presentation software receives the update instantly via the Durable Object, updating slides without running physical notes down the aisle.

## Acceptance criteria

- [ ] AVSyncDO: one DO per congregation, multiplexes WebSocket channels `av-pulpit` and `av-booth`
- [ ] DO RPC `updateOrderOfService(items)` — service leader pushes updated order; DO broadcasts to AV channel
- [ ] DO RPC `getCurrentOrder()` — AV client fetches current state on connect
- [ ] Order of service schema: ordered list of {type: hymn|scripture|prayer|sermon|announcement|special_music, title, details, slide_ref}
- [ ] PWA UI: service leader sees editable order list; AV operator sees read-only view that updates live
- [ ] Hono endpoint `GET /av/current` — REST fallback if WebSocket unavailable (returns last known state from D1)
- [ ] Integration surface: documented JSON format for EasyWorship/ProPresenter to consume (future)
- [ ] Test: leader updates order → AV sees change in under 500ms → REST fallback returns same state
- [ ] Test: WebSocket disconnect → reconnect → receives current state → no missed updates

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
