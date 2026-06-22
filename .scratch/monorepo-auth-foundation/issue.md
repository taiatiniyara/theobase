# 001 — Monorepo + Auth Foundation

**Status: Complete** (17/17 criteria met)

## What to build

Scaffold the entire development workspace and implement the email-based passwordless authentication flow end to end. This is the tracer bullet — it proves every layer of the Cloudflare stack works before any feature code is written.

The deliverable is a running (local via Miniflare) system where a test user requests a magic link, the SMTP relay logs the email, the user exchanges the token for a JWT, and a protected Hono endpoint verifies the session.

## Acceptance criteria

- [x] pnpm monorepo with `apps/api`, `apps/do`, `apps/web`, `packages/db`, `packages/auth`, `packages/email`, `packages/shared`
- [x] `wrangler.jsonc` with D1 binding, DO binding, R2 binding, Email Routing binding
- [x] Core Drizzle schemas: `congregation`, `person`, `user`, `organization`, `department`
- [x] D1 migration runner (`packages/db/src/migrate.ts` with MIGRATION_STATEMENTS + `applyMigrations()`)
- [x] `packages/auth`: magic link token generation (SHA-256), JWT sign/verify, Hono session middleware
- [x] `packages/email`: `sendEmail()` dispatching via HTTPS POST to SMTP relay; test mode logs to console
- [x] Hono endpoint `POST /auth/request` — accepts email, generates token, dispatches email
- [x] Hono endpoint `POST /auth/verify` — accepts token, issues JWT in httpOnly cookie
- [x] Hono middleware `requireAuth` — rejects unauthenticated requests with 401
- [x] Vitest + Miniflare 3 test setup with throwaway D1
- [x] Test: full magic link flow — request → token logged → verify → JWT → protected endpoint returns 200
- [x] Test: unauthenticated request to protected endpoint returns 401
- [x] Test: expired JWT returns 401
- [x] SMTP relay: minimal Node.js HTTP server proxying to Hostinger SMTP (Cloudflare Tunnel config TODO)
- [x] SMTP relay: test mode that logs email body instead of connecting to Hostinger
- [x] GitHub Actions CI: install, typecheck, lint, test across all packages
- [x] `docker-compose.yml` for local dev: Miniflare Workers + SMTP relay

## Blocked by

None — can start immediately.
