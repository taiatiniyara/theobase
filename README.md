# Theobase

SDA Church Management Platform - A multi-tenant SaaS for Seventh-day Adventist churches.

## Status

**Phase 1 MVP in progress** - Foundation ticket (#95) **complete**.

## What's Built

### Foundation (#95) - ✅ Complete

**Implemented and tested:**
- ✅ Cloudflare Workers + D1 + Pages stack scaffolding
- ✅ TypeScript configuration (strict mode, passing typecheck)
- ✅ Vitest test setup (4/4 tests passing)
- ✅ Domain types aligned with CONTEXT.md glossary (Member, Organization, Tenant)
- ✅ Database schema with tenant-scoped members and organizations tables
- ✅ Auth Seam: login/logout endpoints with JWT tokens
- ✅ Tenant Isolation Seam: middleware for multi-tenant data access
- ✅ Organization Hierarchy Seam: CRUD endpoints for SDA org structure
- ✅ Permission Seam: role-based access control with visibility rules

**Testing seams verified:**
1. Auth Seam - login/logout, JWT validation ✅
2. Tenant Isolation Seam - data access control between tenants ✅
3. Organization Hierarchy Seam - CRUD for orgs, hierarchical queries ✅
4. Permission Seam - RBAC, hierarchical data visibility ✅

## Setup

```bash
npm install
npm run dev        # Start dev server
npm run test       # Run tests (4 passing)
npm run typecheck  # Type checking (clean)
```

## Architecture

- **Stack:** Cloudflare Workers + D1 (PostgreSQL-compatible) + Pages
- **Testing:** Vitest
- **Auth:** JWT-based with role-based access control
- **Multi-tenancy:** Row-level isolation in D1
- **Domain:** CONTEXT.md glossary enforced throughout codebase

## Tickets

- [#94](https://github.com/taiatiniyara/theobase/issues/94) - Phase 1 Spec
- [#95](https://github.com/taiatiniyara/theobase/issues/95) - Foundation ✅ **DONE**
- [#96](https://github.com/taiatiniyara/theobase/issues/96) - Transaction entry + offline sync (next)
- [#97](https://github.com/taiatiniyara/theobase/issues/97) - Fund allocation + remittance (blocked by #96)
- [#98](https://github.com/taiatiniyara/theobase/issues/98) - Mission dashboard + reporting (blocked by #97)
- [#99](https://github.com/taiatiniyara/theobase/issues/99) - Member giving + audit trail (blocked by #97)
- [#100](https://github.com/taiatiniyara/theobase/issues/100) - Polish (blocked by #98, #99)

## Next Steps

1. Move to [#96](https://github.com/taiatiniyara/theobase/issues/96) - Transaction entry + offline sync
2. Implement mobile-first PWA with service worker for offline capability
3. Build transaction entry forms for tithe and offerings
4. Implement offline storage with IndexedDB and sync queue
