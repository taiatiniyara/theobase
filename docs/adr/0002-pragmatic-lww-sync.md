# Pragmatic last-write-wins sync with conflict queue

Sync between local SQLite and D1 uses last-write-wins as the default merge strategy, backed by a conflict queue for manual resolution. The vision doc mentions CRDTs, but most churches have one clerk and one treasurer — concurrent edits on the same record are rare. A full CRDT implementation would be over-engineering for this domain. When a conflict is detected (two offline edits to the same record), the affected record is surfaced in a reconciliation UI for an officer to resolve manually.
