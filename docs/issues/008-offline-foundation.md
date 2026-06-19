# 008 — Offline Foundation

## What to build

Harden the PWA's offline capabilities across the features built so far. Implement the three-tier CRDT strategy (LWW for scalars, OR-Set for rota slots, revision-based merge for board minutes), the IndexedDB outbox for offline writes, and automatic sync with conflict resolution UI. This is not a standalone feature — it retrofits offline support into Slices 002–007.

## Acceptance criteria

- [ ] Service Worker: precache PWA shell, runtime-cache API GET responses in IndexedDB
- [ ] IndexedDB outbox: offline writes (profile edits, receipt uploads, duty swaps, board minute edits, expense entries) queue in outbox
- [ ] Sync manager: on connectivity restore, flush outbox sequentially, handle per-item success/failure/conflict
- [ ] LWW register sync: scalar field updates carry logical timestamp, server accepts highest
- [ ] OR-Set sync: duty rota slot assignments merge without losing data
- [ ] Revision fork: board minute conflict produces two revisions; UI shows diff, user picks resolution
- [ ] Network status indicator in PWA: green (online, synced), yellow (online, syncing), red (offline, N items queued)
- [ ] Test: go offline → update profile, upload receipt, edit board minute → reconnect → all sync → state matches D1
- [ ] Test: offline duty swap conflict resolves via OR-Set merge
- [ ] Test: offline board minute conflict produces revision fork; manual resolution succeeds

## Blocked by

- 002 — Member Self-Service Portal
- 004 — Digital Receipt Registry
- 006 — Smart-Swap Duty Rota + Safety Shield
