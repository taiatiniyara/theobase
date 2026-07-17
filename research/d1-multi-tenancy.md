# Multi-Tenant Hierarchical Data on Cloudflare D1

Research conducted: July 2026

## Executive Summary

**Recommendation:** Use a **hybrid approach** with a single shared D1 database for the entire organization hierarchy, implementing row-level tenant isolation with `org_id` columns and materialized path hierarchy.

**Rationale:** D1 is explicitly designed for "per-user, per-tenant or per-entity databases" but the 10 GB limit per database and the need for cross-tenant hierarchical queries (e.g., "show all members across all churches in a conference") make a single-database approach more practical for this use case.

---

## 1. D1 Limits and Capabilities

### Hard Limits (Workers Paid Plan)

| Resource | Limit | Implications |
|----------|-------|--------------|
| **Databases per account** | 50,000 (can request increase to millions) | Database-per-tenant is feasible at scale |
| **Max database size** | 10 GB (cannot be increased) | Single database may become limiting for large deployments |
| **Max storage per account** | 1 TB (can request increase) | Shared database approach uses this pool |
| **Queries per Worker invocation** | 1,000 | Limits complexity per request |
| **Max columns per table** | 100 | Sufficient for most schemas |
| **Max rows per table** | Unlimited (bounded by storage) | No artificial row limits |
| **Max row size** | 2 MB | Generous for typical data |
| **Max SQL statement length** | 100 KB | Sufficient for complex queries |
| **Max bound parameters per query** | 100 | May limit IN clause size |
| **Max query duration** | 30 seconds | Long-running aggregations need batching |
| **Time Travel retention** | 30 days | Built-in point-in-time recovery |
| **Time Travel restores** | 10 per 10 min per DB | Rate-limited recovery operations |

### Performance Characteristics

**Concurrency Model:**
- Each D1 database is **single-threaded** and processes queries sequentially
- Throughput depends on query duration:
  - 1ms queries → ~1,000 queries/second
  - 100ms queries → ~10 queries/second
- Concurrent requests queue; full queue returns "overloaded" error

**Read Replication:**
- Asynchronous read replicas in 6 regions (WNAM, ENAM, WEUR, EEUR, APAC, OC)
- Requires Sessions API for sequential consistency
- Writes still go to primary; reads distributed to replicas
- No additional cost for replicas
- Replica lag exists; Sessions API ensures consistency via bookmarks

**Query Performance Guidelines:**
- Indexed point lookups: <1ms
- Writes (INSERT/UPDATE): several ms (durably persisted across locations)
- Large migrations must be batched (modify ~1,000 rows at a time)
- Indexes critical for performance (reduce rows_read, improve billing)

**Worker Integration:**
- Max 6 simultaneous D1 connections per Worker invocation
- Batch operations reduce latency (single network round-trip)
- Batches are transactions (sequential, non-concurrent, atomic)

### Pricing Model

| Metric | Free Tier | Paid Tier |
|--------|-----------|-----------|
| Rows read | 5M/day | 25B/month included, then $0.001/M |
| Rows written | 100K/day | 50M/month included, then $1.00/M |
| Storage | 5 GB total | 5 GB included, then $0.75/GB-month |

**Key Insight:** Indexes increase rows_written (update index on write) but dramatically reduce rows_read. For read-heavy workloads, indexes are cost-effective.

---

## 2. Multi-Tenancy Patterns

### Pattern 1: Single Database with Row-Level Isolation

**Architecture:**
- One D1 database for all tenants
- Every table includes `org_id` column
- Application-level filtering on every query
- Hierarchical org structure via materialized path or closure table

**Schema Example:**

