# Modular architecture with package-based registry

Theobase uses a modular architecture where each functional area (Finance, Membership, Sabbath School, Pathfinders, etc.) is a self-contained package that registers with a shared platform core, rather than a monolithic application.

**Why modules:** The initial scope is Finance + Membership + Organization + Auth + Audit. But the SDA church has many more departments (Sabbath School, Pathfinders, Health Ministries, Youth, Evangelism, ADRA, Family Ministries, Music, Communication, etc.). A monolith would accumulate all of these in one ever-growing codebase. Modules allow each department to be developed and deployed independently, sharing only the core layer (auth, org hierarchy, member records, audit trail).

**Module contract:** Each module exports:
- Routes (TanStack Router tree, merged into app shell at build time)
- Navigation (sidebar item with label, icon, position)
- Permissions (additional roles/actions appended to auth matrix)
- Positions (optional church-level offices, e.g., "Sabbath School Superintendent")
- Database (namespaced D1 tables, `module_name_*`)
- API handlers (Worker routes or DO class)

**Trade-offs:**
- **Build-time registration, not runtime.** Modules are composed at build time, not hot-plugged at runtime. This is simpler and sufficient for a single-tenant deploy. Runtime modules would add complexity (dynamic code loading, sandboxing) with no benefit until the platform supports third-party extensions.
- **Shared core is a hard dependency.** All modules depend on the core for auth, org hierarchy, member records, and audit logging. This couples modules to the core's API contract — a breaking change to the core affects all modules. Accepted because the core is small and stable (auth, org tree, member records, audit).

**Considered alternative:** Monolithic application. Rejected because it doesn't support the explicit goal of adding modules incrementally without growing a single unmanageable codebase.
