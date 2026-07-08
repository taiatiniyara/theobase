# Issue 26: Accessibility Implementation

## What to build

Full WCAG 2.1 AA compliance. Screen reader support, contrast, font scaling, keyboard navigation.

## Input/Output

**Input:** All UI components (buttons, inputs, selects, modals, tables, cards, tabs, accordions), all user interaction modes (mouse, touch, keyboard, screen reader)
**Output:** Guaranteed: WCAG 2.1 AA compliance across all components, keyboard-navigable UI, screen-reader-complete workflows, `prefers-reduced-motion` honored, high contrast mode functional

## Validation Requirements

- Every interactive element has accessible name (aria-label or visible label)
- Every image/icon conveying meaning has alt text; decorative images have alt=""
- Every form field has aria-describedby linking to help/error text
- Color contrast ratios: 4.5:1 for normal text, 3:1 for large text — verified by automated test
- Font scaling: layout reflows at 200% zoom with no horizontal scroll, no content loss
- Touch targets: every interactive element >= 44x44px at base font size and at 200% zoom
- Reduced motion: all animations/transitions disabled when system preference set
- High contrast: all content visible and distinguishable with forced-colors mode
- Keyboard: Tab order is logical, focus ring visible on every element, no keyboard traps
- Screen reader: "add a member" flow completable via VoiceOver (Mac) and TalkBack (Android) from login to success
- Automated axe-core audit must pass with zero violations (except reviewed false positives)

## Acceptance Criteria

- [ ] Every button has aria-label
- [ ] Every image has alt text
- [ ] Every form field has aria-describedby for help text
- [ ] Color never the only signal (add icon + text alongside color)
- [ ] Font scaling: respects OS font size, layouts reflow, no horizontal scroll
- [ ] Touch targets >= 44x44px at all font sizes
- [ ] `prefers-reduced-motion` respected (animations become instant)
- [ ] High contrast mode works with system settings
- [ ] Keyboard navigation: Tab through all interactive elements, visible focus ring
- [ ] Screen reader: VoiceOver/TalkBack can complete "add a member" end-to-end

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/adr/0012-product-quality-standards.md`
- `CHANGELOG.md`