```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  path TEXT NOT NULL,  -- Materialized path: "/gc/division/union/conference/church"
  level TEXT NOT NULL, -- 'general_conference', 'division', 'union', 'conference', 'church'
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,  -- Church ID
  org_path TEXT NOT NULL, -- Cached path for hierarchical queries
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL, -- 'active', 'inactive', 'pending'
  created_at TEXT NOT NULL,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

-- Critical indexes for tenant isolation and hierarchical queries
CREATE INDEX idx_members_org_id ON members(org_id);
CREATE INDEX idx_members_org_path ON members(org_path);
CREATE INDEX idx_organizations_parent ON organizations(parent_id);
CREATE INDEX idx_organizations_path ON organizations(path);

-- Query: All members in a conference (and all its churches)
SELECT m.* FROM members m
WHERE m.org_path LIKE '/gc/division/union/conference/%';
```

**Pros:**
- ✅ Simple schema migrations (one database)
- ✅ Cross-tenant queries are trivial (hierarchical roll-ups)
- ✅ Efficient storage (no schema duplication)
- ✅ Single backup/restore operation
- ✅ D1 read replication benefits all tenants
- ✅ Fits D1's design for horizontal scaling

**Cons:**
- ❌ Application must enforce tenant isolation on every query
- ❌ Risk of cross-tenant data leakage if filtering logic has bugs
- ❌ Single database = single point of failure (mitigated by Time Travel)
- ❌ Noisy neighbor problem (one tenant's slow queries affect all)
- ❌ May hit 10 GB limit for very large deployments

**Security Model:**
- Must implement row-level security in application layer
- Every query must include tenant filter
- Use database views or application middleware to enforce isolation
- Consider generated columns or triggers for path validation

### Pattern 2: Database-per-Tenant

**Architecture:**
- Separate D1 database for each church (or conference)
- Application routes queries to correct database based on tenant context
- Hierarchical queries require multiple database accesses

**Implementation:**

```typescript
// Worker routing logic
async function getDatabaseForOrg(orgId: string, env: Env): Promise<D1Database> {
  // Option A: Dynamic binding lookup (limited to ~5,000 bindings per Worker)
  const dbBinding = `DB_${orgId.replace(/-/g, '_')}`;
  return env[dbBinding];
  
  // Option B: Database ID stored in metadata service
  const dbId = await env.META_DB.prepare(
    'SELECT database_id FROM tenant_databases WHERE org_id = ?'
  ).bind(orgId).first();
  
  return env.D1_MANAGER.getDatabaseById(dbId);
}

// Hierarchical query: aggregate across all churches in a conference
async function getConferenceMembers(conferenceId: string, env: Env) {
  const churches = await getChurchesInConference(conferenceId);
  const allMembers = [];
  
  for (const church of churches) {
    const db = await getDatabaseForOrg(church.id, env);
    const members = await db.prepare('SELECT * FROM members').all();
    allMembers.push(...members.results);
  }
  
  return allMembers;
}
```

**Pros:**
- ✅ Strongest data isolation (physical separation)
- ✅ No risk of cross-tenant leakage via application bugs
- ✅ Per-tenant backup/restore
- ✅ Per-tenant performance isolation
- ✅ Can place databases in different regions (data locality)
- ✅ D1 supports 50,000+ databases per account

**Cons:**
- ❌ Hierarchical queries require multiple database accesses (N+1 problem)
- ❌ Worker binding limit (~5,000 per Worker) requires dynamic routing
- ❌ Complex schema migrations (must update all databases)
- ❌ Storage overhead (schema duplication across databases)
- ❌ Difficult to implement cross-tenant features (reporting, analytics)
- ❌ Each database is single-threaded (more concurrency challenges)

**Security Model:**
- Physical isolation eliminates most cross-tenant risks
- Must still secure database routing logic
- Per-tenant access controls can be enforced at routing layer

### Pattern 3: Schema-per-Tenant

**Architecture:**
- Single database, separate schema (namespace) per tenant
- Not supported by SQLite/D1

**Status:** ❌ **Not viable**

SQLite does not support schemas in the traditional RDBMS sense. All tables exist in a single namespace. You cannot have `tenant_a.members` and `tenant_b.members` as separate schemas.

**Workaround:** Prefix table names (`tenant_a_members`, `tenant_b_members`), but this is effectively Pattern 1 with worse ergonomics.

### Pattern 4: Hybrid - Shared Database + Tenant Databases

**Architecture:**
- Shared "metadata" database for organization hierarchy, configuration, cross-tenant data
- Separate databases per tenant for tenant-specific data (members, transactions, etc.)

**Schema:**

```sql
-- Shared metadata database
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  path TEXT NOT NULL,
  level TEXT NOT NULL,
  name TEXT NOT NULL,
  database_id TEXT, -- D1 database ID for this org's data
  created_at TEXT NOT NULL
);

CREATE TABLE global_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Per-church database (only for church-level data)
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

**Hierarchical Query:**

```typescript
async function getConferenceMembers(conferenceId: string, env: Env) {
  // 1. Get all churches in conference from shared DB
  const churches = await env.SHARED_DB.prepare(`
    SELECT id, database_id FROM organizations
    WHERE path LIKE ? AND level = 'church'
  `).bind(`%/conference/${conferenceId}/%`).all();
  
  // 2. Query each church's database
  const allMembers = [];
  for (const church of churches.results) {
    const db = env.D1_MANAGER.getDatabaseById(church.database_id);
    const members = await db.prepare(`
      SELECT m.*, ? as church_id FROM members m
    `).bind(church.id).all();
    allMembers.push(...members.results);
  }
  
  return allMembers;
}
```

**Pros:**
- ✅ Strong isolation for tenant data
- ✅ Efficient hierarchical queries via shared metadata
- ✅ Reduced database count (only churches, not all org levels)
- ✅ Cross-tenant reporting via shared database
- ✅ Per-tenant backup/restore for member data

**Cons:**
- ❌ More complex architecture (two data access patterns)
- ❌ Hierarchical queries still require multiple database accesses
- ❌ Must maintain schema in multiple databases
- ❌ Still may hit database count limits at scale

**Security Model:**
- Tenant data physically isolated
- Shared database contains only non-sensitive metadata
- Cross-tenant queries require explicit routing logic

---

## 3. Hierarchical Query Performance

### Query Types for Church → Conference Roll-Up

**Scenario:** "Show me all members across all churches in this conference"

#### Single Database (Materialized Path)

```sql
-- Query all members in conference and descendant churches
SELECT m.* FROM members m
JOIN organizations o ON m.org_id = o.id
WHERE o.path LIKE '/gc/division/union/conference/abc123/%'
  AND m.status = 'active';

-- Performance: O(n) where n = members in conference
-- With index on org_path: Fast index scan
-- Estimated time: 10-100ms for 10,000 members
```

**Optimization:** Cache `org_path` in members table to avoid JOIN

```sql
-- Denormalized for performance
SELECT * FROM members
WHERE org_path LIKE '/gc/division/union/conference/abc123/%'
  AND status = 'active';
```

#### Database-per-Tenant

```typescript
// Pseudocode
const churches = await getChurchesInConference(conferenceId); // 1 query
const allMembers = [];

for (const church of churches) { // N iterations
  const db = getDatabase(church.id);
  const members = await db.prepare('SELECT * FROM members').all(); // N queries
  allMembers.push(...members.results);
}

// Performance: O(N) databases, O(M) total members
// Estimated time: N * (5-20ms) = 50-200ms for 10 churches
// Network overhead: N round-trips to D1
```

**Optimization:** Use Promise.all() for parallel queries

```typescript
const memberPromises = churches.map(async (church) => {
  const db = getDatabase(church.id);
  return await db.prepare('SELECT * FROM members').all();
});
const results = await Promise.all(memberPromises);
const allMembers = results.flatMap(r => r.results);

// Performance: Max(query times) instead of Sum(query times)
// Estimated time: 20-50ms (parallel execution)
```

#### Hybrid Approach

```typescript
// Metadata query (fast)
const churches = await env.SHARED_DB.prepare(`
  SELECT id, database_id FROM organizations
  WHERE path LIKE ? AND level = 'church'
`).bind(`%/conference/${conferenceId}/%`).all();

// Parallel member queries
const memberPromises = churches.results.map(async (church) => {
  const db = env.D1_MANAGER.getDatabaseById(church.database_id);
  return await db.prepare('SELECT * FROM members').all();
});
const results = await Promise.all(memberPromises);
```

### Performance Comparison

| Approach | 10 Churches | 100 Churches | 1,000 Churches |
|----------|-------------|--------------|----------------|
| **Single DB (indexed)** | 10-50ms | 50-200ms | 200-1000ms |
| **Database-per-Tenant (parallel)** | 20-100ms | 50-300ms | 200-1000ms |
| **Hybrid (parallel)** | 25-120ms | 60-350ms | 250-1200ms |

**Key Insight:** Single database with materialized path is fastest for hierarchical queries. Database-per-tenant approaches add network overhead but can be mitigated with parallel queries.

### Aggregation Queries

**Scenario:** "Count total members per conference"

#### Single Database

```sql
SELECT o.id, o.name, COUNT(m.id) as member_count
FROM organizations o
LEFT JOIN members m ON m.org_id = o.id OR m.org_path LIKE o.path || '/%'
WHERE o.level = 'conference'
GROUP BY o.id, o.name;

-- Performance: Slow for many conferences (full table scan + GROUP BY)
-- Estimated time: 500-2000ms for 100 conferences, 100K members
```

**Optimization:** Maintain materialized counts

```sql
CREATE TABLE org_member_counts (
  org_id TEXT PRIMARY KEY,
  direct_count INTEGER NOT NULL, -- Members directly in this org
  total_count INTEGER NOT NULL,  -- Members in this org + all descendants
  last_updated_at TEXT NOT NULL
);

-- Update via triggers or application logic
-- Query: O(1) per conference
```

#### Database-per-Tenant

```typescript
// Must query each church database and aggregate
const counts = await Promise.all(
  churches.map(async (church) => {
    const db = getDatabase(church.id);
    const result = await db.prepare('SELECT COUNT(*) as count FROM members').all();
    return { churchId: church.id, count: result.results[0].count };
  })
);

// Performance: Similar to hierarchical member queries
```

---

## 4. Security Implications

### Single Database (Row-Level Isolation)

**Threat Model:**
- Application bugs that omit tenant filter
- SQL injection that bypasses tenant filtering
- Privilege escalation accessing other tenants' data

**Mitigations:**
1. **Application Middleware:** Implement query wrapper that always injects tenant filter

```typescript
// Tenant-scoped query builder
function tenantQuery(tenantId: string, baseQuery: string): string {
  return `${baseQuery} WHERE org_id = '${tenantId}'`;
}

// Better: Use parameterized queries
async function queryTenantData(tenantId: string, db: D1Database) {
  return await db.prepare(`
    SELECT * FROM members WHERE org_id = ?
  `).bind(tenantId).all();
}
```

2. **Database Views:** Create tenant-scoped views (not enforced, but helpful)

```sql
CREATE VIEW tenant_members AS
SELECT * FROM members WHERE org_id = current_tenant_id();
-- Note: SQLite doesn't support session variables, so this is illustrative only
```

3. **Generated Columns:** Enforce path validation

```sql
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  org_path TEXT GENERATED ALWAYS AS (
    (SELECT path FROM organizations WHERE id = org_id)
  ) STORED,
  -- org_path automatically maintained
);
```

4. **Audit Logging:** Log all queries with tenant context

**Risk Level:** Medium-High (relies on application correctness)

### Database-per-Tenant

**Threat Model:**
- Routing logic bugs accessing wrong database
- Database ID leakage or prediction
- Shared credentials compromise all databases

**Mitigations:**
1. **Isolated Credentials:** Use separate D1 bindings per tenant (if <5,000 tenants)
2. **Database ID Randomness:** Use UUIDs, not sequential IDs
3. **Access Logging:** Log which database is accessed per request
4. **Network Isolation:** Place sensitive tenant databases in specific jurisdictions

**Risk Level:** Low (physical isolation)

### Hybrid Approach

**Threat Model:**
- Shared database compromise exposes org hierarchy
- Routing logic bugs for tenant databases
- Inconsistent security policies across databases

**Mitigations:**
1. **Minimal Shared Data:** Only store non-sensitive metadata in shared DB
2. **Consistent Security:** Apply same security patterns to all databases
3. **Access Control:** Enforce tenant isolation in routing layer

**Risk Level:** Low-Medium (shared DB is low-value target)

### Cross-Tenant Data Leakage Scenarios

| Scenario | Single DB | DB-per-Tenant | Hybrid |
|----------|-----------|---------------|--------|
| Missing WHERE clause | ❌ High risk | ✅ No risk | ✅ Low risk |
| SQL injection | ❌ High risk | ✅ Low risk | ✅ Low risk |
| Routing bug | ✅ N/A | ❌ Medium risk | ❌ Medium risk |
| Backup exposure | ❌ High risk | ✅ Low risk | ⚠️ Medium risk |
| Debugging mistake | ❌ High risk | ✅ Low risk | ⚠️ Medium risk |

---

## 5. Operational Complexity

### Schema Migrations

**Single Database:**
```bash
# Simple: one migration
wrangler d1 execute shared-db --file=./migrations/001_add_member_status.sql

