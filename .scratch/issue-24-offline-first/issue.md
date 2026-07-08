# Issue 24: Offline-First Infrastructure

## What to build

Cross-cutting infrastructure enabling all features to work offline. Auto-save in-memory queue, background sync when reconnected, graceful degradation.

## Input/Output

**Input:** All mutation operations (create, update, delete) across every feature, network state changes (online/offline)
**Output:** Guaranteed: auto-save on every mutation, offline mutation queue, background sync on reconnect, cached data with offline indicator, feature-level degradation

## Validation Requirements

- Every mutation must persist locally before attempting server sync (auto-save)
- Mutations queued when offline must replay in order on reconnect
- No data loss: queued mutations survive app close/reopen
- Sync conflict resolution: server state wins, local queue notifies user of conflicts
- Cached data must be visually distinguishable from live data (subtle indicator)
- Feature isolation: photo upload failure must not block data save
- Background sync must not drain battery (batch, exponential backoff)
- All acceptance criteria must pass with network throttled to offline

## Acceptance Criteria

- [ ] Auto-save on every mutation — "Saved" indicator, no Save button needed
- [ ] Offline queue: mutations stack locally when network drops
- [ ] TanStack Query stale-while-revalidate with cache-first strategy
- [ ] "Saved (will sync when connected)" indicator on offline
- [ ] Auto-sync on reconnect without user action
- [ ] Feature-level degradation: photo upload fails → data still saves
- [ ] Background sync doesn't drain battery (batch, not continuous polling)
- [ ] Cached data shown with subtle "offline" indicator
- [ ] Audit log infrastructure: every mutation (create/update/delete) produces an immutable audit log entry recording who changed what, when, and from what value to what value
- [ ] Audit log entries survive sync conflicts and replay correctly

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/adr/0012-product-quality-standards.md`
- `CHANGELOG.md`
