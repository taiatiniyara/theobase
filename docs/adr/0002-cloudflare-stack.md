# Cloudflare-Only Stack

The platform is built entirely on Cloudflare infrastructure: Workers (compute), D1 (database), R2 (object storage), Pages (frontend), Durable Objects (real-time features), Queues (background jobs), and Email Routing (notifications).

**Rationale:** Cost-effective for a solo developer, globally distributed (critical for Pacific Islands), and reduces operational complexity (no separate infra to manage). The stack is mature enough for financial-grade applications.

**Consequences:**
- D1 (PostgreSQL-compatible) is the system of record; no external database
- Offline-first PWA architecture requires custom sync logic (no managed offline sync like Firebase)
- Multi-tenant isolation is enforced at the application layer (D1 schemas or row-level security)
- Vendor lock-in to Cloudflare is acceptable given the mission-driven, non-commercial nature of the project