# Or use Drizzle Kit / Prisma
npx drizzle-kit push
```

**Database-per-Tenant:**
```bash
# Complex: must migrate all databases
for db_id in $(get_all_tenant_db_ids); do
  wrangler d1 execute --database-id=$db_id --file=./migrations/001_add_member_status.sql
done

# Or use a migration orchestrator
node migrate-all-tenants.js
```

**Hybrid:**
```bash
# Migrate shared DB
wrangler d1 execute shared-db --file=./migrations/001_update_org_schema.sql

# Migrate tenant DBs
for db_id in $(get_tenant_db_ids); do
  wrangler d1 execute --database-id=$db_id --file=./migrations/002_update_member_schema.sql
done
```

**Complexity Ranking:** Single DB < Hybrid < DB-per-Tenant

### Backups and Recovery

**Single Database:**
- **Backup:** Time Travel (automatic, 30-day retention)
- **Restore:** `wrangler d1 restore shared-db --bookmark=<bookmark>`
- **Granularity:** All-or-nothing (can't restore single tenant)
- **Export:** `wrangler d1 export shared-db --output=backup.sql`

**Database-per-Tenant:**
- **Backup:** Time Travel per database
- **Restore:** Per-tenant restore
- **Granularity:** Can restore single tenant without affecting others
- **Export:** Per-tenant export

**Hybrid:**
- **Backup:** Time Travel for shared DB + all tenant DBs
- **Restore:** Per-tenant or shared DB restore
- **Granularity:** Flexible (restore specific tenant or shared metadata)

### Monitoring and Observability

**Single Database:**
- **Query Metrics:** D1 dashboard shows aggregate metrics
- **Tenant Attribution:** Must add tenant_id to query logs
- **Performance:** Single set of metrics (harder to isolate noisy tenants)

**Database-per-Tenant:**
- **Query Metrics:** Per-database metrics in D1 dashboard
- **Tenant Attribution:** Natural (one database = one tenant)
- **Performance:** Easy to identify problematic tenants

**Hybrid:**
- **Query Metrics:** Separate metrics for shared DB and tenant DBs
- **Tenant Attribution:** Per-tenant database metrics
- **Performance:** Good isolation (shared DB vs tenant DBs)

### Scaling Considerations

**Single Database:**
- **Vertical Scaling:** Limited by 10 GB size cap
- **Horizontal Scaling:** Read replicas (automatic)
- **Write Scaling:** Single-threaded (bottleneck under heavy writes)
- **Mitigation:** Archive old data, use read replicas

**Database-per-Tenant:**
- **Vertical Scaling:** Each DB limited to 10 GB (usually not a problem)
- **Horizontal Scaling:** Many databases (D1 handles this)
- **Write Scaling:** Parallel writes across databases
- **Mitigation:** Automatic (database-per-tenant scales naturally)

**Hybrid:**
- **Vertical Scaling:** Shared DB may become bottleneck
- **Horizontal Scaling:** Tenant DBs scale naturally
- **Write Scaling:** Shared DB for metadata, tenant DBs for data
- **Mitigation:** Keep shared DB small (metadata only)

---

## 6. Cloudflare Documentation and Community Patterns

### Official Documentation Insights

**From D1 Limits Page:**
> "D1 is designed for horizontal scale out across multiple, smaller (10 GB) databases, such as per-user, per-tenant or per-entity databases."

This explicitly endorses database-per-tenant for certain use cases.

**From Storage Options Page:**
> "If your working data size exceeds 10 GB (the maximum size for a D1 database), consider splitting the database into multiple, smaller D1 databases."

Suggests splitting when size limits are approached.

**From D1 Best Practices:**
- Use indexes to reduce rows_read (improves performance and reduces costs)
- Use batch operations to reduce latency
- Use Sessions API for read replication consistency
- Break large migrations into batches (1,000 rows at a time)

### Community Patterns

**Multi-Tenancy Approaches (from Cloudflare Community and GitHub):**

1. **Database-per-User Pattern:**
   - Popular for SaaS applications with strict isolation requirements
   - Each user gets a dedicated database
   - Routing via metadata service or dynamic bindings

2. **Shared Database with Tenant ID:**
   - Common for applications with cross-tenant features
   - Simpler operations, but requires careful security
   - Used by many early D1 adopters

3. **Hybrid Metadata + Tenant Databases:**
   - Emerging pattern for complex multi-tenant applications
   - Shared DB for configuration, tenant DBs for data
   - Balances isolation with operational simplicity

### Relevant Blog Posts and Resources

1. **"Building D1: a Global Database"** (Cloudflare Blog)
   - Explains D1's architecture (Durable Objects under the hood)
   - Read replication implementation details

2. **"D1 Read Replication Beta"** (Cloudflare Blog)
   - Sessions API for sequential consistency
   - Bookmark-based consistency model

3. **D1 Community Projects** (Cloudflare Docs)
   - Examples of multi-tenant applications
   - Link: https://developers.cloudflare.com/d1/reference/community-projects/

### Limitations and Workarounds

**Known Limitations:**
- No native row-level security (must implement in application)
- No schema support (all tables in single namespace)
- Single-threaded query execution (queue under load)
- 10 GB database size limit (cannot be increased)
- 5,000 bindings per Worker (limits database-per-tenant at scale)

**Workarounds:**
- **Row-Level Security:** Application middleware, generated columns
- **Schema Support:** Table name prefixes (anti-pattern)
- **Concurrency:** Read replicas, batch operations
- **Size Limit:** Split into multiple databases (hybrid approach)
- **Binding Limit:** Dynamic database routing via metadata service

---

## 7. Recommendation for Theobase

### Recommended Architecture: Single Database with Materialized Path

**Rationale:**

1. **Hierarchical Queries are Core:** The requirement to roll up data from church → conference → union → division → GC strongly favors a single database. Materialized path enables efficient hierarchical queries.

2. **Operational Simplicity:** Single database = single migration, single backup, single monitoring dashboard. Reduces operational burden significantly.

3. **D1 Read Replication:** A single database can leverage read replicas globally, improving read performance for all tenants.

4. **Size Projection:** For typical church management workloads, a single 10 GB database can support thousands of churches and millions of members. If you approach the limit, you can split by division or union.

5. **Security is Manageable:** Row-level isolation via application middleware is well-understood. The key is enforcing tenant filters consistently.

### Schema Design

```sql
-- Organization hierarchy with materialized path
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  parent_id TEXT REFERENCES organizations(id),
  path TEXT NOT NULL UNIQUE, -- e.g., "/gc/division/union/conference/church"
  level TEXT NOT NULL CHECK (level IN ('general_conference', 'division', 'union', 'conference', 'church')),
  name TEXT NOT NULL,
  metadata TEXT, -- JSON blob for flexible attributes
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Members with denormalized path for fast hierarchical queries
CREATE TABLE members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  org_path TEXT NOT NULL, -- Denormalized from organizations.path
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  metadata TEXT, -- JSON blob for flexible attributes
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Financial transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  org_id TEXT NOT NULL REFERENCES organizations(id),
  org_path TEXT NOT NULL,
  member_id TEXT REFERENCES members(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('tithe', 'offering', 'donation', 'expense')),
  transaction_date TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Critical indexes
