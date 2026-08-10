# ADR-0004: Frontend Tech Stack

## Status

Accepted (2026-08-10)

## Context

Theobase is a mobile-first PWA running on Cloudflare Pages. We need a frontend stack that supports offline-first operation, complex form workflows (counting room batch entry, dual-signoff), data-heavy list views (member directory, giving history, reports), and role-based routing.

## Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React 19** | Largest ecosystem, most accessible talent pool, mature PWA and form library ecosystem. Statically exported via Vite to Cloudflare Pages. |
| Language | **TypeScript** (strict mode) | Type safety across the worker/frontend boundary. Shared types between DO and PWA. |
| Build | **Vite** | Fast dev server, native ESM, Cloudflare Pages adapter. |
| Styling | **Tailwind CSS v4** | Utility-first, tree-shaken, design tokens map directly to Tailwind config. |
| Components | **shadcn/ui** | Headless, copy-paste component library built on Radix primitives. Accessible by default. Works with Tailwind. No npm dependency lock-in. |
| Server state | **TanStack Query v5** | Manages the DO sync layer — caching, background refetch, optimistic updates for giving records, stale-while-revalidate for member data. Replaces manual fetch/useEffect. |
| Tables/lists | **TanStack Table v8** | Column sorting, filtering, pagination for member directory, giving history, reports, batch reconciliation views. Headless — we bring the markup. |
| Routing | **TanStack Router v1** | Type-safe file-based routing. Separate route trees for clerk, treasurer, pastor roles. Search param validation. |
| Forms | **React Hook Form + Zod** | Performant (uncontrolled inputs), mature validation ecosystem. Zod schemas shared between client and DO for end-to-end type safety on giving records and member forms. |
| Database | **Drizzle ORM** | SQL-first, first-class D1 driver. `drizzle-zod` derives Zod validators from table definitions — single schema file generates both D1 migrations and runtime validation. The DO uses Drizzle for internal state; D1 reporting tables share the same schema types. |
| Package manager | **pnpm** | Fast, strict, workspaces for monorepo structure (shared types package, worker package, frontend package). |
| Testing | **Vitest** (unit/integration) + **Playwright** (E2E) | Vitest for DO tests and React component tests. Playwright for PWA offline flows and counting-room end-to-end tests. |
| Linting | **ESLint** + **Prettier** | ESLint flat config with TypeScript and React rules. Prettier for consistent formatting. Enforced in CI. |

## Consequences

- React 19's `use()` API and RSC are irrelevant for a PWA — we use the client-side subset.
- TanStack Query's cache layer becomes the client-side source of truth, synced with IndexedDB and the DO via WebSocket. This is complex to set up but eliminates the ad-hoc sync code that would otherwise grow organically.
- shadcn/ui means no npm dependency for components — copy the source into the repo. This prevents the upgrade-paralysis problem of third-party component libraries.
- Zod schemas shared between client and DO worker give us compile-time guarantees that a GivingRecord produced by the counter matches what the DO expects.
- Drizzle's schema file is the single source of truth for data types, constraints, and defaults. `drizzle-zod` eliminates the dual-maintenance problem of separate validation schemas and DDL.
