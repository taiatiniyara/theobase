# ADR-0001: Row-Level Tenancy in D1

**Status:** Accepted
**Date:** 2026-07-21

## Context

Theobase serves multiple SDA churches, conferences, unions, and divisions — all within a single Cloudflare D1 (SQLite) database. We need a strategy for isolating each org unit's data.

## Decision

Use **row-level tenancy**: every domain table includes an `orgId` column. The Worker middleware extracts the user's `orgId` from their JWT and injects it into every query via a query builder or middleware. Access rules are enforced at the application layer:

- Church-level user: `WHERE orgId = theirOrgId`
- Conference-level user: `WHERE orgId IN (conferenceId + all child churchIds)`
- Union/Division: recursive descent through the org hierarchy

## Alternatives Considered

1. **Separate D1 databases per org unit** — D1 does not support dynamic database provisioning. Cloudflare limits databases per account. Rejected as infeasible.
2. **Schema-per-tenant** — SQLite has no schema isolation primitive. Rejected.
3. **Separate KV namespace per org** — KV lacks query capabilities needed for reports. Rejected.

## Consequences

- **Simplicity**: single database, single migration set, single connection pool.
- **Query discipline required**: every query must include the `orgId` filter. A missing filter leaks data across orgs. Mitigation: a query builder that injects `orgId` automatically.
- **Scale ceiling**: D1 has per-database limits (storage, reads/writes). A single church produces kilobytes of data; even thousands of churches fit comfortably within D1 limits.
- **Hard to reverse**: migrating from row-level to separate-database tenancy would require a data migration script and deployment coordination. The schema design should keep this path open by using a consistent `orgId` column everywhere from day one.