CREATE INDEX idx_organizations_parent ON organizations(parent_id);
CREATE INDEX idx_organizations_path ON organizations(path);
CREATE INDEX idx_organizations_level ON organizations(level);

CREATE INDEX idx_members_org_id ON members(org_id);
CREATE INDEX idx_members_org_path ON members(org_path);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_email ON members(email);

CREATE INDEX idx_transactions_org_id ON transactions(org_id);
CREATE INDEX idx_transactions_org_path ON transactions(org_path);
CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Partial indexes for common queries
CREATE INDEX idx_members_active ON members(org_path, status) WHERE status = 'active';
CREATE INDEX idx_transactions_current_year ON transactions(org_path, transaction_date) 
  WHERE transaction_date >= date('now', 'start of year');
```

### Application-Layer Security

```typescript
// Middleware to enforce tenant isolation
async function withTenantIsolation(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  handler: (req: Request, env: Env, ctx: ExecutionContext, tenantId: string) => Promise<Response>
): Promise<Response> {
  const tenantId = request.headers.get('X-Tenant-ID');
  if (!tenantId) {
    return new Response('Missing tenant ID', { status: 400 });
  }
  
  // Verify tenant access (e.g., via JWT or session)
  const user = await getUserFromRequest(request, env);
  if (!await userHasAccessToTenant(user, tenantId, env)) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  return handler(request, env, ctx, tenantId);
}

