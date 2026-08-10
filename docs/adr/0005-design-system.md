# ADR-0005: Design System Specification

## Status

Accepted (2026-08-10)

## Context

AI agents produce inconsistent UI without concrete visual constraints. Theobase needs a spec they can reference that locks colors, typography, spacing, layouts, and components.

## Decision

Create `docs/design-system.md` as the single source of truth for UI decisions. It defines:

- Brand tokens derived from the logo palette
- Typography, spacing, border radius, shadows, and motion tokens
- Three canonical layouts (Dashboard, Detail, Form)
- A component catalog of shadcn/ui primitives styled with Theobase tokens
- AI agent rules: no new base components, choose from existing, test keyboard/contrast

## Consequences

- Features assemble from catalogued components, ensuring visual consistency.
- AI agents have a concrete reference, reducing the "AI produces generic UI" problem.
- The catalog expands as new patterns emerge, but always via deliberate addition, not ad-hoc creation.
