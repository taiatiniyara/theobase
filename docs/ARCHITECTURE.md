# Architecture

## Stack

| Concern            | Choice          | Rationale                                          |
| ------------------ | --------------- | -------------------------------------------------- |
| Language           | TypeScript      | Type safety, shared types between frontend/backend |
| Backend Framework  | Hono            | Lightweight, fast, Cloudflare Workers native       |
| Frontend Framework | React + Vite    | Modern, fast dev experience, PWA support           |
| Routing            | TanStack Router | Type-safe routing, nested layouts                  |
| Data Fetching      | TanStack Query  | Caching, background refetch, optimistic updates    |
| Data Store         | TBD             | TBD                                                |
| Auth               | TBD             | TBD                                                |
| Hosting            | Cloudflare      | Global edge, Workers, D1, R2                       |

## System Topology

TBD

## API / IPC Contracts

TBD

## UI / UX

Design decisions driven by `references/ui-ux.md` heuristics. Fill every
section before implementation begins.

### Design Tokens

TBD

### Component Library

| Component | States Covered | Accessibility Notes |
| --------- | -------------- | ------------------- |
|           |                |                     |

### Layout

- **Max content width:**
- **Breakpoints:**
- **Navigation pattern:**
- **Responsive strategy:**

### UX Patterns

- **Forms:**
- **Data display:**
- **Feedback:**
- **Empty states:**
- **Error states:**

### Accessibility Baseline

- **Standard:** WCAG 2.1 AA
- **Color contrast:** 4.5:1 minimum verified
- **Keyboard:** full navigation, visible focus ring
- **Screen reader:** semantic HTML, alt text, aria labels
- **Motion:** `prefers-reduced-motion` respected
- **Touch targets:** >= 44x44px