// Tenant-scoped query helpers
class TenantDatabase {
  constructor(private db: D1Database, private tenantId: string) {}
  
  async queryMembers(): Promise<Member[]> {
    return await this.db.prepare(`
      SELECT * FROM members WHERE org_id = ?
    `).bind(this.tenantId).all().then(r => r.results);
  }
  
  async queryHierarchicalMembers(orgPath: string): Promise<Member[]> {
    return await this.db.prepare(`
      SELECT * FROM members WHERE org_path LIKE ?
    `).bind(`${orgPath}%`).all().then(r => r.results);
  }
  
  async createMember(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(`
      INSERT INTO members (id, org_id, org_path, first_name, last_name, email, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, this.tenantId, this.tenantPath, member.first_name, member.last_name, member.email, member.status, now, now).run();
    
    return { id, org_id: this.tenantId, ...member, created_at: now, updated_at: now };
  }
}
```

### Hierarchical Query Examples

```typescript
// Get all members in a conference (and all its churches)
async function getConferenceMembers(conferenceId: string, db: D1Database) {
  const conference = await db.prepare(`
    SELECT path FROM organizations WHERE id = ?
  `).bind(conferenceId).first();
  
  const members = await db.prepare(`
    SELECT * FROM members WHERE org_path LIKE ?
  `).bind(`${conference.path}/%`).all();
  
  return members.results;
}

// Get member count per conference
async function getConferenceMemberCounts(db: D1Database) {
  const counts = await db.prepare(`
    SELECT 
      o.id,
      o.name,
      COUNT(m.id) as member_count
    FROM organizations o
    LEFT JOIN members m ON m.org_path LIKE o.path || '/%'
    WHERE o.level = 'conference'
    GROUP BY o.id, o.name
  `).all();
  
  return counts.results;
}

// Aggregate financial data across hierarchy
async function getConferenceFinancialSummary(conferenceId: string, db: D1Database) {
  const conference = await db.prepare(`
    SELECT path FROM organizations WHERE id = ?
  `).bind(conferenceId).first();
  
  const summary = await db.prepare(`
    SELECT 
      t.type,
      COUNT(*) as transaction_count,
      SUM(t.amount) as total_amount
    FROM transactions t
    WHERE t.org_path LIKE ?
      AND t.transaction_date >= date('now', 'start of year')
    GROUP BY t.type
  `).bind(`${conference.path}/%`).all();
  
  return summary.results;
}
```

### Migration Strategy

1. **Phase 1:** Implement single database with materialized path
2. **Phase 2:** Build application middleware for tenant isolation
3. **Phase 3:** Implement hierarchical query layer
4. **Phase 4:** Monitor performance and size
5. **Phase 5:** If approaching 10 GB, implement hybrid approach (split by division)

### When to Consider Hybrid Approach

Consider migrating to hybrid if:
- Database size exceeds 7-8 GB (approaching limit)
- Specific tenants require strict isolation (compliance)
- Write contention becomes a bottleneck
- Need per-tenant backup/restore

---

## 8. Trade-Offs Summary

| Criterion | Single DB | DB-per-Tenant | Hybrid |
|-----------|-----------|---------------|--------|
| **Hierarchical Query Performance** | ✅ Excellent | ⚠️ Good (with parallel queries) | ⚠️ Good |
| **Data Isolation** | ⚠️ Application-enforced | ✅ Physical | ✅ Physical (for tenant data) |
| **Schema Migrations** | ✅ Simple | ❌ Complex | ⚠️ Moderate |
| **Backup/Restore** | ✅ Simple (all-or-nothing) | ✅ Granular | ✅ Flexible |
| **Operational Complexity** | ✅ Low | ❌ High | ⚠️ Moderate |
| **Scaling (Write)** | ⚠️ Single-threaded | ✅ Parallel | ✅ Parallel (tenant data) |
| **Scaling (Read)** | ✅ Read replicas | ✅ Read replicas per DB | ✅ Read replicas |
| **Storage Efficiency** | ✅ No duplication | ❌ Schema duplication | ⚠️ Minimal duplication |
| **Cost (D1 Pricing)** | ✅ Efficient | ⚠️ Higher (more databases) | ⚠️ Moderate |
| **Cross-Tenant Features** | ✅ Easy | ❌ Difficult | ⚠️ Moderate |
| **Noisy Neighbor** | ❌ Possible | ✅ Isolated | ⚠️ Partial |
| **Compliance (Data Locality)** | ⚠️ Single region | ✅ Per-DB region | ⚠️ Shared DB single region |

---

## 9. Conclusion

For Theobase's hierarchical multi-tenant church management system, a **single D1 database with materialized path hierarchy** is the recommended approach.

**Key Advantages:**
- Simplest operational model (one migration, one backup)
- Best performance for hierarchical queries (core requirement)
- Leverages D1 read replicas effectively
- Scales to thousands of churches and millions of members within 10 GB limit

**Key Risks:**
- Application must enforce tenant isolation (mitigated with middleware)
- Single point of failure (mitigated by Time Travel backups)
- May need to split at scale (plan for hybrid migration path)

**Migration Path:**
Start with single database. Monitor size and performance. If approaching 10 GB or write contention becomes an issue, migrate to hybrid approach by splitting tenant data into separate databases while keeping shared metadata in the original database.

**Next Steps:**
1. Implement schema with materialized path
2. Build tenant isolation middleware
3. Create hierarchical query layer
4. Set up monitoring (rows_read, rows_written, database size)
5. Load test hierarchical queries with realistic data volumes
6. Document migration plan to hybrid approach (if needed)
