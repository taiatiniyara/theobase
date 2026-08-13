# Contributing to Theobase

Thank you for your interest in contributing. Theobase serves Seventh-day Adventist churches worldwide — every contribution helps church officers spend less time on paperwork and more time on ministry.

## Before you start

1. Read [CONTEXT.md](CONTEXT.md) to understand the domain model, architecture, and design principles.
2. Read the relevant [ADR](docs/adr/) for the area you're working in.
3. Check [open issues](https://github.com/taiatiniyara/theobase/issues) — look for `good first issue` tags.

## Development setup

```bash
# Prerequisites: Node.js >= 22, pnpm >= 9

git clone https://github.com/taiatiniyara/theobase.git
cd theobase
pnpm install

# Dev servers
pnpm dev           # PWA at localhost:5173
pnpm dev:worker    # Worker at localhost:8787
```

## Development workflow

### Before starting work

1. Find or create an issue describing the change.
2. Comment on the issue to say you're working on it.
3. Create a branch: `git checkout -b feat/your-feature` or `fix/your-fix`.

### Writing code

- **TypeScript** with strict mode — all new code must pass `pnpm typecheck`.
- **Components** from the catalog in [docs/design-system.md](docs/design-system.md) — don't create new base components.
- **Every form input must have a visible label.** Placeholders are hints, not labels.
- **Financial numbers must use `tabular-nums`** — amounts, counts, dates in tables.
- **Empty states direct action** — never just "No results". Explain what happened and what to do next.
- **Error states explain and offer a path forward** — plain language, never a stack trace.
- **Design principles** from CONTEXT.md: system does the work, self-teaching interface, zero-assembly reporting, proactive intelligence.

### Before submitting

```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript across all packages
pnpm test        # Vitest unit tests
pnpm --filter @theobase/web test:e2e  # Playwright E2E (requires Chromium)
```

All checks run in CI — a PR that fails any of them cannot merge.

### Commit messages

Follow conventional commits:

```
feat: add baptismal class tracking
fix: prevent double-count in batch reconciliation
chore: upgrade drizzle-orm to 0.46
docs: document transfer dispute resolution
```

### Pull requests

1. Push your branch and open a PR against `main`.
2. Fill in the PR template (description, linked issue, testing notes).
3. Wait for CI to pass.
4. A maintainer will review and merge.

## Domain knowledge

Theobase is deeply domain-specific. Key concepts worth understanding:

- **Dual-signoff** — SDA policy requires two counters to independently confirm each giving batch. This isn't a setting; it's the only way a batch can be committed.
- **14 role types** — clerk, treasurer, counter (x2), pastor, department-head, board-member, member, interest, visitor, conference-treasurer, conference-secretary, conference-president, auditor, operator. Each role's permission boundary is enforced by the Durable Object.
- **Approve-don't-build** — every feature is designed so the system produces the complete output and the human reviews and confirms. No manual assembly.
- **Offline-first** — the PWA must work without internet. Intents are queued in IndexedDB and flushed when connectivity returns.

## 14 role types (SDA polity)

Every church officer has a defined role with a DO-enforced permission matrix. Read the full table in [CONTEXT.md](CONTEXT.md) under "People & Roles." K

Before implementing anything that touches access control, confirm the role's permissions in the matrix.

## Accessibility

WCAG 2.2 AA is enforced:
- `eslint-plugin-jsx-a11y` at lint stage
- `@axe-core/react` at test stage
- `@axe-core/playwright` on E2E critical flows *(planned — not yet shipped)*
- Manual screen-reader / keyboard / zoom checklist before release

A PR that fails automated checks cannot merge.

## Need help?

- [GitHub Discussions](https://github.com/taiatiniyara/theobase/discussions) — questions, ideas, architecture
- [GitHub Issues](https://github.com/taiatiniyara/theobase/issues) — bugs and feature requests
