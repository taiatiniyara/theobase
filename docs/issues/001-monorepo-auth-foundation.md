# 001 — Monorepo + Auth Foundation

## What to build

Scaffold the entire development workspace and implement the email-based passwordless authentication flow end to end. This is the tracer bullet — it proves every layer of the Cloudflare stack works before any feature code is written.

The deliverable is a running (local via Miniflare) system where a test user requests a magic link, the SMTP relay logs the email, the user exchanges the token for a JWT, and a protected Hono endpoint verifies the session.

## Acceptance criteria

- [ ] pnpm monorepo with `apps/api`, `apps/do`, `apps/web`, `packages/db`, `packages/auth`, `packages/email`, `packages/shared`
- [ ] `wrangler.jsonc` with D1 binding, DO binding, R2 binding, Email Routing binding
- [ ] Core Drizzle schemas: `congregation`, `person`, `user`, `organization`, `department`
- [ ] D1 migration runner (CI Worker script that iterates division bindings)
- [ ] `packages/auth`: magic link token generation (SHA-256), JWT sign/verify, Hono session middleware
- [ ] `packages/email`: `sendEmail()` dispatching via HTTPS POST to SMTP relay; test mode logs to console
- [ ] Hono endpoint `POST /auth/request` — accepts email, generates token, dispatches email
- [ ] Hono endpoint `POST /auth/verify` — accepts token, issues JWT in httpOnly cookie
- [ ] Hono middleware `requireAuth` — rejects unauthenticated requests with 401
- [ ] Vitest + Miniflare 3 test setup with throwaway D1
- [ ] Test: full magic link flow — request → token logged → verify → JWT → protected endpoint returns 200
- [ ] Test: unauthenticated request to protected endpoint returns 401
- [ ] Test: expired JWT returns 401
- [ ] SMTP relay: minimal Node.js HTTP server proxying to Hostinger SMTP, Cloudflare Tunnel config
- [ ] SMTP relay: test mode that logs email body instead of connecting to Hostinger
- [ ] GitHub Actions CI: install, typecheck, lint, test across all packages
- [ ] `docker-compose.yml` for local dev: Miniflare Workers + SMTP relay

## Blocked by

None — can start immediately.
