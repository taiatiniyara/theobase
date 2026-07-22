# Per-Conference D1 tenancy

Theobase isolates each Conference's data in its own Cloudflare D1 database rather than sharing one global database or giving each church its own database.

**Why one database per Conference:** A Conference is the natural administrative boundary — Conference officers see all their churches' data; members and churches in different Conferences never interact. Per-Conference isolation simplifies access control (row-level security per church_id within the database rather than cross-tenant filters), limits blast radius, and maps to D1's horizontal scaling model (thousands of small databases are free; one massive database hits the 10GB ceiling). A typical 500-church Conference with 10 years of transactions fits in under 1GB.

**Considered alternatives:**
- **Per-church D1 databases.** Better for infinite horizontal scaling but creates N× complexity — every cross-church operation (transfers, Conference aggregation, pastor dashboard) requires querying multiple databases. Rejected because per-Conference is sufficient for the 10GB limit and keeps operations simpler.
- **Single global D1 database.** Simplest to build but hits D1's single-threaded throughput limits and the 10GB ceiling quickly. Rejected because it doesn't scale past one small Conference.
