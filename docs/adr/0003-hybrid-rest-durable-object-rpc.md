# Hybrid REST + Durable Object RPC API

## Status: Accepted

Reads use Hono REST endpoints querying D1 directly. Writes go through REST
handlers to D1; after a successful D1 write, a Durable Object stub is called
to broadcast the change over WebSocket to connected clients. The DO is a
real-time notification sidecar, not the data authority. One DO per congregation
multiplexes 4 WebSocket channels (board, rota, AV, notifications).

**Why:** REST endpoints are cacheable via the PWA's Service Worker — a member
viewing their giving history or a clerk loading the membership roll hits
IndexedDB, not the network. Durable Objects are the only Cloudflare primitive
with native WebSocket support, and their in-memory state + alarm scheduling
covers real-time collaboration (board minutes, AV sync, duty swaps) and
scheduled notifications without external cron services.

**Rejected:** Pure REST (no native WebSocket support on Workers outside DOs).
Pure DO RPC (every read hits a DO, losing PWA cacheability and adding latency
for simple queries). Separate DOs per feature (too many WebSocket connections
per user).
