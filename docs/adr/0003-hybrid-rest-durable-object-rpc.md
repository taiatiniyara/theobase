# Hybrid REST + Durable Object RPC API

Reads use Hono REST endpoints querying D1 directly. Writes and real-time
collaboration use Durable Object RPC methods, with one DO per congregation
multiplexing multiple WebSocket channels.

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
