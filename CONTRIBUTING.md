# Contributing to Theobase

## Setup

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

## Code Quality

All commits must pass:

- `pnpm typecheck` — TypeScript strict mode, no `any` except explicit
- `pnpm lint` — ESLint flat config, zero warnings
- `pnpm test` — Vitest with Miniflare 3 simulation

## Workflow

This project follows the Platform Lifecycle Orchestrator. Each feature goes through:

1. **Issue** — `.scratch/<slug>/issue.md` with acceptance criteria
2. **Branch** — `issue-<n>-<slug>` from `main`
3. **Implement** — RED → GREEN → REFACTOR (TDD)
4. **Review** — Two-axis: spec conformance + coding standards
5. **Merge** — Squash-merge to `main` on full pass

## Conventions

- Monorepo: pnpm workspaces with `apps/` and `packages/`
- Database: Drizzle ORM with numbered migration files in `drizzle/`
- Testing: External behavior seams (REST, DO RPC, PWA offline, auth, email)
- Domain language: Use terms defined in `CONTEXT.md`
