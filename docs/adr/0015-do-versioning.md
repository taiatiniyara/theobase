# ADR-0015: DO Versioning

## Status

Accepted (2026-08-10)

## Context

PWAs may remain offline for days. When they reconnect, the DO may have been updated with breaking changes. The system must self-heal without data loss.

## Decision

**DO-communicated semantic versioning via response header.**

- The DO returns `X-DO-Version: <major>.<minor>.<patch>` on every response (e.g. `1.2.3`).
- The PWA stores its built-against version at compile time (from `packages/shared` version field).
- On first sync after reconnection, the PWA checks the DO version:

| DO major > PWA major | PWA forces `location.reload()` to fetch the latest build from Cloudflare Pages. Offline queue preserved in IndexedDB — no data loss. |
| DO minor/patch > PWA | PWA proceeds normally. The DO is backwards-compatible within a major version. |
| DO version == PWA version | Normal operation. |

### Breaking Change Protocol

1. Bump the shared package's major version.
2. Deploy the new DO.
3. Deploy the new PWA build to Cloudflare Pages.
4. PWAs that reconnect see the major bump and force-reload to the new build.
5. No migration window needed — the DO is single-threaded per church and handles only one version at a time.

### Non-Breaking Changes

Minor/patch bumps are transparent to the PWA. New fields added to Zod schemas with `.optional()` or defaults. Old fields removed by deprecation (marked as optional, removed in the next major).

## Consequences

- Simpler than REST API versioning. No URL-based version prefixes. No dual-serving of old and new endpoints.
- The offline queue survives a force-reload because IndexedDB persists across page loads.
- Major version bumps force every PWA to reload. This is acceptable at v1 scale but must be coordinated with release notes and a deployment window if thousands of churches are affected in the future.
