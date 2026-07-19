# Theobase

SDA Church Management Platform - A multi-tenant SaaS for Seventh-day Adventist churches.

## Status

**Phase 1 MVP in progress** - Foundation ticket (#95) implementation.

## What's Built

### Foundation (#95) - In Progress

**Implemented:**
- ✅ Project structure (Cloudflare Workers + D1 + Pages)
- ✅ TypeScript configuration
- ✅ Vitest test setup
- ✅ Domain types (Organization, User, Tenant, AuthPayload)
- ✅ Database schema (migrations/0001_initial_schema.sql)
- ✅ Auth Seam: login endpoint with JWT tokens
- ✅ Tenant Isolation Seam: middleware for multi-tenant data access
- ✅ Organization Hierarchy Seam: CRUD endpoints for SDA org structure
- ✅ Permission Seam: role-based access control middleware

**Testing seams defined:**
1. Auth Seam - login/logout, JWT validation
2. Tenant Isolation Seam - data access control between tenants
3. Organization Hierarchy Seam - CRUD for orgs, hierarchical queries
4. Permission Seam - RBAC, hierarchical data visibility

## Setup

```bash
npm install
npm run dev        # Start dev server
npm run test       # Run tests
npm run typecheck  # Type checking
```

## Architecture

- **Stack:** Cloudflare Workers + D1 (PostgreSQL-compatible) + Pages
- **Testing:** Vitest
- **Auth:** JWT-based with role-based access control
- **Multi-tenancy:** Row-level isolation in D1

## Tickets

- [#94](https://github.com/taiatiniyara/theobase/issues/94) - Phase 1 Spec
- [#95](https://github.com/taiatiniyara/theobase/issues/95) - Foundation (in progress)
- [#96](https://github.com/taiatiniyara/theobase/issues/96) - Transaction entry + offline sync (blocked by #95)
- [#97](https://github.com/taiatiniyara/theobase/issues/97) - Fund allocation + remittance (blocked by #96)
- [#98](https://github.com/taiatiniyara/theobase/issues/98) - Mission dashboard + reporting (blocked by #97)
- [#99](https://github.com/taiatiniyara/theobase/issues/99) - Member giving + audit trail (blocked by #97)
- [#100](https://github.com/taiatiniyara/theobase/issues/100) - Polish (blocked by #98, #99)

## Next Steps

1. Complete remaining acceptance criteria for #95
2. Write integration tests for all seams
3. Deploy to Cloudflare
4. Move to #96 (transaction entry + offline sync)
