# Offline-first CRDT strategy

Offline writes are handled with three conflict-resolution strategies chosen per
data type: last-writer-wins registers for scalar fields (member phone numbers,
uniform sizes, communion inventories), Observed-Remove Sets for duty rota slot
assignments, and revision-based merging for board minutes.

**Why:** Theobase must work during Sabbath services when internet is
unavailable. Two treasurers might assign the same duty slot offline; two clerks
might edit the same board minute. A single conflict strategy applied uniformly
would either lose data (LWW on board minutes) or overcomplicate simple cases (OR-Set
for a phone number update). The three-tier approach matches the conflict
semantics of each data type without pulling in a heavyweight CRDT library.

**Consequences:** The PWA maintains an IndexedDB outbox for offline writes.
Successful sync is acknowledged by the server; conflicts surface in the UI for
manual resolution (revision fork for minutes) or automatic resolution (OR-Set
merge for rota slots). This is implemented directly in shared packages rather
than via an external CRDT library, keeping the bundle small.

**Rejected:** Single-strategy LWW everywhere (data loss on minutes). Full CRDT
library like Yjs or Automerge (library weight, network format complexity,
overkill for scalar fields). Server-authoritative (requires connectivity for
every write — violates the offline-first pillar).
