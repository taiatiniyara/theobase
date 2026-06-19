# Cloudflare-native stack

Theobase runs entirely on Cloudflare: Pages for the PWA, Workers (Hono) for the
API, D1 for SQLite storage, Durable Objects for WebSocket real-time, R2 for blob
storage, and Email Routing for inbound mail. No traditional servers, no VPS
fleet, no separate CDN layer.

**Why:** The proposal's three non-negotiable pillars — offline-first operation,
regional data isolation, and near-zero infrastructure cost per church — map
directly onto Cloudflare's edge model. Workers sleep when idle (near-zero cost),
D1 databases can be placed per world division (regional isolation), and the PWA
offline cache + WebSocket DOs deliver the offline-first experience without
native app complexity.

**Rejected:** Traditional VPS or AWS. Managing server fleets per region,
handling scaling, and keeping per-church costs under $5/month would require
significant ops overhead. A Node/Express monolith on a VPS would simplify
development but fail the "works in poor internet" and "per-region data
sovereignty" pillars.
