# ADR-0014: Observability

## Status

Accepted (2026-08-10)

## Context

We're not using Sentry. Theobase needs its own error tracking, sync health monitoring, and alerting — built on Cloudflare's existing infrastructure.

## Decision

### v1.0 — Data Pipeline (ships with MVP)

Infrastructure that records every error from day one, with no user-facing UI:

| Component | Implementation |
|-----------|----------------|
| PWA client | `@theobase/observability` — wraps errors, breadcrumbs, sync metrics. Pushes to `metrics` Queue. Never blocks the user. |
| DO error catches | Every DO catches unhandled errors, pushes to `metrics` Queue with DO ID, event log position, and stack trace. |
| Worker middleware | Request timing and error rate per endpoint. Error responses pushed to Queue. |
| Storage | D1 `errors` table: `id, churchId, userId, severity, type, message, stackTrace, breadcrumbTrail, deviceInfo, timestamp, resolved`. D1 `sync_health` table: `churchId, queueDepth, lastSyncAt, syncSuccessRate, doLatencyMs, updatedAt`. R2: full error payloads and raw stack traces. |

### v1.5 — Observability UI (post-MVP)

A Conference admin dashboard route tree with:

- **Errors list** — TanStack Table filtered by church, severity, time range. Click → detail view with source-mapped stack trace, breadcrumb trail, device/browser info.
- **Church health cards** — sync latency, error count (24h), queue depth, last sync per church. Green/amber/red status.
- **Alert rules** — configurable per Conference admin: "notify me if any church has >5 sync failures in 10 minutes." In-app notification only.

### Performance Monitoring

Cloudflare Analytics covers Worker/DO metrics (request rate, CPU time, error rate). Link to Analytics dashboard from the observability UI.

## Consequences

- v1 has no observability UI, but all errors are recorded. Debugging v1 issues requires D1 queries by hand — acceptable for early adopters.
- The `@theobase/observability` client wrapper must be dependency-light (no React dependency) so it works in the DO and Worker contexts as well as the PWA.
- The v1.5 UI adds significant value to the Conference admin dashboard and becomes a selling point: "you can see every church's health at a glance."
- The v1 and v1.5 pipelines both record operation-level Cloudflare billable events (DO request count, GB-seconds, D1 reads/writes, R2 storage) in a `cost_metrics` table. A **cost dashboard** in v1.5 shows: cost per church per month, cost per operation type, and projected monthly bill. This validates the $3/church/month price before we get surprised.
- The v1.5 observability UI also surfaces the cost dashboard for Theobase operators, not just Conference admins.
