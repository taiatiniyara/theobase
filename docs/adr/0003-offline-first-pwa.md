# Offline-first PWA architecture

Theobase is an offline-first Progressive Web App — every data-entry operation works without internet, using a local operation-log that syncs when connectivity returns. It is not an online-only SaaS that fails gracefully offline.

**Why offline-first:** Many SDA churches operate in rural areas with intermittent or no internet during Sabbath services — exactly when financial data is collected. An online-only app would be unusable at the moment of highest need. The PWA model allows installation on any device without an app store, critical for global reach across 215+ countries.

**Trade-offs accepted:**
- **Added complexity.** Conflict resolution (especially for member record edits), sync queue management, and dual-custody enforcement across disconnected clients add significant engineering surface area compared to an online-only app.
- **Eventual consistency.** Data may be stale until sync completes. Reports show "last synced" timestamps. Conference dashboards may lag behind church-level activity.
- **No native mobile app in MVP.** PWA was chosen over React Native / Capacitor because it delivers the same installable, offline-capable experience with a single codebase.

**Sync model:** IndexedDB operation-log (Dexie.js) queues writes locally. Four-tier priority on reconnect: finance entries → expenses → membership changes → pull fresh data. Finance is append-only (no conflicts per ADR-0001). Member edits use versioned optimistic locking with human-resolution diffs.

**Considered alternative:** Online-only SaaS with optimistic UI. Rejected because it's unusable in the primary deployment environment (rural Sabbath services).
