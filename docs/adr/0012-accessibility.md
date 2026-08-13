# ADR-0012: Accessibility Enforcement

## Status

Accepted (2026-08-10)

## Context

Theobase must be usable by church officers with disabilities across 215+ countries, including those using screen readers, keyboard-only navigation, and high-zoom/low-vision setups.

## Decision

Two-tier enforcement: automated CI gates for every PR, manual release-gate checklist.

### Tier 1: Automated (PR Gate)

| Tool                     | What it catches                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `eslint-plugin-jsx-a11y` | Missing alt text, invalid ARIA roles, missing form labels, no-positive-tabindex, anchor-has-content. Runs at lint stage. |
| `@axe-core/react`        | Runtime accessibility violations in component tests. Integrated with Vitest + React Testing Library. Runs at test stage. |
| `@axe-core/playwright`   | E2E axe scanning on critical flows (login → counting room → batch commit → approve report). **Planned — not yet shipped.** |

**PR is blocked if any automated check fails.** (Today the blocking gates are lint + typecheck + tests; e2e runs `continue-on-error`.)

### Tier 2: Manual (Release Gate)

Before every major release, a designated tester completes the checklist in `docs/accessibility-checklist.md`:

1. **Screen reader** — Navigate full counting room flow (VoiceOver + Safari, NVDA + Firefox, TalkBack + Chrome Android).
2. **Keyboard-only** — Tab, Enter, Escape, arrow keys through member directory, batch entry, report approval. No mouse.
3. **200% zoom** — Verify no content is clipped or hidden. Scrollable where needed.
4. **High-contrast mode** — Verify all UI elements remain visible with system `prefers-contrast: more`.
5. **Reduced motion** — Animations disabled, transitions are instant.
6. **Focus trapping** — Modals trap focus. Focus returns to trigger on close.

Release is blocked if any checklist item fails.

## Consequences

- The manual checklist requires time per release. Budget ~2 hours for a full pass.
- `@axe-core/react` catches ~30% of WCAG issues. The manual tier catches the other 70%. This is the standard ratio for accessibility programs.
- As the component catalog grows, add Playwright accessibility snapshots to prevent regression on previously-passing flows.
